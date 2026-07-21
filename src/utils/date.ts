import dayjs, { type Dayjs } from "dayjs";

export const DATE_FORMAT = "YYYY-MM-DD";

export function formatDate(value?: string, fallback = "未设置"): string {
  return value ? dayjs(value).format("YYYY年M月D日") : fallback;
}

export function formatShortDate(value?: string): string {
  return value ? dayjs(value).format("MM月DD日") : "无期限";
}

export function isOverdue(deadline?: string, completed = false): boolean {
  return Boolean(
    deadline && !completed && dayjs(deadline).endOf("day").isBefore(dayjs()),
  );
}

export function daysUntil(deadline?: string): number | null {
  return deadline
    ? dayjs(deadline).startOf("day").diff(dayjs().startOf("day"), "day")
    : null;
}

export function toDateString(value: Dayjs | string): string {
  return dayjs(value).format(DATE_FORMAT);
}
