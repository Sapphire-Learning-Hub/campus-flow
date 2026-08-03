import { describe, expect, it } from "vitest";
import type { Project } from "@/types/project";
import type { Task } from "@/types/task";
import {
  canAssignTaskTo,
  canDeleteTask,
  canEditTask,
  getProjectPermissions,
} from "@/utils/Permissions";

function makeProject(
  members: Array<[string, "owner" | "admin" | "member" | "readonly"]>,
): Project {
  return {
    id: "project-1",
    name: "校园项目",
    description: "测试项目",
    status: "active",
    leaderId: members[0]?.[0] ?? "owner-1",
    members: members.map(([memberId, role]) => ({
      memberId,
      role,
      addedAt: "2026-01-01",
    })),
    createdAt: "2026-01-01",
    deadline: "2026-12-31",
    updatedAt: "2026-01-01T00:00:00.000Z",
    color: "#1d5eff",
    favorite: false,
  };
}

function makeTask(assigneeId = "member-1"): Task {
  return {
    id: "task-1",
    projectId: "project-1",
    title: "测试任务",
    description: "验证权限",
    status: "pending",
    priority: "medium",
    assigneeId,
    createdAt: "2026-01-01",
    deadline: "2026-12-31",
    tags: [],
    updatedAt: "2026-01-01T00:00:00.000Z",
  };
}

describe("项目权限", () => {
  it("所有者拥有完整的项目和任务管理权限", () => {
    const project = makeProject([
      ["owner-1", "owner"],
      ["member-1", "member"],
    ]);
    const permissions = getProjectPermissions(project, "owner-1");

    expect(permissions).toMatchObject({
      role: "owner",
      canViewProject: true,
      canEditProject: true,
      canDeleteProject: true,
      canManageMembers: true,
      canManageAllTasks: true,
      canCreateTask: true,
    });
    expect(canEditTask(project, "owner-1", makeTask())).toBe(true);
    expect(canDeleteTask(project, "owner-1")).toBe(true);
    expect(canAssignTaskTo(project, "owner-1", "member-1")).toBe(true);
  });

  it("管理员可以编辑任务和项目，但不能删除项目或管理成员", () => {
    const project = makeProject([
      ["admin-1", "admin"],
      ["member-1", "member"],
    ]);
    const permissions = getProjectPermissions(project, "admin-1");

    expect(permissions).toMatchObject({
      role: "admin",
      canViewProject: true,
      canEditProject: true,
      canDeleteProject: false,
      canManageMembers: false,
      canManageAllTasks: true,
      canCreateTask: true,
    });
    expect(canDeleteTask(project, "admin-1")).toBe(true);
    expect(canAssignTaskTo(project, "admin-1", "outside-project")).toBe(false);
  });

  it("成员只能创建和编辑分配给自己的任务", () => {
    const project = makeProject([["member-1", "member"]]);

    expect(getProjectPermissions(project, "member-1")).toMatchObject({
      role: "member",
      canViewProject: true,
      canEditProject: false,
      canDeleteProject: false,
      canManageMembers: false,
      canManageAllTasks: false,
      canCreateTask: true,
    });
    expect(canEditTask(project, "member-1", makeTask("member-1"))).toBe(true);
    expect(canEditTask(project, "member-1", makeTask("another-member"))).toBe(
      false,
    );
    expect(canDeleteTask(project, "member-1")).toBe(false);
    expect(canAssignTaskTo(project, "member-1", "member-1")).toBe(true);
    expect(canAssignTaskTo(project, "member-1", "another-member")).toBe(false);
  });

  it("拒绝只读成员和未知成员的访问", () => {
    const project = makeProject([["readonly-1", "readonly"]]);

    expect(getProjectPermissions(project, "readonly-1")).toMatchObject({
      role: "readonly",
      canViewProject: true,
      canEditProject: false,
      canDeleteProject: false,
      canManageMembers: false,
      canManageAllTasks: false,
      canCreateTask: false,
    });
    expect(getProjectPermissions(project, "unknown").canViewProject).toBe(
      false,
    );
    expect(canEditTask(project, "readonly-1", makeTask())).toBe(false);
    expect(canDeleteTask(project, "unknown")).toBe(false);
  });
});
