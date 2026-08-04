import { http } from "@/utils/request";
import { unwrap } from "./client";
import { clearAccessToken, storeAccessToken } from "./session";
import type { ApiResponse } from "@/types/common";
import type {
  AuthSession,
  AuthUser,
  ChangePasswordPayload,
  LoginPayload,
  RegisterPayload,
  UpdateProfilePayload,
} from "@/types/user";

export async function login(payload: LoginPayload): Promise<AuthSession> {
  const session = await unwrap(http.post<ApiResponse<AuthSession>>("/auth/login", payload));
  storeAccessToken(session.token, payload.remember);
  return session;
}

export async function register(payload: RegisterPayload): Promise<AuthSession> {
  const session = await unwrap(http.post<ApiResponse<AuthSession>>("/auth/register", payload));
  storeAccessToken(session.token, payload.remember);
  return session;
}

export function getCurrentUser(): Promise<AuthUser> {
  return unwrap(http.get<ApiResponse<AuthUser>>("/auth/me"));
}

export function updateProfile(payload: UpdateProfilePayload): Promise<AuthUser> {
  return unwrap(http.patch<ApiResponse<AuthUser>>("/auth/profile", payload));
}

export async function changePassword(payload: ChangePasswordPayload): Promise<void> {
  await unwrap(http.post<ApiResponse<null>>("/auth/change-password", payload));
}

export async function logout(): Promise<void> {
  try {
    await http.post("/auth/logout");
  } finally {
    clearAccessToken();
  }
}
