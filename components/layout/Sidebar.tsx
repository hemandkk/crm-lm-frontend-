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
  UsersRound,
  TrendingUp,
  LineChart,
  Download,
  Wallet,
  HandCoins,
} from "lucide-react";
import { cn, getInitials } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
import {
  crmBasePathForRole,
  hasSalesCrmAccess,
  roleLabel,
  teamBasePathForRole,
} from "@/lib/roles";

interface NavItem {
  label: string;
  href: string;
  icon: React.ReactNode;
}

interface NavSection {
  label: string;
  items: NavItem[];
}

function buildAdminNav(): NavSection[] {
  const teamBase = "/admin/team";
  return [
    {
      label: "Admin",
      items: [
        {
          label: "Dashboard",
          href: "/admin/dashboard",
          icon: <LayoutDashboard size={16} />,
        },
        { label: "Users", href: "/admin/employees", icon: <Users size={16} /> },
        {
          label: "All Admissions",
          href: "/admin/leads",
          icon: <List size={16} />,
        },
        {
          label: "Analytics",
          href: "/admin/reports",
          icon: <BarChart2 size={16} />,
        },
        {
          label: "Masters",
          href: "/admin/masters",
          icon: <Settings size={16} />,
        },
        {
          label: "Activity Log",
          href: "/admin/activity",
          icon: <Activity size={16} />,
        },
        {
          label: "Expenses",
          href: "/admin/expenses",
          icon: <Wallet size={16} />,
        },
        {
          label: "Payment Requests",
          href: "/admin/payment-requests",
          icon: <HandCoins size={16} />,
        },
        {
          label: "Incentive Releases",
          href: "/admin/incentive-releases",
          icon: <Award size={16} />,
        },
      ],
    },
    {
      label: "Team",
      items: teamNavItems(teamBase),
    },
  ];
}

function teamNavItems(base: string): NavItem[] {
  return [
    {
      label: "Overview",
      href: base,
      icon: <UsersRound size={16} />,
    },
    {
      label: "Sales",
      href: `${base}/sales`,
      icon: <TrendingUp size={16} />,
    },
    {
      label: "Performance",
      href: `${base}/performance`,
      icon: <Award size={16} />,
    },
    /* {
      label: "Payments",
      href: `${base}/payments`,
      icon: <CreditCard size={16} />,
    },
    {
      label: "Analytics",
      href: `${base}/analytics`,
      icon: <LineChart size={16} />,
    }, */
    {
      label: "Exports",
      href: `${base}/exports`,
      icon: <Download size={16} />,
    },
  ];
}

/** Personal CRM reuses /employee/*; home dashboard + Team are role-scoped. */
function buildSalesCrmNav(crmBase: string, teamBase: string): NavSection[] {
  return [
    {
      label: "My workspace",
      items: [
        {
          label: "Dashboard",
          href: `${crmBase}/dashboard`,
          icon: <LayoutDashboard size={16} />,
        },
        {
          label: "My Admissions",
          href: "/employee/leads",
          icon: <List size={16} />,
        },
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
        {
          label: "Incentive Releases",
          href: "/employee/incentive-releases",
          icon: <Award size={16} />,
        },
      ],
    },
    {
      label: "Team",
      items: teamNavItems(teamBase),
    },
  ];
}

function buildEmployeeNav(): NavSection[] {
  return [
    {
      label: "My workspace",
      items: [
        {
          label: "Dashboard",
          href: "/employee/dashboard",
          icon: <LayoutDashboard size={16} />,
        },
        {
          label: "My Admissions",
          href: "/employee/leads",
          icon: <List size={16} />,
        },
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
        {
          label: "Incentive Releases",
          href: "/employee/incentive-releases",
          icon: <Award size={16} />,
        },
      ],
    },
  ];
}

const accountantNav: NavSection[] = [
  {
    label: "Accountant",
    items: [
      {
        label: "Certificate Waiting",
        href: "/accountant/leads",
        icon: <List size={16} />,
      },
      {
        label: "Expenses",
        href: "/accountant/expenses",
        icon: <Wallet size={16} />,
      },
      {
        label: "Payment Requests",
        href: "/accountant/payment-requests",
        icon: <HandCoins size={16} />,
      },
    ],
  },
];

const processingNav: NavSection[] = [
  {
    label: "Processing",
    items: [
      {
        label: "Admissions",
        href: "/processing/leads",
        icon: <List size={16} />,
      },
    ],
  },
];

function isNavItemActive(pathname: string, href: string, allHrefs: string[]) {
  const isExactHome =
    href.endsWith("/dashboard") ||
    href === "/admin/team" ||
    href === "/manager/team" ||
    href === "/sales-head/team";

  if (pathname === href) return true;

  // Exact-match section homes (dashboard / team overview)
  if (isExactHome && pathname !== href) {
    // still allow nested under team overview only when href is the section root
    // and no more specific sibling matches — handled below for non-dashboard
  }

  if (href.endsWith("/dashboard") && pathname !== href) {
    return false;
  }

  if (pathname === href) return true;
  if (!pathname.startsWith(`${href}/`) && pathname !== href) {
    // team overview: /admin/team should not match /admin/team/sales
    if (
      (href === "/admin/team" ||
        href === "/manager/team" ||
        href === "/sales-head/team") &&
      pathname.startsWith(`${href}/`)
    ) {
      return false;
    }
    if (!pathname.startsWith(`${href}/`)) return false;
  }

  if (pathname.startsWith(`${href}/`)) {
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

  return false;
}

interface SidebarProps {
  mobileOpen?: boolean;
  onClose?: () => void;
}

export default function Sidebar({ mobileOpen = false, onClose }: SidebarProps) {
  const pathname = usePathname();
  const { user, role, logout, isLoggingOut } = useAuth();

  const sections: NavSection[] = (() => {
    if (role === "admin") return buildAdminNav();
    if (role === "accountant") return accountantNav;
    if (role === "processing_team") return processingNav;
    if (role === "manager" || role === "sales_head") {
      return buildSalesCrmNav(
        crmBasePathForRole(role),
        teamBasePathForRole(role),
      );
    }
    if (hasSalesCrmAccess(role)) return buildEmployeeNav();
    return buildEmployeeNav();
  })();

  const allHrefs = sections.flatMap((s) => s.items.map((i) => i.href));

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
        {sections.map((section) => (
          <div key={section.label} className="mb-3">
            <p className="px-2 mb-2 text-[10px] font-semibold uppercase tracking-wider text-gray-400">
              {section.label}
            </p>
            <ul className="space-y-0.5">
              {section.items.map((item) => {
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
          </div>
        ))}
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
            <p className="text-[10px] text-gray-400 truncate">
              {roleLabel(role)}
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
      <aside className="hidden lg:flex w-[220px] flex-shrink-0 h-dvh flex-col border-r border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950">
        {navContent}
      </aside>

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
