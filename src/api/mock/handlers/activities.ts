import { delay, http } from "msw";
import { findAuthorizedUser } from "../auth";
import { mockDatabase } from "../database";
import { fail, ok, readPositiveInteger } from "../response";
import {
  getProjectPermissions,
  PERMISSION_DENIED,
} from "@/utils/Permissions.ts";

export const activityHandlers = [
  http.get("/api/activities", async ({ request }) => {
    await delay(200);
    const user = findAuthorizedUser(request);
    if (!user) return fail("请先登录", 401);

    const url = new URL(request.url);
    const projectId = url.searchParams.get("projectId");
    const limit = readPositiveInteger(url.searchParams.get("limit"), 20);
    if (projectId) {
      const project = mockDatabase.projects.find(
        (item) => item.id === projectId,
      );
      if (!project) return fail("项目不存在", 404);
      if (!getProjectPermissions(project, user.memberId).canViewProject) {
        return fail(PERMISSION_DENIED.viewProject, 403);
      }
    }
    const accessibleProjectIds = new Set(
      mockDatabase.projects
        .filter(
          (project) =>
            getProjectPermissions(project, user.memberId).canViewProject,
        )
        .map((project) => project.id),
    );
    const activities = projectId
      ? mockDatabase.activities.filter((item) => item.projectId === projectId)
      : mockDatabase.activities.filter((item) =>
          accessibleProjectIds.has(item.projectId),
        );
    return ok(activities.slice(0, limit));
  }),
];
