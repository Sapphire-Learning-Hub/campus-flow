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
import type { TFunction } from "i18next";
import { useCallback, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router";
import { MemberAvatar } from "@/components/common/MemberAvatar";
import { PageHeader } from "@/components/common/PageHeader";
import { PageState } from "@/components/common/PageState";
import { ProjectFormDrawer } from "@/components/projects/ProjectForm";
import { TaskFormDrawer } from "@/components/tasks/TaskForm";
import { PROJECT_STATUS_META } from "@/constants/status.ts";
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
import type { Project } from "@/types/project";
import type { Task } from "@/types/task";
import { indexById } from "@/utils/collection";
import {
  daysUntil,
  formatDate,
  formatShortDate,
  isOverdue,
} from "@/utils/date";
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

function getGreeting(t: TFunction) {
  const hour = dayjs().hour();
  if (hour < 6) return t("dashboard.greeting.night");
  if (hour < 12) return t("dashboard.greeting.morning");
  if (hour < 18) return t("dashboard.greeting.afternoon");
  return t("dashboard.greeting.evening");
}

function getDeadlineLabel(t: TFunction, deadline?: string) {
  const remainingDays = daysUntil(deadline);
  if (remainingDays === null) return t("dashboard.deadline.none");
  if (remainingDays < 0) {
    return t("dashboard.deadline.overdue", {
      count: Math.abs(remainingDays),
    });
  }
  if (remainingDays === 0) return t("dashboard.deadline.today");
  if (remainingDays === 1) return t("dashboard.deadline.tomorrow");
  if (remainingDays <= 7) {
    return t("dashboard.deadline.days", { count: remainingDays });
  }
  return formatShortDate(deadline);
}

function getRelativeTime(t: TFunction, value: string) {
  const createdAt = dayjs(value);
  const minuteDiff = dayjs().diff(createdAt, "minute");
  if (minuteDiff < 1) return t("dashboard.relativeTime.justNow");
  if (minuteDiff < 60) {
    return t("dashboard.relativeTime.minutes", { count: minuteDiff });
  }
  const hourDiff = dayjs().diff(createdAt, "hour");
  if (hourDiff < 24) {
    return t("dashboard.relativeTime.hours", { count: hourDiff });
  }
  const dayDiff = dayjs().diff(createdAt, "day");
  if (dayDiff < 7) {
    return t("dashboard.relativeTime.days", { count: dayDiff });
  }
  return formatShortDate(value);
}

export default function DashboardPage() {
  const { t } = useTranslation();
  const { message } = App.useApp();
  const currentUser = useCurrentUser();
  const navigate = useNavigate();
  const getDashboardErrorMessage = useCallback(
    (requestError: unknown) =>
      getApiErrorMessage(requestError, t("dashboard.loadError")),
    [t],
  );
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
        label: t("dashboard.metrics.activeProjects"),
        value: summary.activeProjects,
        note: t("dashboard.metrics.projectTotal", { count: projects.length }),
        icon: <FolderOpenOutlined />,
        tone: "blue",
        onClick: () => navigate("/projects"),
      },
      {
        label: t("dashboard.metrics.openTasks"),
        value: summary.openTasks,
        note: t("dashboard.metrics.taskTotal", { count: tasks.length }),
        icon: <ClockCircleOutlined />,
        tone: "cyan",
        onClick: () => navigate("/tasks"),
      },
      {
        label: t("dashboard.metrics.dueSoon"),
        value: summary.dueSoon,
        note: t("dashboard.metrics.dueSoonNote"),
        icon: <CalendarOutlined />,
        tone: "amber",
        onClick: () => navigate("/tasks"),
      },
      {
        label: t("dashboard.metrics.overdue"),
        value: summary.overdueTasks,
        note: summary.overdueTasks
          ? t("dashboard.metrics.overdueAction")
          : t("dashboard.metrics.healthy"),
        icon: <WarningFilled />,
        tone: "red",
        onClick: () => navigate("/tasks"),
      },
      {
        label: t("dashboard.metrics.members"),
        value: summary.members,
        note: t("dashboard.metrics.visibleScope"),
        icon: <TeamOutlined />,
        tone: "violet",
        onClick: () => navigate("/members"),
      },
    ],
    [navigate, projects.length, summary, t, tasks.length],
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
        title={t("dashboard.header.title", {
          greeting: getGreeting(t),
          name: currentUser.name,
        })}
        description={t("dashboard.header.description", {
          date: formatDate(dayjs().toISOString()),
        })}
        actions={
          <Space wrap>
            <Button
              aria-label={t("dashboard.actions.refresh")}
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
              {t("dashboard.actions.createTask")}
            </Button>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              disabled={loading}
              onClick={openProjectCreate}
            >
              {t("dashboard.actions.createProject")}
            </Button>
          </Space>
        }
      />

      <PageState
        loading={loading}
        error={error}
        empty={!projects.length}
        loadingDescription={t("dashboard.states.loading")}
        errorTitle={t("dashboard.states.errorTitle")}
        emptyDescription={t("dashboard.states.empty")}
        onRetry={reload}
        emptyAction={
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={openProjectCreate}
          >
            {t("dashboard.actions.createProject")}
          </Button>
        }
      >
        <section
          className="metric-band"
          aria-label={t("dashboard.metrics.regionLabel")}
        >
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
                <h2>{t("dashboard.projects.title")}</h2>
                <p>{t("dashboard.projects.description")}</p>
              </div>
              <Button type="link" onClick={() => navigate("/projects")}>
                {t("dashboard.actions.viewAll")}
                <ArrowRightOutlined />
              </Button>
            </div>

            <div className="project-progress-header" aria-hidden="true">
              <span />
              <span>{t("dashboard.projects.columns.project")}</span>
              <span>{t("dashboard.projects.columns.owner")}</span>
              <span>{t("dashboard.projects.columns.progress")}</span>
              <span>{t("dashboard.projects.columns.deadlineStatus")}</span>
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
                        {t("dashboard.projects.collaborationSummary", {
                          members: project.members.length,
                          tasks: metrics?.total ?? 0,
                        })}
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
                        {overdue
                          ? t("dashboard.deadline.overdueShort")
                          : formatShortDate(project.deadline)}
                      </time>
                      <small
                        className={`project-status-text ${PROJECT_STATUS_META[project.status].className}`}
                        style={{ color: PROJECT_STATUS_META[project.status].hex }}
                      >
                        {t(`options.projectStatus.${project.status}`)}
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
                <h2>{t("dashboard.tasks.title")}</h2>
                <p>{t("dashboard.tasks.description")}</p>
              </div>
              <Button
                type="link"
                onClick={() =>
                  navigate(`/tasks?assigneeId=${currentUser.memberId}`)
                }
              >
                {t("dashboard.actions.all")}
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
                          {project?.name ?? t("dashboard.unknownProject")}
                          <span aria-hidden="true">·</span>
                          {t(`options.taskStatus.${task.status}`)}
                        </small>
                      </span>
                      <span className="focus-task-meta">
                        <small
                          className={`priority-text priority-${task.priority}`}
                        >
                          {t("dashboard.tasks.priority", {
                            priority: t(`options.priority.${task.priority}`),
                          })}
                        </small>
                        <time className={overdue ? "is-overdue" : ""}>
                          {getDeadlineLabel(t, task.deadline)}
                        </time>
                      </span>
                      <RightOutlined />
                    </button>
                  );
                })
              ) : (
                <div className="dashboard-compact-empty">
                  <CheckCircleOutlined />
                  <b>{t("dashboard.tasks.emptyTitle")}</b>
                  <span>{t("dashboard.tasks.emptyDescription")}</span>
                </div>
              )}
            </div>
          </section>
        </div>

        <section className="surface-panel activity-panel">
          <div className="section-heading">
            <div>
              <h2>{t("dashboard.activities.title")}</h2>
              <p>{t("dashboard.activities.description")}</p>
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
                        <b>{actor?.name ?? t("dashboard.unknownMember")}</b>
                        {activity.content}
                      </span>
                      <small>
                        {project?.name ?? t("dashboard.unknownProject")} ·{" "}
                        {getRelativeTime(t, activity.createdAt)}
                      </small>
                    </span>
                    <RightOutlined />
                  </button>
                );
              })
            ) : (
              <div className="dashboard-compact-empty dashboard-activity-empty">
                <ClockCircleOutlined />
                <b>{t("dashboard.activities.emptyTitle")}</b>
                <span>{t("dashboard.activities.emptyDescription")}</span>
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
