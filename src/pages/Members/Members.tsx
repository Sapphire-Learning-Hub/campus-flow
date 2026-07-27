import {
  PlusOutlined,
  ReloadOutlined,
  SearchOutlined,
  TeamOutlined,
} from "@ant-design/icons";
import { App, Button, Input, Select, Space, Table, Tag, Tooltip } from "antd";
import type { ColumnsType } from "antd/es/table";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate, useSearchParams } from "react-router";
import { MemberAvatar } from "@/components/common/MemberAvatar";
import { PageHeader } from "@/components/common/PageHeader";
import { PageState } from "@/components/common/PageState";
import { MemberFormDrawer } from "@/components/members/MemberForm";
import { useAsyncPageData } from "@/hooks/useAsyncPageData";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { useEntityEditor } from "@/hooks/useEntityEditor";
import { useLocalizedOptions } from "@/hooks/useLocalizedOptions";
import { useSettings } from "@/hooks/useSettings";
import { getApiErrorMessage } from "@/services/client";
import { listMembers } from "@/services/members";
import { listProjects } from "@/services/projects";
import { listTasks } from "@/services/tasks";
import type { Member, ProjectMember, ProjectRole } from "@/types/member";
import type { Project } from "@/types/project";
import type { Task } from "@/types/task";
import { countActiveFilters, indexById } from "@/utils/collection";
import { formatShortDate } from "@/utils/date";
import {
  getProjectPermissions,
  PERMISSION_DENIED,
} from "@/utils/Permissions.ts";
import "./index.css";

interface MembersPageData {
  tasks: Task[];
  projects: Project[];
  members: Member[];
}

interface MemberFilters {
  keyword?: string;
  projectId?: string;
  role?: ProjectRole;
}

interface MemberRow {
  key: string;
  projectId: string;
  projectName: string;
  member: Member;
  role: ProjectRole;
  addedAt: string;
  taskCount: number;
}

const INITIAL_MEMBERS_PAGE_DATA: MembersPageData = {
  tasks: [],
  projects: [],
  members: [],
};

const ROLE_COLORS: Record<ProjectRole, string> = {
  owner: "purple",
  admin: "blue",
  member: "green",
  readonly: "default",
};

async function loadMembersPageData(): Promise<MembersPageData> {
  const [taskResult, projectResult, members] = await Promise.all([
    listTasks({ pageSize: 100 }),
    listProjects({ pageSize: 100 }),
    listMembers(),
  ]);

  return {
    tasks: taskResult.items,
    projects: projectResult.items,
    members,
  };
}

