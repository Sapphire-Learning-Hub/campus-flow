import {
  AppstoreOutlined,
  ApartmentOutlined,
  CalendarOutlined,
  FieldTimeOutlined,
  PlusOutlined,
  ReloadOutlined,
  SearchOutlined,
  UnorderedListOutlined,
  WarningFilled,
} from "@ant-design/icons";
import {
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
import { useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router";
import { MemberAvatar } from "@/components/common/MemberAvatar";
import { PageHeader } from "@/components/common/PageHeader";
import { PageState } from "@/components/common/PageState";
import { TaskFormDrawer } from "@/components/tasks/TaskForm";
import {
  PRIORITY_OPTIONS,
  TASK_STAGE_OPTIONS,
  TASK_STATUS_OPTIONS,
  TASK_TYPE_OPTIONS,
} from "@/constants/options";
import { getApiErrorMessage } from "@/services/client";
import { useAsyncPageData } from "@/hooks/useAsyncPageData";
import { useEntityEditor } from "@/hooks/useEntityEditor";
import { listMembers } from "@/services/members";
import { listProjects } from "@/services/projects";
import { listTasks } from "@/services/tasks";
import type { Member } from "@/types/member";
import type { Project } from "@/types/project";
import type { TaskView } from "@/types/settings";
import type {
  Task,
  TaskPriority,
  TaskStage,
  TaskStatus,
  TaskType,
} from "@/types/task";
import { formatShortDate, isOverdue } from "@/utils/date";
import { countActiveFilters, indexById } from "@/utils/collection";
import { getTaskStage, getTaskType, summarizeTasks } from "@/utils/task";
import "./index.css";

const TYPE_META: Record<TaskType, { label: string; color: string }> = {
  requirement: { label: "需求", color: "purple" },
  design: { label: "设计", color: "cyan" },
  development: { label: "开发", color: "blue" },
  test: { label: "测试", color: "gold" },
  bug: { label: "缺陷", color: "red" },
  operation: { label: "运营", color: "green" },
};

const STAGE_META: Record<TaskStage, { label: string; color: string }> = {
  discovery: { label: "发现", color: "default" },
  design: { label: "设计", color: "cyan" },
  delivery: { label: "交付", color: "geekblue" },
  acceptance: { label: "验收", color: "gold" },
};

const PRIORITY_META: Record<TaskPriority, { label: string; color: string }> = {
  low: { label: "低", color: "default" },
  medium: { label: "中", color: "blue" },
  high: { label: "高", color: "orange" },
  urgent: { label: "紧急", color: "red" },
};

const STATUS_META: Record<
  TaskStatus,
  { label: string; color: string; className: string }
> = {
  pending: { label: "待处理", color: "default", className: "pending" },
  in_progress: {
    label: "进行中",
    color: "processing",
    className: "in-progress",
  },
  review: { label: "待审核", color: "warning", className: "review" },
  done: { label: "已完成", color: "success", className: "done" },
};

const FILTER_SELECT_PROPS = {
  allowClear: true,
  showSearch: false,
};

interface TaskFilters {
  keyword?: string;
  projectId?: string;
  workItemType?: TaskType;
  stage?: TaskStage;
  status?: TaskStatus;
  priority?: TaskPriority;
  assigneeId?: string;
  overdueOnly?: boolean;
}

interface TasksPageData {
  tasks: Task[];
  projects: Project[];
  members: Member[];
}

const INITIAL_TASKS_PAGE_DATA: TasksPageData = {
  tasks: [],
  projects: [],
  members: [],
};

async function loadTasksPageData(): Promise<TasksPageData> {
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

function getTasksPageErrorMessage(error: unknown) {
  return getApiErrorMessage(error, "工作项加载失败，请稍后重试");
}

interface TaskCardProps {
  task: Task;
  project?: Project;
  member?: Member;
  onEdit: (task: Task) => void;
}

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

function TaskCard({ task, project, member, onEdit }: TaskCardProps) {
  const overdue = isOverdue(task.deadline, task.status === "done");

  return (
    <article className={`task-card${overdue ? " is-overdue" : ""}`}>
      <header className="task-card-header">
        <button
          type="button"
          className="task-card-title"
          onClick={() => onEdit(task)}
        >
          {task.title}
        </button>
        <Button type="link" size="small" onClick={() => onEdit(task)}>
          编辑
        </Button>
      </header>

      <p className="task-card-description">{task.description}</p>

      <div className="task-card-tags">
        <TypeTag type={getTaskType(task)} />
        <StageTag stage={getTaskStage(task)} />
        <PriorityTag priority={task.priority} />
      </div>

      <div className="task-card-project">
        <span style={{ background: project?.color ?? "#94a3b8" }} />
        <b>{project?.name ?? "未知项目"}</b>
      </div>

      <footer className="task-card-footer">
        <MemberAvatar member={member} size={24} showName />
        <Tooltip title={overdue ? "该工作项已逾期" : "截止日期"}>
          <time className={overdue ? "danger-text" : undefined}>
            {overdue ? <WarningFilled /> : null}
            {formatShortDate(task.deadline)}
          </time>
        </Tooltip>
      </footer>

      <div className="task-card-status">
        <StatusTag status={task.status} />
      </div>
    </article>
  );
}

interface TaskBoardProps {
  tasks: Task[];
  projectsById: ReadonlyMap<string, Project>;
  membersById: ReadonlyMap<string, Member>;
  onEdit: (task: Task) => void;
}

function TaskBoard({
  tasks,
  projectsById,
  membersById,
  onEdit,
}: TaskBoardProps) {
  return (
    <div className="task-board" aria-label="工作项看板">
      {TASK_STATUS_OPTIONS.map((column) => {
        const columnTasks = tasks.filter(
          (task) => task.status === column.value,
        );
        return (
          <section className="task-column" key={column.value}>
            <header className="task-column-header">
              <span
                className={`task-status-dot ${STATUS_META[column.value].className}`}
              />
              <b>{column.label}</b>
              <strong>{columnTasks.length}</strong>
            </header>
            <div className="task-column-content">
              {columnTasks.length ? (
                columnTasks.map((task) => (
                  <TaskCard
                    key={task.id}
                    task={task}
                    project={projectsById.get(task.projectId)}
                    member={
                      task.assigneeId
                        ? membersById.get(task.assigneeId)
                        : undefined
                    }
                    onEdit={onEdit}
                  />
                ))
              ) : (
                <div className="task-column-empty">暂无工作项</div>
              )}
            </div>
          </section>
        );
      })}
    </div>
  );
}

export default function TasksWorkspacePage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [view, setView] = useState<TaskView>("list");
  const [filters, setFilters] = useState<TaskFilters>(() => ({
    projectId: searchParams.get("projectId") || undefined,
    assigneeId: searchParams.get("assigneeId") || undefined,
  }));
  const {
    data,
    setData,
    loading,
    refreshing,
    error,
    reload,
    refresh,
  } = useAsyncPageData({
    initialData: INITIAL_TASKS_PAGE_DATA,
    load: loadTasksPageData,
    getErrorMessage: getTasksPageErrorMessage,
  });
  const { tasks, projects, members } = data;
  const {
    open: drawerOpen,
    editingItem: editingTask,
    openCreate,
    openEdit,
    close: closeEditor,
  } = useEntityEditor<Task>();

  useEffect(() => {
    if (searchParams.get("create") !== "1") return;

    let active = true;
    queueMicrotask(() => {
      if (!active) return;
      openCreate();
      const nextParams = new URLSearchParams(searchParams);
      nextParams.delete("create");
      setSearchParams(nextParams, { replace: true });
    });
    return () => {
      active = false;
    };
  }, [openCreate, searchParams, setSearchParams]);

  const projectsById = useMemo(
    () => indexById(projects),
    [projects],
  );
  const membersById = useMemo(
    () => indexById(members),
    [members],
  );
  const summary = useMemo(() => summarizeTasks(tasks), [tasks]);

  const filteredTasks = useMemo(() => {
    const keyword = filters.keyword?.trim().toLowerCase();

    return tasks
      .filter((task) => {
        const project = projectsById.get(task.projectId);
        const member = task.assigneeId
          ? membersById.get(task.assigneeId)
          : undefined;
        const searchableText = [
          task.title,
          task.description,
          project?.name,
          member?.name,
          ...task.tags,
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();

        return (
          (!keyword || searchableText.includes(keyword)) &&
          (!filters.projectId || task.projectId === filters.projectId) &&
          (!filters.workItemType ||
            getTaskType(task) === filters.workItemType) &&
          (!filters.stage || getTaskStage(task) === filters.stage) &&
          (!filters.status || task.status === filters.status) &&
          (!filters.priority || task.priority === filters.priority) &&
          (!filters.assigneeId || task.assigneeId === filters.assigneeId) &&
          (!filters.overdueOnly ||
            isOverdue(task.deadline, task.status === "done"))
        );
      })
      .toSorted((left, right) => {
        const leftOverdue = isOverdue(left.deadline, left.status === "done");
        const rightOverdue = isOverdue(right.deadline, right.status === "done");
        if (leftOverdue !== rightOverdue) return leftOverdue ? -1 : 1;
        return (left.deadline ?? "9999").localeCompare(
          right.deadline ?? "9999",
        );
      });
  }, [filters, membersById, projectsById, tasks]);

  const activeFilterCount = useMemo(
    () => countActiveFilters(filters),
    [filters],
  );

  const handleTaskSaved = useCallback((savedTask: Task) => {
    setData((current) => {
      const taskExists = current.tasks.some(
        (task) => task.id === savedTask.id,
      );
      const tasks = taskExists
        ? current.tasks.map((task) =>
            task.id === savedTask.id ? savedTask : task,
          )
        : [savedTask, ...current.tasks];
      return { ...current, tasks };
    });
  }, [setData]);

  const handleTaskDeleted = useCallback((taskId: string) => {
    setData((current) => ({
      ...current,
      tasks: current.tasks.filter((task) => task.id !== taskId),
    }));
  }, [setData]);

  const columns: TableProps<Task>["columns"] = useMemo(
    () => [
      {
        title: "工作项",
        key: "task",
        width: 260,
        render: (_, task) => (
          <div className="task-title-cell">
            <button type="button" onClick={() => openEdit(task)}>
              {task.title}
            </button>
            {task.tags.length ? (
              <small>{task.tags.map((tag) => `#${tag}`).join(" ")}</small>
            ) : null}
          </div>
        ),
      },
      {
        title: "所属项目",
        key: "project",
        width: 145,
        render: (_, task) => {
          const project = projectsById.get(task.projectId);
          return (
            <span className="task-project-cell">
              <i style={{ background: project?.color ?? "#94a3b8" }} />
              {project?.name ?? "未知项目"}
            </span>
          );
        },
      },
      {
        title: "类型",
        key: "type",
        width: 72,
        render: (_, task) => <TypeTag type={getTaskType(task)} />,
      },
      {
        title: "状态",
        key: "status",
        width: 82,
        render: (_, task) => <StatusTag status={task.status} />,
      },
      {
        title: "阶段",
        key: "stage",
        width: 72,
        render: (_, task) => <StageTag stage={getTaskStage(task)} />,
      },
      {
        title: "优先级",
        key: "priority",
        width: 72,
        render: (_, task) => <PriorityTag priority={task.priority} />,
      },
      {
        title: "负责人",
        key: "assignee",
        width: 105,
        render: (_, task) => (
          <MemberAvatar
            member={
              task.assigneeId ? membersById.get(task.assigneeId) : undefined
            }
            size={24}
            showName
          />
        ),
      },
      {
        title: "计划",
        key: "schedule",
        width: 145,
        render: (_, task) => {
          const overdue = isOverdue(task.deadline, task.status === "done");
          return (
            <span className={overdue ? "danger-text" : undefined}>
              {overdue ? <WarningFilled /> : null}
              {formatShortDate(task.startDate)} -{" "}
              {formatShortDate(task.deadline)}
            </span>
          );
        },
      },
      {
        title: "操作",
        key: "actions",
        fixed: "right",
        width: 65,
        render: (_, task) => (
          <Button type="link" size="small" onClick={() => openEdit(task)}>
            编辑
          </Button>
        ),
      },
    ],
    [membersById, openEdit, projectsById],
  );

  const taskContent =
    view === "card" ? (
      <TaskBoard
        tasks={filteredTasks}
        projectsById={projectsById}
        membersById={membersById}
        onEdit={openEdit}
      />
    ) : (
      <div className="task-table-panel">
        <Table
          rowKey="id"
          columns={columns}
          dataSource={filteredTasks}
          scroll={{ x: 1060 }}
          rowClassName={(task) =>
            isOverdue(task.deadline, task.status === "done")
              ? "task-table-row-overdue"
              : ""
          }
          pagination={{
            pageSize: 10,
            showSizeChanger: false,
            showTotal: (total) => `共 ${total} 个工作项`,
          }}
        />
      </div>
    );

  return (
    <div className="page-container tasks-workspace-page">
      <PageHeader
        title="工作项"
        description="集中安排、跟进和交付跨项目工作"
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
              disabled={!projects.length && loading}
              onClick={openCreate}
            >
              创建工作项
            </Button>
          </Space>
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
          <strong>{summary.total}</strong>
          <em>{summary.progress}% 已完成</em>
        </article>

        <article>
          <span>
            <FieldTimeOutlined />
          </span>
          <small>未完成</small>
          <strong>{summary.open}</strong>
          <em>等待推进交付</em>
        </article>

        <article>
          <span>
            <CalendarOutlined />
          </span>
          <small>待审核</small>
          <strong>{summary.review}</strong>
          <em>等待验收确认</em>
        </article>

        <article className={summary.overdue ? "risk" : undefined}>
          <span>
            <WarningFilled />
          </span>
          <small>逾期风险</small>
          <strong>{summary.overdue}</strong>
          <em>{summary.overdue ? "需要优先处理" : "当前进度健康"}</em>
        </article>
      </section>

      <section className="task-controls surface-panel" aria-label="工作项筛选">
        <div className="task-filter-grid">
          <Input
            className="task-search-input"
            prefix={<SearchOutlined />}
            allowClear
            value={filters.keyword}
            placeholder="搜索标题、项目、负责人或标签"
            onChange={(event) =>
              setFilters((current) => ({
                ...current,
                keyword: event.target.value || undefined,
              }))
            }
          />
          <Select
            {...FILTER_SELECT_PROPS}
            aria-label="按项目筛选"
            value={filters.projectId}
            placeholder="全部项目"
            options={projects.map((project) => ({
              label: project.name,
              value: project.id,
            }))}
            onChange={(projectId) => {
              console.log("[项目 Select] change:", projectId);

              setFilters((current) => ({
                ...current,
                projectId,
              }));
            }}
          />
          <Select
            {...FILTER_SELECT_PROPS}
            aria-label="按类型筛选"
            value={filters.workItemType}
            placeholder="全部类型"
            options={[...TASK_TYPE_OPTIONS]}
            onChange={(workItemType) =>
              setFilters((current) => ({ ...current, workItemType }))
            }
          />
          <Select
            {...FILTER_SELECT_PROPS}
            aria-label="按阶段筛选"
            value={filters.stage}
            placeholder="全部阶段"
            options={[...TASK_STAGE_OPTIONS]}
            onChange={(stage) =>
              setFilters((current) => ({ ...current, stage }))
            }
          />
          <Select
            {...FILTER_SELECT_PROPS}
            aria-label="按状态筛选"
            value={filters.status}
            placeholder="全部状态"
            options={[...TASK_STATUS_OPTIONS]}
            onChange={(status) =>
              setFilters((current) => ({ ...current, status }))
            }
          />
          <Select
            {...FILTER_SELECT_PROPS}
            aria-label="按优先级筛选"
            value={filters.priority}
            placeholder="全部优先级"
            options={[...PRIORITY_OPTIONS]}
            onChange={(priority) =>
              setFilters((current) => ({ ...current, priority }))
            }
          />
          <Select
            {...FILTER_SELECT_PROPS}
            aria-label="按负责人筛选"
            value={filters.assigneeId}
            placeholder="全部负责人"
            options={members.map((member) => ({
              label: member.name,
              value: member.id,
            }))}
            onChange={(assigneeId) =>
              setFilters((current) => ({ ...current, assigneeId }))
            }
          />
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

        <div className="task-controls-footer">
          <span>
            显示 <b>{filteredTasks.length}</b> / {tasks.length} 个工作项
            {summary.overdue ? ` · ${summary.overdue} 个逾期` : ""}
          </span>
          <Segmented
            value={view}
            onChange={(value) => setView(value as TaskView)}
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
        empty={!filteredTasks.length}
        loadingDescription="正在加载工作项..."
        errorTitle="工作项加载失败"
        emptyDescription={
          tasks.length ? "没有符合当前筛选条件的工作项" : "还没有工作项"
        }
        onRetry={reload}
        emptyAction={
          tasks.length ? (
            <Button onClick={() => setFilters({})}>清空筛选</Button>
          ) : (
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={openCreate}
            >
              创建第一个工作项
            </Button>
          )
        }
      >
        {taskContent}
      </PageState>

      <TaskFormDrawer
        open={drawerOpen}
        projects={projects}
        members={members}
        initial={editingTask}
        onClose={closeEditor}
        onSaved={handleTaskSaved}
        onDeleted={handleTaskDeleted}
      />
    </div>
  );
}
