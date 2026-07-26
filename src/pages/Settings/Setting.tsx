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
import { useEffect, useMemo, useState, type ReactNode } from "react";
import { useRevalidator } from "react-router";
import { PageHeader } from "@/components/common/PageHeader";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { useSettings } from "@/hooks/useSettings";
import { changePassword, updateProfile } from "@/services/auth";
import { getApiErrorMessage } from "@/services/client";
import type { SelectOption } from "@/types/common";
import type {
  PageSize,
  ProjectView,
  SettingsFormValues,
  TaskView,
  ThemeMode,
} from "@/types/settings";
import type { AuthUser } from "@/types/user";
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

const SETTINGS_SECTIONS: SettingsSection[] = [
  {
    key: "profile",
    icon: <UserOutlined />,
    label: "个人信息",
    description: "管理头像和基础资料",
  },
  {
    key: "security",
    icon: <LockOutlined />,
    label: "账号安全",
    description: "修改登录密码",
  },
  {
    key: "appearance",
    icon: <BgColorsOutlined />,
    label: "外观设置",
    description: "主题更改会立即生效",
  },
  {
    key: "preferences",
    icon: <SettingOutlined />,
    label: "使用偏好",
    description: "设置常用的默认视图",
  },
];

const MENU_ITEMS: MenuProps["items"] = SETTINGS_SECTIONS.map(
  ({ key, icon, label }) => ({ key, icon, label }),
);

const PAGE_SIZE_OPTIONS = [
  { label: "5 条/页", value: 5 },
  { label: "10 条/页", value: 10 },
  { label: "20 条/页", value: 20 },
  { label: "50 条/页", value: 50 },
] satisfies Array<{ label: string; value: PageSize }>;

const PROJECT_VIEW_OPTIONS = [
  { label: "卡片视图", value: "card" },
  { label: "列表视图", value: "list" },
] satisfies SelectOption<ProjectView>[];

const TASK_VIEW_OPTIONS = [
  { label: "卡片视图", value: "card" },
  { label: "列表视图", value: "list" },
] satisfies SelectOption<TaskView>[];

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

