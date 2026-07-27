import {
  ArrowLeftOutlined,
  BranchesOutlined,
  CalendarOutlined,
  DeleteOutlined,
  EditOutlined,
  FieldTimeOutlined,
  PlusOutlined,
  TeamOutlined,
} from "@ant-design/icons";
import { App, Button, Progress, Space, Statistic, Tag } from "antd";
import dayjs from "dayjs";
import { useCallback, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate, useParams } from "react-router";
import { MemberAvatar } from "@/components/common/MemberAvatar";
import { PageState } from "@/components/common/PageState";
import { ProjectFormDrawer } from "@/components/projects/ProjectForm";
import { useAsyncPageData } from "@/hooks/useAsyncPageData";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { getApiErrorMessage } from "@/services/client";
import { deleteProject, getProject } from "@/services/projects";
import { listTasks } from "@/services/tasks";
import { listMembers } from "@/services/members";
import { listActivities } from "@/services/activities";
import type { Activity } from "@/types/activity";
import type { Member } from "@/types/member";
import type { Project } from "@/types/project";
import type { Task } from "@/types/task";
import { indexById } from "@/utils/collection";
import { formatDate, isOverdue } from "@/utils/date";
import {
  getProjectPermissions,
  PERMISSION_DENIED,
} from "@/utils/Permissions.ts";
import "./ProjectDetail.css";

interface ProjectDetailData {
  project: Project;
  tasks: Task[];
  members: Member[];
  activities: Activity[];
}

