import React, { useState } from "react";
import {
  App,
  Button,
  Card,
  Checkbox,
  Form,
  Input,
  Modal,
  Space,
  Typography,
  type FormProps,
} from "antd";
import {
  BankOutlined,
  FileTextOutlined,
  LockOutlined,
  MailOutlined,
  SafetyCertificateOutlined,
  UserOutlined,
} from "@ant-design/icons";
import { Link, useLocation, useNavigate } from "react-router";
import { useTranslation } from "react-i18next";
import { BrandMark } from "@/components/common/BrandMark";
import type { RegisterPayload } from "@/types/user.ts";
import { getApiErrorMessage } from "@/services/client.ts";
import { register } from "@/services/auth.ts";
import "./index.css";

function getInternalPath(value: unknown): string | undefined {
  return typeof value === "string" && value.startsWith("/") && !value.startsWith("//")
    ? value
    : undefined;
}

type RegisterProps = RegisterPayload & {
  confirmPassword: string;
  agreement: boolean;
};

const { Title, Paragraph, Text } = Typography;

const Register: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const { message } = App.useApp();
  const [form] = Form.useForm<RegisterProps>();
  const [submitted, setSubmitted] = useState(false);
  const [termsOpen, setTermsOpen] = useState(false);

  const from =
    getInternalPath((location.state as { from?: string } | null)?.from) ??
    "/dashboard";

  const onFinish: FormProps<RegisterProps>["onFinish"] = async (values) => {
    setSubmitted(true);

    try {
      await register({
        username: values.username,
        name: values.name,
        email: values.email,
        department: values.department,
        password: values.password,
        remember: values.remember,
      });

      message.success(t("auth.register.success"));
      navigate(from, { replace: true });
    } catch (error) {
      message.error(getApiErrorMessage(error, t("auth.register.failure")));
    } finally {
      setSubmitted(false);
    }
  };

  const openTerms = () => {
    setTermsOpen(true);
  };

  const handleAgreeTerms = async () => {
    form.setFieldValue("agreement", true);
    await form.validateFields(["agreement"]);
    setTermsOpen(false);
  };

  return (
    <>
      <Card className="login-card register-card">
        <div className="login-mobile-brand">
          <BrandMark />
        </div>

        <Typography.Title level={2}>
          {t("auth.register.title")}
        </Typography.Title>
        <Typography.Paragraph type="secondary">
          {t("auth.register.description")}
        </Typography.Paragraph>

        <Form<RegisterProps>
          form={form}
          layout="vertical"
          initialValues={{ remember: true, agreement: false }}
          onFinish={onFinish}
          requiredMark={false}
          scrollToFirstError
        >
          <div className="register-form-grid">
            <Form.Item
              name="name"
              label={t("auth.fields.name")}
              rules={[
                { required: true, message: t("auth.validation.nameRequired") },
                { min: 2, max: 20, message: t("auth.validation.nameLength") },
              ]}
            >
              <Input
                size="middle"
                prefix={<UserOutlined />}
                placeholder={t("auth.placeholders.name")}
                autoComplete="name"
              />
            </Form.Item>

            <Form.Item
              name="username"
              label={t("auth.fields.username")}
              rules={[
                {
                  required: true,
                  message: t("auth.validation.usernameRequired"),
                },
                {
                  min: 3,
                  max: 20,
                  message: t("auth.validation.usernameLength"),
                },
                {
                  pattern: /^[A-Za-z0-9_]+$/,
                  message: t("auth.validation.usernamePattern"),
                },
              ]}
            >
              <Input
                size="middle"
                prefix={<SafetyCertificateOutlined />}
                placeholder={t("auth.placeholders.usernameRegister")}
                autoComplete="username"
              />
            </Form.Item>
          </div>

          <Form.Item
            name="email"
            label={t("auth.fields.email")}
            rules={[
              { required: true, message: t("auth.validation.emailRequired") },
              { type: "email", message: t("auth.validation.emailInvalid") },
            ]}
          >
            <Input
              size="middle"
              prefix={<MailOutlined />}
              placeholder="name@campus.edu.cn"
              autoComplete="email"
            />
          </Form.Item>

          <Form.Item
            name="department"
            label={t("auth.fields.department")}
            rules={[
              {
                required: true,
                message: t("auth.validation.departmentRequired"),
              },
              {
                max: 40,
                message: t("auth.validation.departmentLength"),
              },
            ]}
          >
            <Input
              size="middle"
              prefix={<BankOutlined />}
              placeholder={t("auth.placeholders.department")}
              autoComplete="organization"
            />
          </Form.Item>

          <div className="register-form-grid">
            <Form.Item
              name="password"
              label={t("auth.fields.password")}
              rules={[
                {
                  required: true,
                  message: t("auth.validation.passwordRequired"),
                },
                {
                  min: 6,
                  max: 32,
                  message: t("auth.validation.passwordLength"),
                },
              ]}
              hasFeedback
            >
              <Input.Password
                size="middle"
                prefix={<LockOutlined />}
                placeholder={t("auth.placeholders.passwordNew")}
                autoComplete="new-password"
              />
            </Form.Item>

            <Form.Item
              name="confirmPassword"
              label={t("auth.fields.confirmPassword")}
              dependencies={["password"]}
              hasFeedback
              rules={[
                {
                  required: true,
                  message: t("auth.validation.confirmPasswordRequired"),
                },
                ({ getFieldValue }) => ({
                  validator: (_, value: string) =>
                    !value || getFieldValue("password") === value
                      ? Promise.resolve()
                      : Promise.reject(
                          new Error(t("auth.validation.passwordMismatch")),
                        ),
                }),
              ]}
            >
              <Input.Password
                size="middle"
                prefix={<LockOutlined />}
                placeholder={t("auth.placeholders.confirmPassword")}
                autoComplete="new-password"
              />
            </Form.Item>
          </div>

          <div className="register-options">
            <Form.Item name="remember" valuePropName="checked" noStyle>
              <Checkbox>{t("auth.remember")}</Checkbox>
            </Form.Item>
            <div className="agreement-row">
              <Form.Item
                name="agreement"
                valuePropName="checked"
                className="agreement-form-item"
                rules={[
                  {
                    validator: (_, checked: boolean) =>
                      checked
                        ? Promise.resolve()
                        : Promise.reject(
                            new Error(t("auth.validation.agreementRequired")),
                          ),
                  },
                ]}
              >
                <Checkbox>{t("auth.register.agreement")}</Checkbox>
              </Form.Item>

              <Button
                type="link"
                className="agreement-link"
                onClick={openTerms}
              >
                {t("auth.register.termsLink")}
              </Button>
            </div>
          </div>

          <Button
            type="primary"
            size="middle"
            htmlType="submit"
            loading={submitted}
            block
          >
            {t("auth.register.submit")}
          </Button>
        </Form>

        <p className="auth-switch">
          {t("auth.register.hasAccount")}
          <Link to="/login" state={{ from }}>
            {t("auth.register.backToLogin")}
          </Link>
        </p>
      </Card>

      <Modal
        title={
          <Space>
            <FileTextOutlined />
            {t("auth.terms.title")}
          </Space>
        }
        open={termsOpen}
        width={720}
        onCancel={() => setTermsOpen(false)}
        footer={[
          <Button key="close" onClick={() => setTermsOpen(false)}>
            {t("auth.terms.close")}
          </Button>,
          <Button key="agree" type="primary" onClick={handleAgreeTerms}>
            {t("auth.terms.agree")}
          </Button>,
        ]}
      >
        <div className="terms-content">
          <Title level={4}>{t("auth.terms.sections.serviceTitle")}</Title>
          <Paragraph>{t("auth.terms.sections.serviceBody")}</Paragraph>

          <Title level={4}>{t("auth.terms.sections.accountTitle")}</Title>
          <Paragraph>{t("auth.terms.sections.accountBody")}</Paragraph>

          <Title level={4}>{t("auth.terms.sections.conductTitle")}</Title>
          <Paragraph>{t("auth.terms.sections.conductBody")}</Paragraph>

          <Title level={4}>{t("auth.terms.sections.privacyTitle")}</Title>
          <Paragraph>{t("auth.terms.sections.privacyBody")}</Paragraph>

          <Title level={4}>{t("auth.terms.sections.changesTitle")}</Title>
          <Paragraph>{t("auth.terms.sections.changesBody")}</Paragraph>

          <Text type="secondary">{t("auth.terms.version")}</Text>
        </div>
      </Modal>
    </>
  );
};

export default Register;
