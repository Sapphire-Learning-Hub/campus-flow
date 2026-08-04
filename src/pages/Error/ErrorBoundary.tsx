import { type ErrorKind, getErrorKind } from "@/routes/RouterError.ts";
import {
  useLocation,
  useNavigate,
  useRevalidator,
  useRouteError,
} from "react-router";
import { useTranslation } from "react-i18next";
import { clearAccessToken } from "@/services/session.ts";
import { Button, Result, Space } from "antd";

interface ErrorCopy {
  status: "403" | "500" | "warning";
  title: string;
  description: string;
}
export function ErrorBoundary() {
  const error = useRouteError();
  const errorKind = getErrorKind(error);
  const { t } = useTranslation();
  const location = useLocation();
  const navigate = useNavigate();
  const revalidator = useRevalidator();
  const copyByKind: Record<ErrorKind, ErrorCopy> = {
    unauthorized: {
      status: "warning",
      title: t("routeError.unauthorized.title"),
      description: t("routeError.unauthorized.description"),
    },
    forbidden: {
      status: "403",
      title: t("routeError.forbidden.title"),
      description: t("routeError.forbidden.description"),
    },
    network: {
      status: "500",
      title: t("routeError.network.title"),
      description: t("routeError.network.description"),
    },
    service: {
      status: "500",
      title: t("routeError.service.title"),
      description: t("routeError.service.description"),
    },
  };
  const copy = copyByKind[errorKind];
  const retryable = errorKind === "network" || errorKind === "service";

  const returnTo = `${location.pathname}${location.search}${location.hash}`;
  function handleLogin() {
    clearAccessToken();
    navigate(`/login?redirectTo=${encodeURIComponent(returnTo)}`, {
      replace: true,
    });
  }
  function handleBackToDashboard() {
    navigate("/dashboard", { replace: true });
  }
  function handleRetry() {
    revalidator.revalidate();
  }

  return (
    <main className="route-error-page" aria-live="assertive">
      <Result
        status={copy.status}
        title={copy.title}
        subTitle={copy.description}
        extra={
          <Space>
            {retryable && (
              <Button
                type="primary"
                loading={revalidator.state === "loading"}
                onClick={handleRetry}
              >
                {t("common.reload")}
              </Button>
            )}

            {errorKind === "unauthorized" ? (
              <Button type="primary" onClick={handleLogin}>
                {t("routeError.actions.login")}
              </Button>
            ) : (
              <Button
                type={retryable ? "default" : "primary"}
                onClick={handleBackToDashboard}
              >
                {t("routeError.actions.back")}
              </Button>
            )}
          </Space>
        }
      />
    </main>
  );
}
