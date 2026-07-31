import axios, {
  AxiosInstance,
  AxiosError,
  InternalAxiosRequestConfig,
} from "axios";
import { toTitleCase } from "./utils";

const BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";

// ─── Token helpers (access in memory + sessionStorage; refresh in localStorage) ─
let inMemoryAccessToken: string | null = null;

const ACCESS_KEY = "access_token";
const REFRESH_KEY = "refresh_token";

function readAccessFromStorage(): string | null {
  if (typeof window === "undefined") return null;
  return sessionStorage.getItem(ACCESS_KEY);
}

export const tokenStore = {
  getAccess: (): string | null =>
    inMemoryAccessToken ?? readAccessFromStorage(),
  setAccess: (token: string) => {
    inMemoryAccessToken = token;
    if (typeof window !== "undefined") {
      sessionStorage.setItem(ACCESS_KEY, token);
    }
  },
  clearAccess: () => {
    inMemoryAccessToken = null;
    if (typeof window !== "undefined") {
      sessionStorage.removeItem(ACCESS_KEY);
    }
  },
  getRefresh: (): string | null => {
    if (typeof window === "undefined") return null;
    return localStorage.getItem(REFRESH_KEY);
  },
  setRefresh: (token: string) => {
    if (typeof window !== "undefined") {
      localStorage.setItem(REFRESH_KEY, token);
    }
  },
  clearAll: () => {
    inMemoryAccessToken = null;
    if (typeof window !== "undefined") {
      sessionStorage.removeItem(ACCESS_KEY);
      localStorage.removeItem(REFRESH_KEY);
    }
  },
};

/** Normalize login/refresh payloads (snake_case or camelCase). */
export function pickTokens(data: Record<string, unknown>): {
  accessToken: string | null;
  refreshToken: string | null;
} {
  const accessToken =
    (typeof data.access_token === "string" && data.access_token) ||
    (typeof data.accessToken === "string" && data.accessToken) ||
    null;
  const refreshToken =
    (typeof data.refresh_token === "string" && data.refresh_token) ||
    (typeof data.refreshToken === "string" && data.refreshToken) ||
    null;
  return { accessToken, refreshToken };
}

// ─── Axios instance ───────────────────────────────────────────────────────
export const api: AxiosInstance = axios.create({
  baseURL: BASE_URL,
  headers: { "Content-Type": "application/json" },
  timeout: 30_000,
});

// ─── Request interceptor — attach access token ───────────────────────────
api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = tokenStore.getAccess();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    // Let the browser set multipart boundary when sending FormData
    if (typeof FormData !== "undefined" && config.data instanceof FormData) {
      delete config.headers["Content-Type"];
    }
    return config;
  },
  (error) => Promise.reject(error),
);

// ─── Response interceptor — handle 401 + refresh ─────────────────────────
let isRefreshing = false;
let pendingQueue: Array<{
  resolve: (value: string) => void;
  reject: (error: unknown) => void;
}> = [];

function processPendingQueue(error: unknown, token: string | null) {
  pendingQueue.forEach(({ resolve, reject }) => {
    if (error) reject(error);
    else resolve(token!);
  });
  pendingQueue = [];
}

function isRefreshRequest(config?: InternalAxiosRequestConfig) {
  const url = config?.url ?? "";
  return url.includes("/auth/refresh");
}

export async function refreshAccessToken(): Promise<string> {
  const refreshToken = tokenStore.getRefresh();
  if (!refreshToken) {
    throw new Error("No refresh token");
  }

  // Prefer snake_case (matches login response); include camelCase as fallback
  const res = await axios.post(`${BASE_URL}/auth/refresh`, {
    refresh_token: refreshToken,
  });

  const { accessToken, refreshToken: nextRefresh } = pickTokens(
    res.data as Record<string, unknown>,
  );

  if (!accessToken) {
    throw new Error("Refresh response missing access token");
  }

  tokenStore.setAccess(accessToken);
  if (nextRefresh) tokenStore.setRefresh(nextRefresh);
  return accessToken;
}

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & {
      _retry?: boolean;
    };

    if (
      error.response?.status === 401 &&
      originalRequest &&
      !originalRequest._retry &&
      !isRefreshRequest(originalRequest)
    ) {
      const refreshToken = tokenStore.getRefresh();
      if (!refreshToken) {
        tokenStore.clearAll();
        if (typeof window !== "undefined") window.location.href = "/auth/login";
        return Promise.reject(error);
      }

      if (isRefreshing) {
        return new Promise<string>((resolve, reject) => {
          pendingQueue.push({ resolve, reject });
        }).then((newToken) => {
          originalRequest.headers.Authorization = `Bearer ${newToken}`;
          return api(originalRequest);
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const newToken = await refreshAccessToken();
        processPendingQueue(null, newToken);
        originalRequest.headers.Authorization = `Bearer ${newToken}`;
        return api(originalRequest);
      } catch (refreshError) {
        processPendingQueue(refreshError, null);
        tokenStore.clearAll();
        if (typeof window !== "undefined") window.location.href = "/auth/login";
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  },
);

// ─── Typed API error extractor ────────────────────────────────────────────
export function extractApiError(error: unknown): string {
  if (axios.isAxiosError(error)) {
    const data = error.response?.data;

    if (Array.isArray(data?.detail)) {
      //console.log(data.detail);

      return data.detail
        .map((err: any) => err.msg.replace(/^Value error,\s*/, ""))
        .join("\n");
    }
    // slabs.4.maxLeads: Value error, maxLeads must be >= minLeads
    /* if (Array.isArray(data?.detail)) {
      return data.detail
        .map((err: any) => {
          const field = err.loc?.slice(1).join("-");
          return toTitleCase(`${field}: ${err.msg}`);
        })
        .join("\n");
    } */

    if (typeof data?.detail === "string") {
      return data.detail;
    }

    if (typeof data?.message === "string") {
      return data.message;
    }

    return error.message;
  }
  return "An unexpected error occurred";
}
