import { QueryClient } from "@tanstack/react-query";

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 2, // 2 minutes
      gcTime: 1000 * 60 * 10, // 10 minutes
      retry: (failureCount, error: unknown) => {
        // Don't retry on 401/403/404
        if (
          typeof error === "object" &&
          error !== null &&
          "response" in error
        ) {
          const status = (error as { response: { status: number } }).response
            ?.status;
          if (status === 401 || status === 403 || status === 404) return false;
        }
        return failureCount < 2;
      },
      refetchOnWindowFocus: false,
    },
    mutations: {
      retry: false,
    },
  },
});

// ─── Query key factory ────────────────────────────────────────────────────
// Centralised so invalidation is type-safe and consistent across hooks
export const queryKeys = {
  // Auth
  me: ["me"] as const,

  // Employees
  employees: {
    all: ["employees"] as const,
    list: (filters?: object) => ["employees", "list", filters] as const,
    detail: (id: string) => ["employees", id] as const,
    performance: (id: string, filters?: object) =>
      ["employees", id, "performance", filters] as const,
  },

  // Prospects
  prospects: {
    all: ["prospects"] as const,
    list: (filters?: object) => ["prospects", "list", filters] as const,
    detail: (id: string) => ["prospects", id] as const,
    timeline: (id: string) => ["prospects", id, "timeline"] as const,
    documents: (id: string) => ["prospects", id, "documents"] as const,
  },

  // Payments
  payments: {
    all: ["payments"] as const,
    list: (filters?: object) => ["payments", "list", filters] as const,
    byProspect: (prospectId: string) =>
      ["payments", "prospect", prospectId] as const,
    summary: (filters?: object) => ["payments", "summary", filters] as const,
  },

  // Dashboard
  dashboard: {
    admin: (filters?: object) => ["dashboard", "admin", filters] as const,
    employee: (filters?: object) => ["dashboard", "employee", filters] as const,
  },

  // Reports
  reports: {
    revenue: (filters?: object) => ["reports", "revenue", filters] as const,
    employeePerformance: (filters?: object) =>
      ["reports", "employee-performance", filters] as const,
    leadsByStage: (filters?: object) =>
      ["reports", "leads-by-stage", filters] as const,
    leadsByAdmissionStage: (filters?: object) =>
      ["reports", "leads-by-admission-stage", filters] as const,
  },

  // Masters
  courses: {
    all: ["courses"] as const,
    list: (filters?: object) => ["courses", "list", filters] as const,
  },
  specializations: {
    all: ["specializations"] as const,
    list: (filters?: object) => ["specializations", "list", filters] as const,
  },
  states: {
    all: ["states"] as const,
    list: (filters?: object) => ["states", "list", filters] as const,
  },
  branches: {
    all: ["branches"] as const,
    list: (filters?: object) => ["branches", "list", filters] as const,
  },
  incentiveSlabs: {
    all: ["incentive-slabs"] as const,
  },
  monthlyTargets: {
    all: ["monthly-targets"] as const,
    overview: () => ["monthly-targets", "overview"] as const,
    default: () => ["monthly-targets", "default"] as const,
    employee: (id: string | number) =>
      ["monthly-targets", "employee", String(id)] as const,
  },

  // Activity
  activityLogs: {
    list: (filters?: object) => ["activity-logs", filters] as const,
  },

  // Notifications
  notifications: {
    list: ["notifications"] as const,
    unreadCount: ["notifications", "unread-count"] as const,
  },

  // Incentives
  incentives: {
    status: (filters?: object) => ["incentives", "status", filters] as const,
    releases: (filters?: object) =>
      ["incentives", "releases", filters] as const,
  },

  // Team (manager / sales_head / admin)
  team: {
    all: ["team"] as const,
    supervisors: (role?: string, filters?: { stateId?: string; branchId?: string }) =>
      ["team", "supervisors", role, filters] as const,
    members: (filters?: object) => ["team", "members", filters] as const,
    overview: (filters?: object) => ["team", "overview", filters] as const,
    sales: (filters?: object) => ["team", "sales", filters] as const,
    performance: (filters?: object) =>
      ["team", "performance", filters] as const,
    payments: (filters?: object) => ["team", "payments", filters] as const,
    analytics: (filters?: object) => ["team", "analytics", filters] as const,
  },

  // Expenses
  expenses: {
    all: ["expenses"] as const,
    list: (filters?: object) => ["expenses", "list", filters] as const,
    detail: (id: string) => ["expenses", id] as const,
  },

  // Payment requests
  paymentRequests: {
    all: ["payment-requests"] as const,
    list: (filters?: object) => ["payment-requests", "list", filters] as const,
    detail: (id: string) => ["payment-requests", id] as const,
  },
} as const;