function getPasswordStrength(password: string) {
  if (!password)
    return { percent: 0, label: "尚未输入", tone: "normal" as const };

  let score = 0;
  if (password.length >= 6) score += 1;
  if (password.length >= 10) score += 1;
  if (/[a-z]/.test(password) && /[A-Z]/.test(password)) score += 1;
  if (/\d/.test(password) && /[^a-zA-Z0-9]/.test(password)) score += 1;

  if (score <= 1)
    return { percent: 25, label: "较弱", tone: "exception" as const };
  if (score === 2)
    return { percent: 50, label: "一般", tone: "normal" as const };
  if (score === 3)
    return { percent: 75, label: "良好", tone: "normal" as const };
  return { percent: 100, label: "强", tone: "success" as const };
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
                更换头像
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
                移除
              </Button>
            ) : null}
          </Space>
          <small>支持 JPG、PNG，文件不超过 2 MB</small>
        </div>
      </section>

      <div className="settings-form-grid">
        <Form.Item label="姓名（不可修改）">
          <Input value={user.name} disabled aria-label="姓名（不可修改）" />
        </Form.Item>
        <Form.Item
          label="用户名"
          name="username"
          rules={[
            { required: true, message: "请输入用户名" },
            {
              pattern: /^[a-zA-Z0-9_]{3,20}$/,
              message: "用户名应为 3–20 位字母、数字或下划线",
            },
          ]}
        >
          <Input placeholder="请输入用户名" maxLength={20} />
        </Form.Item>
        <Form.Item
          label="学院 / 部门"
          name="department"
          rules={[
            { required: true, message: "请输入学院或部门" },
            { max: 30, message: "学院或部门不能超过 30 个字符" },
          ]}
        >
          <Input placeholder="请输入学院或部门" maxLength={30} />
        </Form.Item>
        <Form.Item
          label="邮箱"
          name="email"
          rules={[
            { required: true, message: "请输入邮箱" },
            { type: "email", message: "请输入正确的邮箱格式" },
          ]}
        >
          <Input placeholder="请输入邮箱" />
        </Form.Item>
      </div>

      <div className="settings-actions">
        <Text type="secondary">修改后将同步更新成员资料</Text>
        <Button type="primary" htmlType="submit" loading={submitting}>
          保存个人信息
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
  const [form] = Form.useForm<PasswordFormValues>();
  const newPassword = Form.useWatch("newPassword", form) ?? "";
  const strength = useMemo(
    () => getPasswordStrength(newPassword),
    [newPassword],
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
        label="当前密码"
        name="currentPassword"
        rules={[{ required: true, message: "请输入当前密码" }]}
      >
        <Input.Password
          autoComplete="current-password"
          placeholder="用于验证当前身份"
        />
      </Form.Item>
      <Form.Item
        label="新密码"
        name="newPassword"
        dependencies={["currentPassword"]}
        rules={[
          { required: true, message: "请输入新密码" },
          { min: 6, max: 32, message: "新密码应为 6–32 位" },
          ({ getFieldValue }) => ({
            validator(_, value?: string) {
              if (!value || value !== getFieldValue("currentPassword")) {
                return Promise.resolve();
              }
              return Promise.reject(new Error("新密码不能与当前密码相同"));
            },
          }),
        ]}
      >
        <Input.Password
          autoComplete="new-password"
          placeholder="建议组合使用字母、数字和符号"
        />
      </Form.Item>
      <div className="password-strength" aria-live="polite">
        <div>
          <span>密码强度</span>
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
        label="确认新密码"
        name="confirmPassword"
        dependencies={["newPassword"]}
        rules={[
          { required: true, message: "请再次输入新密码" },
          ({ getFieldValue }) => ({
            validator(_, value?: string) {
              if (!value || value === getFieldValue("newPassword")) {
                return Promise.resolve();
              }
              return Promise.reject(new Error("两次输入的密码不一致"));
            },
          }),
        ]}
      >
        <Input.Password
          autoComplete="new-password"
          placeholder="再次输入新密码"
        />
      </Form.Item>

      <div className="password-guidance">
        <span>至少 6 位，最长 32 位</span>
        <span>避免使用连续数字或重复字符</span>
        <span>修改成功后当前设备仍保持登录</span>
      </div>

      <div className="settings-actions settings-actions-end">
        <Button type="primary" htmlType="submit" loading={submitting}>
          修改密码
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
  return (
    <>
      <section className="settings-section-block">
        <div className="settings-field-heading">
          <div>
            <b>主题模式</b>
            <span>选择最适合当前环境的界面明暗</span>
          </div>
          <small>自动保存</small>
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
              <b>浅色模式</b>
            </div>
          </Radio.Button>
          <Radio.Button value="dark">
            <div className="theme-card">
              <div className="theme-preview dark">
                <i />
                <span />
              </div>
              <b>深色模式</b>
            </div>
          </Radio.Button>
          <Radio.Button value="system">
            <div className="theme-card">
              <div className="theme-preview system">
                <i />
                <span />
              </div>
              <b>跟随系统</b>
            </div>
          </Radio.Button>
        </Radio.Group>
      </section>

      <section className="settings-section-block settings-section-block-last">
        <div className="settings-field-heading">
          <div>
            <b>主题色</b>
            <span>用于主要按钮、导航选中态和强调信息</span>
          </div>
          <ColorPicker
            value={themeColor}
            showText
            onChangeComplete={(color) =>
              onThemeColorChange(color.toHexString())
            }
          />
        </div>
        <div className="color-options" aria-label="推荐主题色">
          {THEME_COLORS.map((color) => (
            <button
              key={color}
              type="button"
              className={`color-item ${themeColor === color ? "active" : ""}`}
              aria-label={`选择主题色 ${color}`}
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
  const [form] = Form.useForm<SettingsFormValues>();
  const { pageSize, defaultProjectView, defaultTaskView } = initialValues;

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
        <Form.Item label="默认每页显示条数" name="pageSize">
          <Select options={PAGE_SIZE_OPTIONS} />
        </Form.Item>
        <Form.Item label="默认项目视图" name="defaultProjectView">
          <Select options={PROJECT_VIEW_OPTIONS} />
        </Form.Item>
        <Form.Item label="默认任务视图" name="defaultTaskView">
          <Select options={TASK_VIEW_OPTIONS} />
        </Form.Item>
      </div>
      <div className="settings-actions settings-actions-end">
        <Button type="primary" htmlType="submit">
          保存使用偏好
        </Button>
      </div>
    </Form>
  );
}

export default function SettingsPage() {
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

  const handleAvatarSelect: NonNullable<UploadProps["beforeUpload"]> = (
    file,
  ) => {
    if (!["image/jpeg", "image/png"].includes(file.type)) {
      message.error("仅支持 JPG、PNG 格式的头像");
      return Upload.LIST_IGNORE;
    }
    if (file.size > 2 * 1024 * 1024) {
      message.error("头像文件不能超过 2 MB");
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
      message.success("个人信息已更新");
    } catch (error) {
      message.error(getApiErrorMessage(error, "个人信息保存失败"));
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
      message.success("密码修改成功");
      return true;
    } catch (error) {
      message.error(getApiErrorMessage(error, "密码修改失败"));
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
    message.success("使用偏好已保存");
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

  const mobileItems: CollapseProps["items"] = SETTINGS_SECTIONS.map(
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

  const activeSection = SETTINGS_SECTIONS.find(
    (section) => section.key === activeTab,
  )!;

  return (
    <div className="page-container settings-page">
      <PageHeader
        title="个人设置"
        description="管理账号资料、安全设置、外观和使用偏好"
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
              items={MENU_ITEMS}
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
