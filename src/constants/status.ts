import type { ProjectRole } from "@/types/member";
import type { ProjectStatus } from "@/types/project";
import type { TaskPriority, TaskStage, TaskStatus, TaskType } from "@/types/task";

/**
 * 业务枚举 → 展示元数据的唯一事实来源。
 * 所有页面(列表/详情/仪表盘)的状态、类型、阶段、优先级、角色颜色
 * 一律从此处取值,禁止在页面内硬编码颜色映射。
 */

/** 完整状态元数据:AntD Tag 色名 + 语义类名 + 与 CSS 圆点色板一致的 hex */
interface StatusMeta {
  color: string;
  className: string;
  hex: string;
}

/** 仅 Tag 消费的枚举元数据 */
interface TagMeta {
  color: string;
}

/**
 * 项目状态。hex 与 `pages/Projects/Project.css` 中 `.project-status-dot.*` 保持一致。
 */
export const PROJECT_STATUS_META: Readonly<Record<ProjectStatus, StatusMeta>> = {
  planning: { color: "default", className: "planning", hex: "#98a2b3" },
  active: { color: "processing", className: "active", hex: "#1d5eff" },
  completed: { color: "success", className: "completed", hex: "#10b981" },
  archived: { color: "default", className: "archived", hex: "#64748b" },
};

/**
 * 任务状态。hex 与 `pages/Tasks/index.css` 中 `.task-status-dot.*` 保持一致。
 */
export const TASK_STATUS_META: Readonly<Record<TaskStatus, StatusMeta>> = {
  pending: { color: "default", className: "pending", hex: "#98a2b3" },
  in_progress: {
    color: "processing",
    className: "in-progress",
    hex: "#1d5eff",
  },
  review: { color: "warning", className: "review", hex: "#f59e0b" },
  done: { color: "success", className: "done", hex: "#10b981" },
};

export const TASK_TYPE_META: Readonly<Record<TaskType, TagMeta>> = {
  requirement: { color: "purple" },
  design: { color: "cyan" },
  development: { color: "blue" },
  test: { color: "gold" },
  bug: { color: "red" },
  operation: { color: "green" },
};

export const TASK_STAGE_META: Readonly<Record<TaskStage, TagMeta>> = {
  discovery: { color: "purple" },
  design: { color: "cyan" },
  delivery: { color: "blue" },
  acceptance: { color: "gold" },
};

export const TASK_PRIORITY_META: Readonly<Record<TaskPriority, TagMeta>> = {
  low: { color: "default" },
  medium: { color: "blue" },
  high: { color: "orange" },
  urgent: { color: "red" },
};

export const PROJECT_ROLE_META: Readonly<Record<ProjectRole, TagMeta>> = {
  owner: { color: "purple" },
  admin: { color: "blue" },
  member: { color: "green" },
  readonly: { color: "default" },
};
