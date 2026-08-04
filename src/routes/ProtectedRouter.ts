import axios from "axios";
import { redirect, type LoaderFunctionArgs } from "react-router";
import { getCurrentUser } from "@/services/auth";
import { clearAccessToken, getAccessToken } from "@/services/session";
import { toRouteError } from "@/routes/RouterError.ts";

function loginUrl(request: Request) {
  const url = new URL(request.url);
  const returnTo = `${url.pathname}${url.search}${url.hash}`;
  return `/login?redirectTo=${encodeURIComponent(returnTo)}`;
}

export async function ProtectedRouter({ request }: LoaderFunctionArgs) {
  if (!getAccessToken()) {
    throw redirect(loginUrl(request));
  }

  try {
    return await getCurrentUser();
  } catch (error) {
    if (axios.isAxiosError(error) && error.response?.status === 401) {
      clearAccessToken();
      throw redirect(loginUrl(request));
    }

    throw toRouteError(error); // 网络或服务端异常应交给 errorElement 处理
  }
}
