import { useOutletContext } from "react-router";
import type { AuthUser } from "@/types/user";

export type AppLayoutContext = {
  user: AuthUser;
};

export function useCurrentUser() {
  const { user } = useOutletContext<AppLayoutContext>();

  return user;
}
