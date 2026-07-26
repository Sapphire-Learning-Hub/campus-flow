export type ThemeMode = "light" | "dark" | "system";
export type ViewMode = "card" | "list";
export type ProjectView = ViewMode;
export type TaskView = ViewMode;
export type PageSize = 5 | 10 | 20 | 50;

export interface SettingsFormValues {
  username: string;
  department: string;
  email: string;
  pageSize: PageSize;
  defaultProjectView: ProjectView;
  defaultTaskView: TaskView;
}

export interface AppSettings {
  themeMode: ThemeMode;
  themeColor: string;
  pageSize: PageSize;
  defaultProjectView: ProjectView;
  defaultTaskView: TaskView;
}
