import { delay, http, HttpResponse } from "msw";
import { findAuthorizedUser } from "../auth";
import { mockDatabase } from "../database";
import { fail, ok, readPositiveInteger } from "../response";
import { createId } from "@/utils/id";
import type { PaginatedResult } from "@/types/common";
import type { Task, TaskFormValues, TaskPatch } from "@/types/task";
import {
  canAssignTaskTo,
  canDeleteTask,
  canEditTask,
  getProjectPermissions,
  PERMISSION_DENIED,
} from "@/utils/Permissions.ts";

export const taskHandlers = [
  http.get("/api/tasks", async ({ request }) => {
    await delay(250);
    const user = findAuthorizedUser(request);
    if (!user) return fail("请先登录", 401);

    const url = new URL(request.url);
    const keyword = url.searchParams.get("keyword")?.trim().toLowerCase() ?? "";
    const projectId = url.searchParams.get("projectId");
    const status = url.searchParams.get("status");
    const priority = url.searchParams.get("priority");
    const assigneeId = url.searchParams.get("assigneeId");
    const page = readPositiveInteger(url.searchParams.get("page"), 1);
    const pageSize = readPositiveInteger(url.searchParams.get("pageSize"), 20);
    const accessibleProjectIds = new Set(
      mockDatabase.projects
        .filter((project) => getProjectPermissions(project, user.memberId).canViewProject)
        .map((project) => project.id),
    );
    const filtered = mockDatabase.tasks.filter((task) => {
      const matchesKeyword =
        !keyword ||
        task.title.toLowerCase().includes(keyword) ||
        task.description.toLowerCase().includes(keyword);
      return (
        accessibleProjectIds.has(task.projectId) &&
        matchesKeyword &&
        (!projectId || task.projectId === projectId) &&
        (!status || task.status === status) &&
        (!priority || task.priority === priority) &&
        (!assigneeId || task.assigneeId === assigneeId)
      );
    });
    const start = (page - 1) * pageSize;
    const result: PaginatedResult<Task> = {
      items: filtered.slice(start, start + pageSize),
      total: filtered.length,
      page,
      pageSize,
    };
    return ok(result);
  }),

  http.get("/api/tasks/:taskId", async ({ params, request }) => {
    await delay(180);
    const user = findAuthorizedUser(request);
    if (!user) return fail("请先登录", 401);

    const task = mockDatabase.tasks.find((item) => item.id === String(params.taskId));
    if (!task) return fail("任务不存在", 404);
    const project = mockDatabase.projects.find((item) => item.id === task.projectId);
    if (!getProjectPermissions(project, user.memberId).canViewProject) {
      return fail(PERMISSION_DENIED.viewProject, 403);
    }
    return ok(task);
  }),

  http.post("/api/tasks", async ({ request }) => {
    await delay(300);
    const user = findAuthorizedUser(request);
    if (!user) return fail("请先登录", 401);

    const values = (await request.json()) as TaskFormValues;
    const project = mockDatabase.projects.find((item) => item.id === values.projectId);
    if (!project) return fail("所属项目不存在", 400);
    if (!getProjectPermissions(project, user.memberId).canCreateTask) {
      return fail(PERMISSION_DENIED.createTask, 403);
    }
    if (!canAssignTaskTo(project, user.memberId, values.assigneeId)) {
      return fail(PERMISSION_DENIED.assignTask, 403);
    }
    if (!values.title?.trim()) return fail("任务标题不能为空", 400);

    const now = new Date().toISOString();
    const task: Task = {
      ...values,
      id: createId("t"),
      title: values.title.trim(),
      description: values.description.trim(),
      createdAt: now,
      updatedAt: now,
    };
    mockDatabase.tasks.unshift(task);
    mockDatabase.activities.unshift({
      id: createId("a"),
      projectId: task.projectId,
      actorId: user.memberId,
      kind: "task_created",
      content: `创建了任务「${task.title}」`,
      createdAt: now,
    });
    return ok(task, "任务创建成功", 201);
  }),

  http.patch("/api/tasks/:taskId", async ({ params, request }) => {
    await delay(250);
    const user = findAuthorizedUser(request);
    if (!user) return fail("请先登录", 401);

    const task = mockDatabase.tasks.find((item) => item.id === String(params.taskId));
    if (!task) return fail("任务不存在", 404);
    const project = mockDatabase.projects.find((item) => item.id === task.projectId);
    if (!canEditTask(project, user.memberId, task)) {
      return fail(PERMISSION_DENIED.editTask, 403);
    }

    const patch = (await request.json()) as TaskPatch;
    const nextAssigneeId = patch.assigneeId === undefined ? task.assigneeId : patch.assigneeId;
    if (!canAssignTaskTo(project, user.memberId, nextAssigneeId)) {
      return fail(PERMISSION_DENIED.assignTask, 403);
    }
    const now = new Date().toISOString();
    Object.assign(task, patch, { updatedAt: now });
    mockDatabase.activities.unshift({
      id: createId("a"),
      projectId: task.projectId,
      actorId: user.memberId,
      kind: "task_updated",
      content: `更新了任务「${task.title}」`,
      createdAt: now,
    });
    return ok(task, "任务更新成功");
  }),

  http.delete("/api/tasks/:taskId", ({ params, request }) => {
    const user = findAuthorizedUser(request);
    if (!user) return fail("请先登录", 401);

    const index = mockDatabase.tasks.findIndex((item) => item.id === String(params.taskId));
    if (index === -1) return fail("任务不存在", 404);
    const task = mockDatabase.tasks[index];
    const project = mockDatabase.projects.find((item) => item.id === task.projectId);
    if (!canDeleteTask(project, user.memberId)) {
      return fail(PERMISSION_DENIED.deleteTask, 403);
    }
    mockDatabase.tasks.splice(index, 1);
    return new HttpResponse(null, { status: 204 });
  }),
];
