export type EntityId = string;

export type AsyncStatus = "idle" | "loading" | "success" | "error";

export interface ApiResponse<T> {
  data: T;
  message: string;
  requestId: string;
  timestamp: string;
}

export interface PaginatedResult<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
}

export interface SelectOption<T extends string = string> {
  label: string;
  value: T;
}
