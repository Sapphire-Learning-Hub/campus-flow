import {
  ApartmentOutlined,
  CalendarOutlined,
  FieldTimeOutlined,
  PlusOutlined,
  ReloadOutlined,
  WarningFilled,
} from "@ant-design/icons";
import { App, Button, Pagination, Space, Tooltip } from "antd";
import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type SetStateAction,
} from "react";
import { useTranslation } from "react-i18next";
import { useSearchParams } from "react-router";
import { PageHeader } from "@/components/common/PageHeader";
import { PageState } from "@/components/common/PageState";
import { TaskFormDrawer } from "@/components/tasks/TaskForm";
import { getApiErrorMessage } from "@/services/client";
import { useAsyncPageData } from "@/hooks/useAsyncPageData";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { useEntityEditor } from "@/hooks/useEntityEditor";
import { useSettings } from "@/hooks/useSettings";
import { TaskBoard } from "@/components/tasks/TaskBoard.tsx";
import type { TaskView } from "@/types/settings";
import type { Task } from "@/types/task";

import { countActiveFilters, indexById } from "@/utils/collection";
import {
  canEditTask,
  getProjectPermissions,
  PERMISSION_DENIED,
} from "@/utils/Permissions.ts";
import { summarizeTasks } from "@/utils/task";
import {
  filterTasks,
  loadTasksPageData,
  readPage,
  type TaskFilters,
  type TasksPageData,
} from "./taskData";
import "./index.css";
import { TaskControls } from "@/components/tasks/TaskControls.tsx";
import { TaskList } from "@/components/tasks/TaskList.tsx";

const INITIAL_TASKS_PAGE_DATA: TasksPageData = {
  tasks: [],
  taskTotal: 0,
  taskSummary: summarizeTasks([]),
  projects: [],
  members: [],
};

export default function TasksWorkspacePage() {
  const { t } = useTranslation();
  const { message } = App.useApp();
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

  const filteredTasks = useMemo(
    () => filterTasks(tasks, filters, projectsById, membersById),
    [filters, membersById, projectsById, tasks],
  );
  useMemo(() => countActiveFilters(filters), [filters]);
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
        <TaskList
          tasks={filteredTasks}
          projectsById={projectsById}
          membersById={membersById}
          pagination={taskPagination}
          canEdit={isTaskEditable}
          onEdit={openEdit}
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

      <TaskControls
        filters={filters}
        onFiltersChange={updateFilters}
        view={view}
        onViewChange={setView}
        projects={projects}
        members={members}
        filteredCount={filteredTasks.length}
        totalCount={taskTotal}
        overdueCount={summary.overdue}
      />

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