export default function ProjectDetailPage() {
  const { t } = useTranslation();
  const { message, modal } = App.useApp();
  const currentUser = useCurrentUser();
  const navigate = useNavigate();
  const { projectId } = useParams();
  const [editorOpen, setEditorOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("overview");

  const handleTabClick = useCallback((tab: string, id: string) => {
    setActiveTab(tab);
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
  }, []);

  const loadProjectDetail = useCallback(() => {
    if (!projectId) {
      return Promise.reject(new Error(t("projectDetail.missingProjectId")));
    }
    return Promise.all([
      getProject(projectId),
      listTasks({ projectId, pageSize: 100 }),
      listMembers({ projectId }),
      listActivities({ projectId, limit: 10 }),
    ]).then(([project, taskResult, members, activities]) => ({
      project,
      tasks: taskResult.items,
      members,
      activities,
    }));
  }, [projectId, t]);

  const getProjectDetailErrorMessage = useCallback(
    (requestError: unknown) =>
      getApiErrorMessage(requestError, t("projectDetail.loadError")),
    [t],
  );

  const {
    data,
    setData,
    loading,
    error,
    reload,
  } = useAsyncPageData<ProjectDetailData | undefined>({
    initialData: undefined,
    load: loadProjectDetail,
    getErrorMessage: getProjectDetailErrorMessage,
  });

  const project = data?.project;
  const tasks = data?.tasks ?? [];
  const activities = data?.activities ?? [];
  const membersById = useMemo(
    () => indexById(data?.members ?? []),
    [data?.members],
  );

  if (loading || error || !project) {
    return (
      <div className="page-container project-detail-page">
        <PageState
          loading={loading}
          error={error}
          empty={!loading && !error && !project}
          loadingDescription={t("projectDetail.states.loading")}
          errorTitle={t("projectDetail.states.errorTitle")}
          emptyDescription={t("projectDetail.states.empty")}
          onRetry={reload}
        >
          {null}
        </PageState>
      </div>
    );
  }

  const permissions = getProjectPermissions(project, currentUser.memberId);
  const handleCreateTask = () => {
    if (!permissions.canCreateTask) {
      message.error(PERMISSION_DENIED.createTask);
      return;
    }
    navigate(`/tasks?projectId=${encodeURIComponent(project.id)}&create=1`);
  };
  const handleEditProject = () => {
    if (!permissions.canEditProject) {
      message.error(PERMISSION_DENIED.editProject);
      return;
    }
    setEditorOpen(true);
  };
  const handleManageMembers = () => {
    if (!permissions.canManageMembers) {
      message.error(PERMISSION_DENIED.manageMembers);
      return;
    }
    navigate(`/members?projectId=${encodeURIComponent(project.id)}`);
  };
  const handleDeleteProject = () => {
    if (!permissions.canDeleteProject) {
      message.error(PERMISSION_DENIED.deleteProject);
      return;
    }
    modal.confirm({
      title: t("projectDetail.delete.title"),
      content: t("projectDetail.delete.confirm", { name: project.name }),
      okText: t("projectDetail.actions.delete"),
      okButtonProps: { danger: true },
      cancelText: t("common.cancel"),
      async onOk() {
        try {
          await deleteProject(project.id);
          message.success(t("projectDetail.messages.deleted"));
          navigate("/projects", { replace: true });
        } catch (requestError) {
          message.error(
            getApiErrorMessage(
              requestError,
              t("projectDetail.messages.deleteFailed"),
            ),
          );
          throw requestError;
        }
      },
    });
  };
  const handleProjectSaved = (savedProject: Project) => {
    setData((current) =>
      current ? { ...current, project: savedProject } : current,
    );
    setEditorOpen(false);
  };

  const openTasks = tasks.filter((task) => task.status !== "done").length;
  const totalTasks = tasks.length;
  const inProgressTasks = tasks.filter(
    (task) => task.status === "in_progress",
  ).length;
  const overdueTasks = tasks.filter((task) =>
    isOverdue(task.deadline, task.status === "done"),
  ).length;
  const completedTasks = tasks.filter((task) => task.status === "done").length;
  const progress = totalTasks
    ? Math.round((completedTasks / totalTasks) * 100)
    : project.status === "completed" || project.status === "archived"
      ? 100
      : 0;
  const daysRemaining = project.deadline
    ? dayjs(project.deadline).startOf("day").diff(dayjs().startOf("day"), "day")
    : 0;

  const priorityColor: Record<string, string> = {
    urgent: "red",
    high: "orange",
    medium: "blue",
    low: "default",
  };

  const statusColor: Record<string, string> = {
    pending: "default",
    in_progress: "processing",
    review: "warning",
    done: "success",
  };

  const stageColor: Record<string, string> = {
    discovery: "purple",
    design: "cyan",
    delivery: "blue",
    acceptance: "gold",
  };

  const leader = membersById.get(project.leaderId);

  return (
    <div className="page-container project-detail-page">
      <Button
        className="back-button"
        type="text"
        icon={<ArrowLeftOutlined />}
        onClick={() => navigate("/projects")}
      >
        {t("projectDetail.actions.back")}
      </Button>

      <div
        className="project-detail-hero"
        style={{ "--project-color": project.color } as React.CSSProperties}
      >
        <span className="project-detail-symbol">
          {project.name.slice(0, 1)}
        </span>

        <div className="project-detail-heading">
          <div>
            <h1>{project.name}</h1>
            <p>{project.description}</p>
          </div>

          <Space wrap>
            <Button icon={<PlusOutlined />} onClick={handleCreateTask}>
              {t("projectDetail.actions.createTask")}
            </Button>
            <Button icon={<EditOutlined />} onClick={handleEditProject}>
              {t("projectDetail.actions.edit")}
            </Button>
            <Button icon={<TeamOutlined />} onClick={handleManageMembers}>
              {t("projectDetail.actions.manageMembers")}
            </Button>
            <Button
              danger
              icon={<DeleteOutlined />}
              onClick={handleDeleteProject}
            >
              {t("projectDetail.actions.delete")}
            </Button>
          </Space>
        </div>
      </div>

      <nav className="detail-tab-bar">
        <button
          type="button"
          className={activeTab === "overview" ? "active" : ""}
          onClick={() => handleTabClick("overview", "project-detail-top")}
        >
          {t("projectDetail.tabs.overview")}
        </button>
        <button
          type="button"
          className={activeTab === "tasks" ? "active" : ""}
          onClick={() => handleTabClick("tasks", "project-detail-tasks")}
        >
          {t("projectDetail.tabs.tasks", { count: totalTasks })}
        </button>
        <button
          type="button"
          className={activeTab === "members" ? "active" : ""}
          onClick={() => handleTabClick("members", "project-detail-members")}
        >
          <TeamOutlined />{" "}
          {t("projectDetail.tabs.members", {
            count: project.members.length,
          })}
        </button>
        <button
          type="button"
          className={activeTab === "activity" ? "active" : ""}
          onClick={() => handleTabClick("activity", "project-detail-activity")}
        >
          {t("projectDetail.tabs.activity")}
        </button>
      </nav>

      <section className="workspace-summary" id="project-detail-top">
        <article>
          <span>
            <BranchesOutlined />
          </span>
          <small>{t("projectDetail.summary.openTasks")}</small>
          <strong>{openTasks}</strong>
          <em>{t("projectDetail.summary.totalTasks", { count: totalTasks })}</em>
        </article>
        <article>
          <span>
            <FieldTimeOutlined />
          </span>
          <small>{t("projectDetail.summary.inProgress")}</small>
          <strong>{inProgressTasks}</strong>
          <em>{t("projectDetail.summary.inProgressNote")}</em>
        </article>
        <article className="risk">
          <span>
            <CalendarOutlined />
          </span>
          <small>{t("projectDetail.summary.overdue")}</small>
          <strong>{overdueTasks}</strong>
          <em>{t("projectDetail.summary.overdueNote")}</em>
        </article>
        <article>
          <span>
            <TeamOutlined />
          </span>
          <small>{t("projectDetail.summary.members")}</small>
          <strong>{project.members.length}</strong>
          <em>{t("projectDetail.summary.membersNote")}</em>
        </article>
      </section>

      <section className="detail-grid">
        <article className="surface-panel detail-summary">
          <div className="section-heading">
            <div>
              <h2>{t("projectDetail.overview.title")}</h2>
              <p>{t("projectDetail.overview.description")}</p>
            </div>
          </div>

          <dl className="detail-description-grid">
            <div>
              <dt>{t("projectDetail.overview.status")}</dt>
              <dd>
                <Tag color="processing">
                  {t(`options.projectStatus.${project.status}`)}
                </Tag>
              </dd>
            </div>
            <div>
              <dt>{t("projectDetail.overview.owner")}</dt>
              <dd>
                <MemberAvatar member={leader} size={24} showName />
              </dd>
            </div>
            <div>
              <dt>{t("projectDetail.overview.createdAt")}</dt>
              <dd>{formatDate(project.createdAt)}</dd>
            </div>
            <div>
              <dt>{t("projectDetail.overview.deadline")}</dt>
              <dd>{formatDate(project.deadline)}</dd>
            </div>
            <div className="full">
              <dt>{t("projectDetail.overview.projectDescription")}</dt>
              <dd>{project.description}</dd>
            </div>
          </dl>

          <div className="detail-progress">
            <div>
              <span>{t("projectDetail.overview.progress")}</span>
              <b>{progress}%</b>
            </div>
            <Progress percent={progress} strokeColor="#1677ff" />
          </div>
        </article>

        <article className="surface-panel detail-stats">
          <Statistic
            title={t("projectDetail.statistics.tasks")}
            value={totalTasks}
            suffix={t("projectDetail.units.items")}
          />
          <Statistic
            title={t("projectDetail.statistics.completed")}
            value={completedTasks}
            suffix={t("projectDetail.units.items")}
          />
          <Statistic
            title={t("projectDetail.statistics.members")}
            value={project.members.length}
            suffix={t("projectDetail.units.people")}
          />
          <Statistic
            title={t("projectDetail.statistics.daysRemaining")}
            value={daysRemaining >= 0 ? daysRemaining : 0}
            suffix={t("projectDetail.units.days")}
          />
        </article>

        <article className="surface-panel detail-upcoming">
          <div className="section-heading">
            <div>
              <h2>{t("projectDetail.upcoming.title")}</h2>
              <p>{t("projectDetail.upcoming.description")}</p>
            </div>
          </div>

          {(() => {
            const upcoming = [...tasks]
              .filter((task) => task.deadline && task.status !== "done")
              .sort(
                (a, b) =>
                  dayjs(a.deadline).valueOf() - dayjs(b.deadline).valueOf(),
              )
              .slice(0, 4);
            return upcoming.length > 0 ? (
              upcoming.map((task) => {
                const assignee = task.assigneeId
                  ? membersById.get(task.assigneeId)
                  : undefined;
                return (
                  <div key={task.id}>
                    <CalendarOutlined />
                    <span>
                      <b>{task.title}</b>
                      <small>{assignee?.name ?? t("common.unassigned")}</small>
                    </span>
                    <time
                      className={
                        isOverdue(task.deadline) ? "danger-text" : ""
                      }
                    >
                      {formatDate(task.deadline)}
                    </time>
                  </div>
                );
              })
            ) : (
              <div className="detail-empty-state">
                <span>{t("projectDetail.upcoming.empty")}</span>
              </div>
            );
          })()}
        </article>
      </section>

      <section className="static-detail-section" id="project-detail-tasks">
        <div className="section-heading outside">
          <div>
            <h2>{t("projectDetail.tasks.title")}</h2>
            <p>{t("projectDetail.tasks.description")}</p>
          </div>
        </div>

        <div className="surface-panel static-table-wrap">
          <table className="static-table">
            <thead>
              <tr>
                <th>{t("projectDetail.tasks.columns.task")}</th>
                <th>{t("projectDetail.tasks.columns.type")}</th>
                <th>{t("projectDetail.tasks.columns.status")}</th>
                <th>{t("projectDetail.tasks.columns.stage")}</th>
                <th>{t("projectDetail.tasks.columns.priority")}</th>
                <th>{t("projectDetail.tasks.columns.assignee")}</th>
                <th>{t("projectDetail.tasks.columns.schedule")}</th>
              </tr>
            </thead>
            <tbody>
              {tasks.length > 0 ? (
                tasks.map((task) => {
                  const assignee = task.assigneeId
                    ? membersById.get(task.assigneeId)
                    : undefined;
                  return (
                    <tr key={task.id}>
                      <td>{task.title}</td>
                      <td>
                        {task.workItemType ? (
                          <Tag>{t(`options.taskType.${task.workItemType}`)}</Tag>
                        ) : (
                          <Tag>{t("common.unknown")}</Tag>
                        )}
                      </td>
                      <td>
                        <Tag color={statusColor[task.status] ?? "default"}>
                          {t(`options.taskStatus.${task.status}`)}
                        </Tag>
                      </td>
                      <td>
                        {task.stage ? (
                          <Tag color={stageColor[task.stage] ?? "blue"}>
                            {t(`options.taskStage.${task.stage}`)}
                          </Tag>
                        ) : (
                          <Tag>{t("common.unknown")}</Tag>
                        )}
                      </td>
                      <td>
                        <Tag color={priorityColor[task.priority] ?? "default"}>
                          {t(`options.priority.${task.priority}`)}
                        </Tag>
                      </td>
                      <td>
                        <MemberAvatar member={assignee} size={24} showName />
                      </td>
                      <td>
                        {task.startDate && task.deadline
                          ? `${dayjs(task.startDate).format("YYYY-MM-DD")} - ${dayjs(task.deadline).format("YYYY-MM-DD")}`
                          : task.deadline
                            ? `${t("projectDetail.tasks.due")} ${dayjs(task.deadline).format("YYYY-MM-DD")}`
                            : t("common.notSet")}
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={7}>
                    <div className="detail-empty-state">
                      <span>{t("projectDetail.tasks.empty")}</span>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      <section className="static-detail-section" id="project-detail-members">
        <div className="section-heading outside">
          <div>
            <h2>{t("projectDetail.members.title")}</h2>
            <p>{t("projectDetail.members.description")}</p>
          </div>
        </div>

        <div className="detail-member-grid">
          {project.members.length > 0 ? (
            project.members.map((pm) => {
              const member = membersById.get(pm.memberId);
              const memberTaskCount = tasks.filter(
                (task) => task.assigneeId === pm.memberId,
              ).length;
              return (
                <article key={pm.memberId}>
                  <MemberAvatar member={member} size={56} />
                  <h3>{member?.name ?? t("common.unknown")}</h3>
                  <p>{member?.department ?? ""}</p>
                  <Tag
                    color={
                      pm.role === "owner"
                        ? "purple"
                        : pm.role === "admin"
                          ? "blue"
                          : pm.role === "readonly"
                            ? "default"
                            : "green"
                    }
                  >
                    {t(`options.role.${pm.role}`)}
                  </Tag>
                  <small>
                    {t("projectDetail.members.taskCount", {
                      count: memberTaskCount,
                    })}
                  </small>
                </article>
              );
            })
          ) : (
            <div className="detail-empty-state">
              <span>{t("projectDetail.members.empty")}</span>
            </div>
          )}
        </div>
      </section>

      <section className="static-detail-section" id="project-detail-activity">
        <div className="section-heading outside">
          <div>
            <h2>{t("projectDetail.activity.title")}</h2>
            <p>{t("projectDetail.activity.description")}</p>
          </div>
        </div>

        <div className="surface-panel activity-list">
          {activities.length > 0 ? (
            activities.map((activity) => {
              const actor = membersById.get(activity.actorId);
              return (
                <article key={activity.id}>
                  <MemberAvatar member={actor} size={30} />
                  <div>
                    <p>
                      <b>{actor?.name ?? t("common.unknown")}</b>{" "}
                      {activity.content}
                    </p>
                    <small>{formatDate(activity.createdAt)}</small>
                  </div>
                </article>
              );
            })
          ) : (
            <div className="detail-empty-state">
              <span>{t("projectDetail.activity.empty")}</span>
            </div>
          )}
        </div>
      </section>

      <ProjectFormDrawer
        open={editorOpen}
        project={project}
        currentMemberId={currentUser.memberId}
        onClose={() => setEditorOpen(false)}
        onSaved={handleProjectSaved}
      />
    </div>
  );
}
