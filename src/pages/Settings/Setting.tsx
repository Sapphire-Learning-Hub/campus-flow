import {
  BgColorsOutlined,
  LockOutlined,
  SettingOutlined,
  UserOutlined,
} from "@ant-design/icons";
import {
  App,
  Card,
  Collapse,
  Layout,
  Menu,
  Upload,
  type CollapseProps,
  type MenuProps,
  type UploadProps,
} from "antd";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { useRevalidator } from "react-router";
import { PageHeader } from "@/components/common/PageHeader";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { useSettings } from "@/hooks/useSettings";
import { changePassword, updateProfile } from "@/services/auth";
import { getApiErrorMessage } from "@/services/client";
import type { SettingsFormValues } from "@/types/settings";

import "./index.css";
import { ProfileSettingsContent } from "@/components/stttings/ProfileSettings.tsx";
import {
  SecuritySettingsContent,
  type PasswordFormValues,
} from "@/components/stttings/SecuritySettings.tsx";
import { AppearanceSettingsContent } from "@/components/stttings/AppearanceSettings.tsx";
import { PreferencesSettingsContent } from "@/components/stttings/PreferencesSettings.tsx";

const { Sider, Content } = Layout;

type TabKey = "profile" | "security" | "appearance" | "preferences";

interface SettingsSection {
  key: TabKey;
  label: string;
  description: string;
  icon: ReactNode;
}

const MOBILE_SETTINGS_QUERY = "(max-width: 768px)";

function useMediaQuery(query: string) {
  const [matches, setMatches] = useState(() =>
    typeof window === "undefined" ? false : window.matchMedia(query).matches,
  );

  useEffect(() => {
    const mediaQuery = window.matchMedia(query);
    const handleChange = (event: MediaQueryListEvent) =>
      setMatches(event.matches);

    mediaQuery.addEventListener("change", handleChange);
    return () => mediaQuery.removeEventListener("change", handleChange);
  }, [query]);

  return matches;
}

