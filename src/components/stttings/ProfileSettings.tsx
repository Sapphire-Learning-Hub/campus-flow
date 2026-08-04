import type { AuthUser } from "@/types/user.ts";
import {
  Avatar,
  Button,
  Form,
  Input,
  Space,
  Typography,
  Upload,
  type UploadProps,
} from "antd";
import type { SettingsFormValues } from "@/types/settings.ts";
import { useTranslation } from "react-i18next";
import { getProfileValidationRules } from "@/utils/formRules.ts";
import { useEffect } from "react";
import { DeleteOutlined, UploadOutlined } from "@ant-design/icons";

const { Text } = Typography;

export function ProfileSettingsContent({
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
