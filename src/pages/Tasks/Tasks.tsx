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
  App,
  Button,
  Input,
  Pagination,
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
  type SetStateAction,
} from "react";
import { useTranslation } from "react-i18next";
import { useSearchParams } from "react-router";
import { MemberAvatar } from "@/components/common/MemberAvatar";
import { PageHeader } from "@/components/common/PageHeader";
import { PageState } from "@/components/common/PageState";
import { TaskFormDrawer } from "@/components/tasks/TaskForm";
import { getApiErrorMessage } from "@/services/client";
import { useAsyncPageData } from "@/hooks/useAsyncPageData";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { useEntityEditor } from "@/hooks/useEntityEditor";
import { useLocalizedOptions } from "@/hooks/useLocalizedOptions";
import { useSettings } from "@/hooks/useSettings";
import { listMembers } from "@/services/members";
import { listProjects } from "@/services/projects";
import { listTasks } from "@/services/tasks";
import type { Member } from "@/types/member";
import type { Project } from "@/types/project";
import type { TaskView } from "@/types/settings";
import {
  TASK_PRIORITY_META,
  TASK_STAGE_META,
  TASK_STATUS_META,
  TASK_TYPE_META,
} from "@/constants/status.ts";
import type {
  Task,
  TaskPriority,
  TaskStage,
  TaskStatus,
  TaskType,
} from "@/types/task";
import { formatShortDate, isOverdue } from "@/utils/date";
import { countActiveFilters, indexById } from "@/utils/collection";
import { fetchAllPages } from "@/utils/pagination";
import {
  canEditTask,
  getProjectPermissions,
  PERMISSION_DENIED,
} from "@/utils/Permissions.ts";
import { getTaskStage, getTaskType, summarizeTasks } from "@/utils/task";
import "./index.css";

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
  taskTotal: number;
  taskSummary: ReturnType<typeof summarizeTasks>;
  projects: Project[];
  members: Member[];
}

interface TasksPageQuery {
  page: number;
  pageSize: number;
  keyword?: string;
  projectId?: string;
  status?: TaskStatus;
  priority?: TaskPriority;
  assigneeId?: string;
}

const INITIAL_TASKS_PAGE_DATA: TasksPageData = {
  tasks: [],
  taskTotal: 0,
  taskSummary: summarizeTasks([]),
  projects: [],
  members: [],
};

async function loadTasksPageData(
  query: TasksPageQuery,
): Promise<TasksPageData> {
  const allTaskResultPromise = fetchAllPages(
    (page, pageSize) =>
      listTasks({
        page,
        pageSize,
        keyword: query.keyword,
        projectId: query.projectId,
        status: query.status,
        priority: query.priority,
        assigneeId: query.assigneeId,
      }),
    query.pageSize,
  );
  const [taskResult, allTaskResult, projectResult, members] = await Promise.all(
    [
      listTasks(query),
      allTaskResultPromise,
      fetchAllPages(
        (page, pageSize) => listProjects({ page, pageSize }),
        query.pageSize,
      ),
      listMembers(),
    ],
  );

  return {
    tasks: taskResult.items,
    taskTotal: taskResult.total,
    taskSummary: summarizeTasks(allTaskResult.items),
    projects: projectResult.items,
    members,
  };
}

function readPage(value: string | null) {
  const page = Number(value);
  return Number.isInteger(page) && page > 0 ? page : 1;
}

interface TaskCardProps {
  task: Task;
  project?: Project;
  member?: Member;
  editable: boolean;
  onEdit: (task: Task) => void;
}

function TypeTag({ type }: { type: TaskType }) {
  const { t } = useTranslation();
  return (
    <Tag color={TASK_TYPE_META[type].color}>
      {t(`options.taskType.${type}`)}
    </Tag>
  );
}

function StageTag({ stage }: { stage: TaskStage }) {
  const { t } = useTranslation();
  return (
    <Tag color={TASK_STAGE_META[stage].color}>
      {t(`options.taskStage.${stage}`)}
    </Tag>
  );
}

