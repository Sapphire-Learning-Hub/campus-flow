import {
  ApartmentOutlined,
  CalendarOutlined,
  FieldTimeOutlined,
  PlusOutlined,
  SearchOutlined,
  TableOutlined,
  UnorderedListOutlined,
  WarningFilled,
} from "@ant-design/icons";
import {
  Avatar,
  Button,
  Input,
  Segmented,
  Select,
  Space,
  Table,
  Tag,
  Tooltip,
  type TableProps,
} from "antd";
import { useState } from "react";
import { PageHeader } from "@/components/common/PageHeader.tsx";
import "./index.css";

type TaskView = "table" | "board" | "timeline" | "flow";
type TaskStatus = "pending" | "in_progress" | "review" | "done";
type TaskPriority = "low" | "medium" | "high" | "urgent";
type TaskType = "feature" | "bug" | "research" | "design";
type TaskStage = "planning" | "design" | "development" | "testing";

interface StaticTask {
  id: string;
  title: string;
  description: string;
  project: string;
  type: TaskType;
  status: TaskStatus;
  stage: TaskStage;
  priority: TaskPriority;
  assignee: string;
  assigneeInitial: string;
  startDate: string;
  deadline: string;
  iteration: string;
  effort: number;
  tags: string[];
  overdue?: boolean;
  timelineLeft: string;
  timelineWidth: string;
}

const STATUS_OPTIONS: Array<{ label: string; value: TaskStatus }> = [
  { label: "待处理", value: "pending" },
  { label: "进行中", value: "in_progress" },
  { label: "待审核", value: "review" },
  { label: "已完成", value: "done" },
];

const STAGE_OPTIONS: Array<{ label: string; value: TaskStage }> = [
  { label: "需求规划", value: "planning" },
  { label: "交互设计", value: "design" },
  { label: "开发实现", value: "development" },
  { label: "测试验收", value: "testing" },
];

const TASKS: StaticTask[] = [
  {
    id: "TASK-101",
    title: "完成计划时间轴页面",
    description: "实现日视图时间轴、任务块定位及时间刻度的静态界面。",
    project: "智能计划系统",
    type: "feature",
    status: "in_progress",
    stage: "development",
    priority: "high",
    assignee: "张伟",
    assigneeInitial: "张",
    startDate: "2026-07-13",
    deadline: "2026-07-18",
    iteration: "Sprint 03",
    effort: 8,
    tags: ["前端", "时间轴"],
    timelineLeft: "12%",
    timelineWidth: "35%",
  },
  {
    id: "TASK-102",
    title: "设计任务权重配置面板",
    description: "展示优先级、权重值、截止时间及动态排序规则。",
    project: "智能计划系统",
    type: "design",
    status: "review",
    stage: "design",
    priority: "medium",
    assignee: "李明",
    assigneeInitial: "李",
    startDate: "2026-07-11",
    deadline: "2026-07-16",
    iteration: "Sprint 03",
    effort: 5,
    tags: ["UI", "权重"],
    timelineLeft: "5%",
    timelineWidth: "30%",
  },
  {
    id: "TASK-103",
    title: "修复跨天任务显示错位",
    description: "处理任务开始时间和结束时间跨越零点时的布局问题。",
    project: "智能计划系统",
    type: "bug",
    status: "pending",
    stage: "testing",
    priority: "urgent",
    assignee: "王强",
    assigneeInitial: "王",
    startDate: "2026-07-15",
    deadline: "2026-07-15",
    iteration: "Sprint 03",
    effort: 3,
    tags: ["缺陷", "排期"],
    overdue: true,
    timelineLeft: "24%",
    timelineWidth: "14%",
  },
  {
    id: "TASK-104",
    title: "整理链接解析规则",
    description: "梳理课程、文档和视频链接的元数据提取字段。",
    project: "链接解析服务",
    type: "research",
    status: "done",
    stage: "planning",
    priority: "low",
    assignee: "陈晨",
    assigneeInitial: "陈",
    startDate: "2026-07-05",
    deadline: "2026-07-10",
    iteration: "Sprint 02",
    effort: 3,
    tags: ["调研", "解析"],
    timelineLeft: "0%",
    timelineWidth: "26%",
  },
  {
    id: "TASK-105",
    title: "完成成员权限矩阵",
    description: "展示所有者、管理员、编辑者和访客的权限差异。",
    project: "团队协作平台",
    type: "feature",
    status: "in_progress",
    stage: "development",
    priority: "high",
    assignee: "赵敏",
    assigneeInitial: "赵",
    startDate: "2026-07-14",
    deadline: "2026-07-21",
    iteration: "Sprint 04",
    effort: 8,
    tags: ["权限", "成员"],
    timelineLeft: "31%",
    timelineWidth: "42%",
  },
  {
    id: "TASK-106",
    title: "补充空状态与错误状态",
    description: "统一列表、看板和统计卡片的空状态展示。",
    project: "团队协作平台",
    type: "design",
    status: "pending",
    stage: "design",
    priority: "medium",
    assignee: "周宁",
    assigneeInitial: "周",
    startDate: "2026-07-18",
    deadline: "2026-07-23",
    iteration: "Sprint 04",
    effort: 5,
    tags: ["体验", "状态"],
    timelineLeft: "48%",
    timelineWidth: "29%",
  },
  {
    id: "TASK-107",
    title: "任务完成后插入休息时间",
    description: "验证完成任务后自动插入休息块的排程表现。",
    project: "智能计划系统",
    type: "feature",
    status: "review",
    stage: "testing",
    priority: "high",
    assignee: "张伟",
    assigneeInitial: "张",
    startDate: "2026-07-16",
    deadline: "2026-07-20",
    iteration: "Sprint 03",
    effort: 5,
    tags: ["休息", "自动排程"],
    timelineLeft: "35%",
    timelineWidth: "27%",
  },
  {
    id: "TASK-108",
    title: "输出项目演示数据",
    description: "准备首页、项目、任务和成员模块的静态演示内容。",
    project: "团队协作平台",
    type: "research",
    status: "done",
    stage: "planning",
    priority: "low",
    assignee: "李明",
    assigneeInitial: "李",
    startDate: "2026-07-08",
    deadline: "2026-07-12",
    iteration: "Sprint 02",
    effort: 2,
    tags: ["Mock", "演示"],
    timelineLeft: "8%",
    timelineWidth: "24%",
  },
];

