import { useMemo } from "react";
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
import { filterSalesEmployees } from "@/lib/roles";
import type { Employee, EmployeeCreate, EmployeeUpdate } from "@/types";

interface UseEmployeeListParams {
  page?: number;
  pageSize?: number;
  search?: string;
  status?: "active" | "inactive";
  /** Backend filter: only role=employee */
  salesOnly?: boolean;
  stateId?: string;
  branchId?: string;
  all?: boolean;
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

/**
 * Sales employees only (role=employee). Uses salesOnly=true on API when supported.
 * Use on dashboard, analytics, assign pickers — not Users admin.
 */
export function useSalesEmployees(
  params: Omit<UseEmployeeListParams, "salesOnly"> = {},
) {
  const query = useEmployees({ ...params, salesOnly: true });
  const items = useMemo(() => {
    const rows =
      (query.data?.items as Employee[] | undefined) ??
      (query.data?.data as Employee[] | undefined) ??
      [];
    return filterSalesEmployees(rows);
  }, [query.data]);

  return {
    ...query,
    employees: items,
  };
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
  enabled = true,
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
      qc.invalidateQueries({ queryKey: queryKeys.team.all });
      qc.invalidateQueries({ queryKey: queryKeys.activityLogs.list() });
      toast.success("User created successfully");
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
      qc.invalidateQueries({ queryKey: queryKeys.team.all });
      toast.success("Employee updated");
    },
    onError: (error) => toast.error(extractApiError(error)),
  });
}

// ─── Toggle employee status ───────────────────────────────────────────────
// Note: no blanket onError here — callers handle errors (400 with leadCount
// opens the transfer modal; everything else shows a toast).
export function useToggleEmployeeStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      status,
      transferToId,
    }: {
      id: string;
      status: "active" | "inactive";
      transferToId?: string;
    }) => employeeService.toggleStatus(id, status, transferToId),
    onSuccess: (updated) => {
      qc.setQueryData(queryKeys.employees.detail(updated.id), updated);
      qc.invalidateQueries({ queryKey: queryKeys.employees.all });
      toast.success(
        `Employee ${updated.status === "active" ? "activated" : "deactivated"}`,
      );
    },
  });
}

// ─── Reset password ───────────────────────────────────────────────────────
export function useResetEmployeePassword() {
  return useMutation({
    mutationFn: ({ id, newPassword }: { id: string; newPassword: string }) =>
      employeeService.resetPassword(id, newPassword),
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
      qc.invalidateQueries({ queryKey: queryKeys.monthlyTargets.all });
      qc.invalidateQueries({ queryKey: queryKeys.dashboard.admin() });
      toast.success("Target updated");
    },
    onError: (error) => toast.error(extractApiError(error)),
  });
}

export function useNextEmployeeId(enabled = true) {
  return useQuery({
    queryKey: [...queryKeys.employees.all, "next-id"],
    queryFn: () => employeeService.getNextEmployeeId(),
    enabled,
    staleTime: 0,
  });
}
