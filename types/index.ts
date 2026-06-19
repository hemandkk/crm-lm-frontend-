// ─── AUTH ────────────────────────────────────────────────────────────────────

export type UserRole = "admin" | "employee";

export interface AuthUser {
  id: string;
  name: string;
  email?: string;
  employeeId?: string;
  department?: string;
  designation?: string;
  phone?: string;
  role: UserRole;
}

export interface LoginCredentials {
  identifier: string; // email for admin, employee_id for employee
  password: string;
  role: UserRole;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface AuthResponse {
  user: AuthUser;
  accessToken: string;
  refreshToken: string;
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
  status: EmployeeStatus;
  monthlyTarget: number;
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
}

export interface EmployeeUpdate extends Partial<EmployeeCreate> {}

export interface EmployeePerformance {
  employeeId: string;
  employeeName: string;
  leadsCreated: number;
  leadsWon: number;
  conversionRate: number;
  totalRevenue: number;
  incentiveAmount: number;
  monthlyTarget: number;
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

export interface Prospect {
  id: string;
  prospectId: string;
  name: string;
  email: string;
  phone: string;
  fatherName: string;
  motherName: string;
  dob: string;
  courseId: string;
  courseName: string;
  specialization: string;
  address: string;
  deliveryAddress: string;
  deliveryDate: string | null;
  estimatedValue: number;
  stage: ProspectStage;
  notes: string;
  portalPassword: string;
  assignedTo: string;
  assignedEmployeeName: string;
  examAttended: boolean;
  examCertified: boolean;
  sheetsSynced: boolean;
  totalPaid: number;
  paymentPercentage: number;
  paymentStatus: "none" | "advance" | "partial" | "full";
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
  address: string;
  deliveryAddress: string;
  deliveryDate: string;
  estimatedValue: number;
  notes: string;
}

export interface ProspectUpdate extends Partial<ProspectCreate> {
  stage?: ProspectStage;
  examAttended?: boolean;
  examCertified?: boolean;
}

export interface ProspectFilters {
  stage?: ProspectStage;
  courseId?: string;
  assignedTo?: string;
  paymentStatus?: string;
  dateFrom?: string;
  dateTo?: string;
  search?: string;
  page?: number;
  pageSize?: number;
}

// ─── PAYMENT ─────────────────────────────────────────────────────────────────

export type PaymentType = "advance" | "installment" | "final";

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

export interface PaymentSummary {
  today: number;
  thisWeek: number;
  thisMonth: number;
  total: number;
  advanceCount: number;
  halfPaidCount: number;
  fullPaidCount: number;
}

// ─── COURSE (MASTER) ─────────────────────────────────────────────────────────

export interface Course {
  id: string;
  name: string;
  active: boolean;
  createdAt: string;
}

export interface CourseCreate {
  name: string;
}

// ─── INCENTIVE SLAB ──────────────────────────────────────────────────────────

export interface IncentiveSlab {
  id: string;
  minAmount: number;
  maxAmount: number | null;
  ratePercent: number;
}

export interface IncentiveSlabCreate {
  minAmount: number;
  maxAmount: number | null;
  ratePercent: number;
}

export interface IncentiveStatus {
  eligible: boolean;
  amount: number;
  rate: number;
  slab: string;
  collection: number;
  nextBracketAmount: number | null;
  nextBracketRate: number | null;
}

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
}

export interface MonthlyRevenue {
  month: string; // "Jan 2025"
  revenue: number;
  leadsCount: number;
}

export interface StageCount {
  stage: ProspectStage;
  count: number;
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
  action: string;
  detail: string;
  performedBy: string;
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

export interface Document {
  id: string;
  prospectId: string;
  docType: DocType;
  fileUrl: string;
  fileName: string;
  uploadedBy: string;
  createdAt: string;
}

export interface PaymentFormValues {
  amount: number;
  paymentType: "advance" | "installment" | "final";
  paymentDate: string;
  notes?: string;
  receipt?: File;
}
