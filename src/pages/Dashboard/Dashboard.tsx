import {
  ArrowRightOutlined,
  CalendarOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  FolderOpenOutlined,
  PlusOutlined,
  ReloadOutlined,
  RightOutlined,
  TeamOutlined,
  WarningFilled,
} from "@ant-design/icons";
import { App, Button, Progress, Space } from "antd";
import dayjs from "dayjs";
import { useCallback, useMemo } from "react";
import { useNavigate } from "react-router";
import { MemberAvatar } from "@/components/common/MemberAvatar";
import { PageHeader } from "@/components/common/PageHeader";
import { PageState } from "@/components/common/PageState";
import { ProjectFormDrawer } from "@/components/projects/ProjectForm";
import { TaskFormDrawer } from "@/components/tasks/TaskForm";
import { useAsyncPageData } from "@/hooks/useAsyncPageData";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { useEntityEditor } from "@/hooks/useEntityEditor";
import { listActivities } from "@/services/activities";
import { getApiErrorMessage } from "@/services/client";
import { listMembers } from "@/services/members";
import { listProjects } from "@/services/projects";
import { listTasks } from "@/services/tasks";
import type { Activity, ActivityKind } from "@/types/activity";
import type { Member } from "@/types/member";
import type { Project, ProjectStatus } from "@/types/project";
import type { Task, TaskPriority, TaskStatus } from "@/types/task";
import { indexById } from "@/utils/collection";
import { daysUntil, formatShortDate, isOverdue } from "@/utils/date";
import { getProjectPermissions, PERMISSION_DENIED } from "@/utils/Permissions";
import "./index.css";

interface DashboardData {
  tasks: Task[];
  projects: Project[];
  members: Member[];
  activities: Activity[];
}

interface ProjectMetrics {
  total: number;
  completed: number;
  review: number;
  overdue: number;
  progress: number;
}

const INITIAL_DATA: DashboardData = {
  tasks: [],
  projects: [],
  members: [],
  activities: [],
};

const PROJECT_STATUS_LABELS: Record<ProjectStatus, string> = {
  planning: "规划中",
  active: "进行中",
  completed: "已完成",
  archived: "已归档",
};

const TASK_STATUS_LABELS: Record<TaskStatus, string> = {
  pending: "待处理",
  in_progress: "进行中",
  review: "待审核",
  done: "已完成",
};

const PRIORITY_LABELS: Record<TaskPriority, string> = {
  low: "低",
  medium: "中",
  high: "高",
  urgent: "紧急",
};

const ACTIVITY_ICONS: Record<ActivityKind, React.ReactNode> = {
  project_created: <FolderOpenOutlined />,
  project_updated: <FolderOpenOutlined />,
  task_created: <PlusOutlined />,
  task_updated: <CheckCircleOutlined />,
  member_updated: <TeamOutlined />,
};

async function loadDashboardData(): Promise<DashboardData> {
  const [taskResult, projectResult, members, activities] = await Promise.all([
    listTasks({ pageSize: 100 }),
    listProjects({ pageSize: 100 }),
    listMembers(),
    listActivities({ limit: 8 }),
  ]);

  return {
    tasks: taskResult.items,
    projects: projectResult.items,
    members,
    activities,
  };
}

function getDashboardErrorMessage(error: unknown) {
  return getApiErrorMessage(error, "工作台数据加载失败，请稍后重试");
}

function getGreeting() {
  const hour = dayjs().hour();
  if (hour < 6) return "夜深了";
  if (hour < 12) return "上午好";
  if (hour < 18) return "下午好";
  return "晚上好";
}

function getDeadlineLabel(deadline?: string) {
  const remainingDays = daysUntil(deadline);
  if (remainingDays === null) return "无截止日期";
  if (remainingDays < 0) return `已逾期 ${Math.abs(remainingDays)} 天`;
  if (remainingDays === 0) return "今天截止";
  if (remainingDays === 1) return "明天截止";
  if (remainingDays <= 7) return `${remainingDays} 天后截止`;
  return formatShortDate(deadline);
}

function getRelativeTime(value: string) {
  const createdAt = dayjs(value);
  const minuteDiff = dayjs().diff(createdAt, "minute");
  if (minuteDiff < 1) return "刚刚";
  if (minuteDiff < 60) return `${minuteDiff} 分钟前`;
  const hourDiff = dayjs().diff(createdAt, "hour");
  if (hourDiff < 24) return `${hourDiff} 小时前`;
  const dayDiff = dayjs().diff(createdAt, "day");
  if (dayDiff < 7) return `${dayDiff} 天前`;
  return createdAt.format("M月D日");
}

