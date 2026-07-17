import { delay, http } from "msw";
import { mockDatabase } from "../database";
import { ok, readPositiveInteger } from "../response";

export const activityHandlers = [
  http.get("/api/activities", async ({ request }) => {
    await delay(200);
    const url = new URL(request.url);
    const projectId = url.searchParams.get("projectId");
    const limit = readPositiveInteger(url.searchParams.get("limit"), 20);
    const activities = projectId
      ? mockDatabase.activities.filter((item) => item.projectId === projectId)
      : mockDatabase.activities;
    return ok(activities.slice(0, limit));
  }),
];
