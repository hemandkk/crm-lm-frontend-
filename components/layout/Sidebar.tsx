"use client";

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
  { label: "Employees", href: "/admin/employees", icon: <Users size={16} /> },
  { label: "All Leads", href: "/admin/leads", icon: <List size={16} /> },
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
  { label: "My Leads", href: "/employee/leads", icon: <List size={16} /> },
  {
    label: "Add Lead",
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

export default function Sidebar() {
  const pathname = usePathname();
  const { user, role, logout, isLoggingOut } = useAuth();

  const navItems = role === "admin" ? adminNav : employeeNav;
  console.log("user", user);
  console.log("role", role);
  return (
    <aside className="w-[220px] flex-shrink-0 h-screen flex flex-col border-r border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950">
      {/* Logo */}
      <div className="px-4 py-5 border-b border-gray-100 dark:border-gray-800">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-primary-600 flex items-center justify-center">
            <Building2 size={14} className="dark:text-white text-black" />
          </div>
          <span className="font-semibold text-gray-900 dark:text-gray-100 text-sm">
            Sales CRM
          </span>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 py-3 px-2 overflow-y-auto">
        <p className="px-2 mb-2 text-[10px] font-semibold uppercase tracking-wider text-gray-400">
          {role === "admin" ? "Admin" : "My workspace"}
        </p>
        <ul className="space-y-0.5">
          {navItems.map((item) => {
            const isActive =
              pathname === item.href ||
              (item.href !== "/admin/dashboard" &&
                item.href !== "/employee/dashboard" &&
                pathname.startsWith(item.href));
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={cn(
                    "flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-colors group",
                    isActive
                      ? " text-primary font-medium dark:bg-gray-800 bg-gray-500 dark:text-white "
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

      {/* User footer */}
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
    </aside>
  );
}
