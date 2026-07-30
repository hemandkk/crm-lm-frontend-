"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Sidebar from "./Sidebar";
import Topbar from "./Topbar";
import { useAuthStore } from "@/store/authStore";
import { useHydrateAuthOrgScope } from "@/hooks/useHydrateAuthOrgScope";
import { Spinner } from "@/components/ui";
import { homePathForRole } from "@/lib/roles";
import type { UserRole } from "@/types";

interface AppShellProps {
  children: React.ReactNode;
  title: string;
  /** Single role or any of these roles may access the page */
  requiredRole: UserRole | UserRole[];
  topbarActions?: React.ReactNode;
}

export default function AppShell({
  children,
  title,
  requiredRole,
  topbarActions,
}: AppShellProps) {
  const router = useRouter();
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const { isAuthenticated, role, hydrated } = useAuthStore();
  useHydrateAuthOrgScope();

  const allowedRoles = useMemo(
    () => (Array.isArray(requiredRole) ? requiredRole : [requiredRole]),
    [requiredRole],
  );
  const isAllowed = !!role && allowedRoles.includes(role);

  useEffect(() => {
    if (!hydrated) return;

    if (!isAuthenticated) {
      router.replace("/auth/login");
      return;
    }

    if (role && !allowedRoles.includes(role)) {
      router.replace(homePathForRole(role));
    }
  }, [hydrated, isAuthenticated, role, allowedRoles, router]);

  useEffect(() => {
    const onResize = () => {
      if (window.innerWidth >= 1024) setMobileNavOpen(false);
    };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  useEffect(() => {
    if (!mobileNavOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [mobileNavOpen]);

  if (!hydrated) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Spinner size={28} />
      </div>
    );
  }

  if (!isAuthenticated || !isAllowed) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Spinner size={28} />
      </div>
    );
  }

  return (
    <div className="flex h-dvh overflow-hidden bg-gray-50 dark:bg-gray-950">
      <Sidebar
        mobileOpen={mobileNavOpen}
        onClose={() => setMobileNavOpen(false)}
      />
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        <Topbar
          title={title}
          actions={topbarActions}
          onMenuClick={() => setMobileNavOpen(true)}
        />
        <main className="flex-1 overflow-y-auto overflow-x-hidden p-3 sm:p-4 lg:p-6">
          <div className="mx-auto w-full max-w-[1400px]">{children}</div>
        </main>
      </div>
    </div>
  );
}
