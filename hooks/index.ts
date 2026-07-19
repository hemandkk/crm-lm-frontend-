import {
  useQuery,
  useMutation,
  useQueryClient,
  keepPreviousData,
} from "@tanstack/react-query";
import toast from "react-hot-toast";
import {
  paymentService,
  dashboardService,
  reportService,
  mastersService,
  activityService,
  notificationService,
  exportService,
} from "@/services";
import { queryKeys } from "@/lib/queryClient";
import { extractApiError } from "@/lib/api";
import type {
  PaymentCreate,
  PaymentFilters,
  ReportFilters,
  CourseCreate,
  CourseUpdate,
  SpecializationCreate,
  SpecializationUpdate,
  IncentiveSlabCreate,
  ExportRequest,
  BulkMonthlyTargetItem,
  MasterImportResult,
} from "@/types";
import { AxiosError } from "axios";

function toastImportResult(label: string, result: MasterImportResult) {
  const errCount = result.errors?.length ?? 0;
  const msg = `${label}: ${result.created} created, ${result.updated} updated, ${result.skipped} skipped`;
  if (errCount > 0) {
    toast.error(`${msg} (${errCount} error${errCount === 1 ? "" : "s"})`);
  } else {
    toast.success(msg);
  }
}

// ─── PAYMENTS ─────────────────────────────────────────────────────────────

export function usePayments(filters: PaymentFilters = {}) {
  return useQuery({
    queryKey: queryKeys.payments.list(filters),
    queryFn: () => paymentService.list(filters),
    placeholderData: keepPreviousData,
  });
}

export function useProspectPayments(prospectId: string, enabled = true) {
  return useQuery({
    queryKey: queryKeys.payments.byProspect(prospectId),
    queryFn: () => paymentService.byProspect(prospectId),
    enabled: enabled && !!prospectId,
  });
}

export function usePaymentSummary(filters?: PaymentFilters) {
  return useQuery({
    queryKey: queryKeys.payments.summary(filters),
    queryFn: () => paymentService.getSummary(filters),
  });
}

export function useCreatePayment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: PaymentCreate) => paymentService.create(data),
    onSuccess: (created) => {
      qc.invalidateQueries({
        queryKey: queryKeys.payments.byProspect(created.prospectId),
      });
      qc.invalidateQueries({ queryKey: queryKeys.payments.all });
      qc.invalidateQueries({
        queryKey: queryKeys.prospects.detail(created.prospectId),
      });
      qc.invalidateQueries({ queryKey: queryKeys.dashboard.employee() });
      qc.invalidateQueries({ queryKey: queryKeys.incentives.status() });
      toast.success(
        `Payment of ₹${created.amount.toLocaleString("en-IN")} recorded`,
      );
    },
    onError: (error) => toast.error(extractApiError(error)),
  });
}

export function useVerifyPayment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      paymentId,
      verificationStatus,
      prospectId,
    }: {
      paymentId: string | number;
      verificationStatus: import("@/types").PaymentVerificationStatus;
      prospectId?: string;
    }) => paymentService.verify(paymentId, verificationStatus),
    onSuccess: (updated, vars) => {
      const prospectId = vars.prospectId || updated.prospectId;
      if (prospectId) {
        qc.invalidateQueries({
          queryKey: queryKeys.payments.byProspect(prospectId),
        });
        qc.invalidateQueries({
          queryKey: queryKeys.prospects.detail(prospectId),
        });
      }
      qc.invalidateQueries({ queryKey: queryKeys.payments.all });
      qc.invalidateQueries({ queryKey: queryKeys.prospects.all });
      qc.invalidateQueries({ queryKey: queryKeys.activityLogs.list() });
      toast.success("Payment verification updated");
    },
    onError: (error) => toast.error(extractApiError(error)),
  });
}

// ─── DASHBOARD ────────────────────────────────────────────────────────────

export function useAdminDashboard(
  filters?: {
    employeeId?: string;
    dateFrom?: string;
    dateTo?: string;
  },
  options?: { enabled?: boolean },
) {
  return useQuery({
    queryKey: queryKeys.dashboard.admin(filters),
    queryFn: () => dashboardService.getAdmin(filters),
    staleTime: 1000 * 60 * 5, // 5 min — dashboards are heavier queries
    enabled: options?.enabled ?? true,
  });
}
export function useEmployeeDashboard(filters?: {
  dateFrom?: string;
  dateTo?: string;
}) {
  return useQuery({
    queryKey: queryKeys.dashboard.employee(filters),
    queryFn: () => dashboardService.getEmployee(filters),
    staleTime: 1000 * 60 * 5,
  });
}