export default function DashboardPage() {
  const { message } = App.useApp();
  const currentUser = useCurrentUser();
  const navigate = useNavigate();
  const { data, setData, loading, refreshing, error, reload, refresh } =
    useAsyncPageData({
      initialData: INITIAL_DATA,
      load: loadDashboardData,
      getErrorMessage: getDashboardErrorMessage,
    });
  const { tasks, projects, members, activities } = data;
  const {
    open: projectDrawerOpen,
    openCreate: openProjectCreate,
    close: closeProjectEditor,
  } = useEntityEditor<Project>();
  const {
    open: taskDrawerOpen,
    editingItem: editingTask,
    openCreate: openTaskCreate,
    openEdit: openTaskEdit,
    close: closeTaskEditor,
  } = useEntityEditor<Task>();

  const projectsById = useMemo(() => indexById(projects), [projects]);
  const membersById = useMemo(() => indexById(members), [members]);

  const projectMetrics = useMemo(() => {
    const result = new Map<string, ProjectMetrics>();

    for (const project of projects) {
      result.set(project.id, {
        total: 0,
        completed: 0,
        review: 0,
        overdue: 0,
        progress: 0,
      });
    }

    for (const task of tasks) {
      const metrics = result.get(task.projectId);
      if (!metrics) continue;
      metrics.total += 1;
      if (task.status === "done") metrics.completed += 1;
      if (task.status === "review") metrics.review += 1;
      if (isOverdue(task.deadline, task.status === "done")) {
        metrics.overdue += 1;
      }
    }

    for (const project of projects) {
      const metrics = result.get(project.id);
      if (!metrics) continue;
      metrics.progress = metrics.total
        ? Math.round((metrics.completed / metrics.total) * 100)
        : project.status === "completed" || project.status === "archived"
          ? 100
          : 0;
    }

    return result;
  }, [projects, tasks]);

  const summary = useMemo(() => {
    let activeProjects = 0;
    let openTasks = 0;
    let dueSoon = 0;
    let overdueTasks = 0;

    for (const project of projects) {
      if (project.status === "active") activeProjects += 1;
    }

    for (const task of tasks) {
      if (task.status === "done") continue;
      openTasks += 1;
      const remainingDays = daysUntil(task.deadline);
      if (remainingDays !== null && remainingDays >= 0 && remainingDays <= 7) {
        dueSoon += 1;
      }
      if (isOverdue(task.deadline)) overdueTasks += 1;
    }

    return {
      activeProjects,
      openTasks,
      dueSoon,
      overdueTasks,
      members: members.length,
    };
  }, [members.length, projects, tasks]);

  const recentProjects = useMemo(
    () =>
      [...projects]
        .sort(
          (a, b) => dayjs(b.updatedAt).valueOf() - dayjs(a.updatedAt).valueOf(),
        )
        .slice(0, 5),
    [projects],
  );

  const focusTasks = useMemo(() => {
    const incompleteTasks = tasks.filter((task) => task.status !== "done");
    const myTasks = incompleteTasks.filter(
      (task) => task.assigneeId === currentUser.memberId,
    );
    const source = myTasks.length ? myTasks : incompleteTasks;

    return [...source]
      .sort((a, b) => {
        const aDeadline = a.deadline ? dayjs(a.deadline).valueOf() : Infinity;
        const bDeadline = b.deadline ? dayjs(b.deadline).valueOf() : Infinity;
        return aDeadline - bDeadline;
      })
      .slice(0, 5);
  }, [currentUser.memberId, tasks]);

  const metricItems = useMemo(
    () => [
      {
        label: "进行中项目",
        value: summary.activeProjects,
        note: `共 ${projects.length} 个项目`,
        icon: <FolderOpenOutlined />,
        tone: "blue",
        onClick: () => navigate("/projects"),
      },
      {
        label: "流转中工作项",
        value: summary.openTasks,
        note: `${tasks.length} 个工作项总计`,
        icon: <ClockCircleOutlined />,
        tone: "cyan",
        onClick: () => navigate("/tasks"),
      },
      {
        label: "七天内到期",
        value: summary.dueSoon,
        note: "需要优先安排",
        icon: <CalendarOutlined />,
        tone: "amber",
        onClick: () => navigate("/tasks"),
      },
      {
        label: "逾期工作项",
        value: summary.overdueTasks,
        note: summary.overdueTasks ? "建议今天处理" : "当前节奏健康",
        icon: <WarningFilled />,
        tone: "red",
        onClick: () => navigate("/tasks"),
      },
      {
        label: "协作成员",
        value: summary.members,
        note: "当前可见范围",
        icon: <TeamOutlined />,
        tone: "violet",
        onClick: () => navigate("/members"),
      },
    ],
    [navigate, projects.length, summary, tasks.length],
  );

  const handleOpenTaskCreate = useCallback(() => {
    const canCreate = projects.some(
      (project) =>
        project.status !== "archived" &&
        getProjectPermissions(project, currentUser.memberId).canCreateTask,
    );
    if (!canCreate) {
      message.error(PERMISSION_DENIED.createTask);
      return;
    }
    openTaskCreate();
  }, [currentUser.memberId, message, openTaskCreate, projects]);

  const handleProjectSaved = useCallback(
    (savedProject: Project) => {
      setData((current) => {
        const exists = current.projects.some(
          (project) => project.id === savedProject.id,
        );
        return {
          ...current,
          projects: exists
            ? current.projects.map((project) =>
                project.id === savedProject.id ? savedProject : project,
              )
            : [savedProject, ...current.projects],
        };
      });
      void refresh();
    },
    [refresh, setData],
  );

  const handleTaskSaved = useCallback(
    (savedTask: Task) => {
      setData((current) => {
        const exists = current.tasks.some((task) => task.id === savedTask.id);
        return {
          ...current,
          tasks: exists
            ? current.tasks.map((task) =>
                task.id === savedTask.id ? savedTask : task,
              )
            : [savedTask, ...current.tasks],
        };
      });
      void refresh();
    },
    [refresh, setData],
  );

  const handleTaskDeleted = useCallback(
    (taskId: string) => {
      setData((current) => ({
        ...current,
        tasks: current.tasks.filter((task) => task.id !== taskId),
      }));
      void refresh();
    },
    [refresh, setData],
  );

  return (
    <div className="page-container dashboard-page">
      <PageHeader
        title={`${getGreeting()}，${currentUser.name}`}
        description={`${dayjs().format("YYYY年M月D日")} · 聚焦进度、截止与团队协作`}
        actions={
          <Space wrap>
            <Button
              aria-label="刷新工作台"
              icon={<ReloadOutlined />}
              loading={refreshing}
              disabled={loading}
              onClick={() => void refresh()}
            />
            <Button
              icon={<PlusOutlined />}
              disabled={loading}
              onClick={handleOpenTaskCreate}
            >
              创建工作项
            </Button>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              disabled={loading}
              onClick={openProjectCreate}
            >
              创建项目
            </Button>
          </Space>
        }
      />

      <PageState
        loading={loading}
        error={error}
        empty={!projects.length}
        loadingDescription="正在汇总工作台..."
        errorTitle="工作台加载失败"
        emptyDescription="还没有可展示的项目，先创建一个项目开始协作"
        onRetry={reload}
        emptyAction={
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={openProjectCreate}
          >
            创建项目
          </Button>
        }
      >
        <section className="metric-band" aria-label="工作台数据概览">
          {metricItems.map((item) => (
            <button
              className="metric-item"
              type="button"
              key={item.label}
              onClick={item.onClick}
            >
              <span className={`metric-icon ${item.tone}`}>{item.icon}</span>
              <span className="metric-copy">
                <span className="metric-label">{item.label}</span>
                <span className="metric-value-row">
                  <strong>{item.value}</strong>
                  <small>{item.note}</small>
                </span>
              </span>
            </button>
          ))}
        </section>

        <div className="dashboard-main-grid">
          <section className="surface-panel project-progress-panel">
            <div className="section-heading">
              <div>
                <h2>项目进展</h2>
                <p>按最近更新时间汇总关键项目</p>
              </div>
              <Button type="link" onClick={() => navigate("/projects")}>
                查看全部
                <ArrowRightOutlined />
              </Button>
            </div>

            <div className="project-progress-header" aria-hidden="true">
              <span />
              <span>项目</span>
              <span>负责人</span>
              <span>进度</span>
              <span>截止 / 状态</span>
            </div>

            <div className="project-progress-list">
              {recentProjects.map((project) => {
                const metrics = projectMetrics.get(project.id);
                const leader = membersById.get(project.leaderId);
                const overdue = isOverdue(
                  project.deadline,
                  project.status === "completed" ||
                    project.status === "archived",
                );

                return (
                  <button
                    className="project-progress-row"
                    type="button"
                    key={project.id}
                    onClick={() => navigate(`/projects/${project.id}`)}
                  >
                    <span
                      className="project-color"
                      style={{ background: project.color }}
                    />
                    <span className="project-progress-name">
                      <b>{project.name}</b>
                      <small>
                        {project.members.length} 人协作 · {metrics?.total ?? 0}{" "}
                        个工作项
                      </small>
                    </span>
                    <span className="project-progress-owner">
                      <MemberAvatar member={leader} size={24} showName />
                    </span>
                    <span className="project-progress-bar">
                      <Progress
                        percent={metrics?.progress ?? 0}
                        showInfo={false}
                        strokeColor={project.color}
                        railColor="var(--line)"
                      />
                      <small>{metrics?.progress ?? 0}%</small>
                    </span>
                    <span className="project-progress-state">
                      <time className={overdue ? "is-overdue" : ""}>
                        {overdue ? "已逾期" : formatShortDate(project.deadline)}
                      </time>
                      <small className={`status-${project.status}`}>
                        {PROJECT_STATUS_LABELS[project.status]}
                      </small>
                    </span>
                  </button>
                );
              })}
            </div>
          </section>

          <section className="surface-panel focus-panel">
            <div className="section-heading">
              <div>
                <h2>我的近期任务</h2>
                <p>先处理离截止时间最近的工作</p>
              </div>
              <Button
                type="link"
                onClick={() =>
                  navigate(`/tasks?assigneeId=${currentUser.memberId}`)
                }
              >
                全部
                <ArrowRightOutlined />
              </Button>
            </div>

            <div className="focus-task-list">
              {focusTasks.length ? (
                focusTasks.map((task) => {
                  const project = projectsById.get(task.projectId);
                  const overdue = isOverdue(task.deadline);
                  return (
                    <button
                      type="button"
                      className="focus-task-row"
                      key={task.id}
                      onClick={() => openTaskEdit(task)}
                    >
                      <span
                        className={`priority-rail priority-${task.priority}`}
                      />
                      <span className="focus-task-copy">
                        <b>{task.title}</b>
                        <small>
                          {project?.name ?? "未知项目"}
                          <span aria-hidden="true">·</span>
                          {TASK_STATUS_LABELS[task.status]}
                        </small>
                      </span>
                      <span className="focus-task-meta">
                        <small
                          className={`priority-text priority-${task.priority}`}
                        >
                          {PRIORITY_LABELS[task.priority]}优先级
                        </small>
                        <time className={overdue ? "is-overdue" : ""}>
                          {getDeadlineLabel(task.deadline)}
                        </time>
                      </span>
                      <RightOutlined />
                    </button>
                  );
                })
              ) : (
                <div className="dashboard-compact-empty">
                  <CheckCircleOutlined />
                  <b>近期任务已清空</b>
                  <span>可以开始规划下一项工作</span>
                </div>
              )}
            </div>
          </section>
        </div>

        <section className="surface-panel activity-panel">
          <div className="section-heading">
            <div>
              <h2>最近动态</h2>
              <p>你可见项目中的最新协作记录</p>
            </div>
          </div>

          <div className="activity-list">
            {activities.length ? (
              activities.map((activity) => {
                const actor = membersById.get(activity.actorId);
                const project = projectsById.get(activity.projectId);
                return (
                  <button
                    type="button"
                    key={activity.id}
                    onClick={() => navigate(`/projects/${activity.projectId}`)}
                  >
                    <span className={`activity-kind activity-${activity.kind}`}>
                      {ACTIVITY_ICONS[activity.kind]}
                    </span>
                    <MemberAvatar member={actor} size={30} />
                    <span className="activity-copy">
                      <span>
                        <b>{actor?.name ?? "未知成员"}</b>
                        {activity.content}
                      </span>
                      <small>
                        {project?.name ?? "未知项目"} ·{" "}
                        {getRelativeTime(activity.createdAt)}
                      </small>
                    </span>
                    <RightOutlined />
                  </button>
                );
              })
            ) : (
              <div className="dashboard-compact-empty dashboard-activity-empty">
                <ClockCircleOutlined />
                <b>暂无团队动态</b>
                <span>创建或更新工作项后，动态会显示在这里</span>
              </div>
            )}
          </div>
        </section>
      </PageState>

      <ProjectFormDrawer
        open={projectDrawerOpen}
        members={members}
        currentMemberId={currentUser.memberId}
        onClose={closeProjectEditor}
        onSaved={handleProjectSaved}
      />
      <TaskFormDrawer
        open={taskDrawerOpen}
        projects={projects}
        members={members}
        currentMemberId={currentUser.memberId}
        initial={editingTask}
        onClose={closeTaskEditor}
        onSaved={handleTaskSaved}
        onDeleted={handleTaskDeleted}
      />
    </div>
  );
}
