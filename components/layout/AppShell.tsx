"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Sidebar from "./Sidebar";
import Topbar from "./Topbar";
import { useAuthStore } from "@/store/authStore";
import { Spinner } from "@/components/ui";
import type { UserRole } from "@/types";

interface AppShellProps {
  children: React.ReactNode;
  title: string;
  requiredRole: UserRole;
  topbarActions?: React.ReactNode;
}

export default function AppShell({
  children,
  title,
  requiredRole,
  topbarActions,
}: AppShellProps) {
  const router = useRouter();
  const { isAuthenticated, role } = useAuthStore();

  useEffect(() => {
    if (!isAuthenticated) {
      router.replace("/auth/login");
      return;
    }
    if (role && role !== requiredRole) {
      // Wrong role — redirect to correct dashboard
      router.replace(
        role === "admin" ? "/admin/dashboard" : "/employee/dashboard",
      );
    }
  }, [isAuthenticated, role, requiredRole, router]);

  if (!isAuthenticated || role !== requiredRole) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Spinner size={28} />
      </div>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50 dark:bg-gray-950">
      <Sidebar />
      <div className="flex flex-col flex-1 overflow-hidden">
        <Topbar title={title} actions={topbarActions} />
        <main className="flex-1 overflow-y-auto p-6">{children}</main>
      </div>
    </div>
  );
}