// ─── REPORTS ──────────────────────────────────────────────────────────────

export function useRevenueReport(filters?: ReportFilters) {
  return useQuery({
    queryKey: queryKeys.reports.revenue(filters),
    queryFn: () => reportService.getRevenue(filters),
  });
}

export function useEmployeePerformanceReport(filters?: ReportFilters) {
  return useQuery({
    queryKey: queryKeys.reports.employeePerformance(filters),
    queryFn: () => reportService.getEmployeePerformance(filters),
  });
}

export function useLeadsByStageReport(filters?: ReportFilters) {
  return useQuery({
    queryKey: queryKeys.reports.leadsByStage(filters),
    queryFn: () => reportService.getLeadsByStage(filters),
  });
}

// ─── INCENTIVES ───────────────────────────────────────────────────────────

export function useIncentiveStatus(filters?: {
  month?: string;
  dateFrom?: string;
  dateTo?: string;
  employeeId?: string;
}) {
  return useQuery({
    queryKey: queryKeys.incentives.status(filters),
    queryFn: () => reportService.getIncentiveStatus(filters),
    enabled: !!(filters?.month || (filters?.dateFrom && filters?.dateTo)),
  });
}

// ─── MASTERS — COURSES ────────────────────────────────────────────────────

export function useCourses(
  params?: { activeOnly?: boolean },
  enabled = true,
) {
  return useQuery({
    queryKey: queryKeys.courses.list(params),
    queryFn: () => mastersService.getCourses(params),
    staleTime: 1000 * 60 * 10, // 10 min — rarely changes
    enabled,
  });
}

export function useCreateCourse() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: CourseCreate) => mastersService.createCourse(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.courses.all });
      toast.success("Course added");
    },
    onError: (error) => toast.error(extractApiError(error)),
  });
}

export function useUpdateCourse() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: CourseUpdate }) =>
      mastersService.updateCourse(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.courses.all });
      toast.success("Course updated");
    },
    onError: (error) => toast.error(extractApiError(error)),
  });
}

export function useDeleteCourse() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => mastersService.deleteCourse(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.courses.all });
      toast.success("Course deleted");
    },
    onError: (error) => toast.error(extractApiError(error)),
  });
}

export function useImportCourses() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (file: File) => mastersService.importCourses(file),
    onSuccess: (result) => {
      qc.invalidateQueries({ queryKey: queryKeys.courses.all });
      toastImportResult("Courses import", result);
    },
    onError: (error) => toast.error(extractApiError(error)),
  });
}

// ─── MASTERS — SPECIALIZATIONS ────────────────────────────────────────────

export function useSpecializations(
  params?: { activeOnly?: boolean },
  enabled = true,
) {
  return useQuery({
    queryKey: queryKeys.specializations.list(params),
    queryFn: () => mastersService.getSpecializations(params),
    staleTime: 1000 * 60 * 10,
    enabled,
  });
}

export function useCreateSpecialization() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: SpecializationCreate) =>
      mastersService.createSpecialization(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.specializations.all });
      toast.success("Specialization added");
    },
    onError: (error) => toast.error(extractApiError(error)),
  });
}

export function useUpdateSpecialization() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: SpecializationUpdate }) =>
      mastersService.updateSpecialization(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.specializations.all });
      toast.success("Specialization updated");
    },
    onError: (error) => toast.error(extractApiError(error)),
  });
}

export function useDeleteSpecialization() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => mastersService.deleteSpecialization(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.specializations.all });
      toast.success("Specialization deleted");
    },
    onError: (error) => toast.error(extractApiError(error)),
  });
}

export function useImportSpecializations() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (file: File) => mastersService.importSpecializations(file),
    onSuccess: (result) => {
      qc.invalidateQueries({ queryKey: queryKeys.specializations.all });
      toastImportResult("Specializations import", result);
    },
    onError: (error) => toast.error(extractApiError(error)),
  });
}

// ─── MASTERS — INCENTIVE SLABS ────────────────────────────────────────────

export function useIncentiveSlabs() {
  return useQuery({
    queryKey: queryKeys.incentiveSlabs.all,
    queryFn: () => mastersService.getIncentiveSlabs(),
    staleTime: 1000 * 60 * 10,
  });
}

