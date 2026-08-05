import dayjs from "dayjs";
import { listActivities } from "@/services/activities";
import { listMembers } from "@/services/members";
import { getProject } from "@/services/projects";
import { listTasks } from "@/services/tasks";
import type { Activity } from "@/types/activity";
import type { Member } from "@/types/member";
import type { Project } from "@/types/project";
import type { Task } from "@/types/task";
import { isOverdue } from "@/utils/date";
import { fetchAllPages } from "@/utils/pagination";

export interface ProjectDetailData {
  project: Project;
  tasks: Task[];
  members: Member[];
  activities: Activity[];
}

export interface ProjectDetailSummary {
  openTasks: number;
  totalTasks: number;
  inProgressTasks: number;
  overdueTasks: number;
  completedTasks: number;
  progress: number;
  daysRemaining: number;
}

export function loadProjectDetailData(
  projectId: string | undefined,
  missingProjectIdMessage: string,
  signal?: AbortSignal,
): Promise<ProjectDetailData> {
  if (!projectId) {
    return Promise.reject(new Error(missingProjectIdMessage));
  }

  return Promise.all([
    getProject(projectId, { signal }),
    fetchAllPages(
      (page, pageSize) => listTasks({ projectId, page, pageSize }, { signal }),
      undefined,
      signal,
    ),
    listMembers({ projectId }, { signal }),
    listActivities({ projectId, limit: 10 }, { signal }),
  ]).then(([project, taskResult, members, activities]) => ({
    project,
    tasks: taskResult.items,
    members,
    activities,
  }));
}

export function summarizeProjectDetail(
  project: Project,
  tasks: ReadonlyArray<Task>,
): ProjectDetailSummary {
  const openTasks = tasks.filter((task) => task.status !== "done").length;
  const totalTasks = tasks.length;
  const inProgressTasks = tasks.filter((task) => task.status === "in_progress").length;
  const overdueTasks = tasks.filter((task) =>
    isOverdue(task.deadline, task.status === "done"),
  ).length;
  const completedTasks = tasks.filter((task) => task.status === "done").length;
  const progress = totalTasks
    ? Math.round((completedTasks / totalTasks) * 100)
    : project.status === "completed" || project.status === "archived"
      ? 100
      : 0;
  const daysRemaining = project.deadline
    ? dayjs(project.deadline).startOf("day").diff(dayjs().startOf("day"), "day")
    : 0;

  return {
    openTasks,
    totalTasks,
    inProgressTasks,
    overdueTasks,
    completedTasks,
    progress,
    daysRemaining,
  };
}
