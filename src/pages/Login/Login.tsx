import React, { useState } from "react";
import { App, Form, Checkbox, Button, Input, Card } from "antd";
import { useTranslation } from "react-i18next";
import { Link, useLocation, useNavigate } from "react-router";
import type { FormProps } from "antd";
import { BrandMark } from "@/components/common/BrandMark.tsx";
import "./index.css";
import type { LoginPayload } from "@/types/user.ts";
import { getApiErrorMessage } from "@/services/client.ts";
import { login } from "@/services/auth.ts";
import { getLoginValidationRules } from "@/utils/formRules";

function getInternalPath(value: unknown): string | undefined {
  return typeof value === "string" &&
    value.startsWith("/") &&
    !value.startsWith("//")
    ? value
    : undefined;
}

const Login: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const { message } = App.useApp();
  const [submitted, setSubmitted] = useState<boolean>(false);
  const validationRules = getLoginValidationRules(t);
  const from =
    getInternalPath(new URLSearchParams(location.search).get("redirectTo")) ??
    getInternalPath((location.state as { from?: string } | null)?.from) ??
    "/dashboard";
  const onFinish: FormProps<LoginPayload>["onFinish"] = async (values) => {
    setSubmitted(true);
    try {
      await login(values);
      message.success(t("auth.login.success"));
      navigate(from, { replace: true });
    } catch (error) {
      message.error(getApiErrorMessage(error, t("auth.login.failure")));
    } finally {
      setSubmitted(false);
    }
  };

  return (
    <Card title="" style={{ width: 500 }} className="login-card">
      <div className="login-mobile-brand">
        <BrandMark />
      </div>
      <Form
        layout="vertical"
        initialValues={{
          username: "",
          password: "",
          remember: true,
        }}
        requiredMark={false}
        onFinish={onFinish}
      >
        <Form.Item
          name="username"
          label={t("auth.fields.username")}
          rules={validationRules.username}
        >
          <Input
            size="large"
            placeholder={t("auth.placeholders.username")}
            autoComplete="username"
          />
        </Form.Item>
        <Form.Item
          name="password"
          label={t("auth.fields.password")}
          rules={validationRules.password}
        >
          <Input.Password
            size="large"
            placeholder={t("auth.placeholders.password")}
            autoComplete="current-password"
          />
        </Form.Item>
        <Form.Item name="remember" valuePropName="checked">
          <Checkbox>{t("auth.remember")}</Checkbox>
        </Form.Item>
        <Button
          type="primary"
          size="large"
          htmlType="submit"
          loading={submitted}
          block
        >
          {t("auth.login.submit")}
        </Button>
        <p className="autu-switch">
          <Link to="/register" state={{ from }}>
            {" "}
            {t("auth.login.registerLink")}
          </Link>
        </p>
      </Form>
    </Card>
  );
};

export default Login;
