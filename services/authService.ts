import { api, pickTokens } from "@/lib/api";
import type { LoginCredentials, AuthResponse, AuthTokens } from "@/types";

export const authService = {
  login: async (credentials: LoginCredentials): Promise<AuthResponse> => {
    const body = {
      username: credentials.identifier,
      password: credentials.password,
    };
    const res = await api.post<AuthResponse>("/auth/login", body);
    return res.data;
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
