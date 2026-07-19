import { delay, http } from "msw";
import { mockDatabase } from "../database";
import { ok } from "../response";

export const memberHandlers = [
  http.get("/api/members", async ({ request }) => {
    await delay(200);
    const projectId = new URL(request.url).searchParams.get("projectId");
    if (!projectId) return ok(mockDatabase.members);

    const project = mockDatabase.projects.find((item) => item.id === projectId);
    const memberIds = new Set(
      project?.members.map((member) => member.memberId),
    );

    return ok(
      mockDatabase.members.filter((member) => memberIds.has(member.id)),
    );
  }),
];