export default function SettingsPage() {
  const { t } = useTranslation();
  const { message } = App.useApp();
  const user = useCurrentUser();
  const { settings: appSettings, updateSettings } = useSettings();
  const revalidator = useRevalidator();
  const isMobile = useMediaQuery(MOBILE_SETTINGS_QUERY);
  const [activeTab, setActiveTab] = useState<TabKey>("profile");
  const [mobileActivePanel, setMobileActivePanel] = useState<
    TabKey | undefined
  >("profile");
  const [avatar, setAvatar] = useState(user.avatar);
  const [profileSubmitting, setProfileSubmitting] = useState(false);
  const [passwordSubmitting, setPasswordSubmitting] = useState(false);
  const settingsSections = useMemo<SettingsSection[]>(
    () => [
      {
        key: "profile",
        icon: <UserOutlined />,
        label: t("settings.sections.profile.label"),
        description: t("settings.sections.profile.description"),
      },
      {
        key: "security",
        icon: <LockOutlined />,
        label: t("settings.sections.security.label"),
        description: t("settings.sections.security.description"),
      },
      {
        key: "appearance",
        icon: <BgColorsOutlined />,
        label: t("settings.sections.appearance.label"),
        description: t("settings.sections.appearance.description"),
      },
      {
        key: "preferences",
        icon: <SettingOutlined />,
        label: t("settings.sections.preferences.label"),
        description: t("settings.sections.preferences.description"),
      },
    ],
    [t],
  );
  const menuItems = useMemo<MenuProps["items"]>(
    () =>
      settingsSections.map(({ key, icon, label }) => ({ key, icon, label })),
    [settingsSections],
  );

  const handleAvatarSelect: NonNullable<UploadProps["beforeUpload"]> = (
    file,
  ) => {
    if (!["image/jpeg", "image/png"].includes(file.type)) {
      message.error(t("settings.profile.messages.fileType"));
      return Upload.LIST_IGNORE;
    }
    if (file.size > 2 * 1024 * 1024) {
      message.error(t("settings.profile.messages.fileSize"));
      return Upload.LIST_IGNORE;
    }

    const reader = new FileReader();
    reader.addEventListener("load", () => setAvatar(String(reader.result)));
    reader.readAsDataURL(file);
    return false;
  };

  const handleSaveProfile = async (values: SettingsFormValues) => {
    if (profileSubmitting) return;
    setProfileSubmitting(true);
    try {
      const savedUser = await updateProfile({
        username: values.username,
        department: values.department,
        email: values.email,
        avatar,
      });
      setAvatar(savedUser.avatar);
      await revalidator.revalidate();
      message.success(t("settings.profile.messages.saved"));
    } catch (error) {
      message.error(
        getApiErrorMessage(error, t("settings.profile.messages.saveFailed")),
      );
    } finally {
      setProfileSubmitting(false);
    }
  };

  const handleChangePassword = async (values: PasswordFormValues) => {
    if (passwordSubmitting) return false;
    setPasswordSubmitting(true);
    try {
      await changePassword({
        currentPassword: values.currentPassword,
        newPassword: values.newPassword,
      });
      message.success(t("settings.security.messages.saved"));
      return true;
    } catch (error) {
      message.error(
        getApiErrorMessage(error, t("settings.security.messages.saveFailed")),
      );
      return false;
    } finally {
      setPasswordSubmitting(false);
    }
  };

  const handleSavePreferences = async (values: SettingsFormValues) => {
    updateSettings({
      pageSize: values.pageSize,
      defaultProjectView: values.defaultProjectView,
      defaultTaskView: values.defaultTaskView,
    });
    message.success(t("settings.preferences.saved"));
  };

  const panelContent: Record<TabKey, ReactNode> = {
    profile: (
      <ProfileSettingsContent
        user={user}
        avatar={avatar}
        submitting={profileSubmitting}
        onAvatarSelect={handleAvatarSelect}
        onAvatarRemove={() => setAvatar(undefined)}
        onSave={handleSaveProfile}
      />
    ),
    security: (
      <SecuritySettingsContent
        submitting={passwordSubmitting}
        onSave={handleChangePassword}
      />
    ),
    appearance: (
      <AppearanceSettingsContent
        themeMode={appSettings.themeMode}
        themeColor={appSettings.themeColor}
        onThemeModeChange={(themeMode) => updateSettings({ themeMode })}
        onThemeColorChange={(themeColor) => updateSettings({ themeColor })}
      />
    ),
    preferences: (
      <PreferencesSettingsContent
        initialValues={{
          pageSize: appSettings.pageSize,
          defaultProjectView: appSettings.defaultProjectView,
          defaultTaskView: appSettings.defaultTaskView,
        }}
        onSave={handleSavePreferences}
      />
    ),
  };

  const mobileItems: CollapseProps["items"] = settingsSections.map(
    ({ key, icon, label, description }) => ({
      key,
      label: (
        <span className="settings-collapse-label">
          <span className="settings-collapse-icon">{icon}</span>
          <span>
            <b>{label}</b>
            <small>{description}</small>
          </span>
        </span>
      ),
      children: panelContent[key],
    }),
  );

  const activeSection = settingsSections.find(
    (section) => section.key === activeTab,
  )!;

  return (
    <div className="page-container settings-page">
      <PageHeader
        title={t("settings.header.title")}
        description={t("settings.header.description")}
      />

      {isMobile ? (
        <Collapse
          className="settings-mobile-collapse"
          accordion
          bordered={false}
          destroyOnHidden
          expandIconPlacement="end"
          activeKey={mobileActivePanel ? [mobileActivePanel] : []}
          items={mobileItems}
          onChange={(keys) =>
            setMobileActivePanel(keys[0] as TabKey | undefined)
          }
        />
      ) : (
        <Layout className="settings-layout">
          <Sider width={230} className="settings-sider">
            <Menu
              mode="inline"
              selectedKeys={[activeTab]}
              items={menuItems}
              onClick={({ key }) => setActiveTab(key as TabKey)}
            />
          </Sider>

          <Content className="settings-content">
            <Card
              className="settings-card"
              title={
                <span className="settings-card-title">
                  <span>{activeSection.icon}</span>
                  <span>
                    <b>{activeSection.label}</b>
                    <small>{activeSection.description}</small>
                  </span>
                </span>
              }
            >
              {panelContent[activeTab]}
            </Card>
          </Content>
        </Layout>
      )}
    </div>
  );
}
