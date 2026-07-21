import { http } from "@/utils/request";
import { unwrap } from "./client";
import type { ApiResponse, PaginatedResult } from "@/types/common";
import type {
  Project,
  ProjectFormValues,
  ProjectPatch,
  ProjectStatus,
} from "@/types/project";

export interface ProjectListQuery {
  keyword?: string;
  status?: ProjectStatus;
  page?: number;
  pageSize?: number;
}

export function listProjects(
  params: ProjectListQuery = {},
): Promise<PaginatedResult<Project>> {
  return unwrap(
    http.get<ApiResponse<PaginatedResult<Project>>>("/projects", { params }),
  );
}

export function getProject(projectId: string): Promise<Project> {
  return unwrap(http.get<ApiResponse<Project>>(`/projects/${projectId}`));
}

export function createProject(values: ProjectFormValues): Promise<Project> {
  return unwrap(http.post<ApiResponse<Project>>("/projects", values));
}

export function updateProject(
  projectId: string,
  patch: ProjectPatch,
): Promise<Project> {
  return unwrap(
    http.patch<ApiResponse<Project>>(`/projects/${projectId}`, patch),
  );
}

export async function deleteProject(projectId: string): Promise<void> {
  await http.delete(`/projects/${projectId}`);
}
