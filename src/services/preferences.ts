import type { AppSettings, PageSize, ThemeMode, ViewMode } from "@/types/settings";

const SETTINGS_STORAGE_KEY = "campus-flow:settings";
const HEX_COLOR_PATTERN = /^#[0-9a-f]{6}$/i;
const PAGE_SIZES = new Set<PageSize>([5, 10, 20, 50]);
const VIEW_MODES = new Set<ViewMode>(["card", "list"]);
const THEME_MODES = new Set<ThemeMode>(["light", "dark", "system"]);

export const DEFAULT_APP_SETTINGS: AppSettings = {
  themeMode: "light",
  themeColor: "#1d5eff",
  pageSize: 10,
  defaultProjectView: "card",
  defaultTaskView: "list",
};

let currentSettings: AppSettings | undefined;
let systemThemeListenerAttached = false;
const listeners = new Set<() => void>();

function readStoredSettings(): AppSettings {
  if (typeof window === "undefined") return DEFAULT_APP_SETTINGS;

  try {
    const stored = JSON.parse(
      window.localStorage.getItem(SETTINGS_STORAGE_KEY) ?? "{}",
    ) as Partial<AppSettings>;
    return {
      themeMode:
        stored.themeMode && THEME_MODES.has(stored.themeMode)
          ? stored.themeMode
          : DEFAULT_APP_SETTINGS.themeMode,
      themeColor:
        stored.themeColor && HEX_COLOR_PATTERN.test(stored.themeColor)
          ? stored.themeColor.toLowerCase()
          : DEFAULT_APP_SETTINGS.themeColor,
      pageSize:
        stored.pageSize && PAGE_SIZES.has(stored.pageSize)
          ? stored.pageSize
          : DEFAULT_APP_SETTINGS.pageSize,
      defaultProjectView:
        stored.defaultProjectView && VIEW_MODES.has(stored.defaultProjectView)
          ? stored.defaultProjectView
          : DEFAULT_APP_SETTINGS.defaultProjectView,
      defaultTaskView:
        stored.defaultTaskView && VIEW_MODES.has(stored.defaultTaskView)
          ? stored.defaultTaskView
          : DEFAULT_APP_SETTINGS.defaultTaskView,
    };
  } catch {
    return DEFAULT_APP_SETTINGS;
  }
}

function notifyListeners() {
  for (const listener of listeners) listener();
}

export function resolveThemeMode(mode: ThemeMode): "light" | "dark" {
  if (mode !== "system") return mode;
  return typeof window !== "undefined" && window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
}

export function applyAppearance(settings: AppSettings) {
  if (typeof document === "undefined") return;
  document.documentElement.dataset.theme = resolveThemeMode(settings.themeMode);
  document.documentElement.style.setProperty("--brand-primary", settings.themeColor);
}

export function getAppSettingsSnapshot(): AppSettings {
  currentSettings ??= readStoredSettings();
  return currentSettings;
}

export function getServerAppSettingsSnapshot(): AppSettings {
  return DEFAULT_APP_SETTINGS;
}

export function subscribeToAppSettings(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function saveAppSettings(patch: Partial<AppSettings>): AppSettings {
  const nextSettings = { ...getAppSettingsSnapshot(), ...patch };
  currentSettings = nextSettings;
  if (typeof window !== "undefined") {
    window.localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(nextSettings));
  }
  applyAppearance(nextSettings);
  notifyListeners();
  return nextSettings;
}

export function initializeAppSettings() {
  const settings = getAppSettingsSnapshot();
  applyAppearance(settings);

  if (typeof window === "undefined" || systemThemeListenerAttached) return;
  systemThemeListenerAttached = true;
  window.matchMedia("(prefers-color-scheme: dark)").addEventListener("change", () => {
    const current = getAppSettingsSnapshot();
    if (current.themeMode !== "system") return;
    currentSettings = { ...current };
    applyAppearance(currentSettings);
    notifyListeners();
  });
}
