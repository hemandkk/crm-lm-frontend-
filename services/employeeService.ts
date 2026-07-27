import { api } from "@/lib/api";
import { normalizePaginatedResponse } from "@/lib/pagination";
import { normalizeRole } from "@/lib/roles";
import type {
  Employee,
  EmployeeCreate,
  EmployeeUpdate,
  EmployeePerformance,
  PaginatedResponse,
  UserRole,
} from "@/types";

interface EmployeeListParams {
  page?: number;
  pageSize?: number;
  search?: string;
  status?: "active" | "inactive";
  /** Backend: only role=employee (lead assign dropdowns) */
  salesOnly?: boolean;
  stateId?: string;
  branchId?: string;
}

interface EmployeeID {
  employeeId: string;
}

function normalizeEmployee(raw: unknown): Employee {
  const r = (raw ?? {}) as Record<string, unknown>;
  const role =
    normalizeRole(String(r.role ?? "employee")) ??
    ("employee" as UserRole);
  const appRole = (
    role === "admin" ? "employee" : role
  ) as Employee["role"];

  const managerId =
    r.reportsToManagerId ?? r.reports_to_manager_id ?? null;
  const salesHeadId =
    r.reportsToSalesHeadId ?? r.reports_to_sales_head_id ?? null;

  const stateId = r.stateId ?? r.state_id ?? null;
  const branchId = r.branchId ?? r.branch_id ?? null;

  return {
    id: String(r.id ?? ""),
    employeeId: String(r.employeeId ?? r.employee_id ?? ""),
    name: String(r.name ?? ""),
    email: String(r.email ?? ""),
    phone: String(r.phone ?? ""),
    department: String(r.department ?? ""),
    designation: String(r.designation ?? ""),
    role: appRole,
    status: (r.status === "inactive" ? "inactive" : "active") as Employee["status"],
    monthlyTarget: Number(r.monthlyTarget ?? r.monthly_target ?? 0),
    stateId: stateId == null || stateId === "" ? null : String(stateId),
    branchId: branchId == null || branchId === "" ? null : String(branchId),
    stateName: (r.stateName ?? r.state_name ?? null) as string | null,
    stateCode: (r.stateCode ?? r.state_code ?? null) as string | null,
    branchName: (r.branchName ?? r.branch_name ?? null) as string | null,
    branchCode: (r.branchCode ?? r.branch_code ?? null) as string | null,
    reportsToManagerId:
      managerId == null || managerId === "" ? null : String(managerId),
    reportsToSalesHeadId:
      salesHeadId == null || salesHeadId === "" ? null : String(salesHeadId),
    reportsToManagerName:
      (r.reportsToManagerName ?? r.reports_to_manager_name ?? null) as
        | string
        | null,
    reportsToSalesHeadName:
      (r.reportsToSalesHeadName ?? r.reports_to_sales_head_name ?? null) as
        | string
        | null,
    createdAt: String(r.createdAt ?? r.created_at ?? ""),
    updatedAt: String(r.updatedAt ?? r.updated_at ?? ""),
  };
}

export const employeeService = {
  list: async (
    params: EmployeeListParams = {},
  ): Promise<PaginatedResponse<Employee>> => {
    const res = await api.get("/employees", { params });
    return normalizePaginatedResponse(res.data, normalizeEmployee);
  },

  get: async (id: string): Promise<Employee> => {
    const res = await api.get(`/employees/${id}`);
    return normalizeEmployee(res.data);
  },

  create: async (data: EmployeeCreate): Promise<Employee> => {
    const res = await api.post("/employees", data);
    return normalizeEmployee(res.data);
  },

  update: async (id: string, data: EmployeeUpdate): Promise<Employee> => {
    const res = await api.put(`/employees/${id}`, data);
    return normalizeEmployee(res.data);
  },

  toggleStatus: async (
    id: string,
    status: "active" | "inactive",
    transferToId?: string,
  ): Promise<Employee> => {
    const body: Record<string, unknown> = { status };
    if (transferToId) body.transferToId = transferToId;
    const res = await api.patch(`/employees/${id}/status`, body);
    return normalizeEmployee(res.data);
  },

  resetPassword: async (id: string, newPassword: string): Promise<void> => {
    await api.post(`/employees/${id}/reset-password`, { newPassword });
  },

  getPerformance: async (
    id: string,
    filters?: { dateFrom?: string; dateTo?: string },
  ): Promise<EmployeePerformance> => {
    const res = await api.get<EmployeePerformance>(
      `/employees/${id}/performance`,
      { params: filters },
    );
    return res.data;
  },

  setTarget: async (id: string, target: number): Promise<void> => {
    await api.put(`/masters/monthly-targets/employees/${id}`, {
      monthlyTarget: target,
    });
  },

  getNextEmployeeId: async (): Promise<EmployeeID> => {
    const res = await api.get<EmployeeID>(`/employees/utility/next-employee-id/`);
    return res.data;
  },
};
