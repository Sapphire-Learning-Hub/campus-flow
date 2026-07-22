import { delay, http } from "msw";
import { findAuthorizedUser } from "../auth";
import { mockDatabase } from "../database";
import { fail, ok } from "../response";
import { createId } from "@/utils/id";
import type {
  ManageableProjectRole,
  ProjectMemberInput,
  ProjectMemberPatch,
} from "@/types/member";
import {
  getProjectPermissions,
  PERMISSION_DENIED,
} from "@/utils/Permissions.ts";

const MANAGEABLE_ROLES = new Set<ManageableProjectRole>([
  "admin",
  "member",
  "readonly",
]);

export const memberHandlers = [
  http.get("/api/members", async ({ request }) => {
    await delay(200);
    const user = findAuthorizedUser(request);
    if (!user) return fail("请先登录", 401);

    const projectId = new URL(request.url).searchParams.get("projectId");
    if (!projectId) return ok(mockDatabase.members);

    const project = mockDatabase.projects.find((item) => item.id === projectId);
    if (!project) return fail("项目不存在", 404);
    if (!getProjectPermissions(project, user.memberId).canViewProject) {
      return fail(PERMISSION_DENIED.viewProject, 403);
    }
    const memberIds = new Set(project.members.map((member) => member.memberId));

    return ok(
      mockDatabase.members.filter((member) => memberIds.has(member.id)),
    );
  }),

  http.post("/api/projects/:projectId/members", async ({ params, request }) => {
    await delay(220);
    const user = findAuthorizedUser(request);
    if (!user) return fail("请先登录", 401);

    const project = mockDatabase.projects.find(
      (item) => item.id === String(params.projectId),
    );
    if (!project) return fail("项目不存在", 404);
    if (!getProjectPermissions(project, user.memberId).canManageMembers) {
      return fail(PERMISSION_DENIED.manageMembers, 403);
    }

    const values = (await request.json()) as ProjectMemberInput;
    if (!MANAGEABLE_ROLES.has(values.role)) {
      return fail("不能通过成员管理变更项目所有者", 400);
    }
    const member = mockDatabase.members.find(
      (item) => item.id === values.memberId,
    );
    if (!member) return fail("成员不存在", 404);
    if (project.members.some((item) => item.memberId === values.memberId)) {
      return fail("该成员已在项目中", 409);
    }

    const now = new Date().toISOString();
    project.members.push({
      memberId: values.memberId,
      role: values.role,
      addedAt: now.slice(0, 10),
    });
    project.updatedAt = now;
    mockDatabase.activities.unshift({
      id: createId("a"),
      projectId: project.id,
      actorId: user.memberId,
      kind: "member_updated",
      content: `将${member.name}添加为项目成员`,
      createdAt: now,
    });
    return ok(project, "成员添加成功", 201);
  }),

  http.patch(
    "/api/projects/:projectId/members/:memberId",
    async ({ params, request }) => {
      await delay(220);
      const user = findAuthorizedUser(request);
      if (!user) return fail("请先登录", 401);

      const project = mockDatabase.projects.find(
        (item) => item.id === String(params.projectId),
      );
      if (!project) return fail("项目不存在", 404);
      if (!getProjectPermissions(project, user.memberId).canManageMembers) {
        return fail(PERMISSION_DENIED.manageMembers, 403);
      }

      const projectMember = project.members.find(
        (item) => item.memberId === String(params.memberId),
      );
      if (!projectMember) return fail("项目成员不存在", 404);
      if (projectMember.role === "owner") {
        return fail("项目所有者角色不能在成员管理中变更", 400);
      }

      const patch = (await request.json()) as ProjectMemberPatch;
      if (!MANAGEABLE_ROLES.has(patch.role)) {
        return fail("不能通过成员管理变更项目所有者", 400);
      }

      projectMember.role = patch.role;
      const now = new Date().toISOString();
      project.updatedAt = now;
      mockDatabase.activities.unshift({
        id: createId("a"),
        projectId: project.id,
        actorId: user.memberId,
        kind: "member_updated",
        content: "更新了项目成员角色",
        createdAt: now,
      });
      return ok(project, "成员角色更新成功");
    },
  ),

  http.delete(
    "/api/projects/:projectId/members/:memberId",
    async ({ params, request }) => {
      await delay(180);
      const user = findAuthorizedUser(request);
      if (!user) return fail("请先登录", 401);

      const project = mockDatabase.projects.find(
        (item) => item.id === String(params.projectId),
      );
      if (!project) return fail("项目不存在", 404);
      if (!getProjectPermissions(project, user.memberId).canManageMembers) {
        return fail(PERMISSION_DENIED.manageMembers, 403);
      }

      const memberId = String(params.memberId);
      const index = project.members.findIndex(
        (item) => item.memberId === memberId,
      );
      if (index === -1) return fail("项目成员不存在", 404);
      if (project.members[index].role === "owner") {
        return fail("不能移除项目所有者", 400);
      }

      project.members.splice(index, 1);
      const now = new Date().toISOString();
      project.updatedAt = now;
      for (const task of mockDatabase.tasks) {
        if (task.projectId === project.id && task.assigneeId === memberId) {
          task.assigneeId = undefined;
          task.updatedAt = now;
        }
      }
      mockDatabase.activities.unshift({
        id: createId("a"),
        projectId: project.id,
        actorId: user.memberId,
        kind: "member_updated",
        content: "移除了一名项目成员",
        createdAt: now,
      });
      return ok(project, "成员已移出项目");
    },
  ),
];
