import { Button, Result } from "antd";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router";
import "./index.css";

export default function NotFoundPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  return (
    <main className="not-found-page">
      <Result
        status="404"
        title="404"
        subTitle={t("notFound.description")}
        extra={
          <Button type="primary" onClick={() => navigate("/dashboard")}>
            {t("notFound.back")}
          </Button>
        }
      />
    </main>
  );
}
