import { HttpResponse } from "msw";
import type { ApiResponse } from "@/types/common";

function createResponse<T>(data: T, message: string): ApiResponse<T> {
  return {
    data,
    message,
    requestId: crypto.randomUUID(),
    timestamp: new Date().toISOString(),
  };
}

export function ok<T>(data: T, message = "success", status = 200): Response {
  return HttpResponse.json<ApiResponse<T>>(createResponse(data, message), {
    status,
  });
}

export function fail(message: string, status: number): Response {
  return HttpResponse.json<ApiResponse<null>>(createResponse(null, message), {
    status,
  });
}

export function readPositiveInteger(
  value: string | null,
  fallback: number,
): number {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
}
