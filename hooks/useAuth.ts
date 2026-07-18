import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { authService } from "@/services/authService";
import { useAuthStore } from "@/store/authStore";
import { extractApiError, pickTokens } from "@/lib/api";
import { homePathForRole, normalizeRole } from "@/lib/roles";
import type { LoginCredentials, UserRole } from "@/types";

export function useAuth() {
  const router = useRouter();
  const qc = useQueryClient();
  const { user, role, isAuthenticated, setAuth, clearAuth } = useAuthStore();

  // ─── Login ──────────────────────────────────────────────────────────────
  const loginMutation = useMutation({
    mutationFn: (credentials: LoginCredentials) =>
      authService.login(credentials),
    onSuccess: (data) => {
      const user = {
        id: data.user.id,
        name: data.user.name ?? data.user.email ?? "User",
        email: data.user.email,
        employeeId: data.user.employee_id,
        role: data.user.role,
      };
      const tokens = pickTokens(data as unknown as Record<string, unknown>);
      const access = tokens.accessToken ?? data.access_token;
      const refresh = tokens.refreshToken ?? data.refresh_token;
      if (!access || !refresh) {
        toast.error("Login response missing tokens");
        return;
      }
      const normalizedRole = normalizeRole(data.user.role) ?? "employee";
      setAuth(
        { ...user, role: normalizedRole as UserRole },
        access,
        refresh,
      );
      toast.success(`Welcome back, ${data.user.name}!`);
      router.replace(homePathForRole(normalizedRole));
    },
    onError: (error) => {
      toast.error(extractApiError(error));
    },
  });

  // ─── Logout ─────────────────────────────────────────────────────────────
  const logoutMutation = useMutation({
    mutationFn: () => authService.logout(),
    onSettled: () => {
      clearAuth();
      qc.clear();
      router.replace("/auth/login");
    },
  });

  // ─── Reset password (admin action) ──────────────────────────────────────
  const resetPasswordMutation = useMutation({
    mutationFn: ({
      employeeId,
      newPassword,
    }: {
      employeeId: string;
      newPassword: string;
    }) => authService.resetPassword(employeeId, newPassword),
    onSuccess: () => toast.success("Password reset successfully"),
    onError: (error) => toast.error(extractApiError(error)),
  });

  return {
    user,
    role,
    isAuthenticated,
    isAdmin: role === "admin",
    isEmployee: role === "employee",
    isAccountant: role === "accountant",
    isProcessingTeam: role === "processing_team",

    login: loginMutation.mutate,
    isLoggingIn: loginMutation.isPending,
    loginError: loginMutation.error,

    logout: logoutMutation.mutate,
    isLoggingOut: logoutMutation.isPending,

    resetPassword: resetPasswordMutation.mutate,
    isResettingPassword: resetPasswordMutation.isPending,
  };
}
