import dayjs from "dayjs";
import type { TFunction } from "i18next";
import { listActivities } from "@/services/activities";
import { listMembers } from "@/services/members";
import { listProjects } from "@/services/projects";
import { listTasks } from "@/services/tasks";
import type { Activity } from "@/types/activity";
import type { Member } from "@/types/member";
import type { Project } from "@/types/project";
import type { Task } from "@/types/task";
import { daysUntil, formatShortDate, isOverdue } from "@/utils/date";
import { fetchAllPages } from "@/utils/pagination";

export interface DashboardData {
  tasks: Task[];
  projects: Project[];
  members: Member[];
  activities: Activity[];
}

export interface DashboardProjectMetrics {
  total: number;
  completed: number;
  review: number;
  overdue: number;
  progress: number;
}

export interface DashboardSummary {
  activeProjects: number;
  openTasks: number;
  dueSoon: number;
  overdueTasks: number;
  members: number;
}

export async function loadDashboardData(
  pageSize: number,
): Promise<DashboardData> {
  const [taskResult, projectResult, members, activities] = await Promise.all([
    fetchAllPages((page, pageSize) => listTasks({ page, pageSize }), pageSize),
    fetchAllPages(
      (page, pageSize) => listProjects({ page, pageSize }),
      pageSize,
    ),
    listMembers(),
    listActivities({ limit: 8 }),
  ]);

  return {
    tasks: taskResult.items,
    projects: projectResult.items,
    members,
    activities,
  };
}

export function calculateDashboardProjectMetrics(
  projects: ReadonlyArray<Project>,
  tasks: ReadonlyArray<Task>,
): Map<string, DashboardProjectMetrics> {
  const result = new Map<string, DashboardProjectMetrics>();

  for (const project of projects) {
    result.set(project.id, {
      total: 0,
      completed: 0,
      review: 0,
      overdue: 0,
      progress: 0,
    });
  }

  for (const task of tasks) {
    const metrics = result.get(task.projectId);
    if (!metrics) continue;
    metrics.total += 1;
    if (task.status === "done") metrics.completed += 1;
    if (task.status === "review") metrics.review += 1;
    if (isOverdue(task.deadline, task.status === "done")) {
      metrics.overdue += 1;
    }
  }

  for (const project of projects) {
    const metrics = result.get(project.id);
    if (!metrics) continue;
    metrics.progress = metrics.total
      ? Math.round((metrics.completed / metrics.total) * 100)
      : project.status === "completed" || project.status === "archived"
        ? 100
        : 0;
  }

  return result;
}

export function summarizeDashboard(
  projects: ReadonlyArray<Project>,
  tasks: ReadonlyArray<Task>,
  memberCount: number,
): DashboardSummary {
  let activeProjects = 0;
  let openTasks = 0;
  let dueSoon = 0;
  let overdueTasks = 0;

  for (const project of projects) {
    if (project.status === "active") activeProjects += 1;
  }

  for (const task of tasks) {
    if (task.status === "done") continue;
    openTasks += 1;
    const remainingDays = daysUntil(task.deadline);
    if (remainingDays !== null && remainingDays >= 0 && remainingDays <= 7) {
      dueSoon += 1;
    }
    if (isOverdue(task.deadline)) overdueTasks += 1;
  }

  return {
    activeProjects,
    openTasks,
    dueSoon,
    overdueTasks,
    members: memberCount,
  };
}

export function getRecentProjects(projects: ReadonlyArray<Project>): Project[] {
  return [...projects]
    .sort((a, b) => dayjs(b.updatedAt).valueOf() - dayjs(a.updatedAt).valueOf())
    .slice(0, 5);
}

export function getFocusTasks(
  tasks: ReadonlyArray<Task>,
  currentMemberId: string,
): Task[] {
  const incompleteTasks = tasks.filter((task) => task.status !== "done");
  const myTasks = incompleteTasks.filter(
    (task) => task.assigneeId === currentMemberId,
  );
  const source = myTasks.length ? myTasks : incompleteTasks;

  return [...source]
    .sort((a, b) => {
      const aDeadline = a.deadline ? dayjs(a.deadline).valueOf() : Infinity;
      const bDeadline = b.deadline ? dayjs(b.deadline).valueOf() : Infinity;
      return aDeadline - bDeadline;
    })
    .slice(0, 5);
}

export function getGreeting(t: TFunction): string {
  const hour = dayjs().hour();
  if (hour < 6) return t("dashboard.greeting.night");
  if (hour < 12) return t("dashboard.greeting.morning");
  if (hour < 18) return t("dashboard.greeting.afternoon");
  return t("dashboard.greeting.evening");
}

export function getDeadlineLabel(t: TFunction, deadline?: string): string {
  const remainingDays = daysUntil(deadline);
  if (remainingDays === null) return t("dashboard.deadline.none");
  if (remainingDays < 0) {
    return t("dashboard.deadline.overdue", {
      count: Math.abs(remainingDays),
    });
  }
  if (remainingDays === 0) return t("dashboard.deadline.today");
  if (remainingDays === 1) return t("dashboard.deadline.tomorrow");
  if (remainingDays <= 7) {
    return t("dashboard.deadline.days", { count: remainingDays });
  }
  return formatShortDate(deadline);
}

export function getRelativeTime(t: TFunction, value: string): string {
  const createdAt = dayjs(value);
  const minuteDiff = dayjs().diff(createdAt, "minute");
  if (minuteDiff < 1) return t("dashboard.relativeTime.justNow");
  if (minuteDiff < 60) {
    return t("dashboard.relativeTime.minutes", { count: minuteDiff });
  }
  const hourDiff = dayjs().diff(createdAt, "hour");
  if (hourDiff < 24) {
    return t("dashboard.relativeTime.hours", { count: hourDiff });
  }
  const dayDiff = dayjs().diff(createdAt, "day");
  if (dayDiff < 7) {
    return t("dashboard.relativeTime.days", { count: dayDiff });
  }
  return formatShortDate(value);
}
