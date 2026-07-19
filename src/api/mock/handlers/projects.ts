import { delay, http, HttpResponse } from "msw";
import { mockDatabase } from "../database";
import { fail, ok, readPositiveInteger } from "../response";
import { createId } from "@/utils/id";
import type { PaginatedResult } from "@/types/common";
import type { Project, ProjectFormValues, ProjectPatch } from "@/types/project";

export const projectHandlers = [
  http.get("/api/projects", async ({ request }) => {
    await delay(250);
    const url = new URL(request.url);
    const keyword = url.searchParams.get("keyword")?.trim().toLowerCase() ?? "";
    const status = url.searchParams.get("status");
    const page = readPositiveInteger(url.searchParams.get("page"), 1);
    const pageSize = readPositiveInteger(url.searchParams.get("pageSize"), 20);
    const filtered = mockDatabase.projects.filter((project) => {
      const matchesKeyword =
        !keyword ||
        project.name.toLowerCase().includes(keyword) ||
        project.description.toLowerCase().includes(keyword);
      return matchesKeyword && (!status || project.status === status);
    });
    const start = (page - 1) * pageSize;
    const result: PaginatedResult<Project> = {
      items: filtered.slice(start, start + pageSize),
      total: filtered.length,
      page,
      pageSize,
    };
    return ok(result);
  }),

  http.get("/api/projects/:projectId", async ({ params }) => {
    await delay(200);
    const project = mockDatabase.projects.find(
      (item) => item.id === String(params.projectId),
    );
    return project ? ok(project) : fail("项目不存在", 404);
  }),

  http.post("/api/projects", async ({ request }) => {
    await delay(300);
    const values = (await request.json()) as ProjectFormValues;
    if (!values.name?.trim()) return fail("项目名称不能为空", 400);

    const now = new Date().toISOString();
    const memberIds = [...new Set([values.leaderId, ...values.memberIds])];
    const project: Project = {
      id: createId("p"),
      name: values.name.trim(),
      description: values.description.trim(),
      status: values.status,
      leaderId: values.leaderId,
      deadline: values.deadline,
      color: values.color,
      favorite: false,
      createdAt: now,
      updatedAt: now,
      members: memberIds.map((memberId) => ({
        memberId,
        role: memberId === values.leaderId ? "owner" : "member",
        addedAt: now.slice(0, 10),
      })),
    };
    mockDatabase.projects.unshift(project);
    return ok(project, "项目创建成功", 201);
  }),

  http.patch("/api/projects/:projectId", async ({ params, request }) => {
    await delay(250);
    const project = mockDatabase.projects.find(
      (item) => item.id === String(params.projectId),
    );
    if (!project) return fail("项目不存在", 404);

    const patch = (await request.json()) as ProjectPatch;
    Object.assign(project, patch, { updatedAt: new Date().toISOString() });
    return ok(project, "项目更新成功");
  }),

  http.delete("/api/projects/:projectId", ({ params }) => {
    const projectId = String(params.projectId);
    const index = mockDatabase.projects.findIndex(
      (item) => item.id === projectId,
    );
    if (index === -1) return fail("项目不存在", 404);

    mockDatabase.projects.splice(index, 1);
    mockDatabase.tasks = mockDatabase.tasks.filter(
      (task) => task.projectId !== projectId,
    );
    mockDatabase.activities = mockDatabase.activities.filter(
      (activity) => activity.projectId !== projectId,
    );
    return new HttpResponse(null, { status: 204 });
  }),
];
