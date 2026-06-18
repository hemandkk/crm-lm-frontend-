import { api } from "@/lib/api";
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

export const employeeService = {
  list: async (
    params: EmployeeListParams = {},
  ): Promise<PaginatedResponse<Employee>> => {
    const res = await api.get<PaginatedResponse<Employee>>("/employees", {
      params,
    });
    return res.data;
  },

  get: async (id: string): Promise<Employee> => {
    const res = await api.get<Employee>(`/employees/${id}`);
    return res.data;
  },

  create: async (data: EmployeeCreate): Promise<Employee> => {
    const res = await api.post<Employee>("/employees", data);
    return res.data;
  },

  update: async (id: string, data: EmployeeUpdate): Promise<Employee> => {
    const res = await api.put<Employee>(`/employees/${id}`, data);
    return res.data;
  },

  toggleStatus: async (
    id: string,
    status: "active" | "inactive",
  ): Promise<Employee> => {
    const res = await api.patch<Employee>(`/employees/${id}/status`, {
      status,
    });
    return res.data;
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
    await api.put(`/masters/targets/${id}`, { target });
  },

  getNextEmployeeId: async (): Promise<EmployeeID> => {
    const res = await api.get<EmployeeID>(`/employees/meta/next-employee-id/`);
    return res.data;
  },
};
