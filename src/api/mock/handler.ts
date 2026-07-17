import { activityHandlers } from "./handlers/activities";
import { authHandlers } from "./handlers/auth";
import { memberHandlers } from "./handlers/members.ts";
import { projectHandlers } from "./handlers/projects";
import { taskHandlers } from "./handlers/tasks";

export const handlers = [
  ...authHandlers,
  ...projectHandlers,
  ...taskHandlers,
  ...memberHandlers,
  ...activityHandlers,
];
