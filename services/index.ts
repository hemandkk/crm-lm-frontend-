import { api } from "@/lib/api";
import type {
  Payment,
  PaymentCreate,
  PaymentFilters,
  PaymentSummary,
  AdminDashboard,
  EmployeeDashboard,
  MonthlyRevenue,
  StageCount,
  EmployeePerformance,
  IncentiveStatus,
  IncentiveSlab,
  IncentiveSlabCreate,
  Course,
  CourseCreate,
  ActivityLog,
  Notification,
  ExportRequest,
  PaginatedResponse,
  ReportFilters,
} from "@/types";

// ─── Payment service ──────────────────────────────────────────────────────
export const paymentService = {
  list: async (
    filters: PaymentFilters = {}
  ): Promise<PaginatedResponse<Payment>> => {
    const res = await api.get<PaginatedResponse<Payment>>("/payments", {
      params: filters,
    });
    return res.data;
  },

  byProspect: async (prospectId: string): Promise<Payment[]> => {
    const res = await api.get<Payment[]>(`/prospects/${prospectId}/payments`);
    return res.data;
  },

  create: async (data: PaymentCreate): Promise<Payment> => {
    const formData = new FormData();
    formData.append("prospectId", data.prospectId);
    formData.append("amount", String(data.amount));
    formData.append("paymentType", data.paymentType);
    formData.append("paymentDate", data.paymentDate);
    if (data.notes) formData.append("notes", data.notes);
    if (data.receipt) formData.append("receipt", data.receipt);

    const res = await api.post<Payment>("/payments", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return res.data;
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
  getRevenue: async (filters?: ReportFilters): Promise<MonthlyRevenue[]> => {
    const res = await api.get<MonthlyRevenue[]>("/reports/revenue", {
      params: filters,
    });
    return res.data;
  },

  getEmployeePerformance: async (
    filters?: ReportFilters
  ): Promise<EmployeePerformance[]> => {
    const res = await api.get<EmployeePerformance[]>(
      "/reports/employee-performance",
      { params: filters }
    );
    return res.data;
  },

  getLeadsByStage: async (
    filters?: ReportFilters
  ): Promise<StageCount[]> => {
    const res = await api.get<StageCount[]>("/reports/leads-by-stage", {
      params: filters,
    });
    return res.data;
  },

  getIncentiveStatus: async (filters?: {
    month?: string;
    employeeId?: string;
  }): Promise<IncentiveStatus> => {
    const res = await api.get<IncentiveStatus>("/reports/incentives", {
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
};

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
    const res = await api.get<PaginatedResponse<ActivityLog>>(
      "/activity-logs",
      { params }
    );
    return res.data;
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
