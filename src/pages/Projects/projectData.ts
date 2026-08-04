import type { Member } from "@/types/member";
import type { Project, ProjectStatus } from "@/types/project";
import type { Task } from "@/types/task";
import { listMembers } from "@/services/members";
import { listProjects } from "@/services/projects";
import { listTasks } from "@/services/tasks";
import { isOverdue } from "@/utils/date";
import { fetchAllPages } from "@/utils/pagination";

export type DateSort = "createdAt" | "deadline" | "updatedAt";

export interface ProjectsPageData {
  tasks: Task[];
  taskTotal: number;
  projects: Project[];
  projectTotal: number;
  allProjects: Project[];
  members: Member[];
}

export interface ProjectsPageQuery {
  page: number;
  pageSize: number;
  keyword?: string;
  status?: ProjectStatus;
}

export interface ProjectFilters {
  keyword?: string;
  status?: ProjectStatus;
  leaderId?: string;
  favoriteOnly?: boolean;
  overdueOnly?: boolean;
}

export interface ProjectMetrics {
  total: number;
  open: number;
  review: number;
  overdue: number;
  progress: number;
}

export interface ProjectSummary {
  total: number;
  active: number;
  favorites: number;
  tasks: number;
  risks: number;
}

export const EMPTY_PROJECT_METRICS: ProjectMetrics = {
  total: 0,
  open: 0,
  review: 0,
  overdue: 0,
  progress: 0,
};

export async function loadProjectsPageData(query: ProjectsPageQuery): Promise<ProjectsPageData> {
  const taskResultPromise = fetchAllPages(
    (page, pageSize) => listTasks({ page, pageSize }),
    query.pageSize,
  );
  const allProjectResultPromise = fetchAllPages(
    (page, pageSize) =>
      listProjects({
        page,
        pageSize,
        keyword: query.keyword,
        status: query.status,
      }),
    query.pageSize,
  );
  const [taskResult, projectResult, allProjectResult, members] = await Promise.all([
    taskResultPromise,
    listProjects(query),
    allProjectResultPromise,
    listMembers(),
  ]);

  return {
    tasks: taskResult.items,
    taskTotal: taskResult.total,
    projects: projectResult.items,
    projectTotal: projectResult.total,
    allProjects: allProjectResult.items,
    members,
  };
}

export function readProjectPage(value: string | null): number {
  const page = Number(value);
  return Number.isInteger(page) && page > 0 ? page : 1;
}

export function isProjectOverdue(project: Project): boolean {
  return isOverdue(
    project.deadline,
    project.status === "completed" || project.status === "archived",
  );
}

export function calculateProjectMetrics(
  projects: ReadonlyArray<Project>,
  tasks: ReadonlyArray<Task>,
): Map<string, ProjectMetrics> {
  const mutableMetrics = new Map<string, ProjectMetrics & { completed: number }>();

  for (const project of projects) {
    mutableMetrics.set(project.id, { ...EMPTY_PROJECT_METRICS, completed: 0 });
  }

  for (const task of tasks) {
    const metrics = mutableMetrics.get(task.projectId);
    if (!metrics) continue;
    metrics.total += 1;
    if (task.status === "done") metrics.completed += 1;
    if (task.status === "review") metrics.review += 1;
    if (isOverdue(task.deadline, task.status === "done")) {
      metrics.overdue += 1;
    }
  }

  const result = new Map<string, ProjectMetrics>();
  for (const project of projects) {
    const metrics = mutableMetrics.get(project.id);
    if (!metrics) continue;
    const progress = metrics.total
      ? Math.round((metrics.completed / metrics.total) * 100)
      : project.status === "completed" || project.status === "archived"
        ? 100
        : 0;
    result.set(project.id, {
      total: metrics.total,
      open: metrics.total - metrics.completed,
      review: metrics.review,
      overdue: metrics.overdue,
      progress,
    });
  }
  return result;
}

export function summarizeProjects(
  projects: ReadonlyArray<Project>,
  projectTotal: number,
  taskTotal: number,
): ProjectSummary {
  return {
    total: projectTotal,
    active: projects.filter((project) => project.status === "active").length,
    favorites: projects.filter((project) => project.favorite).length,
    tasks: taskTotal,
    risks: projects.filter(isProjectOverdue).length,
  };
}

export function filterProjects(
  projects: ReadonlyArray<Project>,
  filters: ProjectFilters,
  membersById: ReadonlyMap<string, Member>,
  sort: DateSort,
): Project[] {
  const keyword = filters.keyword?.trim().toLowerCase();

  return projects
    .filter((project) => {
      const leader = membersById.get(project.leaderId);
      const searchableText = [project.name, project.description, leader?.name, leader?.department]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return (
        (!keyword || searchableText.includes(keyword)) &&
        (!filters.status || project.status === filters.status) &&
        (!filters.leaderId || project.leaderId === filters.leaderId) &&
        (!filters.favoriteOnly || project.favorite) &&
        (!filters.overdueOnly || isProjectOverdue(project))
      );
    })
    .toSorted((left, right) => {
      const leftOverdue = isProjectOverdue(left);
      const rightOverdue = isProjectOverdue(right);
      if (leftOverdue !== rightOverdue) return leftOverdue ? -1 : 1;
      return sort === "createdAt"
        ? right.createdAt.localeCompare(left.createdAt)
        : sort === "deadline"
          ? left.deadline.localeCompare(right.deadline)
          : right.updatedAt.localeCompare(left.updatedAt);
    });
}
