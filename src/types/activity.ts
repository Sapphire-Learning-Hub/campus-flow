import type { EntityId } from "./common";

export type ActivityKind =
  "project_created" | "project_updated" | "task_created" | "task_updated" | "member_updated";

export interface Activity {
  id: EntityId;
  projectId: EntityId;
  actorId: EntityId;
  kind: ActivityKind;
  content: string;
  createdAt: string;
}
