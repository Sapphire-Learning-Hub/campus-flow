import { App as AntdApp, ConfigProvider } from "antd";
import zhCN from "antd/locale/zh_CN";
import { AppRoutes } from "@/routes/AppRoutes";

export default function App() {
  return (
    <ConfigProvider locale={zhCN}>
      <AntdApp>
        <AppRoutes />
      </AntdApp>
    </ConfigProvider>
  );
}
