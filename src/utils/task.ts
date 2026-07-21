import dayjs from "dayjs";
import type { CSSProperties } from "react";
import type { Task, TaskStage, TaskType } from "@/types/task";
import { isOverdue } from "./date";

export const DEFAULT_TASK_TYPE: TaskType = "development";
export const DEFAULT_TASK_STAGE: TaskStage = "delivery";

export interface TaskScheduleBounds {
  start: dayjs.Dayjs;
  end: dayjs.Dayjs;
  spanDays: number;
}

export interface TaskSummary {
  total: number;
  completed: number;
  open: number;
  review: number;
  overdue: number;
  progress: number;
}

export interface TaskAnalysis {
  summary: TaskSummary;
  byStatus: ReadonlyMap<Task["status"], ReadonlyArray<Task>>;
  byStage: ReadonlyMap<TaskStage, ReadonlyArray<Task>>;
  byStageAndStatus: ReadonlyMap<
    TaskStage,
    ReadonlyMap<Task["status"], ReadonlyArray<Task>>
  >;
}

export function getTaskType(task: Task): TaskType {
  return task.workItemType ?? DEFAULT_TASK_TYPE;
}

export function getTaskStage(task: Task): TaskStage {
  return task.stage ?? DEFAULT_TASK_STAGE;
}

export function getTaskStartDate(task: Task): string {
  return task.startDate ?? task.createdAt;
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

function appendToGroup<TKey>(
  groups: Map<TKey, Task[]>,
  key: TKey,
  task: Task,
): void {
  const group = groups.get(key);

  if (group) {
    group.push(task);
  } else {
    groups.set(key, [task]);
  }
}

function appendToNestedGroup(
  groups: Map<TaskStage, Map<Task["status"], Task[]>>,
  stage: TaskStage,
  status: Task["status"],
  task: Task,
): void {
  const stageGroups = groups.get(stage) ?? new Map<Task["status"], Task[]>();

  if (!groups.has(stage)) groups.set(stage, stageGroups);
  appendToGroup(stageGroups, status, task);
}

export function summarizeTasks(tasks: ReadonlyArray<Task>): TaskSummary {
  const summary = createTaskSummary();

  for (const task of tasks) {
    recordTask(summary, task);
  }

  return finalizeTaskSummary(summary);
}

export function analyzeTasks(tasks: ReadonlyArray<Task>): TaskAnalysis {
  const summary = createTaskSummary();
  const byStatus = new Map<Task["status"], Task[]>();
  const byStage = new Map<TaskStage, Task[]>();
  const byStageAndStatus = new Map<TaskStage, Map<Task["status"], Task[]>>();

  for (const task of tasks) {
    const stage = getTaskStage(task);

    recordTask(summary, task);
    appendToGroup(byStatus, task.status, task);
    appendToGroup(byStage, stage, task);
    appendToNestedGroup(byStageAndStatus, stage, task.status, task);
  }

  return {
    summary: finalizeTaskSummary(summary),
    byStatus,
    byStage,
    byStageAndStatus,
  };
}

export function getTaskScheduleBounds(
  tasks: ReadonlyArray<Task>,
): TaskScheduleBounds {
  const datedTasks = tasks.filter(
    (task) => getTaskStartDate(task) || task.deadline,
  );
  const starts = datedTasks.map((task) => dayjs(getTaskStartDate(task)));
  const ends = datedTasks.map((task) =>
    dayjs(task.deadline ?? getTaskStartDate(task)).endOf("day"),
  );
  const start = starts
    .reduce(
      (earliest, item) => (item.isBefore(earliest) ? item : earliest),
      starts[0] ?? dayjs(),
    )
    .startOf("day");
  const end = ends
    .reduce(
      (latest, item) => (item.isAfter(latest) ? item : latest),
      ends[0] ?? dayjs().add(14, "day"),
    )
    .endOf("day");
  const spanDays = Math.max(1, end.diff(start, "day") + 1);
  return { start, end, spanDays };
}

export function getTimelineStyle(
  task: Task,
  bounds: TaskScheduleBounds,
): CSSProperties {
  const taskStart = dayjs(getTaskStartDate(task)).startOf("day");
  const taskEnd = dayjs(task.deadline ?? getTaskStartDate(task)).endOf("day");
  const left =
    (Math.max(0, taskStart.diff(bounds.start, "day")) / bounds.spanDays) * 100;
  const width =
    (Math.max(1, taskEnd.diff(taskStart, "day") + 1) / bounds.spanDays) * 100;
  return {
    left: `${Math.min(98, left)}%`,
    width: `${Math.max(5, Math.min(100 - left, width))}%`,
  };
}
