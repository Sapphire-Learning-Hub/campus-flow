import React from "react";
import { Form, Checkbox, Button, Input, Card } from "antd";
import { Link } from "react-router";
import { BrandMark } from "@/components/common/BrandMark.tsx";
import "./index.css";

const Login: React.FC = () => {
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
        <Button type="primary" size="large" htmlType="submit" block>
          登录 CampusFlow
        </Button>
        <p className="autu-switch">
          <Link to="/register">没有账号,去注册</Link>
        </p>
      </Form>
    </Card>
  );
};

export default Login;
