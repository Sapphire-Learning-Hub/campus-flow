import React, { useState } from "react";
import { App, Form, Checkbox, Button, Input, Card } from "antd";
import { Link, useLocation, useNavigate } from "react-router";
import type { FormProps } from "antd";
import { BrandMark } from "@/components/common/BrandMark.tsx";
import "./index.css";
import type { LoginPayload } from "@/types/user.ts";
import { getApiErrorMessage } from "@/services/client.ts";
import { login } from "@/services/auth.ts";

function getInternalPath(value: unknown): string | undefined {
  return typeof value === "string" && value.startsWith("/") && !value.startsWith("//")
    ? value
    : undefined;
}

const Login: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { message } = App.useApp();
  const [submitted, setSubmitted] = useState<boolean>(false);
  const from =
    getInternalPath(new URLSearchParams(location.search).get("redirectTo")) ??
    getInternalPath((location.state as { from?: string } | null)?.from) ??
    "/dashboard";
  const onFinish: FormProps<LoginPayload>["onFinish"] = async (values) => {
    setSubmitted(true);
    try {
      await login(values);
      message.success("登录成功");
      navigate(from, { replace: true });
    } catch (error) {
      message.error(getApiErrorMessage(error, "登陆失败"));
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
          username: "admin",
          password: "123456",
          remember: true,
        }}
        requiredMark={false}
        onFinish={onFinish}
      >
        <Form.Item
          name="username"
          label="用户名"
          rules={[{ required: true, message: "请输入用户名" }]}
        >
          <Input
            size="large"
            placeholder="请输入用户名"
            autoComplete="username"
          />
        </Form.Item>
        <Form.Item
          name="password"
          label="密码"
          rules={[
            { required: true, message: "请输入密码" },
            { min: 6, message: "密码至少需要 6 位" },
          ]}
        >
          <Input.Password
            size="large"
            placeholder="请输入密码"
            autoComplete="current-password"
          />
        </Form.Item>
        <Form.Item name="remember" valuePropName="checked">
          <Checkbox>保持登录状态</Checkbox>
        </Form.Item>
        <Button
          type="primary"
          size="large"
          htmlType="submit"
          loading={submitted}
          block
        >
          登录 CampusFlow
        </Button>
        <p className="autu-switch">
          <Link to="/register" state={{ from }}>
            {" "}
            没有账号,去注册
          </Link>
        </p>
      </Form>
    </Card>
  );
};

export default Login;
