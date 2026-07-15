import type { EntityId } from "./common";

export type TaskStatus = "pending" | "in_progress" | "review" | "done";
export type TaskPriority = "low" | "medium" | "high" | "urgent";
export type TaskType =
  | "requirement"
  | "design"
  | "development"
  | "test"
  | "bug"
  | "operation";
export type TaskStage = "discovery" | "design" | "delivery" | "acceptance";

export interface Task {
  id: EntityId;
  projectId: EntityId;
  title: string;
  description: string;
  workItemType?: TaskType;
  stage?: TaskStage;
  status: TaskStatus;
  priority: TaskPriority;
  assigneeId?: EntityId;
  createdAt: string;
  startDate?: string;
  deadline?: string;
  iteration?: string;
  effort?: number;
  tags: string[];
  updatedAt: string;
}

export type TaskFormValues = Pick<
  Task,
  | "projectId"
  | "title"
  | "description"
  | "status"
  | "priority"
  | "deadline"
  | "tags"
> &
  Partial<
    Pick<Task, "workItemType" | "stage" | "startDate" | "iteration" | "effort">
  > & {
    assigneeId?: EntityId;
  };

export type TaskPatch = Partial<Omit<Task, "id" | "createdAt" | "projectId">>;
