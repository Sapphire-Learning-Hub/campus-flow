import {
  BellOutlined,
  DashboardOutlined,
  FolderOpenOutlined,
  LogoutOutlined,
  MenuFoldOutlined,
  MenuOutlined,
  MenuUnfoldOutlined,
  PlusOutlined,
  SearchOutlined,
  SettingOutlined,
  TeamOutlined,
  UnorderedListOutlined,
  UserOutlined,
} from "@ant-design/icons";
import {
  Avatar,
  Badge,
  Breadcrumb,
  Button,
  Drawer,
  Input,
  Layout,
  Menu,
  Space,
  Tooltip,
  type MenuProps,
} from "antd";
import { useMemo, useState } from "react";
import { Outlet, useLocation, useNavigate } from "react-router";
import { BrandMark } from "@/components/common/BrandMark";
import { MemberAvatar } from "@/components/common/MemberAvatar.tsx";
import { logout } from "@/services/auth";
import "./AppLayout.css";

const { Header, Sider, Content } = Layout;

const navItems: MenuProps["items"] = [
  { key: "/dashboard", icon: <DashboardOutlined />, label: "工作台" },
  { key: "/projects", icon: <FolderOpenOutlined />, label: "项目空间" },
  { key: "/tasks", icon: <UnorderedListOutlined />, label: "工作项" },
  { key: "/members", icon: <TeamOutlined />, label: "成员" },
  { type: "divider" },
  { key: "/settings", icon: <SettingOutlined />, label: "个人设置" },
];

const routeLabels: Record<string, string> = {
  dashboard: "工作台",
  projects: "项目空间",
  tasks: "工作项",
  members: "成员",
  settings: "个人设置",
};

export function AppLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);

  const rootPath = `/${location.pathname.split("/").filter(Boolean)[0] ?? "dashboard"}`;
  const isMobile: boolean = false;
  const breadcrumbItems = useMemo(() => {
    const parts = location.pathname.split("/").filter(Boolean);
    const items = [{ title: "CampusFlow" }];
    if (parts[0]) items.push({ title: routeLabels[parts[0]] ?? "页面" });
    if (parts[0] === "projects" && parts[1]) items.push({ title: "项目详情" });
    return items;
  }, [location.pathname]);

  const handleSignOut = async () => {
    try {
      await logout();
    } finally {
      setProfileOpen(false);
      navigate("/login", { replace: true });
    }
  };

  const navigation = (
    <>
      <div className="sider-brand">
        <BrandMark compact={!isMobile && collapsed} />
      </div>
      <Menu
        className="main-nav"
        mode="inline"
        selectedKeys={[rootPath]}
        items={navItems}
        onClick={({ key }) => {
          navigate(key);
          setMobileOpen(false);
        }}
      />
      <div className="sider-line"></div>
      <div className="sider-footnote">
        <MemberAvatar />
        <span className="user-trigger-text">
          <b>{"张三"}</b>
          <small>{"管理员"}</small>
        </span>
      </div>
    </>
  );

  return (
    <Layout className="app-shell" hasSider={!isMobile}>
      {isMobile ? (
        <Drawer
          placement="left"
          size={250}
          open={mobileOpen}
          onClose={() => setMobileOpen(false)}
          styles={{ body: { padding: 0 } }}
        >
          <aside className="mobile-sider">{navigation}</aside>
        </Drawer>
      ) : (
        <Sider
          className="app-sider"
          width={232}
          collapsedWidth={80}
          collapsed={collapsed}
          trigger={null}
        >
          {navigation}
        </Sider>
      )}

      <Layout>
        <Header className="app-header">
          <Space size={10}>
            <Button
              className="header-icon-btn"
              type="text"
              icon={
                isMobile ? (
                  <MenuOutlined />
                ) : collapsed ? (
                  <MenuUnfoldOutlined />
                ) : (
                  <MenuFoldOutlined />
                )
              }
              onClick={() =>
                isMobile ? setMobileOpen(true) : setCollapsed((value) => !value)
              }
              aria-label="切换导航"
            />
            <Breadcrumb className="header-breadcrumb" items={breadcrumbItems} />
          </Space>
          <div className="header-actions">
            <Input
              className="global-search"
              prefix={<SearchOutlined />}
              suffix={<span className="search-shortcut">Ctrl K</span>}
              placeholder="搜索项目空间、工作项或成员"
              aria-label="全局搜索"
            />
            <Tooltip title="快速新建">
              <Button
                className="header-icon-btn header-create-btn"
                type="text"
                icon={<PlusOutlined />}
                aria-label="快速新建"
                onClick={() => navigate("/tasks?create=1")}
              />
            </Tooltip>
            <Tooltip title="通知中心">
              <Badge dot offset={[-5, 6]}>
                <Button
                  className="header-icon-btn"
                  type="text"
                  icon={<BellOutlined />}
                  aria-label="通知中心"
                />
              </Badge>
            </Tooltip>
            <button
              className="user-trigger"
              type="button"
              aria-label="打开个人侧栏"
              onClick={() => setProfileOpen(true)}
            >
              <Avatar
                shape="circle"
                src={"@/assets/hero.png"}
                style={{ background: "#0f141d" }}
              ></Avatar>
              <span className="user-trigger-text">
                <b>{"张三"}</b>
                <small>{"111@email.com"}</small>
              </span>
            </button>
          </div>
        </Header>
        <Drawer
          className="profile-drawer"
          title="个人中心"
          placement="right"
          size={360}
          open={profileOpen}
          onClose={() => setProfileOpen(false)}
        >
          <section className="profile-card">
            <Avatar
              shape="circle"
              size={64}
              src={"@/assets/hero.png"}
              style={{ background: "#0f141d" }}
            ></Avatar>
            <div>
              <h2>{"李四"}</h2>
              <p>{"111@Email.com"}</p>
              <span>{"CampusFlow 成员"}</span>
            </div>
          </section>
          <section className="profile-stat-grid" aria-label="个人协作概览">
            <article>
              <strong>{3}</strong>
              <span>参与空间</span>
            </article>
            <article>
              <strong>{2}</strong>
              <span>待办工作项</span>
            </article>
            <article>
              <strong>{1}</strong>
              <span>待审核</span>
            </article>
          </section>
          <div className="profile-action-list">
            <button
              type="button"
              onClick={() => {
                setProfileOpen(false);
                navigate("/settings");
              }}
            >
              <UserOutlined />
              <span>个人设置</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setProfileOpen(false);
                navigate("/tasks");
              }}
            >
              <UnorderedListOutlined />
              <span>我的工作项</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setProfileOpen(false);
                navigate("/projects");
              }}
            >
              <FolderOpenOutlined />
              <span>项目空间</span>
            </button>
            <button
              className="danger"
              type="button"
              onClick={() => void handleSignOut()}
            >
              <LogoutOutlined />
              <span>退出登录</span>
            </button>
          </div>
        </Drawer>
        <Content className="app-content">
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  );
}

export default AppLayout;
