import { api } from "@/lib/api";
import { normalizePaginatedResponse } from "@/lib/pagination";
import type {
  Employee,
  EmployeeCreate,
  EmployeeUpdate,
  EmployeePerformance,
  PaginatedResponse,
} from "@/types";

interface EmployeeListParams {
  page?: number;
  pageSize?: number;
  search?: string;
  status?: "active" | "inactive";
}

interface EmployeeID {
  employeeId: string;
}

function normalizeEmployee(raw: unknown): Employee {
  const r = (raw ?? {}) as Record<string, unknown>;
  const roleRaw = String(r.role ?? "employee")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "_");
  return {
    id: String(r.id ?? ""),
    employeeId: String(r.employeeId ?? r.employee_id ?? ""),
    name: String(r.name ?? ""),
    email: String(r.email ?? ""),
    phone: String(r.phone ?? ""),
    department: String(r.department ?? ""),
    designation: String(r.designation ?? ""),
    role: (
      roleRaw === "accountant" || roleRaw === "processing_team"
        ? roleRaw
        : "employee"
    ) as Employee["role"],
    status: (r.status === "inactive" ? "inactive" : "active") as Employee["status"],
    monthlyTarget: Number(r.monthlyTarget ?? r.monthly_target ?? 0),
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
  ): Promise<Employee> => {
    const res = await api.patch(`/employees/${id}/status`, {
      status,
    });
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
