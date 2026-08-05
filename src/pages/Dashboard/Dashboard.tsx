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
import React, { useCallback, useMemo } from "react";
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
import { useSettings } from "@/hooks/useSettings";
import { getApiErrorMessage } from "@/services/client";
import type { ActivityKind } from "@/types/activity";
import type { Project } from "@/types/project";
import type { Task } from "@/types/task";
import { indexById } from "@/utils/collection";
import { formatDate, formatShortDate, isOverdue } from "@/utils/date";
import { getProjectPermissions, PERMISSION_DENIED } from "@/utils/Permissions";
import {
  calculateDashboardProjectMetrics,
  getDeadlineLabel,
  getFocusTasks,
  getGreeting,
  getRecentProjects,
  getRelativeTime,
  loadDashboardData,
  summarizeDashboard,
  type DashboardData,
} from "./dashboardData";
import "./index.css";

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

export default function DashboardPage() {
  const { t } = useTranslation();
  const { message } = App.useApp();
  const currentUser = useCurrentUser();
  const { settings: appSettings } = useSettings();
  const navigate = useNavigate();
  const getDashboardErrorMessage = useCallback(
    (requestError: unknown) => getApiErrorMessage(requestError, t("dashboard.loadError")),
    [t],
  );
  const loadPage = useCallback(
    (signal: AbortSignal) => loadDashboardData(appSettings.pageSize, signal),
    [appSettings.pageSize],
  );
  const { data, setData, loading, refreshing, error, reload, refresh } = useAsyncPageData({
    initialData: INITIAL_DATA,
    load: loadPage,
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

  const projectMetrics = useMemo(
    () => calculateDashboardProjectMetrics(projects, tasks),
    [projects, tasks],
  );

  const summary = useMemo(
    () => summarizeDashboard(projects, tasks, members.length),
    [members.length, projects, tasks],
  );

  const recentProjects = useMemo(() => getRecentProjects(projects), [projects]);

  const focusTasks = useMemo(
    () => getFocusTasks(tasks, currentUser.memberId),
    [currentUser.memberId, tasks],
  );

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
        const exists = current.projects.some((project) => project.id === savedProject.id);
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
            ? current.tasks.map((task) => (task.id === savedTask.id ? savedTask : task))
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
            <Button icon={<PlusOutlined />} disabled={loading} onClick={handleOpenTaskCreate}>
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
          <Button type="primary" icon={<PlusOutlined />} onClick={openProjectCreate}>
            {t("dashboard.actions.createProject")}
          </Button>
        }
      >
        <section className="metric-band" aria-label={t("dashboard.metrics.regionLabel")}>
          {metricItems.map((item) => (
            <button className="metric-item" type="button" key={item.label} onClick={item.onClick}>
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
                  project.status === "completed" || project.status === "archived",
                );

                return (
                  <button
                    className="project-progress-row"
                    type="button"
                    key={project.id}
                    onClick={() => navigate(`/projects/${project.id}`)}
                  >
                    <span className="project-color" style={{ background: project.color }} />
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
                        style={{
                          color: PROJECT_STATUS_META[project.status].hex,
                        }}
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
                onClick={() => navigate(`/tasks?assigneeId=${currentUser.memberId}`)}
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
                      <span className={`priority-rail priority-${task.priority}`} />
                      <span className="focus-task-copy">
                        <b>{task.title}</b>
                        <small>
                          {project?.name ?? t("dashboard.unknownProject")}
                          <span aria-hidden="true">·</span>
                          {t(`options.taskStatus.${task.status}`)}
                        </small>
                      </span>
                      <span className="focus-task-meta">
                        <small className={`priority-text priority-${task.priority}`}>
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
