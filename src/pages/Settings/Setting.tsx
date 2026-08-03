import {
  BgColorsOutlined,
  CheckCircleFilled,
  DeleteOutlined,
  LockOutlined,
  SettingOutlined,
  UploadOutlined,
  UserOutlined,
} from "@ant-design/icons";
import {
  App,
  Avatar,
  Button,
  Card,
  Collapse,
  ColorPicker,
  Form,
  Input,
  Layout,
  Menu,
  Progress,
  Radio,
  Select,
  Space,
  Typography,
  Upload,
  type CollapseProps,
  type MenuProps,
  type UploadProps,
} from "antd";
import type { TFunction } from "i18next";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { useRevalidator } from "react-router";
import { PageHeader } from "@/components/common/PageHeader";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { useSettings } from "@/hooks/useSettings";
import { changePassword, updateProfile } from "@/services/auth";
import { getApiErrorMessage } from "@/services/client";
import type {
  PageSize,
  ProjectView,
  SettingsFormValues,
  TaskView,
  ThemeMode,
} from "@/types/settings";
import type { AuthUser } from "@/types/user";
import {
  getProfileValidationRules,
  getSecurityValidationRules,
} from "@/utils/formRules";
import "./index.css";

const { Sider, Content } = Layout;
const { Text } = Typography;

type TabKey = "profile" | "security" | "appearance" | "preferences";

interface SettingsSection {
  key: TabKey;
  label: string;
  description: string;
  icon: ReactNode;
}

