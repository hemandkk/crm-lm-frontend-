import { api, pickTokens } from "@/lib/api";
import { normalizeAuthUser } from "@/lib/authUser";
import type {
  LoginCredentials,
  AuthResponse,
  AuthTokens,
  AuthUser,
} from "@/types";

export const authService = {
  login: async (credentials: LoginCredentials): Promise<AuthResponse> => {
    const body = {
      username: credentials.identifier,
      password: credentials.password,
    };
    const res = await api.post("/auth/login", body);
    const data = res.data as Record<string, unknown>;
    const tokens = pickTokens(data);
    const user = normalizeAuthUser(data.user ?? data);
    return {
      user,
      access_token:
        (tokens.accessToken as string | undefined) ??
        (data.access_token as string | undefined) ??
        (data.accessToken as string | undefined) ??
        "",
      refresh_token:
        (tokens.refreshToken as string | undefined) ??
        (data.refresh_token as string | undefined) ??
        (data.refreshToken as string | undefined) ??
        "",
    } as AuthResponse;
  },

  /** Current authenticated user (includes stateId / branchIds when supported). */
  me: async (): Promise<AuthUser> => {
    const res = await api.get("/auth/me");
    return normalizeAuthUser(res.data);
  },

  refresh: async (refreshToken: string): Promise<AuthTokens> => {
    const res = await api.post("/auth/refresh", {
      refresh_token: refreshToken,
    });
    const { accessToken, refreshToken: nextRefresh } = pickTokens(
      res.data as Record<string, unknown>,
    );
    if (!accessToken) {
      throw new Error("Refresh response missing access token");
    }
    return {
      accessToken,
      refreshToken: nextRefresh ?? refreshToken,
    };
  },

  logout: async (): Promise<void> => {
    await api.post("/auth/logout");
  },

  resetPassword: async (
    employeeId: string,
    newPassword: string,
  ): Promise<void> => {
    await api.post(`/employees/${employeeId}/reset-password`, {
      newPassword,
    });
  },
};
