import axios from "axios";
import type { AxiosResponse } from "axios";
import type { ApiResponse } from "@/types/common";

export async function unwrap<T>(request: Promise<AxiosResponse<ApiResponse<T>>>): Promise<T> {
  const response = await request;
  return response.data.data;
}

export function getApiErrorMessage(error: unknown, fallback = "请求失败，请稍后重试"): string {
  if (!axios.isAxiosError<ApiResponse<unknown>>(error)) return fallback;
  return error.response?.data.message || error.message || fallback;
}
