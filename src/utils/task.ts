import type { Task, TaskStage, TaskType } from "@/types/task";
import { isOverdue } from "./date";

export const DEFAULT_TASK_TYPE: TaskType = "development";
export const DEFAULT_TASK_STAGE: TaskStage = "delivery";

export interface TaskSummary {
  total: number;
  completed: number;
  open: number;
  review: number;
  overdue: number;
  progress: number;
}

export function getTaskType(task: Task): TaskType {
  return task.workItemType ?? DEFAULT_TASK_TYPE;
}

export function getTaskStage(task: Task): TaskStage {
  return task.stage ?? DEFAULT_TASK_STAGE;
}

function createTaskSummary(): Omit<TaskSummary, "progress"> {
  return { total: 0, completed: 0, open: 0, review: 0, overdue: 0 };
}

function recordTask(summary: Omit<TaskSummary, "progress">, task: Task): void {
  const completed = task.status === "done";

  summary.total += 1;

  if (completed) {
    summary.completed += 1;
  } else {
    summary.open += 1;
  }

  if (task.status === "review") summary.review += 1;
  if (isOverdue(task.deadline, completed)) summary.overdue += 1;
}

function finalizeTaskSummary(
  summary: Omit<TaskSummary, "progress">,
): TaskSummary {
  return {
    ...summary,
    progress:
      summary.total === 0
        ? 0
        : Math.round((summary.completed / summary.total) * 100),
  };
}
export function summarizeTasks(tasks: ReadonlyArray<Task>): TaskSummary {
  const summary = createTaskSummary();

  for (const task of tasks) {
    recordTask(summary, task);
  }

  return finalizeTaskSummary(summary);
}
