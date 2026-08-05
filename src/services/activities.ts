import { http } from "@/utils/request";
import { unwrap, type RequestOptions } from "./client";
import type { ApiResponse } from "@/types/common";
import type { Activity } from "@/types/activity";

export interface ActivityListQuery {
  projectId?: string;
  limit?: number;
}

export function listActivities(
  params: ActivityListQuery = {},
  options: RequestOptions = {},
): Promise<Activity[]> {
  return unwrap(http.get<ApiResponse<Activity[]>>("/activities", { params, ...options }));
}
