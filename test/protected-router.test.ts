import { AxiosError } from "axios";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ProtectedRouter } from "@/routes/ProtectedRouter";
import { getCurrentUser } from "@/services/auth";
import { clearAccessToken, getAccessToken } from "@/services/session";

vi.mock("@/services/auth", () => ({
  getCurrentUser: vi.fn(),
}));

vi.mock("@/services/session", () => ({
  clearAccessToken: vi.fn(),
  getAccessToken: vi.fn(),
}));

const routeArgs = (url: string) =>
  ({ request: new Request(url) }) as Parameters<typeof ProtectedRouter>[0];

async function captureRedirect(promise: Promise<unknown>): Promise<Response> {
  try {
    await promise;
  } catch (error) {
    if (error instanceof Response) return error;
    throw error;
  }
  throw new Error("受保护路由加载器应执行重定向");
}

describe("受保护路由", () => {
  beforeEach(() => {
    vi.mocked(getAccessToken).mockReset();
    vi.mocked(getCurrentUser).mockReset();
    vi.mocked(clearAccessToken).mockReset();
  });

  it("匿名用户重定向到登录页并保留原始地址", async () => {
    vi.mocked(getAccessToken).mockReturnValue(null);

    const response = await captureRedirect(
      ProtectedRouter(routeArgs("https://campus-flow.test/tasks?page=2#filters")),
    );

    expect(response.status).toBe(302);
    expect(response.headers.get("Location")).toBe(
      "/login?redirectTo=%2Ftasks%3Fpage%3D2%23filters",
    );
    expect(getCurrentUser).not.toHaveBeenCalled();
  });

  it("401 后重定向前清除过期令牌", async () => {
    vi.mocked(getAccessToken).mockReturnValue("expired-token");
    const error = new AxiosError("未授权");
    error.response = { status: 401 } as never;
    vi.mocked(getCurrentUser).mockRejectedValue(error);

    const response = await captureRedirect(
      ProtectedRouter(routeArgs("https://campus-flow.test/dashboard")),
    );

    expect(clearAccessToken).toHaveBeenCalledOnce();
    expect(response.headers.get("Location")).toBe("/login?redirectTo=%2Fdashboard");
  });

  it("返回当前用户并透传非认证错误", async () => {
    vi.mocked(getAccessToken).mockReturnValue("valid-token");
    const user = {
      id: "user-1",
      memberId: "member-1",
      username: "学生用户",
      name: "测试用户",
      email: "student@campus.edu.cn",
      department: "计算机学院",
    };
    vi.mocked(getCurrentUser).mockResolvedValueOnce(user);

    await expect(ProtectedRouter(routeArgs("https://campus-flow.test/dashboard"))).resolves.toEqual(
      user,
    );

    const networkError = new Error("网络不可用");
    vi.mocked(getCurrentUser).mockRejectedValueOnce(networkError);
    await expect(ProtectedRouter(routeArgs("https://campus-flow.test/dashboard"))).rejects.toBe(
      networkError,
    );
    expect(clearAccessToken).not.toHaveBeenCalled();
  });
});