function PriorityTag({ priority }: { priority: TaskPriority }) {
  const { t } = useTranslation();
  return (
    <Tag color={TASK_PRIORITY_META[priority].color}>
      {t(`options.priority.${priority}`)}
    </Tag>
  );
}

function StatusTag({ status }: { status: TaskStatus }) {
  const { t } = useTranslation();
  const meta = TASK_STATUS_META[status];
  return <Tag color={meta.color}>{t(`options.taskStatus.${status}`)}</Tag>;
}

function TaskCard({ task, project, member, editable, onEdit }: TaskCardProps) {
  const { t } = useTranslation();
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
          {editable ? t("tasksPage.actions.edit") : t("tasksPage.actions.view")}
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
        <b>{project?.name ?? t("tasksPage.unknownProject")}</b>
      </div>

      <footer className="task-card-footer">
        <MemberAvatar member={member} size={24} showName />
        <Tooltip
          title={
            overdue
              ? t("tasksPage.card.overdue")
              : t("tasksPage.columns.schedule")
          }
        >
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
  emptyDescription: string;
  canEdit: (task: Task) => boolean;
  onEdit: (task: Task) => void;
}

function TaskBoard({
  tasks,
  projectsById,
  membersById,
  emptyDescription,
  canEdit,
  onEdit,
}: TaskBoardProps) {
  const { t } = useTranslation();

  return (
    <div className="task-board" aria-label={t("tasksPage.boardLabel")}>
      {tasks.length ? (
        tasks.map((task) => (
          <TaskCard
            key={task.id}
            task={task}
            project={projectsById.get(task.projectId)}
            member={
              task.assigneeId ? membersById.get(task.assigneeId) : undefined
            }
            editable={canEdit(task)}
            onEdit={onEdit}
          />
        ))
      ) : (
        <div className="task-board-empty">{emptyDescription}</div>
      )}
    </div>
  );
}

