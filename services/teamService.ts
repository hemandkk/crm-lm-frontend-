import { api } from "@/lib/api";
import { toBranchIdsParam, withBranchScopeParams } from "@/lib/utils";
import type {
  TeamAnalyticsResponse,
  TeamAssignmentBody,
  TeamMember,
  TeamOverviewResponse,
  TeamPaymentsResponse,
  TeamPerformanceResponse,
  TeamQueryFilters,
  TeamSalesResponse,
  TeamSupervisor,
  TeamSupervisorRole,
  TeamExportFormat,
  TeamExportType,
} from "@/types/team";

function teamFilterParams(filters: TeamQueryFilters = {}) {
  return withBranchScopeParams({
    ...filters,
    branchIds: toBranchIdsParam(filters.branchIds),
  });
}

function asRecord(raw: unknown): Record<string, unknown> {
  return (raw ?? {}) as Record<string, unknown>;
}

function normalizeSupervisor(raw: unknown): TeamSupervisor {
  const r = asRecord(raw);
  return {
    id: String(r.id ?? ""),
    employeeId: r.employeeId != null || r.employee_id != null
      ? String(r.employeeId ?? r.employee_id)
      : undefined,
    name: String(r.name ?? r.employeeName ?? r.employee_name ?? ""),
    role: String(r.role ?? "") as TeamSupervisor["role"],
  };
}

function normalizeMember(raw: unknown): TeamMember {
  const r = asRecord(raw);
  return {
    id: String(r.id ?? ""),
    employeeId:
      r.employeeId != null || r.employee_id != null
        ? String(r.employeeId ?? r.employee_id)
        : undefined,
    name: String(r.name ?? r.employeeName ?? r.employee_name ?? ""),
    email: r.email != null ? String(r.email) : undefined,
    role: r.role != null ? String(r.role) : undefined,
    status: r.status != null ? String(r.status) : undefined,
    stateId:
      r.stateId != null || r.state_id != null
        ? String(r.stateId ?? r.state_id)
        : null,
    branchId:
      r.branchId != null || r.branch_id != null
        ? String(r.branchId ?? r.branch_id)
        : null,
    branchName:
      r.branchName != null || r.branch_name != null
        ? String(r.branchName ?? r.branch_name)
        : null,
  };
}

function unwrapList<T>(
  data: unknown,
  map: (row: unknown) => T,
): T[] {
  if (Array.isArray(data)) return data.map(map);
  const r = asRecord(data);
  const rows = (r.items ?? r.data ?? r.results ?? []) as unknown[];
  return Array.isArray(rows) ? rows.map(map) : [];
}

export const teamService = {
  listSupervisors: async (
    role: TeamSupervisorRole,
    filters?: { stateId?: string; branchId?: string; branchIds?: string },
  ): Promise<TeamSupervisor[]> => {
    const res = await api.get("/team/supervisors", {
      params: {
        role,
        stateId: filters?.stateId || undefined,
        branchId: filters?.branchId || undefined,
        branchIds: filters?.branchIds || undefined,
      },
    });
    return unwrapList(res.data, normalizeSupervisor);
  },

  listMembers: async (params?: {
    supervisorId?: string;
    stateId?: string;
    branchId?: string;
    branchIds?: string;
  }): Promise<TeamMember[]> => {
    const res = await api.get("/team/members", {
      params: {
        ...params,
        branchIds: params?.branchIds || undefined,
      },
    });
    return unwrapList(res.data, normalizeMember);
  },

  setAssignment: async (
    employeeId: string | number,
    body: TeamAssignmentBody,
  ): Promise<void> => {
    await api.put(`/team/assignments/${employeeId}`, body);
  },

  overview: async (
    filters: TeamQueryFilters = {},
  ): Promise<TeamOverviewResponse> => {
    const res = await api.get("/team/dashboard/overview", {
      params: teamFilterParams(filters),
    });
    return res.data as TeamOverviewResponse;
  },

  sales: async (
    filters: TeamQueryFilters = {},
  ): Promise<TeamSalesResponse> => {
    const res = await api.get("/team/dashboard/sales", {
      params: teamFilterParams(filters),
    });
    return res.data as TeamSalesResponse;
  },

  performance: async (
    filters: TeamQueryFilters = {},
  ): Promise<TeamPerformanceResponse> => {
    const res = await api.get("/team/dashboard/performance", {
      params: teamFilterParams(filters),
    });
    return res.data as TeamPerformanceResponse;
  },

  payments: async (
    filters: TeamQueryFilters = {},
  ): Promise<TeamPaymentsResponse> => {
    const res = await api.get("/team/dashboard/payments", {
      params: teamFilterParams(filters),
    });
    return res.data as TeamPaymentsResponse;
  },

  analytics: async (
    filters: TeamQueryFilters = {},
  ): Promise<TeamAnalyticsResponse> => {
    const res = await api.get("/team/dashboard/analytics", {
      params: teamFilterParams(filters),
    });
    return res.data as TeamAnalyticsResponse;
  },

  export: async (params: {
    exportType: TeamExportType;
    format: TeamExportFormat;
    dateFrom?: string;
    dateTo?: string;
    employeeId?: string;
    stateId?: string;
    branchId?: string;
    branchIds?: string;
    supervisorId?: string;
  }): Promise<void> => {
    const res = await api.get("/team/exports", {
      params: withBranchScopeParams(params),
      responseType: "blob",
    });
    const mime =
      params.format === "csv"
        ? "text/csv"
        : "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
    const blob = new Blob([res.data as BlobPart], { type: mime });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `team_${params.exportType}.${params.format}`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    window.URL.revokeObjectURL(url);
  },
};
