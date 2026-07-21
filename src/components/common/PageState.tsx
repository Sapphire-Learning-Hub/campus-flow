import { Alert, Button, Empty, Spin } from "antd";
import type { ReactNode } from "react";

interface PageStateProps {
  loading: boolean;
  error?: string;
  empty: boolean;
  loadingDescription: string;
  errorTitle: string;
  emptyDescription: ReactNode;
  onRetry: () => void | Promise<void>;
  emptyAction?: ReactNode;
  children: ReactNode;
}

export function PageState({
  loading,
  error,
  empty,
  loadingDescription,
  errorTitle,
  emptyDescription,
  onRetry,
  emptyAction,
  children,
}: PageStateProps) {
  if (loading) {
    return (
      <div className="page-state-panel">
        <Spin size="large" description={loadingDescription} />
      </div>
    );
  }

  if (error) {
    return (
      <Alert
        className="page-error-panel"
        type="error"
        showIcon
        title={errorTitle}
        description={error}
        action={
          <Button size="small" onClick={() => void onRetry()}>
            重新加载
          </Button>
        }
      />
    );
  }

  if (empty) {
    return (
      <div className="page-empty-panel">
        <Empty
          image={Empty.PRESENTED_IMAGE_SIMPLE}
          description={emptyDescription}
        >
          {emptyAction}
        </Empty>
      </div>
    );
  }

  return children;
}
