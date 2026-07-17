import axios from "axios";
import { getAccessToken } from "@/services/session";

const http = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || "/api",
  timeout: 5000,
});

http.interceptors.request.use(
  (config) => {
    const token = getAccessToken();
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
  },
  (error: unknown) => Promise.reject(error),
);
http.interceptors.response.use(
  (response) => response,
  (error: unknown) => Promise.reject(error),
);

export { http };
