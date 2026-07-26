// ─── AUTH ────────────────────────────────────────────────────────────────────

export type UserRole =
  | "admin"
  | "employee"
  | "accountant"
  | "processing_team"
  | "manager"
  | "sales_head";

export interface AuthUser {
  id: string;
  name: string;
  email?: string;
  employee_id?: string;
  department?: string;
  designation?: string;
  phone?: string;
  role: UserRole;
}

export interface LoginCredentials {
  identifier: string; // email for admin, employee_id for employee
  password: string;
  role?: UserRole;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface AuthResponse {
  user: AuthUser;
  access_token: string;
  refresh_token: string;
}

// ─── EMPLOYEE ────────────────────────────────────────────────────────────────

export type EmployeeStatus = "active" | "inactive";

export interface Employee {
  id: string;
  employeeId: string;
  name: string;
  email: string;
  phone: string;
  department: string;
  designation: string;
  /** Assigned app role (not admin) */
  role?: Exclude<UserRole, "admin"> | string;
  status: EmployeeStatus;
  monthlyTarget: number;
  /** Reporting hierarchy (sales employees only) */
  reportsToManagerId?: string | null;
  reportsToSalesHeadId?: string | null;
  reportsToManagerName?: string | null;
  reportsToSalesHeadName?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface EmployeeCreate {
  name: string;
  email: string;
  phone: string;
  department: string;
  designation: string;
  password: string;
  monthlyTarget: number;
  /** Admin-created users */
  role: Exclude<UserRole, "admin">;
  reportsToManagerId?: string | number | null;
  reportsToSalesHeadId?: string | number | null;
}

export interface EmployeeUpdate extends Partial<EmployeeCreate> {}

export interface EmployeePerformance {
  employeeId: string;
  employeeName: string;
  /** When present, used to exclude accountant / processing_team */
  role?: string;
  leadsCreated: number;
  leadsWon: number;
  conversionRate: number;
  totalRevenue: number;
  revenue: number;
  incentiveAmount: number;
  monthlyTarget: number;
  leadsConverted?: number | string;
  leadsAssigned: number;
  targetAchieved: number;
  targetStatus: "excellent" | "met" | "on_track" | "behind";
}

// ─── PROSPECT / LEAD ─────────────────────────────────────────────────────────

export type ProspectStage =
  | "new"
  | "contacted"
  | "negotiation"
  | "won"
  | "lost";

/** Admission pipeline (separate from CRM stage) */
export type AdmissionStage =
  | "registered"
  | "fifty_percent_paid"
  | "exam_attended"
  | "waiting_for_100_percent_payment"
  | "certificate_waiting"
  | "waiting_result"
  | "result_announced"
  | "completed"
  | "delivered";

/** Accountant payment verification */
export type PaymentVerificationStatus =
  | "verified"
  | "not_verified"
  | "not_credited";

export interface Prospect {
  id: string;
  prospectId: string;
  password: string;
  name: string;
  email: string;
  phone: string;
  fatherName: string;
  motherName: string;
  dob: string;
  courseId: string;
  courseName: string;
  specialization: string;
  university: string;
  address: string;
  deliveryAddress: string;
  deliveryDate: string | null;
  estimatedValue: number;
  stage: ProspectStage;
  /** Admission pipeline stage (independent of CRM stage) */
  admissionStage: AdmissionStage;
  notes: string;
  /** Assigned employee user id (API: assignedToId) */
  assignedTo: string;
  assignedToId: string | null;
  assignedEmployeeName: string;
  assignedToName: string;
  assignedToCode: string;
  examAttended: boolean;
  examCertified: boolean;
  sheetsSynced: boolean;
  totalPaid: number;
  paymentPercentage: number;
  paymentStatus: "none" | "advance" | "partial" | "full";
  /** True when every payment is accountant-verified */
  paymentsVerified?: boolean;
  documents: Document[];
  createdAt: string;
  updatedAt: string;
  payments: Payment[];
}

export interface ProspectCreate {
  name: string;
  email: string;
  phone: string;
  fatherName: string;
  motherName: string;
  courseId: string;
  specialization: string;
  university: string;
  address: string;
  deliveryAddress: string;
  deliveryDate: string;
  estimatedValue: number;
  notes: string;
  /** Admin-only: assign to employee user id on create */
  assignedToId?: number | string | null;
}

export interface ProspectUpdate extends Partial<ProspectCreate> {
  stage?: ProspectStage;
  examAttended?: boolean;
  examCertified?: boolean;
}

export interface ProspectFilters {
  stage?: ProspectStage;
  /** Filter by admission pipeline stage */
  admissionStage?: AdmissionStage;
  /** Multi-stage filter (e.g. processing team: waiting_result + result_announced) */
  admissionStages?: AdmissionStage[];
  courseId?: string;
  assignedTo?: string;
  /** Filter by assigned user (admin: any; manager/sales_head: team) */
  assignedToId?: string;
  paymentStatus?: string;
  createdFrom?: string;
  createdTo?: string;
  search?: string;
  page?: number;
  pageSize?: number;
}

// ─── PAYMENT ─────────────────────────────────────────────────────────────────

export const PAYMENT_TYPES = [
  "advance",
  "installment",
  "full_payment",
  "registration_fee",
  "before_exam_fee",
  "after_result_fee",
] as const;

export type PaymentType = (typeof PAYMENT_TYPES)[number];

export interface Payment {
  id: string;
  prospectId: string;
  prospectName: string;
  amount: number;
  paymentType: PaymentType;
  paymentDate: string;
  receiptUrl: string | null;
  notes: string;
  createdBy: string;
  createdByName: string;
  createdAt: string;
  /** Accountant verification */
  verificationStatus?: PaymentVerificationStatus | null;
  verifiedAt?: string | null;
  verifiedByName?: string | null;
}

export interface PaymentCreate {
  prospectId: string;
  amount: number;
  paymentType: PaymentType;
  paymentDate: string;
  notes?: string;
  receipt?: File;
}

export interface PaymentFilters {
  dateFrom?: string;
  dateTo?: string;
  prospectId?: string;
  employeeId?: string;
}

export interface PaymentSummaryByType {
  advance?: number;
  installment?: number;
  fullPayment?: number;
  registrationFee?: number;
  beforeExamFee?: number;
  afterResultFee?: number;
}

export interface PaymentSummary {
  today: number;
  thisWeek: number;
  thisMonth: number;
  total: number;
  advanceCount: number;
  halfPaidCount: number;
  fullPaidCount: number;
  totalCollected: number;
  collected: {
    custom: number;
    thisMonth: number;
    thisWeek: number;
    today: number;
    total: number;
  };
  byType?: PaymentSummaryByType;
}

// ─── COURSE (MASTER) ─────────────────────────────────────────────────────────

export interface Course {
  id: string;
  name: string;
  courseCode?: string | null;
  specialization?: string | null;
  duration?: string | null;
  fees?: number | string | null;
  description?: string | null;
  active: boolean;
  createdAt: string;
}

export interface CourseCreate {
  name: string;
  courseCode?: string | null;
  specialization?: string | null;
  duration?: string | null;
  fees?: number | null;
  description?: string | null;
  active?: boolean;
}

export interface CourseUpdate extends Partial<CourseCreate> {}

// ─── SPECIALIZATION (MASTER — not FK-linked to leads) ────────────────────────

export interface Specialization {
  id: string;
  name: string;
  specializationCode?: string | null;
  description?: string | null;
  active: boolean;
  createdAt?: string;
}

export interface SpecializationCreate {
  name: string;
  specializationCode?: string | null;
  description?: string | null;
  active?: boolean;
}

export interface SpecializationUpdate extends Partial<SpecializationCreate> {}

export interface MasterImportResult {
  created: number;
  updated: number;
  skipped: number;
  errors: Array<string | { row?: number; message?: string }>;
}

// ─── INCENTIVE SLAB ──────────────────────────────────────────────────────────

export interface IncentiveSlab {
  id: string;
  minLeads: number;
  maxLeads: number | null;
  incentiveAmount: number;
}

export interface IncentiveSlabCreate {
  minLeads: number;
  maxLeads: number | null;
  incentiveAmount: number;
}

// ─── MONTHLY TARGETS (masters) ───────────────────────────────────────────────

export type TargetSource = "assigned" | "default";

export interface MonthlyTargetDefault {
  defaultMonthlyTarget: number | string;
}

export interface EmployeeMonthlyTarget {
  employeeId: number | string;
  employeeCode?: string;
  employeeName?: string;
  /** When present, used to exclude accountant / processing_team from targets UI */
  role?: string;
  /** Custom assignment; null means use org default */
  assignedTarget: number | string | null;
  /** Value used in calculations */
  effectiveTarget: number | string;
  targetAssigned: boolean;
  targetSource: TargetSource;
}

export interface MonthlyTargetsOverview {
  defaultMonthlyTarget: number | string;
  employees: EmployeeMonthlyTarget[];
}

export interface BulkMonthlyTargetItem {
  employeeId: number | string;
  /** null clears custom assignment → master default applies */
  monthlyTarget: number | null;
}

/** Single employee row from GET /reports/incentives */
export interface IncentiveReportItem {
  employeeId: number;
  employeeCode: string;
  employeeName: string;
  eligible: boolean;
  amount: string | number;
  slab: string | null;
  leadCount: number;
  nextBracketLeads: number | null;
  nextBracketIncentive: string | number | null;
}

/** Full response from GET /reports/incentives?month=YYYY-MM */
export interface IncentiveReport {
  month: string;
  dateFrom: string;
  dateTo: string;
  items: IncentiveReportItem[];
  totals: {
    leadCount: number;
    incentiveAmount: string | number;
    eligibleCount: number;
    employeeCount: number;
  };
}

/** Compact shape used on employee dashboard / status cards */
export interface IncentiveStatus {
  eligible: boolean;
  amount: number | string;
  rate?: number;
  slab: string | null;
  leadCount: number;
  nextBracketLeads: number | null;
  nextBracketIncentive: number | string | null;
  /** @deprecated use leadCount */
  collection?: number;
  nextBracketAmount?: number | null;
  nextBracketRate?: number | null;
}

// ─── INCENTIVE RELEASES ─────────────────────────────────────────────────────

/** Single admission-month row from GET /reports/incentive-releases */
export interface IncentiveReleaseMonth {
  month: string;
  admissions: number;
  slabRate: number;
  bookedIncentive: number;
  completedAdmissions: number;
  receivableIncentive: number;
}

/** Summary totals for incentive releases */
export interface IncentiveReleaseSummary {
  totalAdmissions: number;
  totalBookedIncentive: number;
  totalCompletedAdmissions: number;
  totalReceivableIncentive: number;
  totalPaid: number;
  balanceToPay: number;
}

/** Single-employee response from GET /reports/incentive-releases?month=YYYY-MM */
export interface IncentiveReleaseResponse {
  month: string;
  dateFrom: string;
  dateTo: string;
  data: IncentiveReleaseData;
}

/** Per-employee incentive release data */
export interface IncentiveReleaseData {
  month: string;
  dateFrom: string;
  dateTo: string;
  employeeId: number;
  employeeCode: string;
  employeeName: string;
  months: IncentiveReleaseMonth[];
  summary: IncentiveReleaseSummary;
}
export interface IncentiveReleaseListResponse {
  month: string;
  dateFrom: string;
  dateTo: string;
  items: IncentiveReleaseData[];
}
export type IncentiveReleaseResult =
  | IncentiveReleaseData
  | IncentiveReleaseListResponse;
// ─── DASHBOARD ───────────────────────────────────────────────────────────────

export interface AdminDashboard {
  totalEmployees: number;
  totalLeads: number;
  totalRevenue: number;
  conversionRate: number;
  certificatesIssued: number;
  leadsThisMonth: number;
  leadsThisWeek: number;
  leadsToday: number;
  revenueByMonth: MonthlyRevenue[];
  leadsByStage: StageCount[];
  leadsByAdmissionStage: AdmissionStageCount[];
  employeePerformance: EmployeePerformance[];
  topPerformers: EmployeePerformance[];
}

export interface EmployeeDashboard {
  totalLeads: number;
  leadsThisMonth: number;
  leadsThisWeek: number;
  leadsToday: number;
  monthlyTarget: number;
  targetAchieved: number;
  targetStatus: "excellent" | "met" | "on_track" | "behind";
  paymentSummary: PaymentSummary;
  incentive: IncentiveStatus;
  examStats: { attended: number; certified: number };
  paymentCollected: {
    custom: number;
    thisMonth: number;
    thisWeek: number;
    today: number;
    total: number;
  };
  paymentStatus: {
    advancedPaid: number;
    fiftyPercentPaid: number;
    hundredPercentPaid: number;
  };
  leadsByStage: StageCount[];
  leadsByAdmissionStage: AdmissionStageCount[];
  leadCounts: {
    custom: number;
    thisMonth: number;
    thisWeek: number;
    today: number;
    total: number;
  };
}

export interface MonthlyRevenueListResponse {
  items: MonthlyRevenue[];
  total: number;
}

export interface MonthlyRevenue {
  month: string; // "Jan" or "Jan 2025"
  year?: number;
  revenue: number | string;
  leadsCount?: number;
  deals?: number;
}

export interface SalesByMonth {
  month: string;
  year: number;
  revenue: string | number;
  deals: number;
}

export interface SalesByEmployee {
  employeeId: number;
  employeeName: string;
  revenue: string | number;
  deals: number;
  targetAchieved: string | number;
  monthlyTarget: string | number;
  targetStatus: "excellent" | "met" | "on_track" | "behind";
  targetAssigned: boolean;
  targetSource: string;
  incentiveAmount: string | number;
}

export interface RevenueReport {
  totalRevenue: string | number;
  paymentCollected: {
    today: string | number;
    thisWeek: string | number;
    thisMonth: string | number;
    total: string | number;
    custom: string | number | null;
  };
  salesByMonth: SalesByMonth[];
  salesByEmployee: SalesByEmployee[];
}

export interface StageCount {
  stage: ProspectStage;
  count: number;
}

export const ADMISSION_STAGE_LABELS: Record<AdmissionStage, string> = {
  registered: "Registered",
  fifty_percent_paid: "50% Payment",
  exam_attended: "Exam Attended",
  waiting_for_100_percent_payment: "Awaiting Full Payment",
  certificate_waiting: "100% Paid",
  waiting_result: "Awaiting Result",
  result_announced: "Result Announced - Waiting for 100% Payment",
  completed: "Course Completed",
  delivered: "Certificate Delivered",
};

export interface AdmissionStageCount {
  admission_stage: AdmissionStage;
  count: number;
}

export interface StageCountListResponse {
  items: StageCount[];
  total: number;
}

export interface AdmissionStageCountListResponse {
  items: AdmissionStageCount[];
  total: number;
}
// ─── ACTIVITY LOG ────────────────────────────────────────────────────────────

export interface ActivityLog {
  id: string;
  userId: string;
  userName: string;
  userType: UserRole;
  action: string;
  entityType: string;
  entityId: string;
  detail: Record<string, unknown>;
  ipAddress: string;
  createdAt: string;
}

// ─── NOTIFICATION ────────────────────────────────────────────────────────────

export interface Notification {
  id: string;
  title: string;
  body: string;
  read: boolean;
  createdAt: string;
}

// ─── TIMELINE ────────────────────────────────────────────────────────────────

export interface TimelineEvent {
  id: string;
  type: string;
  description: string;
  title: string;
  userName: string;
  createdAt: string;
}

// ─── REPORT FILTERS ──────────────────────────────────────────────────────────

export interface ReportFilters {
  dateFrom?: string;
  dateTo?: string;
  employeeId?: string;
  stage?: ProspectStage;
}

export interface ExportRequest extends ReportFilters {
  format: "xlsx" | "csv" | "pdf";
  entity: "leads" | "employees" | "payments";
}

// ─── API PAGINATION ──────────────────────────────────────────────────────────

export interface PaginatedResponse<T> {
  data: T[];
  items?: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface ApiError {
  message: string;
  statusCode: number;
  errors?: Record<string, string[]>;
}

export enum StatusCode {
  Success = 200,
  BadRequest = 400,
  Unauthorized, // 401 (auto-incremented)
}
export enum Direction {
  Up, // 0
  Down, // 1
  Left, // 2
  Right, // 3
}
export enum UserRoleS {
  Admin = "ADMIN",
  Editor = "EDITOR",
  Viewer = "VIEWER",
}
//let currentRole: UserRoleS = UserRoleS.Admin;

// ─── DOCUMENT ────────────────────────────────────────────────────────────────

export type DocType =
  | "aadhaar"
  | "photo"
  | "sslc"
  | "plus_two"
  | "degree"
  | "agreement";

/** Matches GET /prospects/:id/documents item shape */
export interface Document {
  id: number;
  document_id: string;
  prospect_id: number;
  document_type: DocType;
  original_filename: string;
  stored_filename: string;
  file_url: string;
  mime_type: string;
  file_size: number;
  remarks: string | null;
  verified: boolean;
  created_at: string;
  updated_at: string;
}

export interface DocumentsListResponse {
  items: Document[];
  total: number;
}
export interface EmployeeListResponse {
  items: Employee[];
  total: number;
}
export interface TimelineListResponse {
  items: TimelineEvent[];
  total: number;
}
export interface PaymentListResponse {
  items: Payment[];
  total: number;
}

export interface PaymentFormValues {
  amount: number;
  paymentType: PaymentType;
  paymentDate: string;
  notes?: string;
  receipt: File;
}

// ─── EXPENSES ────────────────────────────────────────────────────────────────

export interface Expense {
  id: string;
  expenseId: string; // EXP00001
  expenseDate: string;
  description: string;
  amount: number;
  paidTo: string;
  transactionId: string;
  installmentNumber: string;
  receiptUrl: string | null;
  invoiceUrl: string | null;
  paymentRequestId?: string | null;
  expenseType?: "office" | "incentive";
  employeeId?: string | null;
  employeeName?: string | null;
  /** Who saved the expense row */
  createdById?: string | null;
  createdByName?: string | null;
  /** Accountant who requested (from linked payment request) */
  requestedById?: string | null;
  requestedByName?: string | null;
  /** Admin who paid (from linked payment request) */
  approvedById?: string | null;
  approvedByName?: string | null;
  /** Accountant who verified */
  verifiedById?: string | null;
  verifiedByName?: string | null;
  createdAt: string;
  updatedAt?: string;
}

export interface ExpenseCreate {
  expenseDate: string;
  description: string;
  amount: number;
  paidTo: string;
  transactionId?: string;
  installmentNumber?: string;
  expenseType?: "office" | "incentive";
  employeeId?: string;
  receipt?: File | null;
  invoice?: File | null;
}

export interface ExpenseUpdate {
  expenseDate?: string;
  description?: string;
  amount?: number;
  paidTo?: string;
  transactionId?: string;
  installmentNumber?: string;
  expenseType?: "office" | "incentive";
  employeeId?: string;
  receipt?: File | null;
  invoice?: File | null;
}

export interface ExpenseFilters {
  dateFrom?: string;
  dateTo?: string;
  search?: string;
  expenseType?: string;
  employeeId?: string;
  page?: number;
  pageSize?: number;
}

// ─── PAYMENT REQUESTS ────────────────────────────────────────────────────────

export type PaymentRequestStatus = "requested" | "payment_done" | "approved";

export interface PaymentRequest {
  id: string;
  requestId: string; // PRQ00001
  description: string;
  paidToDetails: string;
  amount: number;
  installmentNumber: string;
  status: PaymentRequestStatus;
  paymentType?: "office" | "incentive";
  employeeId?: string | null;
  employeeName?: string | null;
  /** Admin fulfillment */
  transactionId?: string | null;
  paymentDate?: string | null;
  receiptUrl?: string | null;
  /** Accountant who created the request */
  requestedById?: string | null;
  requestedByName?: string | null;
  /** Admin who fulfilled payment (also paidBy*) */
  approvedById?: string | null;
  approvedByName?: string | null;
  paidById?: string | null;
  paidByName?: string | null;
  /** Accountant who verified */
  verifiedById?: string | null;
  verifiedByName?: string | null;
  expenseId?: string | null;
  createdAt: string;
  updatedAt?: string;
}

export interface PaymentRequestCreate {
  description: string;
  paidToDetails: string;
  amount: number;
  installmentNumber?: string;
  paymentType?: "office" | "incentive";
  employeeId?: string;
}

export interface PaymentRequestFulfill {
  transactionId: string;
  paymentDate: string;
  receipt?: File | null;
}

export interface PaymentRequestFilters {
  status?: PaymentRequestStatus | "";
  paymentType?: string;
  dateFrom?: string;
  dateTo?: string;
  search?: string;
  page?: number;
  pageSize?: number;
}
