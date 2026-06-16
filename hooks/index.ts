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
  IncentiveSlabCreate,
  ExportRequest,
} from "@/types";

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
      qc.invalidateQueries({ queryKey: queryKeys.prospects.detail(created.prospectId) });
      qc.invalidateQueries({ queryKey: queryKeys.dashboard.employee() });
      qc.invalidateQueries({ queryKey: queryKeys.incentives.status() });
      toast.success(`Payment of ₹${created.amount.toLocaleString("en-IN")} recorded`);
    },
    onError: (error) => toast.error(extractApiError(error)),
  });
}

// ─── DASHBOARD ────────────────────────────────────────────────────────────

export function useAdminDashboard(filters?: {
  employeeId?: string;
  dateFrom?: string;
  dateTo?: string;
}) {
  return useQuery({
    queryKey: queryKeys.dashboard.admin(filters),
    queryFn: () => dashboardService.getAdmin(filters),
    staleTime: 1000 * 60 * 5, // 5 min — dashboards are heavier queries
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
  employeeId?: string;
}) {
  return useQuery({
    queryKey: queryKeys.incentives.status(filters),
    queryFn: () => reportService.getIncentiveStatus(filters),
  });
}

// ─── MASTERS — COURSES ────────────────────────────────────────────────────

export function useCourses(enabled = true) {
  return useQuery({
    queryKey: queryKeys.courses.list(),
    queryFn: () => mastersService.getCourses(),
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

// ─── ACTIVITY LOGS ────────────────────────────────────────────────────────

export function useActivityLogs(
  params?: {
    page?: number;
    pageSize?: number;
    action?: string;
    dateFrom?: string;
    dateTo?: string;
  }
) {
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
    refetchInterval: 1000 * 60, // poll every 60s
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
