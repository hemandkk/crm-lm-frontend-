import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { authService } from "@/services/authService";
import { useAuthStore } from "@/store/authStore";
import { extractApiError } from "@/lib/api";
import type { LoginCredentials } from "@/types";

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
        employeeId: data.user.employeeId,
        role: data.user.role,
      };
      setAuth(user, data.accessToken, data.refreshToken);
      //setAuth(data.user, data.accessToken, data.refreshToken);
      toast.success(`Welcome back, ${data.user.name}!`);
      if (data.user.role === "admin") {
        router.replace("/admin/dashboard");
      } else {
        router.replace("/employee/dashboard");
      }
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

    login: loginMutation.mutate,
    isLoggingIn: loginMutation.isPending,
    loginError: loginMutation.error,

    logout: logoutMutation.mutate,
    isLoggingOut: logoutMutation.isPending,

    resetPassword: resetPasswordMutation.mutate,
    isResettingPassword: resetPasswordMutation.isPending,
  };
}
