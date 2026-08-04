import {
  DashboardOutlined,
  FolderOpenOutlined,
  LogoutOutlined,
  MenuFoldOutlined,
  MenuOutlined,
  MenuUnfoldOutlined,
  MoonOutlined,
  PlusOutlined,
  SearchOutlined,
  SettingOutlined,
  SunOutlined,
  TeamOutlined,
  UnorderedListOutlined,
  UserOutlined,
} from "@ant-design/icons";
import {
  Avatar,
  Breadcrumb,
  Button,
  Drawer,
  Input,
  Layout,
  Menu,
  Space,
  Tooltip,
  type MenuProps,
  Switch,
  Flex,
  AutoComplete,
} from "antd";
import {
  useEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
import { useTranslation } from "react-i18next";
import {
  Outlet,
  useLocation,
  useNavigate,
  useRouteLoaderData,
} from "react-router";
import { BrandMark } from "@/components/common/BrandMark";
import LanguageSwitcher from "@/components/common/LanguageSwitcher";
import { getCurrentUser, logout } from "@/services/auth";
import { clearAccessToken } from "@/services/session";
import "./AppLayout.css";
import type { AuthUser } from "@/types/user.ts";
import type { AppLayoutContext } from "@/hooks/useCurrentUser";
import { useSettings } from "@/hooks/useSettings.ts";
import { listMembers } from "@/services/members.ts";
import { listTasks } from "@/services/tasks.ts";
import { listProjects } from "@/services/projects.ts";
const { Header, Sider, Content } = Layout;
const MOBILE_LAYOUT_QUERY = "(max-width: 768px)";

function subscribeToMobileLayout(onStoreChange: () => void) {
  const mediaQuery = window.matchMedia(MOBILE_LAYOUT_QUERY);
  mediaQuery.addEventListener("change", onStoreChange);
  return () => mediaQuery.removeEventListener("change", onStoreChange);
}

function getMobileLayoutSnapshot() {
  return window.matchMedia(MOBILE_LAYOUT_QUERY).matches;
}

function getServerMobileLayoutSnapshot() {
  return false;
}

function CurrentUserAvatar({
  user,
  large = false,
}: {
  user: AuthUser;
  large?: boolean;
}) {
  const initial = user.name.trim().slice(0, 1).toUpperCase() || "?";

  return (
    <Avatar
      shape="circle"
      size={large ? 64 : "default"}
      src={user.avatar}
      style={{ background: "#0f141d" }}
    >
      {initial}
    </Avatar>
  );
}
type GlobalSearchItem = {
  key: string;
  type: "project" | "task" | "member";
  id: string;
  title: string;
  description?: string;
  path: string;
};
export function AppLayout() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const loaderUser = useRouteLoaderData<AuthUser>("authenticated-app");
  const [recoveredUser, setRecoveredUser] = useState<AuthUser>();
  const recoveryRequestRef = useRef<Promise<AuthUser> | null>(null);
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const { settings, updateSettings } = useSettings();
  const [keyword, setKeyword] = useState("");
  const [searchItems, setSearchItems] = useState<GlobalSearchItem[]>([]);
  const [searching, setSearching] = useState(false);
  const requestRef = useRef(0);
  const rootPath = `/${location.pathname.split("/").filter(Boolean)[0] ?? "dashboard"}`;
  const isMobile = useSyncExternalStore(
    subscribeToMobileLayout,
    getMobileLayoutSnapshot,
    getServerMobileLayoutSnapshot,
  );
  async function searchGlobal(keyword: string) {
    const query = keyword.trim();
    if (!query) return [];
    const [projectResult, taskResult, members] = await Promise.all([
      listProjects({
        keyword: query,
        page: 1,
        pageSize: 5,
      }),
      listTasks({
        keyword: query,
        page: 1,
        pageSize: 5,
      }),
      listMembers(),
    ]);

    const normalizedQuery = query.toLowerCase();

    const projectItems = projectResult.items.map((project) => ({
      key: `project:${project.id}`,
      type: "project" as const,
      id: project.id,
      title: project.name,
      description: project.description,
      path: `/projects/${project.id}`,
    }));

    const taskItems = taskResult.items.map((task) => ({
      key: `task:${task.id}`,
      type: "task" as const,
      id: task.id,
      title: task.title,
      description: task.description,
      path: `/tasks?keyword=${encodeURIComponent(task.title)}`,
    }));

    const memberItems = members
      .filter((member) =>
        `${member.name} ${member.email} ${member.department}`
          .toLowerCase()
          .includes(normalizedQuery),
      )
      .slice(0, 5)
      .map((member) => ({
        key: `member:${member.id}`,
        type: "member" as const,
        id: member.id,
        title: member.name,
        description: `${member.email} · ${member.department}`,
        path: `/members?keyword=${encodeURIComponent(member.name)}`,
      }));

    return [...projectItems, ...taskItems, ...memberItems];
  }
  useEffect(() => {
    requestRef.current += 1;
    const request = requestRef.current;
    const query = keyword.trim();
    if (!query) {
      return;
    }
    let active = true;
    const timer = window.setTimeout(() => {
      setSearching(true);
      void searchGlobal(query)
        .then((items) => {
          if (active && request === requestRef.current) setSearchItems(items);
        })
        .catch((error: unknown) => {
          if (active && request === requestRef.current) {
            console.error("全局搜索失败：", error);
            setSearchItems([]);
          }
        })
        .finally(() => {
          if (active && request === requestRef.current) setSearching(false);
        });
    }, 250);
    return () => {
      active = false;
      window.clearTimeout(timer);
    };
  }, [keyword]);
  const isLight = settings.themeMode === "light";
  const navItems = useMemo<MenuProps["items"]>(
    () => [
      {
        key: "/dashboard",
        icon: <DashboardOutlined />,
        label: t("navigation.dashboard"),
      },
      {
        key: "/projects",
        icon: <FolderOpenOutlined />,
        label: t("navigation.projects"),
      },
      {
        key: "/tasks",
        icon: <UnorderedListOutlined />,
        label: t("navigation.tasks"),
      },
      {
        key: "/members",
        icon: <TeamOutlined />,
        label: t("navigation.members"),
      },
      { type: "divider" },
      {
        key: "/settings",
        icon: <SettingOutlined />,
        label: t("navigation.settings"),
      },
    ],
    [t],
  );
  const breadcrumbItems = useMemo(() => {
    const parts = location.pathname.split("/").filter(Boolean);
    const routeLabels: Record<string, string> = {
      dashboard: t("navigation.dashboard"),
      projects: t("navigation.projects"),
      tasks: t("navigation.tasks"),
      members: t("navigation.members"),
      settings: t("navigation.settings"),
    };
    const items = [{ title: "CampusFlow" }];
    if (parts[0]) {
      items.push({ title: routeLabels[parts[0]] ?? t("navigation.page") });
    }
    if (parts[0] === "projects" && parts[1]) {
      items.push({ title: t("navigation.projectDetail") });
    }
    return items;
  }, [location.pathname, t]);

  useEffect(() => {
    if (loaderUser || recoveredUser) return;

    let active = true;
    const request = recoveryRequestRef.current ?? getCurrentUser();
    recoveryRequestRef.current = request;

    void request
      .then((currentUser) => {
        if (active) setRecoveredUser(currentUser);
      })
      .catch(() => {
        recoveryRequestRef.current = null;
        if (!active) return;

        clearAccessToken();
        const returnTo = `${location.pathname}${location.search}${location.hash}`;
        navigate(`/login?redirectTo=${encodeURIComponent(returnTo)}`, {
          replace: true,
        });
      });

    return () => {
      active = false;
    };
  }, [
    loaderUser,
    location.hash,
    location.pathname,
    location.search,
    navigate,
    recoveredUser,
  ]);

  const user = loaderUser ?? recoveredUser;

  if (!user) {
    return <div className="app-loading">{t("loading.user")}</div>;
  }
  const outletContext: AppLayoutContext = {
    user,
  };
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
        <CurrentUserAvatar user={user} />
        <span className="user-trigger-text">
          <b>{user.name}</b>
          <small>@{user.username}</small>
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
              aria-label={t("navigation.toggle")}
            />
            <Breadcrumb className="header-breadcrumb" items={breadcrumbItems} />
          </Space>
          <div className="header-actions">
            <AutoComplete
              className="global-search-autocomplete"
              value={keyword}
              style={{ width: 380 }}
              options={searchItems.map((item) => ({
                value: item.key,
                label: (
                  <div>
                    <strong>{item.title}</strong>
                    <div>{item.description}</div>
                  </div>
                ),
              }))}
              onChange={setKeyword}
              onSelect={(value) => {
                const selected = searchItems.find((item) => item.key === value);
                if (!selected) return;
                setKeyword("");
                setSearchItems([]);
                navigate(selected.path);
              }}
              allowClear
              notFoundContent={searching ? "正在搜索..." : "没有匹配结果"}
            >
              <Input
                className="global-search-input"
                prefix={<SearchOutlined />}
                placeholder={t("header.searchPlaceholder")}
                aria-label={t("header.globalSearch")}
              />
            </AutoComplete>

            <Tooltip title={t("header.quickCreate")}>
              <Button
                className="header-icon-btn header-create-btn"
                type="text"
                icon={<PlusOutlined />}
                aria-label={t("header.quickCreate")}
                onClick={() => navigate("/tasks?create=1")}
              />
            </Tooltip>

            <Switch
              checked={isLight}
              checkedChildren={
                <Flex gap={4} justify="flex-start" align="center">
                  <SunOutlined />
                </Flex>
              }
              unCheckedChildren={
                <Flex gap={4} justify="flex-start" align="center">
                  <MoonOutlined />
                </Flex>
              }
              aria-label={t("header.themeToggle")}
              onClick={(checked) => {
                updateSettings({
                  themeMode: checked ? "light" : "dark",
                });
              }}
            />
            <LanguageSwitcher />

            <button
              className="user-trigger"
              type="button"
              aria-label={t("profile.open")}
              onClick={() => setProfileOpen(true)}
            >
              <CurrentUserAvatar user={user} />
              <span className="user-trigger-text">
                <b>{user.name}</b>
                <small>{user.email}</small>
              </span>
            </button>
          </div>
        </Header>
        <Drawer
          className="profile-drawer"
          title={t("profile.title")}
          placement="right"
          size={360}
          open={profileOpen}
          onClose={() => setProfileOpen(false)}
        >
          <section className="profile-card">
            <CurrentUserAvatar user={user} large />
            <div>
              <h2>{user.name}</h2>
              <p>{user.email}</p>
              <span>@{user.username}</span>
            </div>
          </section>
          <section
            className="profile-stat-grid"
            aria-label={t("profile.accountInformation")}
          >
            <article>
              <strong>{user.username}</strong>
              <span>{t("profile.username")}</span>
            </article>
            <article>
              <strong>{user.department}</strong>
              <span>{t("profile.department")}</span>
            </article>
            <article>
              <strong>{t("profile.signedIn")}</strong>
              <span>{t("profile.accountStatus")}</span>
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
              <span>{t("profile.settings")}</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setProfileOpen(false);
                navigate("/tasks");
              }}
            >
              <UnorderedListOutlined />
              <span>{t("profile.myTasks")}</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setProfileOpen(false);
                navigate("/projects");
              }}
            >
              <FolderOpenOutlined />
              <span>{t("profile.projects")}</span>
            </button>
            <button
              className="danger"
              type="button"
              onClick={() => void handleSignOut()}
            >
              <LogoutOutlined />
              <span>{t("profile.signOut")}</span>
            </button>
          </div>
        </Drawer>
        <Content className="app-content">
          <Outlet context={outletContext} />
        </Content>
      </Layout>
    </Layout>
  );
}

export default AppLayout;
