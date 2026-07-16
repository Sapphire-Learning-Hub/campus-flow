import { Suspense, lazy } from "react";
import { createBrowserRouter, Navigate } from "react-router";
import { RouterProvider } from "react-router/dom";
import AppLayout from "@/layouts/AppLayout";

// ---------- 1. 懒加载所有页面组件 ----------
const LoginPage = lazy(() => import("@/pages/Login/Login"));
const RegisterPage = lazy(() => import("@/pages/Register/Register.tsx"));
const DashboardPage = lazy(() => import("@/pages/Dashboard/Dashboard"));
const ProjectsPage = lazy(() => import("@/pages/Projects/Project.tsx"));
const ProjectDetailPage = lazy(
  () => import("@/pages/Projects/ProjectDetail.tsx"),
);
const TasksPage = lazy(() => import("@/pages/Tasks/Tasks"));
const MembersPage = lazy(() => import("@/pages/Members/Members.tsx"));
const SettingsPage = lazy(() => import("@/pages/Settings/Setting.tsx"));
const ErrorPage = lazy(() => import("@/pages/Error/Error"));

// ---------- 2. 统一懒加载包装（消除重复代码） ----------
const withLazy = (Component: React.LazyExoticComponent<React.FC>) => (
  <Suspense fallback={<div>Loading...</div>}>
    <Component />
  </Suspense>
);

// ---------- 3. 创建路由实例 ----------
const router = createBrowserRouter([
  // 无公共布局的页面：登录、注册
  {
    path: "/login",
    element: withLazy(LoginPage),
  },
  {
    path: "/register",
    element: withLazy(RegisterPage),
  },

  // 有公共布局的业务页面：统一嵌套 AppLayout
  {
    path: "/",
    element: <AppLayout />,
    children: [
      // 根路径默认重定向到工作台
      {
        index: true,
        element: <Navigate to="/dashboard" replace />,
      },
      {
        path: "dashboard",
        element: withLazy(DashboardPage),
      },
      {
        path: "projects",
        element: withLazy(ProjectsPage),
      },
      {
        path: "projects/:projectId",
        element: withLazy(ProjectDetailPage),
      },
      {
        path: "tasks",
        element: withLazy(TasksPage),
      },
      {
        path: "members",
        element: withLazy(MembersPage),
      },
      {
        path: "settings",
        element: withLazy(SettingsPage),
      },
    ],
  },

  // 全局 404 页面
  {
    path: "*",
    element: withLazy(ErrorPage),
  },
]);

// ---------- 4. 导出路由提供者 ----------
export function AppRoutes() {
  return <RouterProvider router={router} />;
}
