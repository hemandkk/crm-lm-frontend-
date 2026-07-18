import type { UserRole } from "@/types";

/** Roles an admin can assign when creating users (not admin itself). */
export const CREATABLE_USER_ROLES: {
  value: Exclude<UserRole, "admin">;
  label: string;
}[] = [
  { value: "employee", label: "Employee" },
  { value: "accountant", label: "Accountant" },
  { value: "processing_team", label: "Processing team" },
];

export function normalizeRole(role: string | null | undefined): UserRole | null {
  const r = String(role ?? "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "_");
  if (
    r === "admin" ||
    r === "employee" ||
    r === "accountant" ||
    r === "processing_team"
  ) {
    return r;
  }
  // Backend aliases
  if (r === "processing" || r === "processingteam") return "processing_team";
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
    case "employee":
      return "Employee";
    default:
      return role || "User";
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
    role === "admin" || role === "employee" || role === "processing_team"
  );
}

export function canVerifyPayments(role: UserRole | null | undefined): boolean {
  return role === "admin" || role === "accountant";
}

/** CRM stage, exam flags, payments, lead create/edit (not accountant/processing). */
export function canEditLeadFields(role: UserRole | null | undefined): boolean {
  return role === "admin" || role === "employee";
}

export function canRecordPayment(role: UserRole | null | undefined): boolean {
  return role === "admin" || role === "employee";
}

export function canMutateLeads(role: UserRole | null | undefined): boolean {
  return role === "admin" || role === "employee" || role === "processing_team";
}

/** Stages processing team is allowed to browse. */
export const PROCESSING_VISIBLE_ADMISSION_STAGES = [
  "waiting_result",
  "result_announced",
] as const;

export const ACCOUNTANT_VISIBLE_ADMISSION_STAGE = "certificate_waiting" as const;

/**
 * Sales employees only — exclude accountant / processing_team from
 * performance, incentives, dashboard filters, assign pickers, and targets.
 * Missing/unknown role is treated as sales employee (backward compatible).
 */
export function isSalesEmployeeRole(
  role: string | null | undefined,
): boolean {
  const normalized = normalizeRole(role);
  if (normalized === "accountant" || normalized === "processing_team") {
    return false;
  }
  return true;
}

export function filterSalesEmployees<T extends { role?: string | null }>(
  employees: T[] | null | undefined,
): T[] {
  return (employees ?? []).filter((e) => isSalesEmployeeRole(e.role));
}

/** Build id/code set of sales employees for filtering report/performance rows. */
export function salesEmployeeIdSet(
  employees: Array<{
    id?: string | number | null;
    employeeId?: string | number | null;
    role?: string | null;
  }> | null | undefined,
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
 * explicitly accountant/processing_team.
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
