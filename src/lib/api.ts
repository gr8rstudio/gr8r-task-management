import axios, { type AxiosError, type InternalAxiosRequestConfig } from "axios";
import { clearAuthCookies, getAccessToken, getRefreshToken, setAccessTokenCookie } from "@/lib/auth-cookies";
import type { ApiResponse } from "@/types/auth";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: { "Content-Type": "application/json" },
});

api.interceptors.request.use((config) => {
  const accessToken = getAccessToken();
  if (accessToken) config.headers.Authorization = `Bearer ${accessToken}`;
  config.headers["x-device-type"] = "web";
  return config;
});

type RetryConfig = InternalAxiosRequestConfig & { _retry?: boolean };

let refreshPromise: Promise<string | null> | null = null;

async function refreshAccessToken() {
  const refreshToken = getRefreshToken();
  if (!refreshToken) return null;
  try {
    const response = await axios.post<ApiResponse<{ access_token: string }>>(
      `${API_BASE_URL}/auth/refresh`,
      { refreshToken },
    );
    const next = response.data.data.access_token;
    setAccessTokenCookie(next);
    return next;
  } catch {
    return null;
  }
}

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const config = error.config as RetryConfig | undefined;
    if (!config || error.response?.status !== 401 || config._retry) {
      return Promise.reject(error);
    }
    config._retry = true;
    refreshPromise ??= refreshAccessToken().finally(() => {
      refreshPromise = null;
    });
    const next = await refreshPromise;
    if (!next) {
      clearAuthCookies();
      if (typeof window !== "undefined" && !window.location.pathname.startsWith("/login")) {
        window.location.assign("/login");
      }
      return Promise.reject(error);
    }
    config.headers.Authorization = `Bearer ${next}`;
    return api(config);
  },
);

export async function unwrap<T>(request: Promise<{ data: ApiResponse<T> | T }>) {
  const response = await request;
  const body = response.data;
  if (body && typeof body === "object" && "data" in body) return body.data;
  return body as T;
}