export default function MembersPage() {
  const { t } = useTranslation();
  const { message } = App.useApp();
  const { roleOptions } = useLocalizedOptions();
  const currentUser = useCurrentUser();
  const { settings: appSettings } = useSettings();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [filters, setFilters] = useState<MemberFilters>(() => ({
    projectId: searchParams.get("projectId") || undefined,
  }));
  const getMembersPageErrorMessage = useCallback(
    (requestError: unknown) =>
      getApiErrorMessage(requestError, t("membersPage.loadError")),
    [t],
  );
  const { data, setData, loading, refreshing, error, reload, refresh } =
    useAsyncPageData({
      initialData: INITIAL_MEMBERS_PAGE_DATA,
      load: loadMembersPageData,
      getErrorMessage: getMembersPageErrorMessage,
    });
  const { tasks, projects, members } = data;
  const {
    open: drawerOpen,
    editingItem: editingMemberRow,
    openCreate,
    openEdit,
    close: closeEditor,
  } = useEntityEditor<MemberRow>();
  const membersById = useMemo(() => indexById(members), [members]);
  const projectsById = useMemo(() => indexById(projects), [projects]);

  const taskCountsByMembership = useMemo(() => {
    const counts = new Map<string, number>();
    for (const task of tasks) {
      if (!task.assigneeId) continue;
      const key = `${task.projectId}:${task.assigneeId}`;
      counts.set(key, (counts.get(key) ?? 0) + 1);
    }
    return counts;
  }, [tasks]);

  const memberRows = useMemo(() => {
    const rows: MemberRow[] = [];
    for (const project of projects) {
      for (const projectMember of project.members) {
        const member = membersById.get(projectMember.memberId);
        if (!member) continue;

        const key = `${project.id}:${member.id}`;
        rows.push({
          key,
          projectId: project.id,
          projectName: project.name,
          member,
          role: projectMember.role,
          addedAt: projectMember.addedAt,
          taskCount: taskCountsByMembership.get(key) ?? 0,
        });
      }
    }
    return rows;
  }, [membersById, projects, taskCountsByMembership]);

  const filteredMemberRows = useMemo(() => {
    const keyword = filters.keyword?.trim().toLowerCase();
    return memberRows.filter((row) => {
      const searchableText = [
        row.member.name,
        row.member.email,
        row.member.department,
        row.projectName,
      ]
        .join(" ")
        .toLowerCase();

      return (
        (!keyword || searchableText.includes(keyword)) &&
        (!filters.projectId || row.projectId === filters.projectId) &&
        (!filters.role || row.role === filters.role)
      );
    });
  }, [filters, memberRows]);

  const activeFilterCount = useMemo(
    () => countActiveFilters(filters),
    [filters],
  );
  const selectedProject = filters.projectId
    ? projectsById.get(filters.projectId)
    : undefined;

  const handleProjectSaved = useCallback(
    (savedProject: Project) => {
      const activeMemberIds = new Set(
        savedProject.members.map((item) => item.memberId),
      );
      setData((current) => ({
        ...current,
        projects: current.projects.map((project) =>
          project.id === savedProject.id ? savedProject : project,
        ),
        tasks: current.tasks.map((task) =>
          task.projectId === savedProject.id &&
          task.assigneeId &&
          !activeMemberIds.has(task.assigneeId)
            ? { ...task, assigneeId: undefined }
            : task,
        ),
      }));
      closeEditor();
    },
    [closeEditor, setData],
  );

  const handleAddMember = useCallback(() => {
    if (!selectedProject) {
      message.info(t("membersPage.messages.selectProject"));
      return;
    }
    if (
      !getProjectPermissions(selectedProject, currentUser.memberId)
        .canManageMembers
    ) {
      message.error(PERMISSION_DENIED.manageMembers);
      return;
    }
    openCreate();
  }, [currentUser.memberId, message, openCreate, selectedProject, t]);

  const handleManageMember = useCallback(
    (row: MemberRow) => {
      const project = projectsById.get(row.projectId);
      if (
        !getProjectPermissions(project, currentUser.memberId).canManageMembers
      ) {
        message.error(PERMISSION_DENIED.manageMembers);
        return;
      }
      if (row.role === "owner") {
        message.info(t("membersPage.messages.ownerImmutable"));
        return;
      }
      openEdit(row);
    },
    [currentUser.memberId, message, openEdit, projectsById, t],
  );

  useEffect(() => {
    if (loading || searchParams.get("create") !== "1") return;

    let active = true;
    queueMicrotask(() => {
      if (!active) return;
      handleAddMember();
      const nextParams = new URLSearchParams(searchParams);
      nextParams.delete("create");
      setSearchParams(nextParams, { replace: true });
    });
    return () => {
      active = false;
    };
  }, [handleAddMember, loading, searchParams, setSearchParams]);
  const columns: ColumnsType<MemberRow> = useMemo(
    () => [
      {
        title: t("membersPage.columns.member"),
        key: "member",
        width: 240,
        render: (_, row) => (
          <div className="member-cell">
            <MemberAvatar member={row.member} />
            <span>
              <b>{row.member.name}</b>
              <small>{row.member.email}</small>
            </span>
          </div>
        ),
      },
      {
        title: t("membersPage.columns.project"),
        dataIndex: "projectName",
        width: 180,
      },
      {
        title: t("membersPage.columns.department"),
        key: "department",
        width: 180,
        render: (_, row) => row.member.department,
      },
      {
        title: t("membersPage.columns.role"),
        key: "role",
        width: 120,
        render: (_, row) => {
          return (
            <Tag color={ROLE_COLORS[row.role]}>
              {t(`options.role.${row.role}`)}
            </Tag>
          );
        },
      },
      {
        title: t("membersPage.columns.tasks"),
        key: "tasks",
        width: 110,
        render: (_, row) => (
          <Button
            type="link"
            disabled={!row.taskCount}
            onClick={() =>
              navigate(
                `/tasks?projectId=${encodeURIComponent(row.projectId)}&assigneeId=${encodeURIComponent(row.member.id)}`,
              )
            }
          >
            {t("membersPage.taskCount", { count: row.taskCount })}
          </Button>
        ),
      },
      {
        title: t("membersPage.columns.joined"),
        key: "addedAt",
        width: 120,
        render: (_, row) => formatShortDate(row.addedAt),
      },
      {
        title: t("membersPage.columns.actions"),
        key: "actions",
        fixed: "right",
        width: 80,
        render: (_, row) => (
          <Button
            type="link"
            size="small"
            onClick={() => handleManageMember(row)}
          >
            {row.role === "owner"
              ? t("membersPage.actions.owner")
              : t("membersPage.actions.manage")}
          </Button>
        ),
      },
    ],
    [handleManageMember, navigate, t],
  );

  return (
    <div className="page-container members-page">
      <PageHeader
        title={t("membersPage.header.title")}
        description={t("membersPage.header.description")}
        actions={
          <Space>
            <Tooltip title={t("membersPage.actions.refreshData")}>
              <Button
                icon={<ReloadOutlined spin={refreshing} />}
                disabled={loading || refreshing}
                onClick={() => void refresh()}
              >
                {t("membersPage.actions.refresh")}
              </Button>
            </Tooltip>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              disabled={loading}
              onClick={handleAddMember}
            >
              {t("membersPage.actions.add")}
            </Button>
          </Space>
        }
      />

      <div className="project-context-bar">
        <TeamOutlined />
        <span>{t("membersPage.currentProject")}</span>
        <Select
          allowClear
          aria-label={t("membersPage.filters.byProject")}
          value={filters.projectId}
          placeholder={t("membersPage.filters.allProjects")}
          options={projects.map((project) => ({
            label: project.name,
            value: project.id,
          }))}
          onChange={(projectId) =>
            setFilters((current) => ({ ...current, projectId }))
          }
        />
        <Tag>{t("membersPage.memberCount", { count: members.length })}</Tag>
        <Tag>
          {t("membersPage.relationshipCount", {
            count: filteredMemberRows.length,
          })}
        </Tag>
      </div>

      <div className="data-toolbar">
        <Input
          allowClear
          prefix={<SearchOutlined />}
          value={filters.keyword}
          aria-label={t("membersPage.filters.searchLabel")}
          placeholder={t("membersPage.filters.searchPlaceholder")}
          onChange={(event) =>
            setFilters((current) => ({
              ...current,
              keyword: event.target.value || undefined,
            }))
          }
        />
        <Select
          allowClear
          aria-label={t("membersPage.filters.byRole")}
          value={filters.role}
          placeholder={t("membersPage.filters.allRoles")}
          options={roleOptions}
          onChange={(role) => setFilters((current) => ({ ...current, role }))}
        />
        <Button disabled={!activeFilterCount} onClick={() => setFilters({})}>
          {t("membersPage.actions.clear")}
          {activeFilterCount ? ` (${activeFilterCount})` : ""}
        </Button>
        <span className="toolbar-meta">
          {t("membersPage.resultSummary", {
            filtered: filteredMemberRows.length,
            total: memberRows.length,
          })}
          {" · "}
          {selectedProject?.name ?? t("membersPage.filters.allProjects")}
        </span>
      </div>

      <PageState
        loading={loading}
        error={error}
        empty={!filteredMemberRows.length}
        loadingDescription={t("membersPage.states.loading")}
        errorTitle={t("membersPage.states.errorTitle")}
        emptyDescription={
          memberRows.length
            ? t("membersPage.states.noMatch")
            : t("membersPage.states.empty")
        }
        onRetry={reload}
        emptyAction={
          memberRows.length ? (
            <Button onClick={() => setFilters({})}>
              {t("membersPage.actions.clearFilters")}
            </Button>
          ) : undefined
        }
      >
        <Table
          rowKey="key"
          columns={columns}
          dataSource={filteredMemberRows}
          scroll={{ x: 1030 }}
          pagination={{
            pageSize: appSettings.pageSize,
            showSizeChanger: false,
            showTotal: (total) =>
              t("membersPage.paginationTotal", { count: total }),
          }}
        />
      </PageState>

      <MemberFormDrawer
        open={drawerOpen}
        project={
          editingMemberRow
            ? projectsById.get(editingMemberRow.projectId)
            : selectedProject
        }
        members={members}
        currentMemberId={currentUser.memberId}
        initial={
          editingMemberRow
            ? ({
                memberId: editingMemberRow.member.id,
                role: editingMemberRow.role,
                addedAt: editingMemberRow.addedAt,
              } satisfies ProjectMember)
            : undefined
        }
        onClose={closeEditor}
        onSaved={handleProjectSaved}
      />
    </div>
  );
}
