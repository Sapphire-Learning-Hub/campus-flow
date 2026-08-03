import React, { Suspense, lazy } from "react";
import { useTranslation } from "react-i18next";
import { createBrowserRouter, Navigate } from "react-router";
import { RouterProvider } from "react-router/dom";
import AppLayout from "@/layouts/AppLayout";
import { ProtectedRouter } from "@/routes/ProtectedRouter";
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
function LazyRoute({
  Component,
}: {
  Component: React.LazyExoticComponent<React.FC>;
}) {
  const { t } = useTranslation();

  return (
    <Suspense fallback={<div>{t("loading.page")}</div>}>
      <Component />
    </Suspense>
  );
}

const withLazy = (Component: React.LazyExoticComponent<React.FC>) => (
  <LazyRoute Component={Component} />
);

// ---------- 3. 创建路由实例 ----------
const router = createBrowserRouter([
  {
    path: "/login",
    element: withLazy(LoginPage),
  },
  {
    path: "/register",
    element: withLazy(RegisterPage),
  },
  {
    id: "authenticated-app",
    path: "/",
    loader: ProtectedRouter,
    element: <AppLayout />,
    children: [
      { index: true, element: <Navigate to="/dashboard" replace /> },
      { path: "dashboard", element: withLazy(DashboardPage) },
      { path: "projects", element: withLazy(ProjectsPage) },
      { path: "projects/:projectId", element: withLazy(ProjectDetailPage) },
      { path: "tasks", element: withLazy(TasksPage) },
      { path: "members", element: withLazy(MembersPage) },
      { path: "settings", element: withLazy(SettingsPage) },
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
