import i18n from "@/i18n";
import type { ProjectRole } from "@/types/member";
import type { Project } from "@/types/project";
import type { Task } from "@/types/task";

export const PERMISSION_DENIED = {
  get viewProject() {
    return i18n.t("permissions.viewProject");
  },
  get editProject() {
    return i18n.t("permissions.editProject");
  },
  get deleteProject() {
    return i18n.t("permissions.deleteProject");
  },
  get manageMembers() {
    return i18n.t("permissions.manageMembers");
  },
  get createTask() {
    return i18n.t("permissions.createTask");
  },
  get editTask() {
    return i18n.t("permissions.editTask");
  },
  get deleteTask() {
    return i18n.t("permissions.deleteTask");
  },
  get assignTask() {
    return i18n.t("permissions.assignTask");
  },
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