interface PasswordFormValues {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

const MOBILE_SETTINGS_QUERY = "(max-width: 768px)";

const THEME_COLORS = [
  "#1d5eff",
  "#722ed1",
  "#13c2c2",
  "#52c41a",
  "#faad14",
  "#fa541c",
  "#f5222d",
  "#2f54eb",
];

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

function getPasswordStrength(password: string, t: TFunction) {
  if (!password)
    return {
      percent: 0,
      label: t("settings.security.strength.empty"),
      tone: "normal" as const,
    };

  let score = 0;
  if (password.length >= 6) score += 1;
  if (password.length >= 10) score += 1;
  if (/[a-z]/.test(password) && /[A-Z]/.test(password)) score += 1;
  if (/\d/.test(password) && /[^a-zA-Z0-9]/.test(password)) score += 1;

  if (score <= 1)
    return {
      percent: 25,
      label: t("settings.security.strength.weak"),
      tone: "exception" as const,
    };
  if (score === 2)
    return {
      percent: 50,
      label: t("settings.security.strength.fair"),
      tone: "normal" as const,
    };
  if (score === 3)
    return {
      percent: 75,
      label: t("settings.security.strength.good"),
      tone: "normal" as const,
    };
  return {
    percent: 100,
    label: t("settings.security.strength.strong"),
    tone: "success" as const,
  };
}

function ProfileSettingsContent({
  user,
  avatar,
  submitting,
  onAvatarSelect,
  onAvatarRemove,
  onSave,
}: {
  user: AuthUser;
  avatar?: string;
  submitting: boolean;
  onAvatarSelect: NonNullable<UploadProps["beforeUpload"]>;
  onAvatarRemove: () => void;
  onSave: (values: SettingsFormValues) => Promise<void>;
}) {
  const { t } = useTranslation();
  const validationRules = getProfileValidationRules(t);
  const [form] = Form.useForm<SettingsFormValues>();

  useEffect(() => {
    form.setFieldsValue({
      username: user.username,
      department: user.department,
      email: user.email,
    });
  }, [form, user]);

  return (
    <Form
      form={form}
      layout="vertical"
      requiredMark={false}
      initialValues={{
        username: user.username,
        department: user.department,
        email: user.email,
      }}
      onFinish={(values) => void onSave(values)}
    >
      <section className="profile-identity">
        <Avatar
          size={76}
          src={avatar}
          style={{ backgroundColor: "var(--brand-primary)" }}
        >
          {user.name.slice(0, 1)}
        </Avatar>
        <div className="profile-identity-copy">
          <b>{user.name}</b>
          <span>{user.email}</span>
          <Space wrap size={8}>
            <Upload
              accept="image/jpeg,image/png"
              showUploadList={false}
              beforeUpload={onAvatarSelect}
            >
              <Button size="small" icon={<UploadOutlined />}>
                {t("settings.profile.changeAvatar")}
              </Button>
            </Upload>
            {avatar ? (
              <Button
                size="small"
                type="text"
                danger
                icon={<DeleteOutlined />}
                onClick={onAvatarRemove}
              >
                {t("settings.profile.removeAvatar")}
              </Button>
            ) : null}
          </Space>
          <small>{t("settings.profile.avatarHelp")}</small>
        </div>
      </section>

      <div className="settings-form-grid">
        <Form.Item label={t("settings.profile.nameReadOnly")}>
          <Input
            value={user.name}
            disabled
            aria-label={t("settings.profile.nameReadOnly")}
          />
        </Form.Item>
        <Form.Item
          label={t("settings.profile.username")}
          name="username"
          rules={validationRules.username}
        >
          <Input
            placeholder={t("settings.profile.placeholders.username")}
            maxLength={20}
          />
        </Form.Item>
        <Form.Item
          label={t("settings.profile.department")}
          name="department"
          rules={validationRules.department}
        >
          <Input
            placeholder={t("settings.profile.placeholders.department")}
            maxLength={30}
          />
        </Form.Item>
        <Form.Item
          label={t("settings.profile.email")}
          name="email"
          rules={validationRules.email}
        >
          <Input placeholder={t("settings.profile.placeholders.email")} />
        </Form.Item>
      </div>

      <div className="settings-actions">
        <Text type="secondary">{t("settings.profile.syncNote")}</Text>
        <Button type="primary" htmlType="submit" loading={submitting}>
          {t("settings.profile.save")}
        </Button>
      </div>
    </Form>
  );
}

function SecuritySettingsContent({
  submitting,
  onSave,
}: {
  submitting: boolean;
  onSave: (values: PasswordFormValues) => Promise<boolean>;
}) {
  const { t } = useTranslation();
  const validationRules = getSecurityValidationRules(t);
  const [form] = Form.useForm<PasswordFormValues>();
  const newPassword = Form.useWatch("newPassword", form) ?? "";
  const strength = useMemo(
    () => getPasswordStrength(newPassword, t),
    [newPassword, t],
  );

  return (
    <Form
      className="security-form"
      form={form}
      layout="vertical"
      requiredMark={false}
      onFinish={(values) => {
        void onSave(values).then((saved) => {
          if (saved) form.resetFields();
        });
      }}
    >
      <Form.Item
        label={t("settings.security.currentPassword")}
        name="currentPassword"
        rules={validationRules.currentPassword}
      >
        <Input.Password
          autoComplete="current-password"
          placeholder={t("settings.security.placeholders.current")}
        />
      </Form.Item>
      <Form.Item
        label={t("settings.security.newPassword")}
        name="newPassword"
        dependencies={["currentPassword"]}
        rules={validationRules.newPassword}
      >
        <Input.Password
          autoComplete="new-password"
          placeholder={t("settings.security.placeholders.new")}
        />
      </Form.Item>
      <div className="password-strength" aria-live="polite">
        <div>
          <span>{t("settings.security.strength.label")}</span>
          <b>{strength.label}</b>
        </div>
        <Progress
          percent={strength.percent}
          status={strength.tone}
          showInfo={false}
          size="small"
        />
      </div>
      <Form.Item
        label={t("settings.security.confirmPassword")}
        name="confirmPassword"
        dependencies={["newPassword"]}
        rules={validationRules.confirmPassword}
      >
        <Input.Password
          autoComplete="new-password"
          placeholder={t("settings.security.placeholders.confirm")}
        />
      </Form.Item>

      <div className="password-guidance">
        <span>{t("settings.security.guidance.length")}</span>
        <span>{t("settings.security.guidance.avoidWeak")}</span>
        <span>{t("settings.security.guidance.session")}</span>
      </div>

      <div className="settings-actions settings-actions-end">
        <Button type="primary" htmlType="submit" loading={submitting}>
          {t("settings.security.save")}
        </Button>
      </div>
    </Form>
  );
}

function AppearanceSettingsContent({
  themeMode,
  themeColor,
  onThemeModeChange,
  onThemeColorChange,
}: {
  themeMode: ThemeMode;
  themeColor: string;
  onThemeModeChange: (mode: ThemeMode) => void;
  onThemeColorChange: (color: string) => void;
}) {
  const { t } = useTranslation();

  return (
    <>
      <section className="settings-section-block">
        <div className="settings-field-heading">
          <div>
            <b>{t("settings.appearance.themeMode")}</b>
            <span>{t("settings.appearance.themeModeDescription")}</span>
          </div>
          <small>{t("settings.appearance.autoSave")}</small>
        </div>
        <Radio.Group
          className="theme-mode-group"
          value={themeMode}
          onChange={(event) =>
            onThemeModeChange(event.target.value as ThemeMode)
          }
        >
          <Radio.Button value="light">
            <div className="theme-card">
              <div className="theme-preview light">
                <i />
                <span />
              </div>
              <b>{t("settings.appearance.light")}</b>
            </div>
          </Radio.Button>
          <Radio.Button value="dark">
            <div className="theme-card">
              <div className="theme-preview dark">
                <i />
                <span />
              </div>
              <b>{t("settings.appearance.dark")}</b>
            </div>
          </Radio.Button>
          <Radio.Button value="system">
            <div className="theme-card">
              <div className="theme-preview system">
                <i />
                <span />
              </div>
              <b>{t("settings.appearance.system")}</b>
            </div>
          </Radio.Button>
        </Radio.Group>
      </section>

      <section className="settings-section-block settings-section-block-last">
        <div className="settings-field-heading">
          <div>
            <b>{t("settings.appearance.themeColor")}</b>
            <span>{t("settings.appearance.themeColorDescription")}</span>
          </div>
          <ColorPicker
            value={themeColor}
            showText
            onChangeComplete={(color) =>
              onThemeColorChange(color.toHexString())
            }
          />
        </div>
        <div
          className="color-options"
          aria-label={t("settings.appearance.recommendedColors")}
        >
          {THEME_COLORS.map((color) => (
            <button
              key={color}
              type="button"
              className={`color-item ${themeColor === color ? "active" : ""}`}
              aria-label={t("settings.appearance.selectColor", { color })}
              title={color}
              style={{ backgroundColor: color }}
              onClick={() => onThemeColorChange(color)}
            >
              {themeColor === color ? <CheckCircleFilled /> : null}
            </button>
          ))}
        </div>
      </section>
    </>
  );
}

function PreferencesSettingsContent({
  initialValues,
  onSave,
}: {
  initialValues: Pick<
    SettingsFormValues,
    "pageSize" | "defaultProjectView" | "defaultTaskView"
  >;
  onSave: (values: SettingsFormValues) => Promise<void>;
}) {
  const { t } = useTranslation();
  const [form] = Form.useForm<SettingsFormValues>();
  const { pageSize, defaultProjectView, defaultTaskView } = initialValues;
  const pageSizeOptions = useMemo(
    () =>
      ([5, 10, 20, 50] as PageSize[]).map((value) => ({
        label: t("settings.preferences.rowsPerPage", { count: value }),
        value,
      })),
    [t],
  );
  const viewOptions = useMemo<
    Array<{ label: string; value: ProjectView | TaskView }>
  >(
    () => [
      { label: t("settings.preferences.cardView"), value: "card" },
      { label: t("settings.preferences.listView"), value: "list" },
    ],
    [t],
  );

  useEffect(() => {
    form.setFieldsValue({ pageSize, defaultProjectView, defaultTaskView });
  }, [defaultProjectView, defaultTaskView, form, pageSize]);

  return (
    <Form
      form={form}
      layout="vertical"
      requiredMark={false}
      initialValues={initialValues}
      onFinish={(values) => void onSave(values)}
    >
      <div className="settings-form-grid">
        <Form.Item
          label={t("settings.preferences.defaultPageSize")}
          name="pageSize"
        >
          <Select options={pageSizeOptions} />
        </Form.Item>
        <Form.Item
          label={t("settings.preferences.defaultProjectView")}
          name="defaultProjectView"
        >
          <Select options={viewOptions} />
        </Form.Item>
        <Form.Item
          label={t("settings.preferences.defaultTaskView")}
          name="defaultTaskView"
        >
          <Select options={viewOptions} />
        </Form.Item>
      </div>
      <div className="settings-actions settings-actions-end">
        <Button type="primary" htmlType="submit">
          {t("settings.preferences.save")}
        </Button>
      </div>
    </Form>
  );
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
