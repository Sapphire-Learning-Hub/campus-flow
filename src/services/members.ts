import { http } from "@/utils/request";
import { unwrap } from "./client";
import type { ApiResponse } from "@/types/common";
import type { Member, ProjectMemberInput, ProjectMemberPatch } from "@/types/member";
import type { Project } from "@/types/project";

export interface MemberListQuery {
  projectId?: string;
}

export function listMembers(params: MemberListQuery = {}): Promise<Member[]> {
  return unwrap(http.get<ApiResponse<Member[]>>("/members", { params }));
}

export function addProjectMember(projectId: string, values: ProjectMemberInput): Promise<Project> {
  return unwrap(http.post<ApiResponse<Project>>(`/projects/${projectId}/members`, values));
}

export function updateProjectMember(
  projectId: string,
  memberId: string,
  patch: ProjectMemberPatch,
): Promise<Project> {
  return unwrap(
    http.patch<ApiResponse<Project>>(`/projects/${projectId}/members/${memberId}`, patch),
  );
}

export function removeProjectMember(projectId: string, memberId: string): Promise<Project> {
  return unwrap(http.delete<ApiResponse<Project>>(`/projects/${projectId}/members/${memberId}`));
}
