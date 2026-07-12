import { Button, Result } from "antd";
import { useNavigate } from "react-router";
import "./index.css";

export default function NotFoundPage() {
  const navigate = useNavigate();
  return (
    <main className="not-found-page">
      <Result
        status="404"
        title="404"
        subTitle="你访问的页面不存在，可能已被移动或删除。"
        extra={
          <Button type="primary" onClick={() => navigate("/dashboard")}>
            返回工作台
          </Button>
        }
      />
    </main>
  );
}
