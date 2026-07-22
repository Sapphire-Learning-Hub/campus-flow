import { mockDatabase } from "./database";
import type { MockUser } from "@/types/user";

export function findAuthorizedUser(request: Request): MockUser | undefined {
  const authorization = request.headers.get("Authorization");
  const token = authorization?.replace(/^Bearer\s+/i, "");
  const userId = token?.replace(/^mock-token-/, "");
  return mockDatabase.users.find((user) => user.id === userId);
}
