import type { ProjectStatus } from "@/types/project";
import type { TaskStatus } from "@/types/task";

export const PROJECT_STATUS_META: Readonly<
  Record<ProjectStatus, { color: string; className: string }>
> = {
  planning: { color: "default", className: "planning" },
  active: { color: "processing", className: "active" },
  completed: { color: "success", className: "completed" },
  archived: { color: "default", className: "archived" },
};
export const TASK_STATUS_META: Record<
  TaskStatus,
  { color: string; className: string }
> = {
  pending: { color: "default", className: "pending" },
  in_progress: {
    color: "processing",
    className: "in-progress",
  },
  review: { color: "warning", className: "review" },
  done: { color: "success", className: "done" },
};
