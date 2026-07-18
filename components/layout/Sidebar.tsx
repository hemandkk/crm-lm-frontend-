"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  List,
  BarChart2,
  Settings,
  Activity,
  CreditCard,
  Award,
  PlusCircle,
  Building2,
  LogOut,
  ChevronRight,
  X,
} from "lucide-react";
import { cn, getInitials } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";

interface NavItem {
  label: string;
  href: string;
  icon: React.ReactNode;
}

const adminNav: NavItem[] = [
  {
    label: "Dashboard",
    href: "/admin/dashboard",
    icon: <LayoutDashboard size={16} />,
  },
  { label: "Users", href: "/admin/employees", icon: <Users size={16} /> },
  { label: "All Admissions", href: "/admin/leads", icon: <List size={16} /> },
  { label: "Analytics", href: "/admin/reports", icon: <BarChart2 size={16} /> },
  { label: "Masters", href: "/admin/masters", icon: <Settings size={16} /> },
  {
    label: "Activity Log",
    href: "/admin/activity",
    icon: <Activity size={16} />,
  },
];

const employeeNav: NavItem[] = [
  {
    label: "Dashboard",
    href: "/employee/dashboard",
    icon: <LayoutDashboard size={16} />,
  },
  { label: "My Admissions", href: "/employee/leads", icon: <List size={16} /> },
  {
    label: "Add Admission",
    href: "/employee/leads/new",
    icon: <PlusCircle size={16} />,
  },
  {
    label: "Payments",
    href: "/employee/payments",
    icon: <CreditCard size={16} />,
  },
  {
    label: "Incentives",
    href: "/employee/incentives",
    icon: <Award size={16} />,
  },
];

const accountantNav: NavItem[] = [
  {
    label: "Certificate Waiting",
    href: "/accountant/leads",
    icon: <List size={16} />,
  },
];

const processingNav: NavItem[] = [
  {
    label: "Admissions",
    href: "/processing/leads",
    icon: <List size={16} />,
  },
];

function isNavItemActive(pathname: string, href: string, allHrefs: string[]) {
  const isDashboard =
    href === "/admin/dashboard" ||
    href === "/employee/dashboard";

  if (pathname === href) return true;
  if (isDashboard) return false;
  if (!pathname.startsWith(`${href}/`)) return false;

  const hasMoreSpecificMatch = allHrefs.some(
    (other) =>
      other !== href &&
      (other === pathname ||
        pathname.startsWith(`${other}/`) ||
        (other.startsWith(`${href}/`) &&
          (pathname === other || pathname.startsWith(`${other}/`)))),
  );

  return !hasMoreSpecificMatch;
}

interface SidebarProps {
  mobileOpen?: boolean;
  onClose?: () => void;
}

export default function Sidebar({ mobileOpen = false, onClose }: SidebarProps) {
  const pathname = usePathname();
  const { user, role, logout, isLoggingOut } = useAuth();

  const navItems =
    role === "admin"
      ? adminNav
      : role === "accountant"
        ? accountantNav
        : role === "processing_team"
          ? processingNav
          : employeeNav;
  const allHrefs = navItems.map((item) => item.href);
  const sectionLabel =
    role === "admin"
      ? "Admin"
      : role === "accountant"
        ? "Accountant"
        : role === "processing_team"
          ? "Processing"
          : "My workspace";

  const prevPath = useRef(pathname);
  useEffect(() => {
    if (prevPath.current !== pathname) {
      onClose?.();
      prevPath.current = pathname;
    }
  }, [pathname, onClose]);

  const navContent = (
    <>
      <div className="px-4 py-5 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-7 h-7 rounded-lg bg-primary-600 flex items-center justify-center shrink-0">
            <Building2 size={14} className="dark:text-white text-black" />
          </div>
          <span className="font-semibold text-gray-900 dark:text-gray-100 text-sm truncate">
            Sales CRM
          </span>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="lg:hidden p-1.5 rounded-md text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800"
          aria-label="Close menu"
        >
          <X size={18} />
        </button>
      </div>

      <nav className="flex-1 py-3 px-2 overflow-y-auto">
        <p className="px-2 mb-2 text-[10px] font-semibold uppercase tracking-wider text-gray-400">
          {sectionLabel}
        </p>
        <ul className="space-y-0.5">
          {navItems.map((item) => {
            const isActive = isNavItemActive(pathname, item.href, allHrefs);
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  onClick={onClose}
                  className={cn(
                    "flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm transition-colors group",
                    isActive
                      ? "text-white font-medium dark:bg-gray-800 bg-gray-500 dark:text-primary"
                      : "text-gray-600 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-gray-200",
                  )}
                >
                  <span
                    className={cn(
                      isActive
                        ? "text-primary-600"
                        : "text-gray-400 group-hover:text-gray-600",
                    )}
                  >
                    {item.icon}
                  </span>
                  {item.label}
                  {isActive && (
                    <ChevronRight
                      size={12}
                      className="ml-auto text-primary-400"
                    />
                  )}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="p-3 border-t border-gray-100 dark:border-gray-800">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center text-xs font-semibold text-primary-700 dark:text-primary-400 flex-shrink-0">
            {user ? getInitials(user?.name) : "?"}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium text-gray-800 dark:text-gray-200 truncate">
              {user?.name}
            </p>
            <p className="text-[10px] text-gray-400 truncate capitalize">
              {role}
            </p>
          </div>
          <button
            onClick={() => logout()}
            disabled={isLoggingOut}
            title="Logout"
            className="p-1.5 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            <LogOut size={14} />
          </button>
        </div>
      </div>
    </>
  );

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex w-[220px] flex-shrink-0 h-dvh flex-col border-r border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950">
        {navContent}
      </aside>

      {/* Mobile drawer */}
      <div
        className={cn(
          "lg:hidden fixed inset-0 z-50 transition-visibility",
          mobileOpen ? "visible" : "invisible pointer-events-none",
        )}
        aria-hidden={!mobileOpen}
      >
        <button
          type="button"
          className={cn(
            "absolute inset-0 bg-black/40 transition-opacity",
            mobileOpen ? "opacity-100" : "opacity-0",
          )}
          onClick={onClose}
          aria-label="Close menu overlay"
        />
        <aside
          className={cn(
            "absolute inset-y-0 left-0 w-[min(280px,85vw)] flex flex-col bg-white dark:bg-gray-950 border-r border-gray-200 dark:border-gray-800 shadow-xl transition-transform duration-200 ease-out",
            mobileOpen ? "translate-x-0" : "-translate-x-full",
          )}
        >
          {navContent}
        </aside>
      </div>
    </>
  );
}
