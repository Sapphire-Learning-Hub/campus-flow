import axios from "axios";
import { data, isRouteErrorResponse } from "react-router";

export type ErrorKind = "unauthorized" | "forbidden" | "network" | "service";

function isNetworkLikeError(error: unknown): boolean {
  if (axios.isAxiosError(error)) {
    if (error.code === "ERR_CANCELED") return false;

    return (
      error.code === "ERR_NETWORK" ||
      error.code === "ECONNABORTED" ||
      error.code === "ETIMEDOUT" ||
      !error.response
    );
  }

  if (!(error instanceof Error)) return false;

  const message = error.message.toLowerCase();
  return (
    message.includes("network") ||
    message.includes("failed to fetch") ||
    message.includes("load failed") ||
    message.includes("fetch failed") ||
    message.includes("网络")
  );
}

export function getErrorKind(error: unknown): ErrorKind {
  if (isRouteErrorResponse(error)) {
    const data = error.data;

    if (
      typeof data === "object" &&
      data !== null &&
      "kind" in data &&
      ["unauthorized", "forbidden", "network", "service"].includes(String(data.kind))
    ) {
      return data.kind as ErrorKind;
    }

    if (error.status === 401) return "unauthorized";
    if (error.status === 403) return "forbidden";
    if (error.status >= 500) return "service";
  }

  if (axios.isAxiosError(error)) {
    const status = error.response?.status;

    if (status === 401) return "unauthorized";
    if (status === 403) return "forbidden";
    if (isNetworkLikeError(error)) return "network";
    if (status !== undefined && status >= 500) return "service";
  }

  if (isNetworkLikeError(error)) return "network";

  return "service";
}

export function toRouteError(error: unknown): unknown {
  if (!axios.isAxiosError(error)) return error;

  const status = error.response?.status;

  if (status === 401) {
    return data({ kind: "unauthorized" }, { status: 401 });
  }

  if (status === 403) {
    return data({ kind: "forbidden" }, { status: 403 });
  }

  if (isNetworkLikeError(error)) {
    return data({ kind: "network" }, { status: 503 });
  }

  if (status !== undefined && status >= 500) {
    return data({ kind: "service" }, { status });
  }

  return data({ kind: "service" }, { status: status ?? 500 });
}
