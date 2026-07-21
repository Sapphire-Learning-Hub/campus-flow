import type { EntityId } from "./common";

export type ProjectRole = "owner" | "admin" | "member" | "readonly";
export type ManageableProjectRole = Exclude<ProjectRole, "owner">;

export interface Member {
  id: EntityId;
  name: string;
  email: string;
  department: string;
  avatar?: string;
  color: string;
  joinedAt: string;
}

export interface ProjectMember {
  memberId: EntityId;
  role: ProjectRole;
  addedAt: string;
}

export interface ProjectMemberInput {
  memberId: EntityId;
  role: ManageableProjectRole;
}

export interface ProjectMemberPatch {
  role: ManageableProjectRole;
}
