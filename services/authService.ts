import { api } from "@/lib/api";
import type {
  LoginCredentials,
  AuthResponse,
  AuthTokens,
} from "@/types";

export const authService = {
  login: async (credentials: LoginCredentials): Promise<AuthResponse> => {
    const endpoint =
      credentials.role === "admin"
        ? "/auth/admin/login"
        : "/auth/employee/login";

    const body =
      credentials.role === "admin"
        ? { email: credentials.identifier, password: credentials.password }
        : { employee_id: credentials.identifier, password: credentials.password };

    const res = await api.post<AuthResponse>(endpoint, body);
    return res.data;
  },

  refresh: async (refreshToken: string): Promise<AuthTokens> => {
    const res = await api.post<AuthTokens>("/auth/refresh", { refreshToken });
    return res.data;
  },

  logout: async (): Promise<void> => {
    await api.post("/auth/logout");
  },

  resetPassword: async (
    employeeId: string,
    newPassword: string
  ): Promise<void> => {
    await api.post(`/employees/${employeeId}/reset-password`, {
      newPassword,
    });
  },
};
