import { api } from "@/lib/api";
import { normalizePaginatedResponse } from "@/lib/pagination";
import type {
  Payment,
  PaymentCreate,
  PaymentFilters,
  PaymentSummary,
  PaymentVerificationStatus,
  AdminDashboard,
  EmployeeDashboard,
  MonthlyRevenue,
  StageCount,
  EmployeePerformance,
  IncentiveReport,
  IncentiveSlab,
  IncentiveSlabCreate,
  Course,
  CourseCreate,
  ActivityLog,
  Notification,
  ExportRequest,
  PaginatedResponse,
  PaymentListResponse,
  ReportFilters,
  StageCountListResponse,
  MonthlyRevenueListResponse,
  RevenueReport,
  MonthlyTargetDefault,
  MonthlyTargetsOverview,
  EmployeeMonthlyTarget,
  BulkMonthlyTargetItem,
} from "@/types";
import { normalizePaymentVerification } from "@/lib/utils";

function normalizePaymentRow(raw: unknown): Payment {
  const r = (raw ?? {}) as Record<string, unknown>;
  return {
    id: String(r.id ?? ""),
    prospectId: String(r.prospectId ?? r.prospect_id ?? ""),
    prospectName: String(r.prospectName ?? r.prospect_name ?? ""),
    amount: Number(r.amount ?? 0),
    paymentType: (r.paymentType ??
      r.payment_type ??
      "advance") as Payment["paymentType"],
    paymentDate: String(r.paymentDate ?? r.payment_date ?? "").slice(0, 10),
    receiptUrl: (r.receiptUrl ?? r.receipt_url ?? null) as string | null,
    notes: String(r.notes ?? ""),
    createdBy: String(r.createdBy ?? r.created_by ?? ""),
    createdByName: String(r.createdByName ?? r.created_by_name ?? ""),
    createdAt: String(r.createdAt ?? r.created_at ?? ""),
    verificationStatus: normalizePaymentVerification(
      (r.verificationStatus ??
        r.verification_status ??
        "not_verified") as string,
    ),
    verifiedAt: (r.verifiedAt ?? r.verified_at ?? null) as string | null,
    verifiedByName: (r.verifiedByName ??
      r.verified_by_name ??
      null) as string | null,
  };
}

function normalizeActivityLog(raw: unknown): ActivityLog {
  const r = (raw ?? {}) as Record<string, unknown>;
  const detailRaw = r.detail ?? r.meta;
  return {
    id: String(r.id ?? ""),
    userId: String(r.userId ?? r.user_id ?? ""),
    userName: String(r.userName ?? r.user_name ?? ""),
    userType: String(r.userType ?? r.user_type ?? "employee") as ActivityLog["userType"],
    action: String(r.action ?? ""),
    entityType: String(r.entityType ?? r.entity_type ?? ""),
    entityId: String(r.entityId ?? r.entity_id ?? ""),
    detail:
      detailRaw && typeof detailRaw === "object"
        ? (detailRaw as Record<string, unknown>)
        : {},
    ipAddress: String(r.ipAddress ?? r.ip_address ?? ""),
    createdAt: String(r.createdAt ?? r.created_at ?? ""),
  };
}

