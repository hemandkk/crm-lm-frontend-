import type { UserRole } from "@/types";

/** Roles an admin can assign when creating users (not admin itself). */
export const CREATABLE_USER_ROLES: {
  value: Exclude<UserRole, "admin">;
  label: string;
}[] = [
  { value: "employee", label: "Employee" },
  { value: "manager", label: "Branch Manager" },
  { value: "sales_head", label: "Sales Head" },
  { value: "accountant", label: "Accountant" },
  { value: "processing_team", label: "Processing team" },
];

/** Roles that use the personal sales CRM (own leads) + optional Team section. */
export const SALES_CRM_ROLES: UserRole[] = [
  "employee",
  "manager",
  "sales_head",
];

export function normalizeRole(
  role: string | null | undefined,
): UserRole | null {
  const r = String(role ?? "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "_");
  if (
    r === "admin" ||
    r === "employee" ||
    r === "accountant" ||
    r === "processing_team" ||
    r === "manager" ||
    r === "sales_head"
  ) {
    return r;
  }
  // Backend aliases
  if (r === "processing" || r === "processingteam") return "processing_team";
  if (r === "saleshead" || r === "sales-head") return "sales_head";
  return null;
}

export function homePathForRole(role: UserRole | null | undefined): string {
  switch (role) {
    case "admin":
      return "/admin/dashboard";
    case "accountant":
      return "/accountant/leads";
    case "processing_team":
      return "/processing/leads";
    case "manager":
      return "/manager/dashboard";
    case "sales_head":
      return "/sales-head/dashboard";
    case "employee":
    default:
      return "/employee/dashboard";
  }
}

export function roleLabel(role: string | null | undefined): string {
  switch (normalizeRole(role)) {
    case "admin":
      return "Admin";
    case "accountant":
      return "Accountant";
    case "processing_team":
      return "Processing team";
    case "manager":
      return "Branch Manager";
    case "sales_head":
      return "Sales Head";
    case "employee":
      return "Employee";
    default:
      return role || "User";
  }
}

export function hasTeamAccess(role: UserRole | null | undefined): boolean {
  return role === "admin" || role === "manager" || role === "sales_head";
}

export function hasSalesCrmAccess(role: UserRole | null | undefined): boolean {
  return role === "employee" || role === "manager" || role === "sales_head";
}

/** Base path for personal CRM routes by role. */
export function crmBasePathForRole(role: UserRole | null | undefined): string {
  switch (role) {
    case "manager":
      return "/manager";
    case "sales_head":
      return "/sales-head";
    case "admin":
      return "/admin";
    default:
      return "/employee";
  }
}

/** Team section base path. */
export function teamBasePathForRole(role: UserRole | null | undefined): string {
  switch (role) {
    case "manager":
      return "/manager/team";
    case "sales_head":
      return "/sales-head/team";
    case "admin":
      return "/admin/team";
    default:
      return "/manager/team";
  }
}

/** Who may set restricted admission stages (Waiting Result, Result Announced, Completed, Delivered). */
export function canSetRestrictedAdmissionStage(
  role: UserRole | null | undefined,
): boolean {
  return role === "admin" || role === "processing_team";
}

export function canEditAdmissionStage(
  role: UserRole | null | undefined,
): boolean {
  return (
    role === "admin" ||
    role === "employee" ||
    role === "manager" ||
    role === "sales_head" ||
    role === "processing_team" ||
    role === "accountant"
  );
}

/** Completed admission stage — not processing_team or accountant. */
export function canSetCompletedAdmissionStage(
  role: UserRole | null | undefined,
): boolean {
  return (
    role === "admin" ||
    role === "employee" ||
    role === "manager" ||
    role === "sales_head"
  );
}

export function canVerifyPayments(role: UserRole | null | undefined): boolean {
  return role === "admin" || role === "accountant";
}

export function canManageExpenses(role: UserRole | null | undefined): boolean {
  return role === "admin" || role === "accountant";
}

/** Only admin may edit existing expenses (accountant can create, not edit). */
export function canEditExpenses(role: UserRole | null | undefined): boolean {
  return role === "admin";
}

/** Only admin may delete expenses. */
export function canDeleteExpenses(role: UserRole | null | undefined): boolean {
  return role === "admin";
}

export function canManagePaymentRequests(
  role: UserRole | null | undefined,
): boolean {
  return role === "admin" || role === "accountant";
}

/** Admin fulfills payment requests (upload txn id, receipt, date). */
export function canFulfillPaymentRequests(
  role: UserRole | null | undefined,
): boolean {
  return role === "admin";
}

/** Accountant verifies fulfilled requests (creates expense). */
export function canVerifyPaymentRequests(
  role: UserRole | null | undefined,
): boolean {
  return role === "accountant";
}

/** CRM stage, exam flags, payments, lead create/edit. */
export function canEditLeadFields(role: UserRole | null | undefined): boolean {
  return (
    role === "admin" ||
    role === "employee" ||
    role === "manager" ||
    role === "sales_head"
  );
}

export function canRecordPayment(role: UserRole | null | undefined): boolean {
  return (
    role === "admin" ||
    role === "employee" ||
    role === "manager" ||
    role === "sales_head" ||
    role === "accountant" ||
    role === "processing_team"
  );
}
export function canManageLead(
  role: UserRole | null | undefined,
  userId: string | null | undefined,
  leadAssignedToId: string | number | null,
): boolean {
  if (role !== "sales_head") return true;
  if (!userId || leadAssignedToId == null) return false;
  return String(userId) === String(leadAssignedToId);
}
export function canMutateLeads(role: UserRole | null | undefined): boolean {
  return (
    role === "admin" ||
    role === "employee" ||
    role === "manager" ||
    role === "sales_head" ||
    role === "processing_team"
  );
}

/** Stages processing team is allowed to browse. */
export const PROCESSING_VISIBLE_ADMISSION_STAGES = [
  "waiting_result",
  "result_announced",
] as const;

export const ACCOUNTANT_VISIBLE_ADMISSION_STAGE =
  "certificate_waiting" as const;

/**
 * Sales employees only (role=employee) — for assign pickers, targets, etc.
 * Excludes accountant, processing_team, manager, sales_head.
 */
export function isSalesEmployeeRole(role: string | null | undefined): boolean {
  const normalized = normalizeRole(role);
  if (!normalized) return true; // backward compatible when role omitted
  //return normalized === "employee";
  return ["employee", "manager", "sales_head"].includes(normalized);
}

export function filterSalesEmployees<T extends { role?: string | null }>(
  employees: T[] | null | undefined,
): T[] {
  return (employees ?? []).filter((e) => isSalesEmployeeRole(e.role));
}

/** Build id/code set of sales employees for filtering report/performance rows. */
export function salesEmployeeIdSet(
  employees:
    | Array<{
        id?: string | number | null;
        employeeId?: string | number | null;
        role?: string | null;
      }>
    | null
    | undefined,
): Set<string> {
  const set = new Set<string>();
  for (const e of filterSalesEmployees(employees ?? [])) {
    if (e.id != null && e.id !== "") set.add(String(e.id));
    if (e.employeeId != null && e.employeeId !== "") {
      set.add(String(e.employeeId));
    }
  }
  return set;
}

/**
 * Keep performance / sales rows that belong to sales employees.
 * If `role` is on the row, use it; otherwise require id in `salesIds`.
 * When `salesIds` is empty (employees not loaded), keep rows that aren't
 * explicitly non-sales roles.
 */
export function filterSalesPerformanceRows<
  T extends { employeeId?: string | number; role?: string | null },
>(rows: T[] | null | undefined, salesIds?: Set<string>): T[] {
  return (rows ?? []).filter((row) => {
    if (row.role != null && row.role !== "") {
      return isSalesEmployeeRole(row.role);
    }
    if (salesIds && salesIds.size > 0) {
      return salesIds.has(String(row.employeeId));
    }
    return true;
  });
}
