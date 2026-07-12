import React from "react";
import type { FormProps } from "antd";
import { Card, Button, Checkbox, Form, Input, Typography } from "antd";
import {
  BankOutlined,
  LockOutlined,
  MailOutlined,
  SafetyCertificateOutlined,
  UserOutlined,
} from "@ant-design/icons";
import { Link, useLocation } from "react-router";
import { BrandMark } from "@/components/common/BrandMark";
import "./index.css";

type FieldType = {
  username?: string;
  password?: string;
  remember?: string;
};

const onFinish: FormProps<FieldType>["onFinish"] = (values) => {
  console.log("Success:", values);
};

const onFinishFailed: FormProps<FieldType>["onFinishFailed"] = (errorInfo) => {
  console.log("Failed:", errorInfo);
};

const Register: React.FC = () => {
  const location = useLocation();
  const from =
    (location.state as { from?: string } | null)?.from ?? "/dashboard";

  return (
    <Card title="" style={{ width: 500 }} className="login-card register-card">
      <div className="login-mobile-brand">
        <BrandMark />
      </div>
      <Typography.Title level={2}>创建账号</Typography.Title>
      <Typography.Paragraph type="secondary">
        加入 CampusFlow，开始管理你的校园协作项目
      </Typography.Paragraph>
      <Form
        layout="vertical"
        initialValues={{ remember: true, agreement: false }}
        onFinish={onFinish}
        onFinishFailed={onFinishFailed}
        requiredMark={false}
      >
        <div className="register-form-grid">
          <Form.Item
            name="name"
            label="姓名"
            rules={[
              { required: true, message: "请输入姓名" },
              { min: 2, max: 20, message: "姓名应为 2–20 个字符" },
            ]}
          >
            <Input
              size="middle"
              prefix={<UserOutlined />}
              placeholder="请输入真实姓名"
              autoComplete="name"
            />
          </Form.Item>
          <Form.Item
            name="username"
            label="用户名"
            rules={[
              { required: true, message: "请输入用户名" },
              { min: 3, max: 20, message: "用户名应为 3–20 个字符" },
              {
                pattern: /^[A-Za-z0-9_]+$/,
                message: "只能使用字母、数字和下划线",
              },
            ]}
          >
            <Input
              size="middle"
              prefix={<SafetyCertificateOutlined />}
              placeholder="用于登录"
              autoComplete="username"
            />
          </Form.Item>
        </div>
        <Form.Item
          name="email"
          label="校园邮箱"
          rules={[
            { required: true, message: "请输入邮箱" },
            { type: "email", message: "请输入有效的邮箱地址" },
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
          label="学院 / 部门"
          rules={[
            { required: true, message: "请输入学院或部门" },
            { max: 40, message: "学院或部门不能超过 40 个字符" },
          ]}
        >
          <Input
            size="middle"
            prefix={<BankOutlined />}
            placeholder="例如：计算机学院"
            autoComplete="organization"
          />
        </Form.Item>
        <div className="register-form-grid">
          <Form.Item
            name="password"
            label="密码"
            rules={[
              { required: true, message: "请输入密码" },
              { min: 6, max: 32, message: "密码应为 6–32 位" },
            ]}
            hasFeedback
          >
            <Input.Password
              size="middle"
              prefix={<LockOutlined />}
              placeholder="至少 6 位"
              autoComplete="new-password"
            />
          </Form.Item>
          <Form.Item
            name="confirmPassword"
            label="确认密码"
            dependencies={["password"]}
            hasFeedback
            rules={[
              { required: true, message: "请再次输入密码" },
              ({ getFieldValue }) => ({
                validator: (_, value: string) =>
                  !value || getFieldValue("password") === value
                    ? Promise.resolve()
                    : Promise.reject(new Error("两次输入的密码不一致")),
              }),
            ]}
          >
            <Input.Password
              size="middle"
              prefix={<LockOutlined />}
              placeholder="再次输入密码"
              autoComplete="new-password"
            />
          </Form.Item>
        </div>
        <div className="register-options">
          <Form.Item name="remember" valuePropName="checked" noStyle>
            <Checkbox>保持登录状态</Checkbox>
          </Form.Item>
          <Form.Item
            name="agreement"
            valuePropName="checked"
            noStyle
            rules={[
              {
                validator: (_, checked: boolean) =>
                  checked
                    ? Promise.resolve()
                    : Promise.reject(new Error("请先同意使用条款")),
              },
            ]}
          >
            <Checkbox>我已阅读并同意平台使用条款</Checkbox>
          </Form.Item>
        </div>
        <Button type="primary" size="middle" htmlType="submit" block>
          注册并进入 CampusFlow
        </Button>
      </Form>
      <p className="auth-switch">
        已有账号？
        <Link to="/login" state={{ from }}>
          返回登录
        </Link>
      </p>
    </Card>
  );
};
export default Register;
