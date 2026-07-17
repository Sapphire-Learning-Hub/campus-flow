import type { EntityId } from "./common";

export interface AuthUser {
  id: EntityId;
  memberId: EntityId;
  username: string;
  name: string;
  email: string;
  avatar?: string;
}
export interface AuthSession {
  token: string;
  user: AuthUser;
}
export interface MockUser extends AuthUser {
  password: string;
}

export interface LoginPayload {
  username: string;
  password: string;
  remember: boolean;
}

export interface RegisterPayload {
  username: string;
  name: string;
  email: string;
  department: string;
  password: string;
  remember: boolean;
}