const TYPE_META: Record<TaskType, { label: string; color: string }> = {
  feature: { label: "功能", color: "blue" },
  bug: { label: "缺陷", color: "red" },
  research: { label: "调研", color: "purple" },
  design: { label: "设计", color: "cyan" },
};

const STAGE_META: Record<TaskStage, { label: string; color: string }> = {
  planning: { label: "规划", color: "default" },
  design: { label: "设计", color: "cyan" },
  development: { label: "开发", color: "geekblue" },
  testing: { label: "测试", color: "gold" },
};

const PRIORITY_META: Record<TaskPriority, { label: string; color: string }> = {
  low: { label: "低", color: "default" },
  medium: { label: "中", color: "blue" },
  high: { label: "高", color: "orange" },
  urgent: { label: "紧急", color: "red" },
};

const STATUS_META: Record<TaskStatus, { label: string; color: string }> = {
  pending: { label: "待处理", color: "default" },
  in_progress: { label: "进行中", color: "processing" },
  review: { label: "待审核", color: "warning" },
  done: { label: "已完成", color: "success" },
};

function TypeTag({ type }: { type: TaskType }) {
  const meta = TYPE_META[type];
  return <Tag color={meta.color}>{meta.label}</Tag>;
}

function StageTag({ stage }: { stage: TaskStage }) {
  const meta = STAGE_META[stage];
  return <Tag color={meta.color}>{meta.label}</Tag>;
}

function PriorityTag({ priority }: { priority: TaskPriority }) {
  const meta = PRIORITY_META[priority];
  return <Tag color={meta.color}>{meta.label}</Tag>;
}

function StatusTag({ status }: { status: TaskStatus }) {
  const meta = STATUS_META[status];
  return <Tag color={meta.color}>{meta.label}</Tag>;
}

function Member({ task }: { task: StaticTask }) {
  return (
    <span className="static-member">
      <Avatar size={24}>{task.assigneeInitial}</Avatar>
      <span>{task.assignee}</span>
    </span>
  );
}

