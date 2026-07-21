import { http } from "@/utils/request";
import { unwrap } from "./client";
import type { ApiResponse, PaginatedResult } from "@/types/common";
import type {
  Task,
  TaskFormValues,
  TaskPatch,
  TaskPriority,
  TaskStatus,
} from "@/types/task";

export interface TaskListQuery {
  keyword?: string;
  projectId?: string;
  status?: TaskStatus;
  priority?: TaskPriority;
  assigneeId?: string;
  page?: number;
  pageSize?: number;
}

export function listTasks(
  params: TaskListQuery = {},
): Promise<PaginatedResult<Task>> {
  return unwrap(
    http.get<ApiResponse<PaginatedResult<Task>>>("/tasks", { params }),
  );
}

export function getTask(taskId: string): Promise<Task> {
  return unwrap(http.get<ApiResponse<Task>>(`/tasks/${taskId}`));
}

export function createTask(values: TaskFormValues): Promise<Task> {
  return unwrap(http.post<ApiResponse<Task>>("/tasks", values));
}

export function updateTask(taskId: string, patch: TaskPatch): Promise<Task> {
  return unwrap(http.patch<ApiResponse<Task>>(`/tasks/${taskId}`, patch));
}

export async function deleteTask(taskId: string): Promise<void> {
  await http.delete(`/tasks/${taskId}`);
}
