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
import "./ProjectDetail.css";

function getProjectDetailErrorMessage(error: unknown) {
  return getApiErrorMessage(error, "项目加载失败，请稍后重试");
}

export default function ProjectDetailPage() {
  const { message, modal } = App.useApp();
  const currentUser = useCurrentUser();
  const navigate = useNavigate();
  const { projectId } = useParams();
  const [editorOpen, setEditorOpen] = useState(false);
  const loadProject = useCallback(() => {
    if (!projectId) return Promise.reject(new Error("缺少项目编号"));
    return getProject(projectId);
  }, [projectId]);
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
          loadingDescription="正在加载项目..."
          errorTitle="项目加载失败"
          emptyDescription="项目不存在或已被删除"
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
      title: "删除项目",
      content: `确定删除“${project.name}”吗？项目中的任务和动态也会被删除。`,
      okText: "删除",
      okButtonProps: { danger: true },
      cancelText: "取消",
      async onOk() {
        try {
          await deleteProject(project.id);
          message.success("项目已删除");
          navigate("/projects", { replace: true });
        } catch (requestError) {
          message.error(getApiErrorMessage(requestError, "项目删除失败"));
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
        返回项目列表
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
              创建任务
            </Button>
            <Button icon={<EditOutlined />} onClick={handleEditProject}>
              编辑项目
            </Button>
            <Button icon={<TeamOutlined />} onClick={handleManageMembers}>
              管理成员
            </Button>
            <Button
              danger
              icon={<DeleteOutlined />}
              onClick={handleDeleteProject}
            >
              删除项目
            </Button>
          </Space>
        </div>
      </div>

      <nav className="detail-tab-bar">
        <button type="button" className="active">
          概览
        </button>
        <button type="button">工作项 4</button>
        <button type="button">
          <TeamOutlined /> 成员 {project.members.length}
        </button>
        <button type="button">动态记录</button>
      </nav>

      <section className="workspace-summary">
        <article>
          <span>
            <BranchesOutlined />
          </span>
          <small>开放工作项</small>
          <strong>4</strong>
          <em>4 项总计</em>
        </article>
        <article>
          <span>
            <FieldTimeOutlined />
          </span>
          <small>进行中</small>
          <strong>1</strong>
          <em>正在推进</em>
        </article>
        <article className="risk">
          <span>
            <CalendarOutlined />
          </span>
          <small>逾期风险</small>
          <strong>1</strong>
          <em>需要处理</em>
        </article>
        <article>
          <span>
            <TeamOutlined />
          </span>
          <small>成员覆盖</small>
          <strong>{project.members.length}</strong>
          <em>协作角色</em>
        </article>
      </section>

      <section className="detail-grid">
        <article className="surface-panel detail-summary">
          <div className="section-heading">
            <div>
              <h2>项目概览</h2>
              <p>关键目标与时间信息</p>
            </div>
          </div>

          <dl className="detail-description-grid">
            <div>
              <dt>项目状态</dt>
              <dd>
                <Tag color="processing">进行中</Tag>
              </dd>
            </div>
            <div>
              <dt>项目负责人</dt>
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
              <dt>创建日期</dt>
              <dd>2026-06-10</dd>
            </div>
            <div>
              <dt>截止日期</dt>
              <dd>2026-08-20</dd>
            </div>
            <div className="full">
              <dt>项目描述</dt>
              <dd>
                支持任务权重、自动排程、拖拽时间表与休息时间插入的效率工具。
              </dd>
            </div>
          </dl>

          <div className="detail-progress">
            <div>
              <span>整体完成度</span>
              <b>38%</b>
            </div>
            <Progress percent={38} strokeColor="#1677ff" />
          </div>
        </article>

        <article className="surface-panel detail-stats">
          <Statistic title="项目任务" value={4} suffix="个" />
          <Statistic title="已完成" value={0} suffix="个" />
          <Statistic
            title="团队成员"
            value={project.members.length}
            suffix="人"
          />
          <Statistic title="距离截止" value={36} suffix="天" />
        </article>

        <article className="surface-panel detail-upcoming">
          <div className="section-heading">
            <div>
              <h2>临近任务</h2>
              <p>按截止日期优先显示</p>
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
            <h2>工作项</h2>
            <p>项目中的任务与责任信息</p>
          </div>
        </div>

        <div className="surface-panel static-table-wrap">
          <table className="static-table">
            <thead>
              <tr>
                <th>工作项</th>
                <th>类型</th>
                <th>状态</th>
                <th>阶段</th>
                <th>优先级</th>
                <th>负责人</th>
                <th>计划</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>完成时间轴页面</td>
                <td>
                  <Tag>开发</Tag>
                </td>
                <td>
                  <Tag color="processing">进行中</Tag>
                </td>
                <td>
                  <Tag color="blue">交付</Tag>
                </td>
                <td>
                  <Tag color="orange">高</Tag>
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
                  <Tag>设计</Tag>
                </td>
                <td>
                  <Tag color="warning">待审核</Tag>
                </td>
                <td>
                  <Tag color="cyan">设计</Tag>
                </td>
                <td>
                  <Tag color="blue">中</Tag>
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
                  <Tag color="red">缺陷</Tag>
                </td>
                <td>
                  <Tag>待处理</Tag>
                </td>
                <td>
                  <Tag color="gold">验收</Tag>
                </td>
                <td>
                  <Tag color="red">紧急</Tag>
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
                  <Tag>测试</Tag>
                </td>
                <td>
                  <Tag color="warning">待审核</Tag>
                </td>
                <td>
                  <Tag color="gold">验收</Tag>
                </td>
                <td>
                  <Tag color="orange">高</Tag>
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
            <h2>项目成员</h2>
            <p>项目角色与任务责任</p>
          </div>
        </div>

        <div className="detail-member-grid">
          <article>
            <Avatar size={56} style={{ background: "#1677ff" }}>
              张
            </Avatar>
            <h3>张伟</h3>
            <p>计算机学院</p>
            <Tag color="purple">所有者</Tag>
            <small>2 个负责任务</small>
          </article>
          <article>
            <Avatar size={56} style={{ background: "#7c3aed" }}>
              李
            </Avatar>
            <h3>李明</h3>
            <p>软件工程系</p>
            <Tag color="blue">管理员</Tag>
            <small>1 个负责任务</small>
          </article>
          <article>
            <Avatar size={56} style={{ background: "#0891b2" }}>
              王
            </Avatar>
            <h3>王强</h3>
            <p>人工智能学院</p>
            <Tag color="green">成员</Tag>
            <small>1 个负责任务</small>
          </article>
          <article>
            <Avatar size={56} style={{ background: "#ea580c" }}>
              赵
            </Avatar>
            <h3>赵敏</h3>
            <p>自动化学院</p>
            <Tag color="green">成员</Tag>
            <small>0 个负责任务</small>
          </article>
          <article>
            <Avatar size={56} style={{ background: "#16a34a" }}>
              陈
            </Avatar>
            <h3>陈晨</h3>
            <p>管理学院</p>
            <Tag>只读</Tag>
            <small>0 个负责任务</small>
          </article>
          <article>
            <Avatar size={56} style={{ background: "#db2777" }}>
              周
            </Avatar>
            <h3>周宁</h3>
            <p>计算机学院</p>
            <Tag color="green">成员</Tag>
            <small>0 个负责任务</small>
          </article>
        </div>
      </section>

      <section className="static-detail-section">
        <div className="section-heading outside">
          <div>
            <h2>动态记录</h2>
            <p>项目最近发生的变化</p>
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