export default function TasksWorkspacePage() {
  const [view, setView] = useState<TaskView>("table");

  const openCount = TASKS.filter((task) => task.status !== "done").length;
  const reviewCount = TASKS.filter((task) => task.status === "review").length;
  const overdueCount = TASKS.filter((task) => task.overdue).length;
  const totalEffort = TASKS.filter((task) => task.status !== "done").reduce(
    (sum, task) => sum + task.effort,
    0,
  );

  const columns: TableProps<StaticTask>["columns"] = [
    {
      title: "工作项",
      key: "task",
      render: (_, task) => (
        <div className="task-title-cell">
          <b>{task.title}</b>
          <small>
            {task.iteration} · {task.tags.map((tag) => `#${tag}`).join(" ")}
          </small>
        </div>
      ),
    },
    { title: "所属项目", dataIndex: "project", width: 160 },
    {
      title: "类型",
      width: 82,
      render: (_, task) => <TypeTag type={task.type} />,
    },
    {
      title: "状态",
      width: 104,
      render: (_, task) => <StatusTag status={task.status} />,
    },
    {
      title: "阶段",
      width: 88,
      render: (_, task) => <StageTag stage={task.stage} />,
    },
    {
      title: "优先级",
      width: 82,
      render: (_, task) => <PriorityTag priority={task.priority} />,
    },
    {
      title: "负责人",
      width: 118,
      render: (_, task) => <Member task={task} />,
    },
    {
      title: "计划",
      width: 176,
      render: (_, task) => (
        <span className={task.overdue ? "danger-text" : undefined}>
          {task.overdue ? <WarningFilled /> : null} {task.startDate.slice(5)} -{" "}
          {task.deadline.slice(5)}
        </span>
      ),
    },
    {
      title: "估分",
      width: 68,
      render: (_, task) => `${task.effort} 点`,
    },
    {
      title: "操作",
      width: 88,
      render: () => (
        <Space size={0}>
          <Tooltip title="静态布局：未绑定编辑功能">
            <Button type="link" size="small">
              编辑
            </Button>
          </Tooltip>
        </Space>
      ),
    },
  ];

  const taskCard = (task: StaticTask) => (
    <article className="task-card" key={task.id}>
      <button type="button" className="task-card-title">
        {task.title}
      </button>
      <p>{task.description}</p>

      <div className="task-card-tags">
        <TypeTag type={task.type} />
        <StageTag stage={task.stage} />
        <PriorityTag priority={task.priority} />
      </div>

      <footer>
        <Member task={task} />
        <time className={task.overdue ? "danger-text" : undefined}>
          {task.deadline}
        </time>
      </footer>

      <div className="task-card-plan">
        <span>{task.iteration}</span>
        <b>{task.effort} 点</b>
      </div>
    </article>
  );

  const tableView = (
    <div className="static-table-panel">
      <Table
        rowKey="id"
        columns={columns}
        dataSource={TASKS}
        pagination={false}
        scroll={{ x: 1240 }}
      />
      <div className="static-pagination">共 {TASKS.length} 个工作项</div>
    </div>
  );

  const boardView = (
    <div className="task-board">
      {STATUS_OPTIONS.map((column) => {
        const tasks = TASKS.filter((task) => task.status === column.value);

        return (
          <section
            className={`task-column status-${column.value}`}
            key={column.value}
          >
            <header>
              <span>{column.label}</span>
              <b>{tasks.length}</b>
            </header>
            <div>{tasks.map(taskCard)}</div>
          </section>
        );
      })}
    </div>
  );

  return (
    <div className="page-container tasks-workspace-page">
      <PageHeader
        title={"工作项"}
        description={"以表格、看板视图统一管理跨项目交付"}
        actions={
          <Button type="primary" icon={<PlusOutlined />}>
            创建工作项
          </Button>
        }
      />

      <section
        className="workspace-summary task-workspace-summary"
        aria-label="工作项总览"
      >
        <article>
          <span>
            <ApartmentOutlined />
          </span>
          <small>全部工作项</small>
          <strong>{TASKS.length}</strong>
          <em>当前结果</em>
        </article>

        <article>
          <span>
            <FieldTimeOutlined />
          </span>
          <small>未完成</small>
          <strong>{openCount}</strong>
          <em>{totalEffort} 点</em>
        </article>

        <article>
          <span>
            <CalendarOutlined />
          </span>
          <small>待审核</small>
          <strong>{reviewCount}</strong>
          <em>需验收</em>
        </article>

        <article className={overdueCount ? "risk" : undefined}>
          <span>
            <WarningFilled />
          </span>
          <small>逾期风险</small>
          <strong>{overdueCount}</strong>
          <em>{overdueCount ? "优先处理" : "健康"}</em>
        </article>
      </section>

      <div className="data-toolbar task-toolbar view-toolbar">
        <Input
          prefix={<SearchOutlined />}
          placeholder="搜索标题、项目、迭代或标签"
        />

        <Select
          placeholder="全部项目"
          options={[
            { label: "智能计划系统", value: "planner" },
            { label: "团队协作平台", value: "team" },
            { label: "链接解析服务", value: "parser" },
          ]}
        />

        <Select
          placeholder="全部类型"
          options={[
            { label: "功能", value: "feature" },
            { label: "缺陷", value: "bug" },
            { label: "调研", value: "research" },
            { label: "设计", value: "design" },
          ]}
        />

        <Select placeholder="全部阶段" options={STAGE_OPTIONS} />

        <Select placeholder="全部状态" options={STATUS_OPTIONS} />

        <Select
          placeholder="全部优先级"
          options={[
            { label: "低", value: "low" },
            { label: "中", value: "medium" },
            { label: "高", value: "high" },
            { label: "紧急", value: "urgent" },
          ]}
        />
        <Select placeholder="全部负责人" options={[]} />
        <Button>逾期</Button>
        <Button>清空</Button>

        <span className="toolbar-meta">
          {TASKS.length} 项 · {overdueCount} 项逾期
        </span>

        <Segmented
          value={view}
          onChange={(value) => setView(value as TaskView)}
          options={[
            { value: "table", icon: <TableOutlined />, label: "表格" },
            { value: "board", icon: <UnorderedListOutlined />, label: "看板" },
          ]}
        />
      </div>

      {view === "table" ? tableView : boardView}
    </div>
  );
}
