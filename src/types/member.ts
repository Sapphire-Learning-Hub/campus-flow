import type { EntityId } from "./common";

export type ProjectRole = "owner" | "admin" | "member" | "readonly";

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
