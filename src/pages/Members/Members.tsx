import {
  PlusOutlined,
  ReloadOutlined,
  SearchOutlined,
  TeamOutlined,
} from "@ant-design/icons";
import { App, Button, Input, Select, Space, Table, Tag, Tooltip } from "antd";
import type { ColumnsType } from "antd/es/table";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router";
import { MemberAvatar } from "@/components/common/MemberAvatar";
import { PageHeader } from "@/components/common/PageHeader";
import { PageState } from "@/components/common/PageState";
import { MemberFormDrawer } from "@/components/members/MemberForm";
import { useAsyncPageData } from "@/hooks/useAsyncPageData";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { useEntityEditor } from "@/hooks/useEntityEditor";
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

const ROLE_META: Record<ProjectRole, { label: string; color: string }> = {
  owner: { label: "项目所有者", color: "purple" },
  admin: { label: "项目管理员", color: "blue" },
  member: { label: "普通成员", color: "green" },
  readonly: { label: "只读成员", color: "default" },
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

function getMembersPageErrorMessage(error: unknown) {
  return getApiErrorMessage(error, "成员加载失败，请稍后重试");
}

export default function MembersPage() {
  const { message } = App.useApp();
  const currentUser = useCurrentUser();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [filters, setFilters] = useState<MemberFilters>(() => ({
    projectId: searchParams.get("projectId") || undefined,
  }));
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
      message.info("请先选择需要管理成员的项目");
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
  }, [currentUser.memberId, message, openCreate, selectedProject]);

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
        message.info("项目所有者角色不能在成员管理中变更");
        return;
      }
      openEdit(row);
    },
    [currentUser.memberId, message, openEdit, projectsById],
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
        title: "成员",
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
        title: "所属项目",
        dataIndex: "projectName",
        width: 180,
      },
      {
        title: "学院 / 部门",
        key: "department",
        width: 180,
        render: (_, row) => row.member.department,
      },
      {
        title: "项目角色",
        key: "role",
        width: 120,
        render: (_, row) => {
          const meta = ROLE_META[row.role];
          return <Tag color={meta.color}>{meta.label}</Tag>;
        },
      },
      {
        title: "负责任务",
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
            {row.taskCount} 个任务
          </Button>
        ),
      },
      {
        title: "加入项目",
        key: "addedAt",
        width: 120,
        render: (_, row) => formatShortDate(row.addedAt),
      },
      {
        title: "操作",
        key: "actions",
        fixed: "right",
        width: 80,
        render: (_, row) => (
          <Button
            type="link"
            size="small"
            onClick={() => handleManageMember(row)}
          >
            {row.role === "owner" ? "所有者" : "管理"}
          </Button>
        ),
      },
    ],
    [handleManageMember, navigate],
  );

  return (
    <div className="page-container members-page">
      <PageHeader
        title="成员"
        description="按项目维护角色权限与任务责任"
        actions={
          <Space>
            <Tooltip title="刷新数据">
              <Button
                icon={<ReloadOutlined spin={refreshing} />}
                disabled={loading || refreshing}
                onClick={() => void refresh()}
              >
                刷新
              </Button>
            </Tooltip>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              disabled={loading}
              onClick={handleAddMember}
            >
              添加成员
            </Button>
          </Space>
        }
      />

      <div className="project-context-bar">
        <TeamOutlined />
        <span>当前项目</span>
        <Select
          allowClear
          aria-label="按项目筛选"
          value={filters.projectId}
          placeholder="全部项目"
          options={projects.map((project) => ({
            label: project.name,
            value: project.id,
          }))}
          onChange={(projectId) =>
            setFilters((current) => ({ ...current, projectId }))
          }
        />
        <Tag>{members.length} 名成员</Tag>
        <Tag>{filteredMemberRows.length} 条成员关系</Tag>
      </div>

      <div className="data-toolbar">
        <Input
          allowClear
          prefix={<SearchOutlined />}
          value={filters.keyword}
          aria-label="搜索成员"
          placeholder="搜索姓名、邮箱、学院或项目"
          onChange={(event) =>
            setFilters((current) => ({
              ...current,
              keyword: event.target.value || undefined,
            }))
          }
        />
        <Select
          allowClear
          aria-label="按角色筛选"
          value={filters.role}
          placeholder="全部角色"
          options={Object.entries(ROLE_META).map(([value, meta]) => ({
            label: meta.label,
            value,
          }))}
          onChange={(role) => setFilters((current) => ({ ...current, role }))}
        />
        <Button disabled={!activeFilterCount} onClick={() => setFilters({})}>
          清空{activeFilterCount ? ` (${activeFilterCount})` : ""}
        </Button>
        <span className="toolbar-meta">
          显示 {filteredMemberRows.length} / {memberRows.length} 条
          {selectedProject ? ` · ${selectedProject.name}` : " · 全部项目"}
        </span>
      </div>

      <PageState
        loading={loading}
        error={error}
        empty={!filteredMemberRows.length}
        loadingDescription="正在加载成员..."
        errorTitle="成员加载失败"
        emptyDescription={
          memberRows.length ? "没有符合当前筛选条件的成员" : "还没有项目成员"
        }
        onRetry={reload}
        emptyAction={
          memberRows.length ? (
            <Button onClick={() => setFilters({})}>清空筛选</Button>
          ) : undefined
        }
      >
        <Table
          rowKey="key"
          columns={columns}
          dataSource={filteredMemberRows}
          scroll={{ x: 1030 }}
          pagination={{
            pageSize: 10,
            showSizeChanger: false,
            showTotal: (total) => `共 ${total} 条成员关系`,
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
