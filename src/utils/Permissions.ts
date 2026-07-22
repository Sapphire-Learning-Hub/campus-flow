import type { ProjectRole } from "@/types/member";
import type { Project } from "@/types/project";
import type { Task } from "@/types/task";

export const PERMISSION_DENIED = {
  viewProject: "权限不足：你不是该项目的成员",
  editProject: "权限不足：只有项目所有者或管理员可以修改项目信息",
  deleteProject: "权限不足：只有项目所有者可以删除项目",
  manageMembers: "权限不足：只有项目所有者可以管理成员",
  createTask: "权限不足：当前角色不能创建任务",
  editTask: "权限不足：只有项目所有者、管理员或任务负责人可以修改任务",
  deleteTask: "权限不足：只有项目所有者或管理员可以删除任务",
  assignTask: "权限不足：普通成员只能创建并负责自己的任务",
} as const;

export interface Permissions {
  role?: ProjectRole;
  canViewProject: boolean;
  canEditProject: boolean;
  canDeleteProject: boolean;
  canManageMembers: boolean;
  canManageAllTasks: boolean;
  canCreateTask: boolean;
}

export function getProjectRole(
  project: Project | undefined,
  memberId: string | undefined,
): ProjectRole | undefined {
  if (!project || !memberId) return undefined;
  return project.members.find((item) => item.memberId === memberId)?.role;
}

export function getProjectPermissions(
  project: Project | undefined,
  memberId: string | undefined,
): Permissions {
  const role = getProjectRole(project, memberId);
  const isOwner = role === "owner";
  const isAdmin = role === "admin";
  const canManageAllTasks = isOwner || isAdmin;

  return {
    role,
    canViewProject: role !== undefined,
    canEditProject: isOwner || isAdmin,
    canDeleteProject: isOwner,
    canManageMembers: isOwner,
    canManageAllTasks,
    canCreateTask: canManageAllTasks || role === "member",
  };
}

export function canEditTask(
  project: Project | undefined,
  memberId: string | undefined,
  task: Task,
): boolean {
  const permissions = getProjectPermissions(project, memberId);
  return (
    permissions.canManageAllTasks ||
    (permissions.role === "member" && task.assigneeId === memberId)
  );
}

export function canDeleteTask(
  project: Project | undefined,
  memberId: string | undefined,
): boolean {
  return getProjectPermissions(project, memberId).canManageAllTasks;
}

export function canAssignTaskTo(
  project: Project | undefined,
  memberId: string | undefined,
  assigneeId: string | undefined,
): boolean {
  const permissions = getProjectPermissions(project, memberId);
  if (permissions.canManageAllTasks) {
    return (
      assigneeId === undefined ||
      project?.members.some((item) => item.memberId === assigneeId) === true
    );
  }
  return permissions.role === "member" && assigneeId === memberId;
}