export function useUpdateIncentiveSlabs() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (slabs: IncentiveSlabCreate[]) =>
      mastersService.updateIncentiveSlabs(slabs),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.incentiveSlabs.all });
      qc.invalidateQueries({ queryKey: queryKeys.incentives.status() });
      toast.success("Incentive slabs saved");
    },
    onError: (error) => toast.error(extractApiError(error)),
  });
}

// ─── MASTERS — MONTHLY TARGETS ────────────────────────────────────────────

export function useMonthlyTargetsOverview() {
  return useQuery({
    queryKey: queryKeys.monthlyTargets.overview(),
    queryFn: () => mastersService.getMonthlyTargetsOverview(),
  });
}

export function useDefaultMonthlyTarget() {
  return useQuery({
    queryKey: queryKeys.monthlyTargets.default(),
    queryFn: () => mastersService.getDefaultMonthlyTarget(),
  });
}

export function useSetDefaultMonthlyTarget() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (defaultMonthlyTarget: number) =>
      mastersService.setDefaultMonthlyTarget(defaultMonthlyTarget),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.monthlyTargets.all });
      qc.invalidateQueries({ queryKey: queryKeys.dashboard.admin() });
      qc.invalidateQueries({ queryKey: queryKeys.dashboard.employee() });
      toast.success("Default monthly target saved");
    },
    onError: (error) => toast.error(extractApiError(error)),
  });
}

export function useSetEmployeeMonthlyTarget() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      employeeId,
      monthlyTarget,
    }: {
      employeeId: string | number;
      monthlyTarget: number;
    }) => mastersService.setEmployeeMonthlyTarget(employeeId, monthlyTarget),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.monthlyTargets.all });
      qc.invalidateQueries({ queryKey: queryKeys.employees.all });
      qc.invalidateQueries({ queryKey: queryKeys.dashboard.admin() });
      toast.success("Employee target updated");
    },
    onError: (error) => toast.error(extractApiError(error)),
  });
}

export function useClearEmployeeMonthlyTarget() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (employeeId: string | number) =>
      mastersService.clearEmployeeMonthlyTarget(employeeId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.monthlyTargets.all });
      qc.invalidateQueries({ queryKey: queryKeys.employees.all });
      qc.invalidateQueries({ queryKey: queryKeys.dashboard.admin() });
      toast.success("Using org default target");
    },
    onError: (error) => toast.error(extractApiError(error)),
  });
}

export function useBulkSetEmployeeMonthlyTargets() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (items: BulkMonthlyTargetItem[]) =>
      mastersService.bulkSetEmployeeMonthlyTargets(items),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.monthlyTargets.all });
      qc.invalidateQueries({ queryKey: queryKeys.employees.all });
      qc.invalidateQueries({ queryKey: queryKeys.dashboard.admin() });
      toast.success("Targets saved");
    },
    onError: (error) => toast.error(extractApiError(error)),
  });
}

// ─── ACTIVITY LOGS ────────────────────────────────────────────────────────

export function useActivityLogs(params?: {
  page?: number;
  pageSize?: number;
  action?: string;
  dateFrom?: string;
  dateTo?: string;
}) {
  return useQuery({
    queryKey: queryKeys.activityLogs.list(params),
    queryFn: () => activityService.list(params),
    placeholderData: keepPreviousData,
  });
}

// ─── NOTIFICATIONS ────────────────────────────────────────────────────────

export function useNotifications() {
  return useQuery({
    queryKey: queryKeys.notifications.list,
    queryFn: () => notificationService.list(),
    // refetchInterval: 1000 * 60, // poll every 60s
    staleTime: 30_000,
    refetchInterval: 60_000,
    retry: (failureCount, error) => {
      const status = (error as AxiosError)?.response?.status;

      // Don't retry 404s
      if (status === 404) return false;

      return failureCount < 3;
    },
    /* refetchInterval: (query) => {
      if (query.state.error) {
        const status = (query.state.error as AxiosError)?.response?.status;

        if (status === 404) {
          return false;
        }
      }

      return 60_000;
    }, */
  });
}

export function useMarkNotificationRead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => notificationService.markRead(id),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: queryKeys.notifications.list }),
  });
}

export function useMarkAllNotificationsRead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => notificationService.markAllRead(),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: queryKeys.notifications.list }),
  });
}

// ─── EXPORT ───────────────────────────────────────────────────────────────

export function useExport() {
  return useMutation({
    mutationFn: (request: ExportRequest) => exportService.export(request),
    onSuccess: () => toast.success("Export downloaded"),
    onError: (error) => toast.error(extractApiError(error)),
  });
}
