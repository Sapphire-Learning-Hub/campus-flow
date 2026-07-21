import { http } from "@/utils/request";
import { unwrap } from "./client";
import type { ApiResponse } from "@/types/common";
import type { Member } from "@/types/member";

export interface MemberListQuery {
  projectId?: string;
}

export function listMembers(
  params: MemberListQuery = {},
): Promise<Member[]> {
  return unwrap(http.get<ApiResponse<Member[]>>("/members", { params }));
}
