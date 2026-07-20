/** Team dashboard / hierarchy types (LMT /api/v1/team/*) */

export type TeamSupervisorRole = "manager" | "sales_head";

export type TeamPerformanceStatus = "high" | "average" | "low";

export type TeamExportType = "sales" | "performance" | "payments" | "analytics";

export type TeamExportFormat = "xlsx" | "csv";

export interface TeamQueryFilters {
  dateFrom?: string;
  dateTo?: string;
  employeeId?: string;
  /** Admin-only: scope dashboards to a manager / sales_head team */
  supervisorId?: string;
}

export interface TeamSupervisor {
  id: string;
  employeeId?: string;
  name: string;
  role: TeamSupervisorRole | string;
}

export interface TeamMember {
  id: string;
  employeeId?: string;
  name: string;
  email?: string;
  role?: string;
  status?: string;
}

export interface TeamAssignmentBody {
  reportsToManagerId: string | number | null;
  reportsToSalesHeadId: string | number | null;
}

export interface TeamOverviewResponse {
  totalMembers?: number;
  totalEmployees?: number;
  totalLeads?: number;
  leadsCreated?: number;
  leadsWon?: number;
  totalRevenue?: number | string;
  totalCollections?: number | string;
  totalAdmissions?: number | string;
  lowPerformers?: number;
  highPerformers?: number;
  conversionRate?: number;
  certificatesIssued?: number;
  metrics?: Record<string, number | string | null | undefined>;
  revenueByMonth?: Array<{
    month?: string;
    year?: number;
    revenue?: number | string;
    deals?: number;
  }>;
  leadsByStage?: Array<{ stage?: string; count?: number; label?: string }>;
  employeePerformance?: TeamPerformanceRow[];
  [key: string]: unknown;
}

export interface TeamSalesRow {
  employeeId?: string | number;
  employeeName?: string;
  name?: string;
  revenue?: number | string;
  deals?: number;
  leads?: number;
  targetAchieved?: number | string;
  monthlyTarget?: number | string;
  incentiveAmount?: number | string;
  targetStatus?: string;
  [key: string]: unknown;
}

export interface TeamSalesResponse {
  items?: TeamSalesRow[];
  data?: TeamSalesRow[];
  totalRevenue?: number | string;
  totalAdmissions?: number;
  monthly: [];
  leadsConverted?: number | string;
  employeeId?: number | string | null;
  supervisorId?: number | string | null;
  [key: string]: unknown;
}

export interface TeamPerformanceRow {
  employeeId?: string | number;
  employeeName?: string;
  name?: string;
  performanceStatus?: TeamPerformanceStatus | string;
  leadsCreated?: number;
  leadsWon?: number;
  leadsAssigned?: number;
  conversionRate?: number;
  totalRevenue?: number | string;
  incentiveAmount?: number | string;
  monthlyTarget?: number | string;
  targetAchieved?: number | string;
  targetStatus?: string;
  [key: string]: unknown;
}

export interface TeamPerformanceResponse {
  items?: TeamPerformanceRow[];
  data?: TeamPerformanceRow[];
  [key: string]: unknown;
}

export interface TeamPaymentRow {
  employeeId?: string | number;
  employeeName?: string;
  name?: string;
  totalCollected?: number | string;
  totalAdmissions?: number | string;
  totalCollections?: number | string;
  lowPerformers?: number;
  highPerformers?: number;
  collected?: number | string;
  paymentCount?: number;
  advanceCount?: number;
  [key: string]: unknown;
}

export interface TeamPaymentsResponse {
  items?: TeamPaymentRow[];
  data?: TeamPaymentRow[];
  totalCollected?: number | string;
  totalAdmissions?: number | string;
  totalCollections?: number | string;
  lowPerformers?: number;
  highPerformers?: number;
  today?: number | string;
  thisWeek?: number | string;
  thisMonth?: number | string;
  collected?: {
    today?: number | string;
    thisWeek?: number | string;
    thisMonth?: number | string;
    total?: number | string;
  };
  [key: string]: unknown;
}

export interface TeamAnalyticsResponse {
  revenueByMonth?: Array<{
    month?: string;
    year?: number;
    revenue?: number | string;
    deals?: number;
  }>;
  salesByMonth?: Array<{
    month?: string;
    year?: number;
    revenue?: number | string;
    deals?: number;
  }>;
  leadsByStage?: Array<{ stage?: string; count?: number; label?: string }>;
  salesByEmployee?: TeamSalesRow[];
  conversionByEmployee?: TeamPerformanceRow[];
  [key: string]: unknown;
}
