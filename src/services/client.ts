import axios from "axios";
import type { AxiosResponse } from "axios";
import type { ApiResponse } from "@/types/common";

export interface RequestOptions {
  signal?: AbortSignal;
}

export async function unwrap<T>(request: Promise<AxiosResponse<ApiResponse<T>>>): Promise<T> {
  const response = await request;
  return response.data.data;
}

export function isAbortError(error: unknown): boolean {
  if (axios.isCancel(error)) return true;
  return (
    typeof error === "object" && error !== null && "name" in error && error.name === "AbortError"
  );
}

export function getApiErrorMessage(error: unknown, fallback = "请求失败，请稍后重试"): string {
  if (!axios.isAxiosError<ApiResponse<unknown>>(error)) return fallback;
  return error.response?.data.message || error.message || fallback;
}
