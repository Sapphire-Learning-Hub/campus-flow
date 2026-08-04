import type { SelectOption } from "@/types/common";
import type { ProjectRole } from "@/types/member";
import type { ProjectStatus } from "@/types/project";
import type { TaskPriority, TaskStage, TaskStatus, TaskType } from "@/types/task";

export const PROJECT_STATUS_OPTIONS: Readonly<Array<SelectOption<ProjectStatus>>> = [
  { label: "规划中", value: "planning" },
  { label: "进行中", value: "active" },
  { label: "已完成", value: "completed" },
  { label: "已归档", value: "archived" },
];

export const TASK_STATUS_OPTIONS: Readonly<Array<SelectOption<TaskStatus>>> = [
  { label: "待处理", value: "pending" },
  { label: "进行中", value: "in_progress" },
  { label: "待审核", value: "review" },
  { label: "已完成", value: "done" },
];

export const TASK_TYPE_OPTIONS: Readonly<Array<SelectOption<TaskType>>> = [
  { label: "需求", value: "requirement" },
  { label: "设计", value: "design" },
  { label: "开发", value: "development" },
  { label: "测试", value: "test" },
  { label: "缺陷", value: "bug" },
  { label: "运营", value: "operation" },
];

export const TASK_STAGE_OPTIONS: Readonly<Array<SelectOption<TaskStage>>> = [
  { label: "发现", value: "discovery" },
  { label: "设计", value: "design" },
  { label: "交付", value: "delivery" },
  { label: "验收", value: "acceptance" },
];

export const PRIORITY_OPTIONS: Readonly<Array<SelectOption<TaskPriority>>> = [
  { label: "低", value: "low" },
  { label: "中", value: "medium" },
  { label: "高", value: "high" },
  { label: "紧急", value: "urgent" },
];

export const ROLE_OPTIONS: Readonly<Array<SelectOption<ProjectRole>>> = [
  { label: "项目所有者", value: "owner" },
  { label: "项目管理员", value: "admin" },
  { label: "普通成员", value: "member" },
  { label: "只读成员", value: "readonly" },
];
