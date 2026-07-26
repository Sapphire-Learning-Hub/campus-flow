import {
  AppstoreOutlined,
  CalendarOutlined,
  FlagOutlined,
  PlusOutlined,
  ProjectOutlined,
  ReloadOutlined,
  SearchOutlined,
  StarFilled,
  StarOutlined,
  UnorderedListOutlined,
  WarningFilled,
} from "@ant-design/icons";
import {
  App,
  Button,
  Input,
  Progress,
  Segmented,
  Select,
  Space,
  Table,
  Tag,
  Tooltip,
  type TableProps,
} from "antd";
import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type CSSProperties,
} from "react";
import { useNavigate, useSearchParams } from "react-router";
import { MemberAvatar } from "@/components/common/MemberAvatar";
import { PageHeader } from "@/components/common/PageHeader";
import { PageState } from "@/components/common/PageState";
import { ProjectFormDrawer } from "@/components/projects/ProjectForm";
import { PROJECT_STATUS_OPTIONS } from "@/constants/options";
import { useAsyncPageData } from "@/hooks/useAsyncPageData";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { useEntityEditor } from "@/hooks/useEntityEditor";
import { useSettings } from "@/hooks/useSettings";
import { getApiErrorMessage } from "@/services/client";
import { listMembers } from "@/services/members";
import { listProjects, updateProject } from "@/services/projects";
import { listTasks } from "@/services/tasks";
import type { Member } from "@/types/member";
import type { Project, ProjectStatus } from "@/types/project";
import type { ProjectView } from "@/types/settings";
import type { Task } from "@/types/task";
import { countActiveFilters, indexById } from "@/utils/collection";
import { formatShortDate, isOverdue } from "@/utils/date";
import {
  getProjectPermissions,
  PERMISSION_DENIED,
} from "@/utils/Permissions.ts";
import "./Project.css";

const STATUS_META: Record<
  ProjectStatus,
  { label: string; color: string; className: string }
> = {
  planning: { label: "规划中", color: "default", className: "planning" },
  active: { label: "进行中", color: "processing", className: "active" },
  completed: { label: "已完成", color: "success", className: "completed" },
  archived: { label: "已归档", color: "default", className: "archived" },
};
type DateSort = "createdAt" | "deadline" | "updatedAt";
const DATE_SORT_OPTIONS: Array<{
  label: string;
  value: DateSort;
}> = [
  { label: "最近更新", value: "updatedAt" },
  { label: "创建时间", value: "createdAt" },
  { label: "截止日期", value: "deadline" },
];
const FILTER_SELECT_PROPS = {
  allowClear: true,
  showSearch: false,
};

interface ProjectsPageData {
  tasks: Task[];
  projects: Project[];
  members: Member[];
}

interface ProjectFilters {
  keyword?: string;
  status?: ProjectStatus;
  leaderId?: string;
  favoriteOnly?: boolean;
  overdueOnly?: boolean;
}

interface ProjectMetrics {
  total: number;
  open: number;
  review: number;
  overdue: number;
  progress: number;
}

const EMPTY_METRICS: ProjectMetrics = {
  total: 0,
  open: 0,
  review: 0,
  overdue: 0,
  progress: 0,
};

const INITIAL_PROJECTS_PAGE_DATA: ProjectsPageData = {
  tasks: [],
  projects: [],
  members: [],
};

