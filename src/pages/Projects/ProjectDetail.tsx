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
import { App, Avatar, Button, Progress, Space, Statistic, Tag } from "antd";
import { useCallback, useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate, useParams } from "react-router";
import { PageState } from "@/components/common/PageState";
import { ProjectFormDrawer } from "@/components/projects/ProjectForm";
import { useAsyncPageData } from "@/hooks/useAsyncPageData";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { getApiErrorMessage } from "@/services/client";
import { deleteProject, getProject } from "@/services/projects";
import type { Project } from "@/types/project";
import {
  getProjectPermissions,
  PERMISSION_DENIED,
} from "@/utils/Permissions.ts";
import { formatDate } from "@/utils/date";
import "./ProjectDetail.css";

export default function ProjectDetailPage() {
  const { t } = useTranslation();
  const { message, modal } = App.useApp();
  const currentUser = useCurrentUser();
  const navigate = useNavigate();
  const { projectId } = useParams();
  const [editorOpen, setEditorOpen] = useState(false);
  const loadProject = useCallback(() => {
    if (!projectId) {
      return Promise.reject(new Error(t("projectDetail.missingProjectId")));
    }
    return getProject(projectId);
  }, [projectId, t]);
  const getProjectDetailErrorMessage = useCallback(
    (requestError: unknown) =>
      getApiErrorMessage(requestError, t("projectDetail.loadError")),
    [t],
  );
  const {
    data: project,
    setData,
    loading,
    error,
    reload,
  } = useAsyncPageData<Project | undefined>({
    initialData: undefined,
    load: loadProject,
    getErrorMessage: getProjectDetailErrorMessage,
  });

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
    setData(savedProject);
    setEditorOpen(false);
  };

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
        <button type="button" className="active">
          {t("projectDetail.tabs.overview")}
        </button>
        <button type="button">
          {t("projectDetail.tabs.tasks", { count: 4 })}
        </button>
        <button type="button">
          <TeamOutlined />{" "}
          {t("projectDetail.tabs.members", {
            count: project.members.length,
          })}
        </button>
        <button type="button">{t("projectDetail.tabs.activity")}</button>
      </nav>

      <section className="workspace-summary">
        <article>
          <span>
            <BranchesOutlined />
          </span>
          <small>{t("projectDetail.summary.openTasks")}</small>
          <strong>4</strong>
          <em>{t("projectDetail.summary.totalTasks", { count: 4 })}</em>
        </article>
        <article>
          <span>
            <FieldTimeOutlined />
          </span>
          <small>{t("projectDetail.summary.inProgress")}</small>
          <strong>1</strong>
          <em>{t("projectDetail.summary.inProgressNote")}</em>
        </article>
        <article className="risk">
          <span>
            <CalendarOutlined />
          </span>
          <small>{t("projectDetail.summary.overdue")}</small>
          <strong>1</strong>
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
                <span className="detail-member-inline">
                  <Avatar size={24} style={{ background: "#1677ff" }}>
                    张
                  </Avatar>
                  张伟
                </span>
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
              <b>38%</b>
            </div>
            <Progress percent={38} strokeColor="#1677ff" />
          </div>
        </article>

        <article className="surface-panel detail-stats">
          <Statistic
            title={t("projectDetail.statistics.tasks")}
            value={4}
            suffix={t("projectDetail.units.items")}
          />
          <Statistic
            title={t("projectDetail.statistics.completed")}
            value={0}
            suffix={t("projectDetail.units.items")}
          />
          <Statistic
            title={t("projectDetail.statistics.members")}
            value={project.members.length}
            suffix={t("projectDetail.units.people")}
          />
          <Statistic
            title={t("projectDetail.statistics.daysRemaining")}
            value={36}
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

          <div>
            <CalendarOutlined />
            <span>
              <b>修复跨天任务显示错位</b>
              <small>王强</small>
            </span>
            <time className="danger-text">2026-07-15</time>
          </div>
          <div>
            <CalendarOutlined />
            <span>
              <b>设计任务权重配置面板</b>
              <small>李明</small>
            </span>
            <time>2026-07-16</time>
          </div>
          <div>
            <CalendarOutlined />
            <span>
              <b>完成时间轴页面</b>
              <small>张伟</small>
            </span>
            <time>2026-07-18</time>
          </div>
          <div>
            <CalendarOutlined />
            <span>
              <b>任务完成后插入休息时间</b>
              <small>张伟</small>
            </span>
            <time>2026-07-20</time>
          </div>
        </article>
      </section>

      <section className="static-detail-section">
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
              <tr>
                <td>完成时间轴页面</td>
                <td>
                  <Tag>{t("options.taskType.development")}</Tag>
                </td>
                <td>
                  <Tag color="processing">
                    {t("options.taskStatus.in_progress")}
                  </Tag>
                </td>
                <td>
                  <Tag color="blue">{t("options.taskStage.delivery")}</Tag>
                </td>
                <td>
                  <Tag color="orange">{t("options.priority.high")}</Tag>
                </td>
                <td>
                  <span className="detail-member-inline">
                    <Avatar size={24} style={{ background: "#1677ff" }}>
                      张
                    </Avatar>
                    张伟
                  </span>
                </td>
                <td>2026-07-13 - 2026-07-18</td>
              </tr>
              <tr>
                <td>设计任务权重配置面板</td>
                <td>
                  <Tag>{t("options.taskType.design")}</Tag>
                </td>
                <td>
                  <Tag color="warning">{t("options.taskStatus.review")}</Tag>
                </td>
                <td>
                  <Tag color="cyan">{t("options.taskStage.design")}</Tag>
                </td>
                <td>
                  <Tag color="blue">{t("options.priority.medium")}</Tag>
                </td>
                <td>
                  <span className="detail-member-inline">
                    <Avatar size={24} style={{ background: "#7c3aed" }}>
                      李
                    </Avatar>
                    李明
                  </span>
                </td>
                <td>2026-07-11 - 2026-07-16</td>
              </tr>
              <tr>
                <td>修复跨天任务显示错位</td>
                <td>
                  <Tag color="red">{t("options.taskType.bug")}</Tag>
                </td>
                <td>
                  <Tag>{t("options.taskStatus.pending")}</Tag>
                </td>
                <td>
                  <Tag color="gold">{t("options.taskStage.acceptance")}</Tag>
                </td>
                <td>
                  <Tag color="red">{t("options.priority.urgent")}</Tag>
                </td>
                <td>
                  <span className="detail-member-inline">
                    <Avatar size={24} style={{ background: "#0891b2" }}>
                      王
                    </Avatar>
                    王强
                  </span>
                </td>
                <td>2026-07-15 - 2026-07-15</td>
              </tr>
              <tr>
                <td>任务完成后插入休息时间</td>
                <td>
                  <Tag>{t("options.taskType.test")}</Tag>
                </td>
                <td>
                  <Tag color="warning">{t("options.taskStatus.review")}</Tag>
                </td>
                <td>
                  <Tag color="gold">{t("options.taskStage.acceptance")}</Tag>
                </td>
                <td>
                  <Tag color="orange">{t("options.priority.high")}</Tag>
                </td>
                <td>
                  <span className="detail-member-inline">
                    <Avatar size={24} style={{ background: "#1677ff" }}>
                      张
                    </Avatar>
                    张伟
                  </span>
                </td>
                <td>2026-07-16 - 2026-07-20</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      <section className="static-detail-section">
        <div className="section-heading outside">
          <div>
            <h2>{t("projectDetail.members.title")}</h2>
            <p>{t("projectDetail.members.description")}</p>
          </div>
        </div>

        <div className="detail-member-grid">
          <article>
            <Avatar size={56} style={{ background: "#1677ff" }}>
              张
            </Avatar>
            <h3>张伟</h3>
            <p>计算机学院</p>
            <Tag color="purple">{t("options.role.owner")}</Tag>
            <small>{t("projectDetail.members.taskCount", { count: 2 })}</small>
          </article>
          <article>
            <Avatar size={56} style={{ background: "#7c3aed" }}>
              李
            </Avatar>
            <h3>李明</h3>
            <p>软件工程系</p>
            <Tag color="blue">{t("options.role.admin")}</Tag>
            <small>{t("projectDetail.members.taskCount", { count: 1 })}</small>
          </article>
          <article>
            <Avatar size={56} style={{ background: "#0891b2" }}>
              王
            </Avatar>
            <h3>王强</h3>
            <p>人工智能学院</p>
            <Tag color="green">{t("options.role.member")}</Tag>
            <small>{t("projectDetail.members.taskCount", { count: 1 })}</small>
          </article>
          <article>
            <Avatar size={56} style={{ background: "#ea580c" }}>
              赵
            </Avatar>
            <h3>赵敏</h3>
            <p>自动化学院</p>
            <Tag color="green">{t("options.role.member")}</Tag>
            <small>{t("projectDetail.members.taskCount", { count: 0 })}</small>
          </article>
          <article>
            <Avatar size={56} style={{ background: "#16a34a" }}>
              陈
            </Avatar>
            <h3>陈晨</h3>
            <p>管理学院</p>
            <Tag>{t("options.role.readonly")}</Tag>
            <small>{t("projectDetail.members.taskCount", { count: 0 })}</small>
          </article>
          <article>
            <Avatar size={56} style={{ background: "#db2777" }}>
              周
            </Avatar>
            <h3>周宁</h3>
            <p>计算机学院</p>
            <Tag color="green">{t("options.role.member")}</Tag>
            <small>{t("projectDetail.members.taskCount", { count: 0 })}</small>
          </article>
        </div>
      </section>

      <section className="static-detail-section">
        <div className="section-heading outside">
          <div>
            <h2>{t("projectDetail.activity.title")}</h2>
            <p>{t("projectDetail.activity.description")}</p>
          </div>
        </div>

        <div className="surface-panel activity-list">
          <article>
            <Avatar size={30} style={{ background: "#1677ff" }}>
              张
            </Avatar>
            <div>
              <p>
                <b>张伟</b> 更新了项目整体进度
              </p>
              <small>2026-07-15 20:30</small>
            </div>
          </article>
          <article>
            <Avatar size={30} style={{ background: "#7c3aed" }}>
              李
            </Avatar>
            <div>
              <p>
                <b>李明</b> 将“设计任务权重配置面板”提交审核
              </p>
              <small>2026-07-15 16:20</small>
            </div>
          </article>
          <article>
            <Avatar size={30} style={{ background: "#0891b2" }}>
              王
            </Avatar>
            <div>
              <p>
                <b>王强</b> 新增了缺陷“修复跨天任务显示错位”
              </p>
              <small>2026-07-15 11:05</small>
            </div>
          </article>
          <article>
            <Avatar size={30} style={{ background: "#16a34a" }}>
              陈
            </Avatar>
            <div>
              <p>
                <b>陈晨</b> 完成了“整理链接解析规则”
              </p>
              <small>2026-07-14 18:45</small>
            </div>
          </article>
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
