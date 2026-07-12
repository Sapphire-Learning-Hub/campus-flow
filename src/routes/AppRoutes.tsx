import { BrowserRouter, Navigate, Route, Routes } from "react-router";

import LoginPage from "@/pages/auth/LoginPage.tsx";
import RegisterPage from "@/pages/auth/RegisterPage.tsx";
import NotFoundPage from "@/pages/error/NotFoundPage.tsx";
import DashboardPage from "@/pages/dashboard/DashboardPage.tsx";
import ProjectsPage from "@/pages/projects/ProjectsPage.tsx";
import TasksPage from "@/pages/tasks/TasksPage.tsx";
import MembersPage from "@/pages/members/MembersPage.tsx";
import SettingsPage from "@/pages/settings/SettingsPage.tsx";

export function AppRoutes() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />}></Route>
        <Route>
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/projects" element={<ProjectsPage />} />

          <Route path="/tasks" element={<TasksPage />} />
          <Route path="/members" element={<MembersPage />} />
          <Route path="/settings" element={<SettingsPage />} />
        </Route>
        <Route path="*" element={<NotFoundPage />}></Route>
      </Routes>
    </BrowserRouter>
  );
}
