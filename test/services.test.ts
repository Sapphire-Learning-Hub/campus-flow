import { AxiosError } from "axios";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { login } from "@/services/auth";
import { getApiErrorMessage } from "@/services/client";
import { listMembers } from "@/services/members";
import { listProjects } from "@/services/projects";
import { getAccessToken } from "@/services/session";
import { listTasks } from "@/services/tasks";
import { http } from "@/utils/request";

function apiResponse<T>(data: T) {
  return {
    data,
    message: "成功",
    requestId: "request-1",
    timestamp: "2026-01-01T00:00:00.000Z",
  };
}

const user = {
  id: "user-1",
  memberId: "member-1",
  username: "学生用户",
  name: "测试用户",
  email: "student@campus.edu.cn",
  department: "计算机学院",
};

describe("服务适配层", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("将任务列表查询映射到 HTTP 适配层并解包响应", async () => {
    const result = {
      items: [],
      total: 0,
      page: 2,
      pageSize: 10,
    };
    const getSpy = vi.spyOn(http, "get").mockResolvedValue({
      data: apiResponse(result),
    } as never);
    const query = {
      keyword: "回归",
      projectId: "project-1",
      page: 2,
      pageSize: 10,
    };

    await expect(listTasks(query)).resolves.toEqual(result);
    expect(getSpy).toHaveBeenCalledWith("/tasks", { params: query });
  });

  it("保持项目和成员列表适配器一致", async () => {
    const projectResult = {
      items: [],
      total: 0,
      page: 1,
      pageSize: 20,
    };
    const members = [
      {
        id: "member-1",
        name: "测试用户",
        email: "student@campus.edu.cn",
        department: "计算机学院",
        color: "#1d5eff",
        joinedAt: "2026-01-01",
      },
    ];
    const getSpy = vi.spyOn(http, "get");
    getSpy
      .mockResolvedValueOnce({ data: apiResponse(projectResult) } as never)
      .mockResolvedValueOnce({ data: apiResponse(members) } as never);

    await expect(
      listProjects({ status: "active", page: 1, pageSize: 20 }),
    ).resolves.toEqual(projectResult);
    await expect(listMembers({ projectId: "project-1" })).resolves.toEqual(
      members,
    );
    expect(getSpy).toHaveBeenNthCalledWith(1, "/projects", {
      params: { status: "active", page: 1, pageSize: 20 },
    });
    expect(getSpy).toHaveBeenNthCalledWith(2, "/members", {
      params: { projectId: "project-1" },
    });
  });

  it("保存登录适配器返回的令牌", async () => {
    const session = { token: "token-1", user };
    const payload = {
      username: "学生用户",
      password: "密码123456",
      remember: true,
    };
    const postSpy = vi.spyOn(http, "post").mockResolvedValue({
      data: apiResponse(session),
    } as never);

    await expect(login(payload)).resolves.toEqual(session);
    expect(postSpy).toHaveBeenCalledWith("/auth/login", payload);
    expect(getAccessToken()).toBe("token-1");
  });

  it("优先使用 API 错误信息，未知错误使用兜底信息", () => {
    const error = new AxiosError("传输失败");
    error.response = {
      data: apiResponse(null),
      status: 422,
    } as never;
    (error.response as { data: { message: string } }).data.message =
      "用户名已存在";

    expect(getApiErrorMessage(error, "兜底错误")).toBe("用户名已存在");
    expect(getApiErrorMessage(new Error("未知错误"), "兜底错误")).toBe(
      "兜底错误",
    );
  });
});
