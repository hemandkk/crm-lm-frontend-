import {
  useQuery,
  useMutation,
  useQueryClient,
  keepPreviousData,
} from "@tanstack/react-query";
import toast from "react-hot-toast";
import { employeeService } from "@/services/employeeService";
import { queryKeys } from "@/lib/queryClient";
import { extractApiError } from "@/lib/api";
import type { EmployeeCreate, EmployeeUpdate } from "@/types";

interface UseEmployeeListParams {
  page?: number;
  pageSize?: number;
  search?: string;
  status?: "active" | "inactive";
  enabled?: boolean;
}

// ─── List employees ───────────────────────────────────────────────────────
export function useEmployees(params: UseEmployeeListParams = {}) {
  const { enabled = true, ...queryParams } = params;
  return useQuery({
    queryKey: queryKeys.employees.list(queryParams),
    queryFn: () => employeeService.list(queryParams),
    placeholderData: keepPreviousData,
    enabled,
  });
}

// ─── Single employee ──────────────────────────────────────────────────────
export function useEmployee(id: string, enabled = true) {
  return useQuery({
    queryKey: queryKeys.employees.detail(id),
    queryFn: () => employeeService.get(id),
    enabled: enabled && !!id,
  });
}

// ─── Employee performance ─────────────────────────────────────────────────
export function useEmployeePerformance(
  id: string,
  filters?: { dateFrom?: string; dateTo?: string },
  enabled = true
) {
  return useQuery({
    queryKey: queryKeys.employees.performance(id, filters),
    queryFn: () => employeeService.getPerformance(id, filters),
    enabled: enabled && !!id,
  });
}

// ─── Create employee ──────────────────────────────────────────────────────
export function useCreateEmployee() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: EmployeeCreate) => employeeService.create(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.employees.all });
      toast.success("Employee created successfully");
    },
    onError: (error) => toast.error(extractApiError(error)),
  });
}

// ─── Update employee ──────────────────────────────────────────────────────
export function useUpdateEmployee(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: EmployeeUpdate) => employeeService.update(id, data),
    onSuccess: (updated) => {
      qc.setQueryData(queryKeys.employees.detail(id), updated);
      qc.invalidateQueries({ queryKey: queryKeys.employees.all });
      toast.success("Employee updated");
    },
    onError: (error) => toast.error(extractApiError(error)),
  });
}

// ─── Toggle employee status ───────────────────────────────────────────────
export function useToggleEmployeeStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      status,
    }: {
      id: string;
      status: "active" | "inactive";
    }) => employeeService.toggleStatus(id, status),
    onSuccess: (updated) => {
      qc.setQueryData(queryKeys.employees.detail(updated.id), updated);
      qc.invalidateQueries({ queryKey: queryKeys.employees.all });
      toast.success(
        `Employee ${updated.status === "active" ? "activated" : "deactivated"}`
      );
    },
    onError: (error) => toast.error(extractApiError(error)),
  });
}

// ─── Reset password ───────────────────────────────────────────────────────
export function useResetEmployeePassword() {
  return useMutation({
    mutationFn: ({
      id,
      newPassword,
    }: {
      id: string;
      newPassword: string;
    }) => employeeService.resetPassword(id, newPassword),
    onSuccess: () => toast.success("Password reset successfully"),
    onError: (error) => toast.error(extractApiError(error)),
  });
}

// ─── Set monthly target ───────────────────────────────────────────────────
export function useSetEmployeeTarget() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, target }: { id: string; target: number }) =>
      employeeService.setTarget(id, target),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.employees.all });
      toast.success("Target updated");
    },
    onError: (error) => toast.error(extractApiError(error)),
  });
}
