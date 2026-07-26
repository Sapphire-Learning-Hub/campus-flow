import { delay, http } from "msw";
import { findAuthorizedUser } from "../auth";
import { mockDatabase } from "../database";
import { fail, ok } from "../response";
import { createId } from "@/utils/id";
import type { Member } from "@/types/member";
import type {
  AuthSession,
  AuthUser,
  ChangePasswordPayload,
  LoginPayload,
  MockUser,
  RegisterPayload,
  UpdateProfilePayload,
} from "@/types/user";

function toAuthUser(user: MockUser): AuthUser {
  return {
    id: user.id,
    memberId: user.memberId,
    username: user.username,
    name: user.name,
    email: user.email,
    department: user.department,
    avatar: user.avatar,
  };
}

function createSession(user: MockUser): AuthSession {
  return {
    token: `mock-token-${user.id}`,
    user: toAuthUser(user),
  };
}

export const authHandlers = [
  http.post("/api/auth/login", async ({ request }) => {
    await delay(300);
    const payload = (await request.json()) as LoginPayload;
    const user = mockDatabase.users.find(
      (item) =>
        item.username === payload.username.trim() &&
        item.password === payload.password,
    );

    return user
      ? ok(createSession(user), "登录成功")
      : fail("用户名或密码错误", 401);
  }),

  http.post("/api/auth/register", async ({ request }) => {
    await delay(350);
    const payload = (await request.json()) as RegisterPayload;
    const username = payload.username.trim();
    const email = payload.email.trim().toLowerCase();

    if (mockDatabase.users.some((user) => user.username === username)) {
      return fail("用户名已存在", 409);
    }
    if (mockDatabase.members.some((member) => member.email === email)) {
      return fail("邮箱已被使用", 409);
    }

    const memberId = createId("m");
    const member: Member = {
      id: memberId,
      name: payload.name.trim(),
      email,
      department: payload.department.trim(),
      color: "#1677ff",
      joinedAt: new Date().toISOString().slice(0, 10),
    };
    const user: MockUser = {
      id: createId("u"),
      memberId,
      username,
      name: member.name,
      email,
      department: member.department,
      password: payload.password,
    };

    mockDatabase.members.push(member);
    mockDatabase.users.push(user);
    return ok(createSession(user), "注册成功", 201);
  }),

  http.get("/api/auth/me", async ({ request }) => {
    await delay(150);
    const user = findAuthorizedUser(request);
    return user ? ok(toAuthUser(user)) : fail("登录状态已失效", 401);
  }),

  http.patch("/api/auth/profile", async ({ request }) => {
    await delay(260);
    const user = findAuthorizedUser(request);
    if (!user) return fail("请先登录", 401);

    const payload = (await request.json()) as UpdateProfilePayload;
    const username = payload.username?.trim();
    const email = payload.email?.trim().toLowerCase();
    const department = payload.department?.trim();

    if (!username || !email || !department) {
      return fail("个人信息填写不完整", 400);
    }
    if (!/^\S+@\S+\.\S+$/.test(email)) {
      return fail("邮箱格式不正确", 400);
    }
    if (
      mockDatabase.users.some(
        (item) => item.id !== user.id && item.username === username,
      )
    ) {
      return fail("用户名已存在", 409);
    }
    if (
      mockDatabase.users.some(
        (item) => item.id !== user.id && item.email.toLowerCase() === email,
      )
    ) {
      return fail("邮箱已被使用", 409);
    }

    Object.assign(user, {
      username,
      email,
      department,
      avatar: payload.avatar,
    });
    const member = mockDatabase.members.find(
      (item) => item.id === user.memberId,
    );
    if (member) {
      Object.assign(member, {
        email,
        department,
        avatar: payload.avatar,
      });
    }

    return ok(toAuthUser(user), "个人信息已更新");
  }),

  http.post("/api/auth/change-password", async ({ request }) => {
    await delay(300);
    const user = findAuthorizedUser(request);
    if (!user) return fail("请先登录", 401);

    const payload = (await request.json()) as ChangePasswordPayload;
    if (payload.currentPassword !== user.password) {
      return fail("当前密码不正确", 400);
    }
    if (
      !payload.newPassword ||
      payload.newPassword.length < 6 ||
      payload.newPassword.length > 32
    ) {
      return fail("新密码应为 6–32 位", 400);
    }
    if (payload.newPassword === user.password) {
      return fail("新密码不能与当前密码相同", 400);
    }

    user.password = payload.newPassword;
    return ok(null, "密码修改成功");
  }),

  http.post("/api/auth/logout", async () => {
    await delay(100);
    return ok(null, "已退出登录");
  }),
];