async function loadProjectsPageData(): Promise<ProjectsPageData> {
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

function getProjectsPageErrorMessage(error: unknown) {
  return getApiErrorMessage(error, "项目加载失败，请稍后重试");
}

function isProjectOverdue(project: Project) {
  return isOverdue(
    project.deadline,
    project.status === "completed" || project.status === "archived",
  );
}

function StatusTag({ status }: { status: ProjectStatus }) {
  const meta = STATUS_META[status];
  return <Tag color={meta.color}>{meta.label}</Tag>;
}

interface ProjectCardProps {
  project: Project;
  member?: Member;
  metrics: ProjectMetrics;
  editable: boolean;
  favoriteBusy: boolean;
  onEdit: (project: Project) => void;
  onOpenDetail: (project: Project) => void;
  onToggleFavorite: (project: Project) => void;
}

function ProjectCard({
  project,
  member,
  metrics,
  editable,
  favoriteBusy,
  onEdit,
  onOpenDetail,
  onToggleFavorite,
}: ProjectCardProps) {
  const overdue = isProjectOverdue(project);

  return (
    <article
      className={`project-workspace-card${overdue ? " is-overdue" : ""}`}
      style={{ "--project-accent": project.color } as CSSProperties}
    >
      <header className="project-card-heading">
        <span className="project-card-symbol" aria-hidden="true">
          {project.name.slice(0, 1)}
        </span>
        <div>
          <button type="button" onClick={() => onEdit(project)}>
            {project.name}
          </button>
          <small>{project.members.length} 名成员</small>
        </div>
        <Tooltip title={editable ? "切换收藏" : PERMISSION_DENIED.editProject}>
          <Button
            className="project-favorite-button"
            type="text"
            size="small"
            aria-label={project.favorite ? "取消收藏" : "收藏项目"}
            icon={project.favorite ? <StarFilled /> : <StarOutlined />}
            loading={favoriteBusy}
            onClick={() => onToggleFavorite(project)}
          />
        </Tooltip>
      </header>

      <p className="project-card-description">{project.description}</p>

      <div className="project-card-insights">
        <span>
          <b>{metrics.total}</b> 工作项
        </span>
        <span>
          <b>{metrics.open}</b> 未完成
        </span>
        <span className={metrics.overdue ? "danger-text" : undefined}>
          <b>{metrics.overdue}</b> 逾期
        </span>
      </div>

      <div className="project-card-progress">
        <div>
          <span>项目进度</span>
          <b>{metrics.progress}%</b>
        </div>
        <Progress
          percent={metrics.progress}
          showInfo={false}
          strokeColor={project.color}
        />
      </div>

      <footer className="project-card-footer">
        <MemberAvatar member={member} size={24} showName />
        <Tooltip title={overdue ? "该项目已逾期" : "截止日期"}>
          <time className={overdue ? "danger-text" : undefined}>
            {overdue ? <WarningFilled /> : <CalendarOutlined />}
            {formatShortDate(project.deadline)}
          </time>
        </Tooltip>
      </footer>

      <div className="project-card-status">
        <StatusTag status={project.status} />
        <Button type="link" size="small" onClick={() => onOpenDetail(project)}>
          查看详情
        </Button>
      </div>
    </article>
  );
}

interface ProjectBoardProps {
  projects: Project[];
  membersById: ReadonlyMap<string, Member>;
  metricsByProjectId: ReadonlyMap<string, ProjectMetrics>;
  favoriteBusyId?: string;
  canEdit: (project: Project) => boolean;
  onEdit: (project: Project) => void;
  onOpenDetail: (project: Project) => void;
  onToggleFavorite: (project: Project) => void;
}

function ProjectBoard({
  projects,
  membersById,
  metricsByProjectId,
  favoriteBusyId,
  canEdit,
  onEdit,
  onOpenDetail,
  onToggleFavorite,
}: ProjectBoardProps) {
  return (
    <div className="project-board" aria-label="项目看板">
      {PROJECT_STATUS_OPTIONS.map((column) => {
        const columnProjects = projects.filter(
          (project) => project.status === column.value,
        );

        return (
          <section className="project-column" key={column.value}>
            <header className="project-column-header">
              <span
                className={`project-status-dot ${STATUS_META[column.value].className}`}
              />
              <b>{column.label}</b>
              <strong>{columnProjects.length}</strong>
            </header>
            <div className="project-column-content">
              {columnProjects.length ? (
                columnProjects.map((project) => (
                  <ProjectCard
                    key={project.id}
                    project={project}
                    member={membersById.get(project.leaderId)}
                    metrics={
                      metricsByProjectId.get(project.id) ?? EMPTY_METRICS
                    }
                    editable={canEdit(project)}
                    favoriteBusy={favoriteBusyId === project.id}
                    onEdit={onEdit}
                    onOpenDetail={onOpenDetail}
                    onToggleFavorite={onToggleFavorite}
                  />
                ))
              ) : (
                <div className="project-column-empty">暂无项目</div>
              )}
            </div>
          </section>
        );
      })}
    </div>
  );
}

export default function ProjectsWorkspacePage() {
  const { message } = App.useApp();
  const currentUser = useCurrentUser();
  const { settings: appSettings } = useSettings();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [view, setView] = useState<ProjectView>(
    appSettings.defaultProjectView,
  );
  const [filters, setFilters] = useState<ProjectFilters>(() => ({
    leaderId: searchParams.get("leaderId") || undefined,
  }));
  const [sort, setSort] = useState<DateSort>("updatedAt");
  const [favoriteBusyId, setFavoriteBusyId] = useState<string>();
  const { data, setData, loading, refreshing, error, reload, refresh } =
    useAsyncPageData({
      initialData: INITIAL_PROJECTS_PAGE_DATA,
      load: loadProjectsPageData,
      getErrorMessage: getProjectsPageErrorMessage,
    });
  const { tasks, projects, members } = data;
  const {
    open: drawerOpen,
    editingItem: editingProject,
    openCreate,
    openEdit,
    close: closeEditor,
  } = useEntityEditor<Project>();

  const projectsById = useMemo(() => indexById(projects), [projects]);
  const membersById = useMemo(() => indexById(members), [members]);
  const metricsByProjectId = useMemo(() => {
    const mutableMetrics = new Map<
      string,
      ProjectMetrics & { completed: number }
    >();

    for (const project of projects) {
      mutableMetrics.set(project.id, { ...EMPTY_METRICS, completed: 0 });
    }

    for (const task of tasks) {
      const metrics = mutableMetrics.get(task.projectId);
      if (!metrics) continue;
      metrics.total += 1;
      if (task.status === "done") metrics.completed += 1;
      if (task.status === "review") metrics.review += 1;
      if (isOverdue(task.deadline, task.status === "done")) {
        metrics.overdue += 1;
      }
    }

    const result = new Map<string, ProjectMetrics>();
    for (const [projectId, metrics] of mutableMetrics) {
      const project = projectsById.get(projectId);
      const progress = metrics.total
        ? Math.round((metrics.completed / metrics.total) * 100)
        : project?.status === "completed" || project?.status === "archived"
          ? 100
          : 0;
      result.set(projectId, {
        total: metrics.total,
        open: metrics.total - metrics.completed,
        review: metrics.review,
        overdue: metrics.overdue,
        progress,
      });
    }
    return result;
  }, [projects, projectsById, tasks]);

  const summary = useMemo(
    () => ({
      total: projects.length,
      active: projects.filter((project) => project.status === "active").length,
      favorites: projects.filter((project) => project.favorite).length,
      tasks: tasks.length,
      risks: projects.filter(isProjectOverdue).length,
    }),
    [projects, tasks.length],
  );

  const isProjectEditable = useCallback(
    (project: Project) =>
      getProjectPermissions(project, currentUser.memberId).canEditProject,
    [currentUser.memberId],
  );

  const openProjectDetail = useCallback(
    (project: Project) => navigate(`/projects/${project.id}`),
    [navigate],
  );

  const handleOpenCreate = useCallback(() => {
    openCreate();
  }, [openCreate]);

  useEffect(() => {
    if (loading || searchParams.get("create") !== "1") return;

    let active = true;
    queueMicrotask(() => {
      if (!active) return;
      handleOpenCreate();
      const nextParams = new URLSearchParams(searchParams);
      nextParams.delete("create");
      setSearchParams(nextParams, { replace: true });
    });
    return () => {
      active = false;
    };
  }, [handleOpenCreate, loading, searchParams, setSearchParams]);

  const filteredProjects = useMemo(() => {
    const keyword = filters.keyword?.trim().toLowerCase();

    return projects
      .filter((project) => {
        const leader = membersById.get(project.leaderId);
        const searchableText = [
          project.name,
          project.description,
          leader?.name,
          leader?.department,
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();

        return (
          (!keyword || searchableText.includes(keyword)) &&
          (!filters.status || project.status === filters.status) &&
          (!filters.leaderId || project.leaderId === filters.leaderId) &&
          (!filters.favoriteOnly || project.favorite) &&
          (!filters.overdueOnly || isProjectOverdue(project))
        );
      })
      .toSorted((left, right) => {
        const leftOverdue = isProjectOverdue(left);
        const rightOverdue = isProjectOverdue(right);
        if (leftOverdue !== rightOverdue) return leftOverdue ? -1 : 1;
        return sort === "createdAt"
          ? right.createdAt.localeCompare(left.createdAt)
          : sort === "deadline"
            ? left.deadline.localeCompare(right.deadline)
            : right.updatedAt.localeCompare(left.updatedAt);
      });
  }, [filters, membersById, projects, sort]);

  const activeFilterCount = useMemo(
    () => countActiveFilters(filters),
    [filters],
  );

  const handleProjectSaved = useCallback(
    (savedProject: Project) => {
      setData((current) => {
        const projectExists = current.projects.some(
          (project) => project.id === savedProject.id,
        );
        const nextProjects = projectExists
          ? current.projects.map((project) =>
              project.id === savedProject.id ? savedProject : project,
            )
          : [savedProject, ...current.projects];
        return { ...current, projects: nextProjects };
      });
    },
    [setData],
  );

  const handleToggleFavorite = useCallback(
    async (project: Project) => {
      if (!isProjectEditable(project)) {
        message.error(PERMISSION_DENIED.editProject);
        return;
      }
      if (favoriteBusyId) return;

      setFavoriteBusyId(project.id);
      try {
        const savedProject = await updateProject(project.id, {
          favorite: !project.favorite,
        });
        handleProjectSaved(savedProject);
        message.success(savedProject.favorite ? "已收藏项目" : "已取消收藏");
      } catch (requestError) {
        message.error(getApiErrorMessage(requestError, "收藏状态更新失败"));
      } finally {
        setFavoriteBusyId(undefined);
      }
    },
    [favoriteBusyId, handleProjectSaved, isProjectEditable, message],
  );

  const columns: TableProps<Project>["columns"] = useMemo(
    () => [
      {
        title: "项目",
        key: "project",
        width: 300,
        render: (_, project) => (
          <div className="project-title-cell">
            <i style={{ background: project.color }} />
            <div>
              <button type="button" onClick={() => openProjectDetail(project)}>
                {project.name}
              </button>
              <small>{project.description}</small>
            </div>
          </div>
        ),
      },
      {
        title: "状态",
        key: "status",
        width: 90,
        render: (_, project) => <StatusTag status={project.status} />,
      },
      {
        title: "负责人",
        key: "leader",
        width: 120,
        render: (_, project) => (
          <MemberAvatar
            member={membersById.get(project.leaderId)}
            size={24}
            showName
          />
        ),
      },
      {
        title: "进度",
        key: "progress",
        width: 150,
        render: (_, project) => {
          const metrics = metricsByProjectId.get(project.id) ?? EMPTY_METRICS;
          return (
            <span className="project-progress-cell">
              <Progress
                percent={metrics.progress}
                size="small"
                strokeColor={project.color}
              />
            </span>
          );
        },
      },
      {
        title: "工作项",
        key: "tasks",
        width: 145,
        render: (_, project) => {
          const metrics = metricsByProjectId.get(project.id) ?? EMPTY_METRICS;
          return (
            <span className="project-task-count">
              <b>{metrics.open}</b> 未完成
              {metrics.review ? ` · ${metrics.review} 待审` : ""}
            </span>
          );
        },
      },
      {
        title: "成员",
        key: "members",
        width: 75,
        render: (_, project) => `${project.members.length} 人`,
      },
      {
        title: "截止日期",
        key: "deadline",
        width: 120,
        render: (_, project) => {
          const overdue = isProjectOverdue(project);
          return (
            <time className={overdue ? "danger-text" : undefined}>
              {overdue ? <WarningFilled /> : null}
              {formatShortDate(project.deadline)}
            </time>
          );
        },
      },
      {
        title: "操作",
        key: "actions",
        fixed: "right",
        width: 130,
        render: (_, project) => (
          <Space size={0}>
            <Button
              type="link"
              size="small"
              onClick={() => openProjectDetail(project)}
            >
              详情
            </Button>
            <Button type="link" size="small" onClick={() => openEdit(project)}>
              {isProjectEditable(project) ? "编辑" : "查看"}
            </Button>
          </Space>
        ),
      },
    ],
    [
      isProjectEditable,
      membersById,
      metricsByProjectId,
      openEdit,
      openProjectDetail,
    ],
  );

  const projectContent =
    view === "card" ? (
      <ProjectBoard
        projects={filteredProjects}
        membersById={membersById}
        metricsByProjectId={metricsByProjectId}
        favoriteBusyId={favoriteBusyId}
        canEdit={isProjectEditable}
        onEdit={openEdit}
        onOpenDetail={openProjectDetail}
        onToggleFavorite={(project) => void handleToggleFavorite(project)}
      />
    ) : (
      <div className="project-table-panel">
        <Table
          rowKey="id"
          columns={columns}
          dataSource={filteredProjects}
          scroll={{ x: 1110 }}
          rowClassName={(project) =>
            isProjectOverdue(project) ? "project-table-row-overdue" : ""
          }
          pagination={{
            pageSize: appSettings.pageSize,
            showSizeChanger: false,
            showTotal: (total) => `共 ${total} 个项目`,
          }}
        />
      </div>
    );

  return (
    <div className="page-container projects-workspace-page">
      <PageHeader
        title="项目"
        description="集中管理课程项目、团队协作与社团活动"
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
              onClick={handleOpenCreate}
            >
              创建项目
            </Button>
          </Space>
        }
      />

      <section
        className="workspace-summary project-workspace-summary"
        aria-label="项目总览"
      >
        <article>
          <span>
            <ProjectOutlined />
          </span>
          <small>全部项目</small>
          <strong>{summary.total}</strong>
          <em>{summary.active} 个进行中</em>
        </article>
        <article>
          <span>
            <FlagOutlined />
          </span>
          <small>收藏项目</small>
          <strong>{summary.favorites}</strong>
          <em>优先跟进空间</em>
        </article>
        <article>
          <span>
            <CalendarOutlined />
          </span>
          <small>全部工作项</small>
          <strong>{summary.tasks}</strong>
          <em>跨项目协作</em>
        </article>
        <article className={summary.risks ? "risk" : undefined}>
          <span>
            <WarningFilled />
          </span>
          <small>逾期项目</small>
          <strong>{summary.risks}</strong>
          <em>{summary.risks ? "需要优先处理" : "当前进度健康"}</em>
        </article>
      </section>

      <section className="project-controls surface-panel" aria-label="项目筛选">
        <div className="project-filter-grid">
          <Input
            className="project-search-input"
            prefix={<SearchOutlined />}
            allowClear
            value={filters.keyword}
            placeholder="搜索项目、负责人或院系"
            onChange={(event) =>
              setFilters((current) => ({
                ...current,
                keyword: event.target.value || undefined,
              }))
            }
          />
          <Select
            {...FILTER_SELECT_PROPS}
            aria-label="按状态筛选"
            value={filters.status}
            placeholder="全部状态"
            options={[...PROJECT_STATUS_OPTIONS]}
            onChange={(status) =>
              setFilters((current) => ({ ...current, status }))
            }
          />
          <Select
            aria-label="按时间排序"
            value={sort}
            placeholder="最近更新"
            options={[...DATE_SORT_OPTIONS]}
            onChange={setSort}
          ></Select>
          <Select
            {...FILTER_SELECT_PROPS}
            aria-label="按负责人筛选"
            value={filters.leaderId}
            placeholder="全部负责人"
            options={members.map((member) => ({
              label: member.name,
              value: member.id,
            }))}
            onChange={(leaderId) =>
              setFilters((current) => ({ ...current, leaderId }))
            }
          />
          <Button
            type={filters.favoriteOnly ? "primary" : "default"}
            icon={<StarFilled />}
            onClick={() =>
              setFilters((current) => ({
                ...current,
                favoriteOnly: !current.favoriteOnly,
              }))
            }
          >
            仅看收藏
          </Button>
          <Button
            type={filters.overdueOnly ? "primary" : "default"}
            danger={filters.overdueOnly}
            icon={<WarningFilled />}
            onClick={() =>
              setFilters((current) => ({
                ...current,
                overdueOnly: !current.overdueOnly,
              }))
            }
          >
            仅看逾期
          </Button>
          <Button disabled={!activeFilterCount} onClick={() => setFilters({})}>
            清空{activeFilterCount ? ` (${activeFilterCount})` : ""}
          </Button>
        </div>

        <div className="project-controls-footer">
          <span>
            显示 <b>{filteredProjects.length}</b> / {projects.length} 个项目
            {summary.favorites ? ` · ${summary.favorites} 个收藏` : ""}
          </span>
          <Segmented
            value={view}
            onChange={(value) => setView(value as ProjectView)}
            options={[
              { value: "list", icon: <UnorderedListOutlined />, label: "列表" },
              { value: "card", icon: <AppstoreOutlined />, label: "看板" },
            ]}
          />
        </div>
      </section>

      <PageState
        loading={loading}
        error={error}
        empty={!filteredProjects.length}
        loadingDescription="正在加载项目..."
        errorTitle="项目加载失败"
        emptyDescription={
          projects.length ? "没有符合当前筛选条件的项目" : "还没有项目"
        }
        onRetry={reload}
        emptyAction={
          projects.length ? (
            <Button onClick={() => setFilters({})}>清空筛选</Button>
          ) : (
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={handleOpenCreate}
            >
              创建第一个项目
            </Button>
          )
        }
      >
        {projectContent}
      </PageState>

      <ProjectFormDrawer
        open={drawerOpen}
        project={editingProject}
        members={members}
        currentMemberId={currentUser.memberId}
        onClose={closeEditor}
        onSaved={handleProjectSaved}
      />
    </div>
  );
}
