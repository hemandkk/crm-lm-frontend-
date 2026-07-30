import type { AuthUser, UserRole } from "@/types";
import { normalizeRole } from "@/lib/roles";

function asRecord(raw: unknown): Record<string, unknown> {
  return (raw ?? {}) as Record<string, unknown>;
}

function pickId(raw: unknown): string | null {
  if (raw == null || raw === "") return null;
  return String(raw);
}

function parseIdList(raw: unknown): string[] {
  if (Array.isArray(raw)) return raw.map((id) => String(id)).filter(Boolean);
  if (typeof raw === "string" && raw.trim()) {
    return raw
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
  }
  return [];
}

/**
 * Normalize login /auth/me / employee payloads into AuthUser org fields.
 * Backend may nest under `employee` or expose `branches` without top-level stateId.
 */
export function normalizeAuthUser(rawInput: unknown): AuthUser {
  const root = asRecord(rawInput);
  const nested = asRecord(root.user ?? root.employee ?? root.data ?? root);
  const r = { ...nested, ...root };

  const role =
    normalizeRole(String(r.role ?? "employee")) ?? ("employee" as UserRole);

  const stateId =
    pickId(r.stateId ?? r.state_id) ??
    pickId(asRecord(r.state).id) ??
    null;

  const branchId = pickId(r.branchId ?? r.branch_id);

  const branchesRaw = r.branches ?? r.Branches;
  const branches = Array.isArray(branchesRaw) ? branchesRaw : [];
  const branchIdsFromBranches = branches
    .map((b) => pickId(asRecord(b).id ?? asRecord(b).branchId))
    .filter(Boolean) as string[];

  let branchIds = parseIdList(r.branchIds ?? r.branch_ids);
  if (!branchIds.length) branchIds = branchIdsFromBranches;
  if (!branchIds.length && branchId) branchIds = [branchId];

  // Infer state from first assigned branch when login omits stateId
  const inferredStateId =
    stateId ??
    (branches.length
      ? pickId(
          asRecord(branches[0]).stateId ?? asRecord(branches[0]).state_id,
        )
      : null);

  return {
    id: String(r.id ?? ""),
    name: String(r.name ?? r.email ?? "User"),
    email: r.email != null ? String(r.email) : undefined,
    employeeId: pickId(r.employeeId ?? r.employee_id) ?? undefined,
    employee_id: pickId(r.employee_id ?? r.employeeId) ?? undefined,
    role,
    stateId: inferredStateId,
    branchId,
    branchIds: branchIds.length ? branchIds : null,
  };
}

/** Merge employee profile geo into existing auth user. */
export function mergeAuthOrgFromEmployee(
  user: AuthUser,
  employee: {
    stateId?: string | null;
    branchId?: string | null;
    branchIds?: string[];
    branches?: Array<{ id: string; stateId?: string | null }>;
  },
): AuthUser {
  const branchIds =
    employee.branchIds?.length
      ? employee.branchIds.map(String)
      : employee.branches?.map((b) => String(b.id)).filter(Boolean) ??
        user.branchIds ??
        null;

  const stateId =
    pickId(employee.stateId) ??
    pickId(employee.branches?.[0]?.stateId) ??
    user.stateId ??
    null;

  return {
    ...user,
    stateId,
    branchId: pickId(employee.branchId) ?? user.branchId ?? null,
    branchIds: branchIds?.length ? branchIds.map(String) : user.branchIds,
  };
}
