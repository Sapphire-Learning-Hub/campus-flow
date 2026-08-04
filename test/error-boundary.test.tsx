import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { createMemoryRouter, data, MemoryRouter } from "react-router";
import { RouterProvider } from "react-router/dom";
import { ErrorBoundary } from "@/pages/Error/ErrorBoundary";
import NotFoundPage from "@/pages/Error/Error";

vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string) => {
      const messages: Record<string, string> = {
        "common.reload": "重新加载",
        "notFound.description": "你访问的页面不存在",
        "notFound.back": "返回工作台",

        "routeError.unauthorized.title": "登录状态已失效",
        "routeError.unauthorized.description": "登录信息已过期，请重新登录后继续访问。",

        "routeError.forbidden.title": "没有访问权限",
        "routeError.forbidden.description": "当前账号无权访问此内容。",

        "routeError.network.title": "网络连接失败",
        "routeError.network.description": "无法连接到服务，请检查网络后重试。",

        "routeError.service.title": "服务暂时不可用",
        "routeError.service.description": "服务器出现异常，请稍后重试。",

        "routeError.actions.login": "重新登录",
        "routeError.actions.back": "返回工作台",
      };

      return messages[key] ?? key;
    },
  }),
}));

function renderLoaderError(error: unknown) {
  const router = createMemoryRouter(
    [
      {
        path: "/",
        loader: () => {
          throw error;
        },
        element: <div>受保护内容</div>,
        errorElement: <ErrorBoundary />,
      },
    ],
    {
      initialEntries: ["/"],
    },
  );

  return render(<RouterProvider router={router} />);
}

describe("受保护路由错误边界", () => {
  it("应显示 401 登录失效页面", async () => {
    renderLoaderError(data({ kind: "unauthorized" }, { status: 401 }));

    expect(await screen.findByText("登录状态已失效")).toBeInTheDocument();

    expect(
      screen.getByRole("button", {
        name: "重新登录",
      }),
    ).toBeInTheDocument();
  });

  it("应显示 403 无权限页面", async () => {
    renderLoaderError(data({ kind: "forbidden" }, { status: 403 }));

    expect(await screen.findByText("没有访问权限")).toBeInTheDocument();

    expect(
      screen.getByRole("button", {
        name: "返回工作台",
      }),
    ).toBeInTheDocument();
  });

  it("应显示网络错误页面", async () => {
    renderLoaderError(data({ kind: "network" }, { status: 503 }));

    expect(await screen.findByText("网络连接失败")).toBeInTheDocument();

    expect(
      screen.getByRole("button", {
        name: "重新加载",
      }),
    ).toBeInTheDocument();
  });

  it("应显示服务异常页面", async () => {
    renderLoaderError(data({ kind: "service" }, { status: 500 }));

    expect(await screen.findByText("服务暂时不可用")).toBeInTheDocument();

    expect(
      screen.getByRole("button", {
        name: "重新加载",
      }),
    ).toBeInTheDocument();
  });
});

describe("404 页面", () => {
  it("应显示独立的 404 页面", () => {
    render(
      <MemoryRouter initialEntries={["/missing-page"]}>
        <NotFoundPage />
      </MemoryRouter>,
    );

    expect(screen.getByText("404")).toBeInTheDocument();
    expect(screen.getByText("你访问的页面不存在")).toBeInTheDocument();
  });
});
