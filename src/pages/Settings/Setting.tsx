import "./index.css";

import { useState } from "react";
import {
  BgColorsOutlined,
  SettingOutlined,
  UploadOutlined,
  UserOutlined,
} from "@ant-design/icons";
import type { MenuProps } from "antd";
import {
  Avatar,
  Button,
  Card,
  Col,
  ColorPicker,
  Form,
  Input,
  Layout,
  Menu,
  message,
  Radio,
  Row,
  Select,
  Space,
  Typography,
  Upload,
} from "antd";

import { PageHeader } from "@/components/common/PageHeader";

const { Sider, Content } = Layout;
const { Text } = Typography;

type TabKey = "profile" | "appearance" | "preferences";

const menuItems: MenuProps["items"] = [
  {
    key: "profile",
    icon: <UserOutlined />,
    label: "个人信息",
  },
  {
    key: "appearance",
    icon: <BgColorsOutlined />,
    label: "外观设置",
  },
  {
    key: "preferences",
    icon: <SettingOutlined />,
    label: "偏好设置",
  },
];

const themeColors = [
  "#1677ff",
  "#722ed1",
  "#13c2c2",
  "#52c41a",
  "#faad14",
  "#fa541c",
  "#f5222d",
  "#2f54eb",
];

export default function SettingsPage() {
  const [form] = Form.useForm();
  const [messageApi, contextHolder] = message.useMessage();

  const [activeTab, setActiveTab] = useState<TabKey>("profile");
  const [themeMode, setThemeMode] = useState("light");
  const [themeColor, setThemeColor] = useState("#1677ff");

  const handleSaveProfile = async () => {
    await form.validateFields(["username", "nickname", "email"]);
    messageApi.success("个人信息已保存");
  };

  const handleSavePreferences = async () => {
    await form.validateFields(["pageSize", "defaultView"]);
    messageApi.success("偏好设置已保存");
  };

  return (
    <div className="page-container settings-page">
      {contextHolder}

      <PageHeader title="个人设置" description="管理你的个人信息和偏好设置" />

      <Layout className="settings-layout">
        <Sider width={200} className="settings-sider">
          <Menu
            mode="inline"
            selectedKeys={[activeTab]}
            items={menuItems}
            onClick={({ key }) => setActiveTab(key as TabKey)}
          />
        </Sider>

        <Content className="settings-content">
          <Form
            form={form}
            layout="vertical"
            initialValues={{
              username: "campusflow_user",
              nickname: "CampusFlow 用户",
              email: "user@example.com",
              pageSize: 10,
              defaultView: "table",
            }}
          >
            {activeTab === "profile" && (
              <Card
                title="个人信息"
                extra={<Text type="secondary">基础资料设置</Text>}
              >
                <div className="profile-row">
                  <Avatar
                    size={80}
                    icon={<UserOutlined />}
                    style={{ backgroundColor: themeColor }}
                  />

                  <div className="profile-info">
                    <Space>
                      <Upload showUploadList={false} beforeUpload={() => false}>
                        <Button icon={<UploadOutlined />}>更换头像</Button>
                      </Upload>
                    </Space>

                    <Text type="secondary">
                      支持 JPG、PNG 格式，文件大小不超过 2MB
                    </Text>
                  </div>
                </div>

                <Row gutter={20}>
                  <Col xs={24} md={12}>
                    <Form.Item label="用户名" name="username">
                      <Input disabled />
                    </Form.Item>
                  </Col>

                  <Col xs={24} md={12}>
                    <Form.Item
                      label="昵称"
                      name="nickname"
                      rules={[
                        { required: true, message: "请输入昵称" },
                        { max: 20, message: "昵称不能超过 20 个字符" },
                      ]}
                    >
                      <Input placeholder="请输入昵称" maxLength={20} />
                    </Form.Item>
                  </Col>

                  <Col xs={24} md={12}>
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
                  </Col>
                </Row>
                <div className="card-actions">
                  <Button type="primary" onClick={handleSaveProfile}>
                    保存修改
                  </Button>
                </div>
              </Card>
            )}

            {activeTab === "appearance" && (
              <Card
                title="外观设置"
                extra={<Text type="secondary">点击后立即生效</Text>}
              >
                <div className="section-block">
                  <Text strong>主题模式</Text>

                  <Radio.Group
                    className="theme-mode-group"
                    value={themeMode}
                    onChange={(e) => setThemeMode(e.target.value)}
                  >
                    <Radio.Button value="light">
                      <div className="theme-card">
                        <div className="theme-preview light" />
                        <span>浅色模式</span>
                      </div>
                    </Radio.Button>

                    <Radio.Button value="dark">
                      <div className="theme-card">
                        <div className="theme-preview dark" />
                        <span>深色模式</span>
                      </div>
                    </Radio.Button>

                    <Radio.Button value="system">
                      <div className="theme-card">
                        <div className="theme-preview system" />
                        <span>跟随系统</span>
                      </div>
                    </Radio.Button>
                  </Radio.Group>
                </div>

                <div className="section-block">
                  <Text strong>主题色</Text>

                  <div className="color-row">
                    <ColorPicker
                      value={themeColor}
                      showText
                      presets={[
                        {
                          label: "推荐颜色",
                          colors: themeColors,
                        },
                      ]}
                      onChange={(color) => setThemeColor(color.toHexString())}
                    />

                    <div className="color-options">
                      {themeColors.map((color) => (
                        <button
                          key={color}
                          type="button"
                          className={`color-item ${
                            themeColor === color ? "active" : ""
                          }`}
                          aria-label={`选择主题色 ${color}`}
                          title={color}
                          style={{ backgroundColor: color }}
                          onClick={() => setThemeColor(color)}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              </Card>
            )}

            {activeTab === "preferences" && (
              <Card
                title="偏好设置"
                extra={<Text type="secondary">工作台默认展示方式</Text>}
              >
                <Row gutter={20}>
                  <Col xs={24} md={12}>
                    <Form.Item label="默认每页显示条数" name="pageSize">
                      <Select
                        options={[
                          { label: "5 条/页", value: 5 },
                          { label: "10 条/页", value: 10 },
                          { label: "20 条/页", value: 20 },
                          { label: "50 条/页", value: 50 },
                        ]}
                      />
                    </Form.Item>
                  </Col>

                  <Col xs={24} md={12}>
                    <Form.Item label="默认项目视图" name="defaultView">
                      <Select
                        options={[
                          { label: "表格视图", value: "table" },
                          { label: "看板视图", value: "kanban" },
                        ]}
                      />
                    </Form.Item>
                  </Col>
                </Row>

                <div className="card-actions">
                  <Button type="primary" onClick={handleSavePreferences}>
                    保存设置
                  </Button>
                </div>
              </Card>
            )}
          </Form>
        </Content>
      </Layout>
    </div>
  );
}
