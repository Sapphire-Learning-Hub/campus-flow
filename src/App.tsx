import { App as AntdApp, ConfigProvider, theme as antdTheme } from "antd";
import zhCN from "antd/locale/zh_CN";
import { SettingsProvider } from "@/contexts/SettingContext";
import { useSettings } from "@/hooks/useSettings";
import { AppRoutes } from "@/routes/AppRoutes";
import { resolveThemeMode } from "@/services/preferences";

function ThemedApplication() {
  const { settings: appSettings } = useSettings();
  const isDark = resolveThemeMode(appSettings.themeMode) === "dark";

  return (
    <ConfigProvider
      locale={zhCN}
      theme={{
        algorithm: isDark
          ? antdTheme.darkAlgorithm
          : antdTheme.defaultAlgorithm,
        token: {
          colorPrimary: appSettings.themeColor,
          borderRadius: 8,
        },
      }}
    >
      <AntdApp>
        <AppRoutes />
      </AntdApp>
    </ConfigProvider>
  );
}

export default function App() {
  return (
    <SettingsProvider>
      <ThemedApplication />
    </SettingsProvider>
  );
}