export default function TasksWorkspacePage() {
  const { t } = useTranslation();
  const { message } = App.useApp();
  const {
    priorityOptions,
    taskStageOptions,
    taskStatusOptions,
    taskTypeOptions,
  } = useLocalizedOptions();
  const currentUser = useCurrentUser();
  const { settings: appSettings } = useSettings();
  const [searchParams, setSearchParams] = useSearchParams();
  const page = readPage(searchParams.get("page"));
  const pageSize = appSettings.pageSize;
  const [view, setView] = useState<TaskView>(appSettings.defaultTaskView);
  const [filters, setFilters] = useState<TaskFilters>(() => ({
    projectId: searchParams.get("projectId") || undefined,
    assigneeId: searchParams.get("assigneeId") || undefined,
  }));
  const getTasksPageErrorMessage = useCallback(
    (requestError: unknown) =>
      getApiErrorMessage(requestError, t("tasksPage.loadError")),
    [t],
  );
  const updatePage = useCallback(
    (nextPage: number, replace = false) => {
      const nextParams = new URLSearchParams(searchParams);
      const normalizedPage = Math.max(1, Math.floor(nextPage));
      if (normalizedPage === 1) nextParams.delete("page");
      else nextParams.set("page", String(normalizedPage));
      setSearchParams(nextParams, { replace });
    },
    [searchParams, setSearchParams],
  );
  const handlePageChange = useCallback(
    (nextPage: number) => updatePage(nextPage),
    [updatePage],
  );
  const resetPage = useCallback(() => {
    if (page > 1) updatePage(1, true);
  }, [page, updatePage]);
  const updateFilters = useCallback(
    (nextFilters: SetStateAction<TaskFilters>) => {
      setFilters(nextFilters);
      resetPage();
    },
    [resetPage],
  );
  const loadPage = useCallback(
    () =>
      loadTasksPageData({
        page,
        pageSize,
        keyword: filters.keyword?.trim() || undefined,
        projectId: filters.projectId,
        status: filters.status,
        priority: filters.priority,
        assigneeId: filters.assigneeId,
      }),
    [
      filters.assigneeId,
      filters.keyword,
      filters.priority,
      filters.projectId,
      filters.status,
      page,
      pageSize,
    ],
  );
  const { data, setData, loading, refreshing, error, reload, refresh } =
    useAsyncPageData({
      initialData: INITIAL_TASKS_PAGE_DATA,
      load: loadPage,
      getErrorMessage: getTasksPageErrorMessage,
    });
  const { taskSummary, taskTotal, tasks, projects, members } = data;
  useEffect(() => {
    if (loading) return;

    const lastPage = Math.max(1, Math.ceil(taskTotal / pageSize));
    if (page > lastPage) updatePage(lastPage, true);
  }, [loading, page, pageSize, taskTotal, updatePage]);
  const {
    open: drawerOpen,
    editingItem: editingTask,
    openCreate,
    openEdit,
    close: closeEditor,
  } = useEntityEditor<Task>();

  const projectsById = useMemo(() => indexById(projects), [projects]);
  const membersById = useMemo(() => indexById(members), [members]);
  const summary = taskSummary;
  const creatableProjects = useMemo(
    () =>
      projects.filter(
        (project) =>
          project.status !== "archived" &&
          getProjectPermissions(project, currentUser.memberId).canCreateTask,
      ),
    [currentUser.memberId, projects],
  );
  const isTaskEditable = useCallback(
    (task: Task) =>
      canEditTask(projectsById.get(task.projectId), currentUser.memberId, task),
    [currentUser.memberId, projectsById],
  );
  const handleOpenCreate = useCallback(() => {
    const scopedProject = filters.projectId
      ? projectsById.get(filters.projectId)
      : undefined;
    if (
      scopedProject &&
      !getProjectPermissions(scopedProject, currentUser.memberId).canCreateTask
    ) {
      message.error(PERMISSION_DENIED.createTask);
      return;
    }
    if (!creatableProjects.length) {
      message.error(PERMISSION_DENIED.createTask);
      return;
    }
    openCreate();
  }, [
    creatableProjects.length,
    currentUser.memberId,
    filters.projectId,
    message,
    openCreate,
    projectsById,
  ]);

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

  const handleTaskSaved = useCallback(
    (savedTask: Task) => {
      setData((current) => {
        const taskExists = current.tasks.some(
          (task) => task.id === savedTask.id,
        );
        const tasks = taskExists
          ? current.tasks.map((task) =>
              task.id === savedTask.id ? savedTask : task,
            )
          : [savedTask, ...current.tasks];
        return {
          ...current,
          taskTotal: taskExists ? current.taskTotal : current.taskTotal + 1,
          tasks,
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
        taskTotal: Math.max(0, current.taskTotal - 1),
        tasks: current.tasks.filter((task) => task.id !== taskId),
      }));
      void refresh();
    },
    [refresh, setData],
  );

  const columns: TableProps<Task>["columns"] = useMemo(
    () => [
      {
        title: t("tasksPage.columns.task"),
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
        title: t("tasksPage.columns.project"),
        key: "project",
        width: 145,
        render: (_, task) => {
          const project = projectsById.get(task.projectId);
          return (
            <span className="task-project-cell">
              <i style={{ background: project?.color ?? "#94a3b8" }} />
              {project?.name ?? t("tasksPage.unknownProject")}
            </span>
          );
        },
      },
      {
        title: t("tasksPage.columns.type"),
        key: "type",
        width: 72,
        render: (_, task) => <TypeTag type={getTaskType(task)} />,
      },
      {
        title: t("tasksPage.columns.status"),
        key: "status",
        width: 82,
        render: (_, task) => <StatusTag status={task.status} />,
      },
      {
        title: t("tasksPage.columns.stage"),
        key: "stage",
        width: 72,
        render: (_, task) => <StageTag stage={getTaskStage(task)} />,
      },
      {
        title: t("tasksPage.columns.priority"),
        key: "priority",
        width: 72,
        render: (_, task) => <PriorityTag priority={task.priority} />,
      },
      {
        title: t("tasksPage.columns.assignee"),
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
        title: t("tasksPage.columns.schedule"),
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
        title: t("tasksPage.columns.actions"),
        key: "actions",
        fixed: "right",
        width: 65,
        render: (_, task) => (
          <Button type="link" size="small" onClick={() => openEdit(task)}>
            {isTaskEditable(task)
              ? t("tasksPage.actions.edit")
              : t("tasksPage.actions.view")}
          </Button>
        ),
      },
    ],
    [isTaskEditable, membersById, openEdit, projectsById, t],
  );

  const taskPagination = useMemo(
    () => ({
      current: page,
      pageSize,
      total: taskTotal,
      hideOnSinglePage: true,
      showSizeChanger: false,
      showTotal: (total: number) =>
        t("tasksPage.paginationTotal", { count: total }),
      onChange: handlePageChange,
    }),
    [handlePageChange, page, pageSize, t, taskTotal],
  );

  const taskContent =
    view === "card" ? (
      <TaskBoard
        tasks={filteredTasks}
        projectsById={projectsById}
        membersById={membersById}
        emptyDescription={
          tasks.length
            ? t("tasksPage.states.noMatch")
            : t("tasksPage.states.empty")
        }
        canEdit={isTaskEditable}
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
          pagination={taskPagination}
        />
      </div>
    );
  const taskCardPagination =
    view === "card" ? (
      <div className="task-card-pagination">
        <Pagination {...taskPagination} />
      </div>
    ) : null;

  return (
    <div className="page-container tasks-workspace-page">
      <PageHeader
        title={t("tasksPage.header.title")}
        description={t("tasksPage.header.description")}
        actions={
          <Space>
            <Tooltip title={t("tasksPage.actions.refreshData")}>
              <Button
                icon={<ReloadOutlined spin={refreshing} />}
                disabled={loading || refreshing}
                onClick={() => void refresh()}
              >
                {t("tasksPage.actions.refresh")}
              </Button>
            </Tooltip>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              disabled={loading}
              onClick={handleOpenCreate}
            >
              {t("tasksPage.actions.create")}
            </Button>
          </Space>
        }
      />

      <section
        className="workspace-summary task-workspace-summary"
        aria-label={t("tasksPage.summary.label")}
      >
        <article>
          <span>
            <ApartmentOutlined />
          </span>
          <small>{t("tasksPage.summary.all")}</small>
          <strong>{summary.total}</strong>
          <em>
            {t("tasksPage.summary.completedPercent", {
              percent: summary.progress,
            })}
          </em>
        </article>

        <article>
          <span>
            <FieldTimeOutlined />
          </span>
          <small>{t("tasksPage.summary.open")}</small>
          <strong>{summary.open}</strong>
          <em>{t("tasksPage.summary.openNote")}</em>
        </article>

        <article>
          <span>
            <CalendarOutlined />
          </span>
          <small>{t("tasksPage.summary.review")}</small>
          <strong>{summary.review}</strong>
          <em>{t("tasksPage.summary.reviewNote")}</em>
        </article>

        <article className={summary.overdue ? "risk" : undefined}>
          <span>
            <WarningFilled />
          </span>
          <small>{t("tasksPage.summary.overdue")}</small>
          <strong>{summary.overdue}</strong>
          <em>
            {summary.overdue
              ? t("tasksPage.summary.riskNote")
              : t("tasksPage.summary.healthyNote")}
          </em>
        </article>
      </section>

      <section
        className="task-controls surface-panel"
        aria-label={t("tasksPage.filters.label")}
      >
        <div className="task-filter-grid">
          <Input
            className="task-search-input"
            prefix={<SearchOutlined />}
            allowClear
            value={filters.keyword}
            placeholder={t("tasksPage.filters.search")}
            onChange={(event) =>
              updateFilters((current) => ({
                ...current,
                keyword: event.target.value || undefined,
              }))
            }
          />
          <Select
            {...FILTER_SELECT_PROPS}
            aria-label={t("tasksPage.filters.byProject")}
            value={filters.projectId}
            placeholder={t("tasksPage.filters.allProjects")}
            options={projects.map((project) => ({
              label: project.name,
              value: project.id,
            }))}
            onChange={(projectId) => {
              updateFilters((current) => ({
                ...current,
                projectId,
              }));
            }}
          />
          <Select
            {...FILTER_SELECT_PROPS}
            aria-label={t("tasksPage.filters.byType")}
            value={filters.workItemType}
            placeholder={t("tasksPage.filters.allTypes")}
            options={taskTypeOptions}
            onChange={(workItemType) =>
              updateFilters((current) => ({ ...current, workItemType }))
            }
          />
          <Select
            {...FILTER_SELECT_PROPS}
            aria-label={t("tasksPage.filters.byStage")}
            value={filters.stage}
            placeholder={t("tasksPage.filters.allStages")}
            options={taskStageOptions}
            onChange={(stage) =>
              updateFilters((current) => ({ ...current, stage }))
            }
          />
          <Select
            {...FILTER_SELECT_PROPS}
            aria-label={t("tasksPage.filters.byStatus")}
            value={filters.status}
            placeholder={t("tasksPage.filters.allStatuses")}
            options={taskStatusOptions}
            onChange={(status) =>
              updateFilters((current) => ({ ...current, status }))
            }
          />
          <Select
            {...FILTER_SELECT_PROPS}
            aria-label={t("tasksPage.filters.byPriority")}
            value={filters.priority}
            placeholder={t("tasksPage.filters.allPriorities")}
            options={priorityOptions}
            onChange={(priority) =>
              updateFilters((current) => ({ ...current, priority }))
            }
          />
          <Select
            {...FILTER_SELECT_PROPS}
            aria-label={t("tasksPage.filters.byAssignee")}
            value={filters.assigneeId}
            placeholder={t("tasksPage.filters.allAssignees")}
            options={members.map((member) => ({
              label: member.name,
              value: member.id,
            }))}
            onChange={(assigneeId) =>
              updateFilters((current) => ({ ...current, assigneeId }))
            }
          />
          <Button
            type={filters.overdueOnly ? "primary" : "default"}
            danger={filters.overdueOnly}
            icon={<WarningFilled />}
            onClick={() =>
              updateFilters((current) => ({
                ...current,
                overdueOnly: !current.overdueOnly,
              }))
            }
          >
            {t("tasksPage.filters.overdueOnly")}
          </Button>
          <Button
            disabled={!activeFilterCount}
            onClick={() => updateFilters({})}
          >
            {t("tasksPage.actions.clear")}
            {activeFilterCount ? ` (${activeFilterCount})` : ""}
          </Button>
        </div>

        <div className="task-controls-footer">
          <span>
            {t("tasksPage.resultSummary", {
              filtered: filteredTasks.length,
              total: taskTotal,
            })}
            {summary.overdue
              ? ` · ${t("tasksPage.overdueCount", {
                  count: summary.overdue,
                })}`
              : ""}
          </span>
          <Segmented
            value={view}
            onChange={(value) => setView(value as TaskView)}
            options={[
              {
                value: "list",
                icon: <UnorderedListOutlined />,
                label: t("tasksPage.views.list"),
              },
              {
                value: "card",
                icon: <AppstoreOutlined />,
                label: t("tasksPage.views.board"),
              },
            ]}
          />
        </div>
      </section>

      <PageState
        loading={loading}
        error={error}
        empty={!filteredTasks.length && taskTotal === 0}
        loadingDescription={t("tasksPage.states.loading")}
        errorTitle={t("tasksPage.states.errorTitle")}
        emptyDescription={
          tasks.length
            ? t("tasksPage.states.noMatch")
            : t("tasksPage.states.empty")
        }
        onRetry={reload}
        emptyAction={
          tasks.length ? (
            <Button onClick={() => updateFilters({})}>
              {t("tasksPage.actions.clearFilters")}
            </Button>
          ) : (
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={handleOpenCreate}
            >
              {t("tasksPage.actions.createFirst")}
            </Button>
          )
        }
      >
        {taskContent}
        {taskCardPagination}
      </PageState>

      <TaskFormDrawer
        open={drawerOpen}
        projects={projects}
        members={members}
        currentMemberId={currentUser.memberId}
        initial={editingTask}
        defaultProjectId={filters.projectId}
        onClose={closeEditor}
        onSaved={handleTaskSaved}
        onDeleted={handleTaskDeleted}
      />
    </div>
  );
}
