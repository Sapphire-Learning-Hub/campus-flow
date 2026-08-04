import { AxiosError } from "axios";
import { describe, expect, it } from "vitest";
import { type ErrorKind, getErrorKind, toRouteError } from "@/routes/RouterError.ts";

function createAxiosError(status?: number, code?: string): AxiosError {
  const error = new AxiosError("请求失败", code);
  if (status !== undefined) {
    error.response = {
      status,
    } as never;
  }
  return error;
}

describe("路由错误处理", () => {
  const statusCases: Array<[number, ErrorKind]> = [
    [401, "unauthorized"],
    [403, "forbidden"],
    [500, "service"],
    [502, "service"],
    [503, "service"],
  ];

  it.each(statusCases)("HTTP %s 应被识别为 %s", (status, expectedKind) => {
    expect(getErrorKind(createAxiosError(status))).toBe(expectedKind);
  });
  it("应将 Axios 网络错误识别为网络错误", () => {
    const error = createAxiosError(undefined, "ERR_NETWORK");

    expect(getErrorKind(error)).toBe("network");
  });

  it("应将 Axios 超时识别为网络错误", () => {
    const error = createAxiosError(undefined, "ECONNABORTED");

    expect(getErrorKind(error)).toBe("network");
  });

  it("应将普通网络异常识别为网络错误", () => {
    expect(getErrorKind(new Error("网络不可用"))).toBe("network");

    expect(getErrorKind(new Error("Failed to fetch"))).toBe("network");
  });

  it("应将未知异常识别为服务异常", () => {
    expect(getErrorKind(new Error("未知 loader 异常"))).toBe("service");

    expect(getErrorKind("未知错误")).toBe("service");
  });

  it("应将 Axios 网络错误转换为路由错误数据", () => {
    const converted = toRouteError(createAxiosError(undefined, "ERR_NETWORK")) as {
      data: {
        kind: string;
      };
      init: {
        status: number;
      };
    };

    expect(converted.data.kind).toBe("network");
    expect(converted.init.status).toBe(503);
  });

  it("应将 Axios 403 错误转换为路由错误数据", () => {
    const converted = toRouteError(createAxiosError(403)) as {
      data: {
        kind: string;
      };
      init: {
        status: number;
      };
    };

    expect(converted.data.kind).toBe("forbidden");
    expect(converted.init.status).toBe(403);
  });

  it("普通 Error 应保持原对象不变", () => {
    const error = new Error("网络不可用");

    expect(toRouteError(error)).toBe(error);
  });
});
