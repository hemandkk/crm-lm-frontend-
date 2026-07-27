import {
  useMutation,
  useQuery,
  useQueryClient,
  keepPreviousData,
} from "@tanstack/react-query";
import toast from "react-hot-toast";
import { teamService } from "@/services/teamService";
import { queryKeys } from "@/lib/queryClient";
import { extractApiError } from "@/lib/api";
import type {
  TeamAssignmentBody,
  TeamExportFormat,
  TeamExportType,
  TeamQueryFilters,
  TeamSupervisorRole,
} from "@/types/team";

export function useTeamSupervisors(
  role: TeamSupervisorRole,
  enabled = true,
  filters?: { stateId?: string; branchId?: string },
) {
  return useQuery({
    queryKey: queryKeys.team.supervisors(role, filters),
    queryFn: () => teamService.listSupervisors(role, filters),
    enabled,
  });
}

export function useTeamMembers(
  params?: { supervisorId?: string },
  enabled = true,
) {
  return useQuery({
    queryKey: queryKeys.team.members(params),
    queryFn: () => teamService.listMembers(params),
    enabled,
  });
}

export function useTeamOverview(
  filters: TeamQueryFilters = {},
  enabled = true,
) {
  return useQuery({
    queryKey: queryKeys.team.overview(filters),
    queryFn: () => teamService.overview(filters),
    placeholderData: keepPreviousData,
    enabled,
  });
}

export function useTeamSales(filters: TeamQueryFilters = {}, enabled = true) {
  return useQuery({
    queryKey: queryKeys.team.sales(filters),
    queryFn: () => teamService.sales(filters),
    placeholderData: keepPreviousData,
    enabled,
  });
}

export function useTeamPerformance(
  filters: TeamQueryFilters = {},
  enabled = true,
) {
  return useQuery({
    queryKey: queryKeys.team.performance(filters),
    queryFn: () => teamService.performance(filters),
    placeholderData: keepPreviousData,
    enabled,
  });
}

export function useTeamPayments(
  filters: TeamQueryFilters = {},
  enabled = true,
) {
  return useQuery({
    queryKey: queryKeys.team.payments(filters),
    queryFn: () => teamService.payments(filters),
    placeholderData: keepPreviousData,
    enabled,
  });
}

export function useTeamAnalytics(
  filters: TeamQueryFilters = {},
  enabled = true,
) {
  return useQuery({
    queryKey: queryKeys.team.analytics(filters),
    queryFn: () => teamService.analytics(filters),
    placeholderData: keepPreviousData,
    enabled,
  });
}

export function useSetTeamAssignment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      employeeId,
      ...body
    }: TeamAssignmentBody & { employeeId: string | number }) =>
      teamService.setAssignment(employeeId, {
        reportsToManagerId: body.reportsToManagerId,
        reportsToSalesHeadId: body.reportsToSalesHeadId,
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.employees.all });
      qc.invalidateQueries({ queryKey: queryKeys.team.all });
      toast.success("Reporting assignment saved");
    },
    onError: (error) => toast.error(extractApiError(error)),
  });
}

export function useTeamExport() {
  return useMutation({
    mutationFn: (params: {
      exportType: TeamExportType;
      format: TeamExportFormat;
      dateFrom?: string;
      dateTo?: string;
      employeeId?: string;
      stateId?: string;
      branchId?: string;
      supervisorId?: string;
    }) => teamService.export(params),
    onSuccess: () => toast.success("Export downloaded"),
    onError: (error) => toast.error(extractApiError(error)),
  });
}
