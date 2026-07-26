import {
  createContext,
  useCallback,
  useMemo,
  useSyncExternalStore,
  type ReactNode,
} from "react";
import {
  getAppSettingsSnapshot,
  getServerAppSettingsSnapshot,
  saveAppSettings,
  subscribeToAppSettings,
} from "@/services/preferences";
import type { AppSettings } from "@/types/settings";

export interface SettingsContextValue {
  settings: AppSettings;
  updateSettings: (patch: Partial<AppSettings>) => AppSettings;
}

// eslint-disable-next-line react-refresh/only-export-components
export const SettingsContext = createContext<SettingsContextValue | undefined>(
  undefined,
);

export function SettingsProvider({ children }: { children: ReactNode }) {
  const settings = useSyncExternalStore(
    subscribeToAppSettings,
    getAppSettingsSnapshot,
    getServerAppSettingsSnapshot,
  );
  const updateSettings = useCallback(
    (patch: Partial<AppSettings>) => saveAppSettings(patch),
    [],
  );
  const value = useMemo(
    () => ({ settings, updateSettings }),
    [settings, updateSettings],
  );

  return (
    <SettingsContext.Provider value={value}>
      {children}
    </SettingsContext.Provider>
  );
}
