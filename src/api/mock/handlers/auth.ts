import { delay, http } from "msw";
import { findAuthorizedUser } from "../auth";
import { mockDatabase } from "../database";
import { fail, ok } from "../response";
import { createId } from "@/utils/id";
import type { Member } from "@/types/member";
import type {
  AuthSession,
  AuthUser,
  LoginPayload,
  MockUser,
  RegisterPayload,
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

  http.post("/api/auth/logout", async () => {
    await delay(100);
    return ok(null, "已退出登录");
  }),
];
