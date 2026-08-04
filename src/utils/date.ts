import dayjs from "dayjs";
import i18n, { normalizeLanguage } from "@/i18n";

export const DATE_FORMAT = "YYYY-MM-DD";

function isChinese() {
  return normalizeLanguage(i18n.resolvedLanguage) === "zh-CN";
}

export function formatDate(value?: string, fallback?: string): string {
  if (!value) return fallback ?? i18n.t("common.notSet");
  return dayjs(value).format(isChinese() ? "YYYY年M月D日" : "MMM D, YYYY");
}

export function formatShortDate(value?: string): string {
  if (!value) return i18n.t("common.noDeadline");
  return dayjs(value).format(isChinese() ? "MM月DD日" : "MMM D");
}

export function isOverdue(deadline?: string, completed = false): boolean {
  return Boolean(deadline && !completed && dayjs(deadline).endOf("day").isBefore(dayjs()));
}

export function daysUntil(deadline?: string): number | null {
  return deadline ? dayjs(deadline).startOf("day").diff(dayjs().startOf("day"), "day") : null;
}