// ─── Payment service ──────────────────────────────────────────────────────
export const paymentService = {
  list: async (
    filters: PaymentFilters = {},
  ): Promise<PaginatedResponse<Payment>> => {
    const res = await api.get("/payments", { params: filters });
    return normalizePaginatedResponse(res.data, normalizePaymentRow);
  },

  byProspect: async (prospectId: string): Promise<PaymentListResponse> => {
    const res = await api.get(`/prospects/${prospectId}/payments`);
    const data = res.data as PaymentListResponse & {
      items?: unknown[];
      data?: unknown[];
    };
    const rows = (data.items ?? data.data ?? []) as unknown[];
    const items = rows.map((row) => normalizePaymentRow(row));
    return { items, total: data.total ?? items.length };
  },

  create: async (data: PaymentCreate): Promise<Payment> => {
    const formData = new FormData();
    formData.append("prospectId", data.prospectId);
    formData.append("amount", String(data.amount));
    formData.append("paymentType", data.paymentType);
    formData.append("paymentDate", data.paymentDate);
    if (data.notes) formData.append("notes", data.notes);
    if (data.receipt) formData.append("receipt", data.receipt);

    const res = await api.post("/payments", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return normalizePaymentRow(res.data);
  },

  /** Accountant / admin: set payment verification status */
  verify: async (
    paymentId: string | number,
    verificationStatus: PaymentVerificationStatus,
  ): Promise<Payment> => {
    const res = await api.patch(`/payments/${paymentId}/verification`, {
      verificationStatus,
    });
    return normalizePaymentRow(res.data);
  },

  getSummary: async (filters?: PaymentFilters): Promise<PaymentSummary> => {
    const res = await api.get<PaymentSummary>("/payments/summary", {
      params: filters,
    });
    return res.data;
  },
};

// ─── Dashboard service ────────────────────────────────────────────────────
export const dashboardService = {
  getAdmin: async (filters?: {
    employeeId?: string;
    dateFrom?: string;
    dateTo?: string;
  }): Promise<AdminDashboard> => {
    const res = await api.get<AdminDashboard>("/dashboard/admin", {
      params: filters,
    });
    return res.data;
  },

  getEmployee: async (filters?: {
    dateFrom?: string;
    dateTo?: string;
  }): Promise<EmployeeDashboard> => {
    const res = await api.get<EmployeeDashboard>("/dashboard/employee", {
      params: filters,
    });
    return res.data;
  },
};

// ─── Reports service ──────────────────────────────────────────────────────
export const reportService = {
  getRevenue: async (filters?: ReportFilters): Promise<RevenueReport> => {
    const res = await api.get<RevenueReport>("/reports/revenue", {
      params: filters,
    });
    return res.data;
  },

  getEmployeePerformance: async (
    filters?: ReportFilters
  ): Promise<PaginatedResponse<EmployeePerformance>> => {
    const res = await api.get<PaginatedResponse<EmployeePerformance>>(
      "/reports/employee-performance",
      { params: filters }
    );
    return res.data;
  },

  getLeadsByStage: async (
    filters?: ReportFilters
  ): Promise<PaginatedResponse<StageCountListResponse>> => {
    const res = await api.get<PaginatedResponse<StageCountListResponse>>("/reports/leads-by-stage", {
      params: filters,
    });
    return res.data;
  },

  getIncentiveStatus: async (filters?: {
    month?: string;
    dateFrom?: string;
    dateTo?: string;
    employeeId?: string;
  }): Promise<IncentiveReport> => {
    const res = await api.get<IncentiveReport>("/reports/incentives", {
      params: filters,
    });
    return res.data;
  },
};

// ─── Export service ───────────────────────────────────────────────────────
export const exportService = {
  export: async (request: ExportRequest): Promise<void> => {
    const res = await api.post(`/exports/${request.entity}`, request, {
      responseType: "blob",
    });

    const ext = request.format;
    const mimeMap: Record<string, string> = {
      xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      csv: "text/csv",
      pdf: "application/pdf",
    };

    const blob = new Blob([res.data as BlobPart], {
      type: mimeMap[ext] || "application/octet-stream",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${request.entity}-export.${ext}`;
    a.click();
    URL.revokeObjectURL(url);
  },
};

// ─── Masters service ──────────────────────────────────────────────────────
export const mastersService = {
  getCourses: async (): Promise<Course[]> => {
    const res = await api.get<Course[]>("/masters/courses");
    return res.data;
  },

  createCourse: async (data: CourseCreate): Promise<Course> => {
    const res = await api.post<Course>("/masters/courses", data);
    return res.data;
  },

  deleteCourse: async (id: string): Promise<void> => {
    await api.delete(`/masters/courses/${id}`);
  },

  getIncentiveSlabs: async (): Promise<IncentiveSlab[]> => {
    const res = await api.get<IncentiveSlab[]>("/masters/incentive-slabs");
    return res.data;
  },

  updateIncentiveSlabs: async (
    slabs: IncentiveSlabCreate[]
  ): Promise<IncentiveSlab[]> => {
    const res = await api.put<IncentiveSlab[]>("/masters/incentive-slabs", {
      slabs,
    });
    return res.data;
  },

  // ── Monthly targets ────────────────────────────────────────────────────
  getMonthlyTargetsOverview: async (): Promise<MonthlyTargetsOverview> => {
    const res = await api.get("/masters/monthly-targets");
    return normalizeMonthlyTargetsOverview(res.data);
  },

  getDefaultMonthlyTarget: async (): Promise<MonthlyTargetDefault> => {
    const res = await api.get("/masters/monthly-targets/default");
    return normalizeMonthlyTargetDefault(res.data);
  },

  setDefaultMonthlyTarget: async (
    defaultMonthlyTarget: number,
  ): Promise<MonthlyTargetDefault> => {
    const res = await api.put("/masters/monthly-targets/default", {
      defaultMonthlyTarget,
    });
    return normalizeMonthlyTargetDefault(res.data);
  },

  getEmployeeMonthlyTarget: async (
    employeeId: string | number,
  ): Promise<EmployeeMonthlyTarget> => {
    const res = await api.get(
      `/masters/monthly-targets/employees/${employeeId}`,
    );
    return normalizeEmployeeMonthlyTarget(res.data);
  },

  setEmployeeMonthlyTarget: async (
    employeeId: string | number,
    monthlyTarget: number,
  ): Promise<EmployeeMonthlyTarget> => {
    const res = await api.put(
      `/masters/monthly-targets/employees/${employeeId}`,
      { monthlyTarget },
    );
    return normalizeEmployeeMonthlyTarget(res.data);
  },

  clearEmployeeMonthlyTarget: async (
    employeeId: string | number,
  ): Promise<void> => {
    await api.delete(`/masters/monthly-targets/employees/${employeeId}`);
  },

  bulkSetEmployeeMonthlyTargets: async (
    items: BulkMonthlyTargetItem[],
  ): Promise<MonthlyTargetsOverview | EmployeeMonthlyTarget[]> => {
    const res = await api.put("/masters/monthly-targets/employees", {
      items,
    });
    const data = res.data;
    if (Array.isArray(data)) {
      return data.map(normalizeEmployeeMonthlyTarget);
    }
    return normalizeMonthlyTargetsOverview(data);
  },
};

function normalizeMonthlyTargetDefault(raw: unknown): MonthlyTargetDefault {
  const r = (raw ?? {}) as Record<string, unknown>;
  return {
    defaultMonthlyTarget:
      (r.defaultMonthlyTarget as number | string) ??
      (r.default_monthly_target as number | string) ??
      0,
  };
}

function normalizeEmployeeMonthlyTarget(raw: unknown): EmployeeMonthlyTarget {
  const r = (raw ?? {}) as Record<string, unknown>;
  const assigned =
    r.assignedTarget ?? r.assigned_target ?? null;
  const effective =
    r.effectiveTarget ?? r.effective_target ?? assigned ?? 0;
  const source = String(
    r.targetSource ?? r.target_source ?? "default",
  ) as EmployeeMonthlyTarget["targetSource"];
  const targetAssigned = Boolean(
    r.targetAssigned ?? r.target_assigned ?? source === "assigned",
  );

  return {
    employeeId: (r.employeeId ?? r.employee_id ?? r.id) as number | string,
    employeeCode: (r.employeeCode ?? r.employee_code) as string | undefined,
    employeeName: (r.employeeName ?? r.employee_name ?? r.name) as
      | string
      | undefined,
    role: (r.role as string | undefined) ?? undefined,
    assignedTarget: assigned as number | string | null,
    effectiveTarget: effective as number | string,
    targetAssigned,
    targetSource: source === "assigned" ? "assigned" : "default",
  };
}

function normalizeMonthlyTargetsOverview(raw: unknown): MonthlyTargetsOverview {
  const r = (raw ?? {}) as Record<string, unknown>;
  const employeesRaw =
    (r.employees as unknown[]) ??
    (r.items as unknown[]) ??
    [];
  return {
    defaultMonthlyTarget:
      (r.defaultMonthlyTarget as number | string) ??
      (r.default_monthly_target as number | string) ??
      0,
    employees: employeesRaw.map(normalizeEmployeeMonthlyTarget),
  };
}

// ─── Activity log service ─────────────────────────────────────────────────
export const activityService = {
  list: async (params?: {
    page?: number;
    pageSize?: number;
    action?: string;
    userId?: string;
    dateFrom?: string;
    dateTo?: string;
  }): Promise<PaginatedResponse<ActivityLog>> => {
    const res = await api.get("/activity-logs", { params });
    return normalizePaginatedResponse(res.data, normalizeActivityLog);
  },
};

// ─── Notification service ─────────────────────────────────────────────────
export const notificationService = {
  list: async (): Promise<Notification[]> => {
    const res = await api.get<Notification[]>("/notifications");
    return res.data;
  },

  markRead: async (id: string): Promise<void> => {
    await api.patch(`/notifications/${id}/read`);
  },

  markAllRead: async (): Promise<void> => {
    await api.patch("/notifications/read-all");
  },
};
