import type { EntityId } from "./common";
import type { ProjectMember } from "./member";

export type ProjectStatus = "planning" | "active" | "completed" | "archived";

export interface Project {
  id: EntityId;
  name: string;
  description: string;
  status: ProjectStatus;
  leaderId: EntityId;
  members: ProjectMember[];
  createdAt: string;
  deadline: string;
  updatedAt: string;
  color: string;
  favorite: boolean;
}

export type ProjectFormValues = Pick<
  Project,
  "name" | "description" | "status" | "leaderId" | "deadline" | "color"
> & {
  memberIds: EntityId[];
};

export type ProjectPatch = Partial<
  Omit<Project, "id" | "createdAt" | "members">
>;
