import { useTranslation } from "react-i18next";
import { getSecurityValidationRules } from "@/utils/formRules.ts";
import { Button, Form, Input, Progress } from "antd";
import { useMemo } from "react";

import type { TFunction } from "i18next";

export interface PasswordFormValues {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
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

export function SecuritySettingsContent({
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
