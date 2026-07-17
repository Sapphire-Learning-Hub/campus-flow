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
import { BrandMark } from "@/components/common/BrandMark";
import type { RegisterPayload } from "@/types/user.ts";
import { getApiErrorMessage } from "@/services/client.ts";
import { register } from "@/services/auth.ts";
import "./index.css";

type RegisterProps = RegisterPayload & {
  confirmPassword: string;
  agreement: boolean;
};

const { Title, Paragraph, Text } = Typography;

const Register: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { message } = App.useApp();
  const [form] = Form.useForm<RegisterProps>();
  const [submitted, setSubmitted] = useState(false);
  const [termsOpen, setTermsOpen] = useState(false);

  const from =
    (location.state as { from?: string } | null)?.from ?? "/dashboard";

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

      message.success("注册成功");
      navigate(from, { replace: true });
    } catch (error) {
      message.error(getApiErrorMessage(error, "注册失败"));
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

        <Typography.Title level={2}>创建账号</Typography.Title>
        <Typography.Paragraph type="secondary">
          加入 CampusFlow，开始管理你的校园协作项目
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
                            new Error("请先阅读并同意平台服务条款"),
                          ),
                  },
                ]}
              >
                <Checkbox>我已阅读并同意</Checkbox>
              </Form.Item>

              <Button
                type="link"
                className="agreement-link"
                onClick={openTerms}
              >
                《平台服务条款》
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

      <Modal
        title={
          <Space>
            <FileTextOutlined />
            平台使用条款
          </Space>
        }
        open={termsOpen}
        width={720}
        onCancel={() => setTermsOpen(false)}
        footer={[
          <Button key="close" onClick={() => setTermsOpen(false)}>
            关闭
          </Button>,
          <Button key="agree" type="primary" onClick={handleAgreeTerms}>
            同意并关闭
          </Button>,
        ]}
      >
        <div className="terms-content">
          <Title level={4}>一、服务说明</Title>
          <Paragraph>
            {/*欢迎使用本平台。在注册和使用平台服务前，请认真阅读本使用条款。*/}
            {/*用户完成注册并使用平台服务，即表示已经理解并接受本条款。*/}
            肯德基疯狂星期四,v我50
          </Paragraph>

          <Title level={4}>二、账号注册</Title>
          <Paragraph>
            {/*用户应当提供真实、准确、完整的注册信息，并妥善保管账号和密码。*/}
            {/*因用户保管不当造成的账号损失，由用户自行承担相应责任。*/}
            注册账户是对的
          </Paragraph>

          <Title level={4}>三、用户行为规范</Title>
          <Paragraph>
            {/*用户不得利用本平台发布违法违规内容，不得攻击平台系统，*/}
            {/*不得侵害其他用户或第三方的合法权益。*/}
            不要攻击本平台啊
          </Paragraph>

          <Title level={4}>四、隐私保护</Title>
          <Paragraph>
            {/*平台将按照隐私政策处理用户信息，并采取合理的技术措施保护用户数据。*/}
            用这个平台还能有隐私吗
          </Paragraph>

          <Title level={4}>五、条款变更</Title>
          <Paragraph>
            {/*平台可能根据业务发展或法律法规要求更新本条款。*/}
            {/*更新后的条款将在平台内公布。*/}
            听说平台条款可以随便写,反正都不看
          </Paragraph>

          <Text type="secondary">条款版本：2026年7月</Text>
        </div>
      </Modal>
    </>
  );
};

export default Register;
