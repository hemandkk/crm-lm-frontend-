import { QueryClient } from "@tanstack/react-query";

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 2,        // 2 minutes
      gcTime: 1000 * 60 * 10,          // 10 minutes
      retry: (failureCount, error: unknown) => {
        // Don't retry on 401/403/404
        if (
          typeof error === "object" &&
          error !== null &&
          "response" in error
        ) {
          const status = (error as { response: { status: number } }).response?.status;
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
    list: (filters?: Record<string, unknown>) =>
      ["employees", "list", filters] as const,
    detail: (id: string) => ["employees", id] as const,
    performance: (id: string, filters?: Record<string, unknown>) =>
      ["employees", id, "performance", filters] as const,
  },

  // Prospects
  prospects: {
    all: ["prospects"] as const,
    list: (filters?: Record<string, unknown>) =>
      ["prospects", "list", filters] as const,
    detail: (id: string) => ["prospects", id] as const,
    timeline: (id: string) => ["prospects", id, "timeline"] as const,
    documents: (id: string) => ["prospects", id, "documents"] as const,
  },

  // Payments
  payments: {
    all: ["payments"] as const,
    list: (filters?: Record<string, unknown>) =>
      ["payments", "list", filters] as const,
    byProspect: (prospectId: string) =>
      ["payments", "prospect", prospectId] as const,
    summary: (filters?: Record<string, unknown>) =>
      ["payments", "summary", filters] as const,
  },

  // Dashboard
  dashboard: {
    admin: (filters?: Record<string, unknown>) =>
      ["dashboard", "admin", filters] as const,
    employee: (filters?: Record<string, unknown>) =>
      ["dashboard", "employee", filters] as const,
  },

  // Reports
  reports: {
    revenue: (filters?: Record<string, unknown>) =>
      ["reports", "revenue", filters] as const,
    employeePerformance: (filters?: Record<string, unknown>) =>
      ["reports", "employee-performance", filters] as const,
    leadsByStage: (filters?: Record<string, unknown>) =>
      ["reports", "leads-by-stage", filters] as const,
  },

  // Masters
  courses: {
    all: ["courses"] as const,
    list: () => ["courses", "list"] as const,
  },
  incentiveSlabs: {
    all: ["incentive-slabs"] as const,
  },

  // Activity
  activityLogs: {
    list: (filters?: Record<string, unknown>) =>
      ["activity-logs", filters] as const,
  },

  // Notifications
  notifications: {
    list: ["notifications"] as const,
    unreadCount: ["notifications", "unread-count"] as const,
  },

  // Incentives
  incentives: {
    status: (filters?: Record<string, unknown>) =>
      ["incentives", "status", filters] as const,
  },
} as const;
