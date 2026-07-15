import {
  ArrowRightOutlined,
  CalendarOutlined,
  ClockCircleOutlined,
  FolderOpenOutlined,
  TeamOutlined,
  WarningFilled,
} from "@ant-design/icons";

import { Button, Progress, Space } from "antd";

import dayjs from "dayjs";

import "./index.css";

const metrics = [
  {
    label: "进行中项目",
    value: 8,
    note: "共 12 个项目",
    icon: <FolderOpenOutlined />,
    tone: "blue",
  },
  {
    label: "流转中任务",
    value: 24,
    note: "18 个待完成",
    icon: <ClockCircleOutlined />,
    tone: "cyan",
  },
  {
    label: "即将到期",
    value: 5,
    note: "未来 7 天",
    icon: <CalendarOutlined />,
    tone: "amber",
  },
  {
    label: "逾期任务",
    value: 2,
    note: "需要处理",
    icon: <WarningFilled />,
    tone: "red",
  },
  {
    label: "团队成员",
    value: 16,
    note: "可协作成员",
    icon: <TeamOutlined />,
    tone: "violet",
  },
];

const projects = [
  {
    id: 1,
    name: "智能计划管理系统",
    owner: "张伟",
    progress: 82,
    deadline: "2026-07-20",
    status: "进行中",
    color: "#2563eb",
    members: 6,
  },
  {
    id: 2,
    name: "校园机器人项目",
    owner: "李强",
    progress: 64,
    deadline: "2026-08-01",
    status: "测试中",
    color: "#16a34a",
    members: 4,
  },
  {
    id: 3,
    name: "AI知识库平台",
    owner: "王晨",
    progress: 35,
    deadline: "2026-08-15",
    status: "规划中",
    color: "#9333ea",
    members: 8,
  },
];

const deadlines = [
  {
    title: "完成 Dashboard 页面",
    project: "智能计划管理系统",
    date: "今天",
    overdue: false,
  },
  {
    title: "数据库结构设计",
    project: "AI知识库平台",
    date: "7月18日",
    overdue: false,
  },
  {
    title: "接口测试",
    project: "校园机器人项目",
    date: "已逾期",
    overdue: true,
  },
];

const activities = [
  {
    user: "张伟",
    content: "更新了项目进度",
    project: "智能计划管理系统",
    time: "10分钟前",
  },
  {
    user: "李强",
    content: "完成了一个任务",
    project: "校园机器人项目",
    time: "1小时前",
  },
  {
    user: "王晨",
    content: "创建了新的任务",
    project: "AI知识库平台",
    time: "昨天",
  },
];

export default function DashboardPage() {
  return (
    <div className="page-container dashboard-page">
      {/* Header */}

      <div className="page-header">
        <div>
          <h1>下午好，Developer</h1>

          <p>
            {dayjs().format("YYYY年M月D日")}
            {" · "}
            查看项目进度和团队动态
          </p>
        </div>

        <Space>
          <Button>创建任务</Button>
          <Button type="primary">创建项目</Button>
        </Space>
      </div>

      {/* 数据指标 */}

      <section className="metric-band">
        {metrics.map((item) => (
          <article className="metric-item" key={item.label}>
            <span className={`metric-icon ${item.tone}`}>{item.icon}</span>

            <div>
              <small>{item.label}</small>

              <strong>{item.value}</strong>

              <span>{item.note}</span>
            </div>
          </article>
        ))}
      </section>

      <div className="dashboard-main-grid">
        {/* 项目进度 */}

        <section className="surface-panel project-progress-panel">
          <div className="section-heading">
            <div>
              <h2>项目进展</h2>

              <p>最近更新项目</p>
            </div>

            <Button type="link">
              查看全部
              <ArrowRightOutlined />
            </Button>
          </div>

          <div className="project-progress-header">
            <span />

            <span>项目名称</span>

            <span>负责人</span>

            <span>进度</span>

            <span>截止</span>

            <span>状态</span>
          </div>

          {projects.map((project) => (
            <button className="project-progress-row" key={project.id}>
              <span
                className="project-color"
                style={{
                  background: project.color,
                }}
              />

              <span className="project-progress-name">
                <b>{project.name}</b>

                <small>{project.members} 名成员</small>
              </span>

              <span>{project.owner}</span>

              <span className="project-progress-bar">
                <Progress percent={project.progress} showInfo={false} />

                <small>{project.progress}%</small>
              </span>

              <time>{project.deadline}</time>

              <span>{project.status}</span>
            </button>
          ))}
        </section>

        {/* 截止任务 */}

        <section className="surface-panel deadline-panel">
          <div className="section-heading">
            <div>
              <h2>即将到期</h2>

              <p>优先处理任务</p>
            </div>
          </div>

          <div className="deadline-timeline">
            {deadlines.map((item) => (
              <button key={item.title}>
                <span
                  className={`deadline-marker ${item.overdue ? "overdue" : ""}`}
                >
                  {item.overdue ? <WarningFilled /> : <ClockCircleOutlined />}
                </span>

                <span>
                  <b>{item.title}</b>

                  <small>{item.project}</small>
                </span>

                <time>{item.date}</time>
              </button>
            ))}
          </div>
        </section>
      </div>

      {/* 动态 */}

      <section className="surface-panel activity-panel">
        <div className="section-heading">
          <div>
            <h2>最近动态</h2>

            <p>团队操作记录</p>
          </div>
        </div>

        <div className="activity-list">
          {activities.map((item) => (
            <div key={item.user}>
              <span>
                <b>{item.user}</b>
              </span>

              <span>
                {item.content}

                <small>
                  {item.project}
                  {" · "}
                  {item.time}
                </small>
              </span>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
