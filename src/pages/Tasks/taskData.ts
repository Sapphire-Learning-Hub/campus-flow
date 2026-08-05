import type { Member } from "@/types/member";
import type { Project } from "@/types/project";
import type { Task, TaskPriority, TaskStage, TaskStatus, TaskType } from "@/types/task";
import { listMembers } from "@/services/members";
import { listProjects } from "@/services/projects";
import { listTasks } from "@/services/tasks";
import { isOverdue } from "@/utils/date";
import { fetchAllPages } from "@/utils/pagination";
import { getTaskStage, getTaskType, summarizeTasks } from "@/utils/task";

export interface TaskFilters {
  keyword?: string;
  projectId?: string;
  workItemType?: TaskType;
  stage?: TaskStage;
  status?: TaskStatus;
  priority?: TaskPriority;
  assigneeId?: string;
  overdueOnly?: boolean;
}

export interface TasksPageData {
  tasks: Task[];
  taskTotal: number;
  taskSummary: ReturnType<typeof summarizeTasks>;
  projects: Project[];
  members: Member[];
}

export interface TasksPageQuery {
  page: number;
  pageSize: number;
  keyword?: string;
  projectId?: string;
  status?: TaskStatus;
  priority?: TaskPriority;
  assigneeId?: string;
}

export async function loadTasksPageData(
  query: TasksPageQuery,
  signal?: AbortSignal,
): Promise<TasksPageData> {
  const allTaskResultPromise = fetchAllPages(
    (page, pageSize) =>
      listTasks(
        {
          page,
          pageSize,
          keyword: query.keyword,
          projectId: query.projectId,
          status: query.status,
          priority: query.priority,
          assigneeId: query.assigneeId,
        },
        { signal },
      ),
    query.pageSize,
    signal,
  );
  const [taskResult, allTaskResult, projectResult, members] = await Promise.all([
    listTasks(query, { signal }),
    allTaskResultPromise,
    fetchAllPages(
      (page, pageSize) => listProjects({ page, pageSize }, { signal }),
      query.pageSize,
      signal,
    ),
    listMembers({}, { signal }),
  ]);

  return {
    tasks: taskResult.items,
    taskTotal: taskResult.total,
    taskSummary: summarizeTasks(allTaskResult.items),
    projects: projectResult.items,
    members,
  };
}

export function filterTasks(
  tasks: ReadonlyArray<Task>,
  filters: TaskFilters,
  projectsById: ReadonlyMap<string, Project>,
  membersById: ReadonlyMap<string, Member>,
): Task[] {
  const keyword = filters.keyword?.trim().toLowerCase();

  return tasks
    .filter((task) => {
      const project = projectsById.get(task.projectId);
      const member = task.assigneeId ? membersById.get(task.assigneeId) : undefined;
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
        (!filters.workItemType || getTaskType(task) === filters.workItemType) &&
        (!filters.stage || getTaskStage(task) === filters.stage) &&
        (!filters.status || task.status === filters.status) &&
        (!filters.priority || task.priority === filters.priority) &&
        (!filters.assigneeId || task.assigneeId === filters.assigneeId) &&
        (!filters.overdueOnly || isOverdue(task.deadline, task.status === "done"))
      );
    })
    .toSorted((left, right) => {
      const leftOverdue = isOverdue(left.deadline, left.status === "done");
      const rightOverdue = isOverdue(right.deadline, right.status === "done");
      if (leftOverdue !== rightOverdue) return leftOverdue ? -1 : 1;
      return (left.deadline ?? "9999").localeCompare(right.deadline ?? "9999");
    });
}

export function readPage(value: string | null): number {
  const page = Number(value);
  return Number.isInteger(page) && page > 0 ? page : 1;
}
