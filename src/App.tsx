import { App as AntdApp, ConfigProvider, theme as antdTheme } from "antd";
import enUS from "antd/locale/en_US";
import zhCN from "antd/locale/zh_CN";
import { useTranslation } from "react-i18next";
import { SettingsProvider } from "@/contexts/SettingContext";
import { useSettings } from "@/hooks/useSettings";
import { normalizeLanguage } from "@/i18n";
import { AppRoutes } from "@/routes/AppRoutes";
import { resolveThemeMode } from "@/services/preferences";

function ThemedApplication() {
  const { settings: appSettings } = useSettings();
  const { i18n } = useTranslation();
  const isDark = resolveThemeMode(appSettings.themeMode) === "dark";
  const antdLocale = normalizeLanguage(i18n.resolvedLanguage) === "zh-CN" ? zhCN : enUS;

  return (
    <ConfigProvider
      locale={antdLocale}
      theme={{
        algorithm: isDark ? antdTheme.darkAlgorithm : antdTheme.defaultAlgorithm,
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
