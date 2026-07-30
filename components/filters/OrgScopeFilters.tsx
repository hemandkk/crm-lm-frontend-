"use client";

import { useMemo } from "react";
import { useStates, useBranches } from "@/hooks";
import {
  useEmployee,
  useEmployees,
  useSalesEmployees,
} from "@/hooks/useEmployees";
import { useTeamMembers } from "@/hooks/useTeam";
import { useAuthStore } from "@/store/authStore";
import { roleLabel } from "@/lib/roles";
import { cn } from "@/lib/utils";
import type { Employee } from "@/types";
import type { TeamMember } from "@/types/team";

export interface OrgScopeValue {
  stateId: string;
  branchId: string;
  /** Sales head multi-select; empty = all assigned branches */
  branchIds: string[];
  employeeId: string;
}

export type EmployeeOptionsMode = "all" | "sales" | "team";

/** admin = state + single branch; sales_head = multi branch only */
export type OrgScopeVariant = "default" | "sales_head";

const SELECT_CLASS =
  "px-3 py-1.5 text-sm border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-600 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-primary-600 min-w-[9rem]";

const SELECT_CLASS_SM =
  "w-full sm:w-auto max-w-full sm:max-w-[200px] px-2.5 py-1.5 text-xs rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-600 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-primary-600";

function employeeLabel(
  e: Pick<Employee, "name" | "employeeId" | "branchName" | "role"> & {
    id: string | number;
  },
  includeRole = false,
) {
  const base = e.employeeId ? `${e.name} (${e.employeeId})` : e.name;
  const withBranch = e.branchName ? `${base} — ${e.branchName}` : base;
  if (includeRole && e.role) {
    return `${withBranch} — ${roleLabel(e.role)}`;
  }
  return withBranch;
}

function teamMemberLabel(m: TeamMember) {
  const base = m.employeeId ? `${m.name} (${m.employeeId})` : m.name;
  return m.branchName ? `${base} — ${m.branchName}` : base;
}

interface OrgScopeFiltersProps {
  stateId: string;
  branchId: string;
  branchIds?: string[];
  employeeId: string;
  onChange: (next: OrgScopeValue) => void;
  showEmployee?: boolean;
  employeeOptionsMode?: EmployeeOptionsMode;
  variant?: OrgScopeVariant;
  /** Used when employeeOptionsMode is "team" to scope members */
  supervisorId?: string;
  /** Optional preloaded team members (skips internal team fetch when provided) */
  teamMembers?: TeamMember[];
  /** Include role in employee option labels (admin assignee pickers) */
  includeRoleInLabel?: boolean;
  employeePlaceholder?: string;
  size?: "sm" | "md";
  className?: string;
  disabled?: boolean;
  /** Hide state/branch entirely (e.g. accountant) */
  hideOrgScope?: boolean;
}

export default function OrgScopeFilters({
  stateId,
  branchId,
  branchIds = [],
  employeeId,
  onChange,
  showEmployee = true,
  employeeOptionsMode = "sales",
  variant = "default",
  supervisorId,
  teamMembers: teamMembersProp,
  includeRoleInLabel = false,
  employeePlaceholder = "All employees",
  size = "md",
  className,
  disabled = false,
  hideOrgScope = false,
}: OrgScopeFiltersProps) {
  const selectClass = size === "sm" ? SELECT_CLASS_SM : SELECT_CLASS;
  const isSalesHead = variant === "sales_head";
  const user = useAuthStore((s) => s.user);

  // Read-only fallback while AppShell hydrates auth geo — do not write to the store here
  // (writing caused max update depth loops).
  const needsSelfProfile =
    isSalesHead &&
    !!user?.id &&
    (user.stateId == null ||
      String(user.stateId) === "" ||
      !user.branchIds?.length);
  const { data: selfEmployee, isLoading: selfLoading } = useEmployee(
    user?.id ?? "",
    needsSelfProfile,
  );

  const salesHeadStateId =
    (user?.stateId != null && String(user.stateId) !== ""
      ? String(user.stateId)
      : "") ||
    (selfEmployee?.stateId != null && String(selfEmployee.stateId) !== ""
      ? String(selfEmployee.stateId)
      : "");

  const assignedBranchIdSet = useMemo(() => {
    const fromUser = user?.branchIds?.map(String).filter(Boolean) ?? [];
    const fromSelf = selfEmployee?.branchIds?.map(String).filter(Boolean) ?? [];
    const fromBranches =
      selfEmployee?.branches?.map((b) => String(b.id)).filter(Boolean) ?? [];
    const ids =
      fromUser.length > 0
        ? fromUser
        : fromSelf.length > 0
          ? fromSelf
          : fromBranches.length > 0
            ? fromBranches
            : user?.branchId != null && String(user.branchId) !== ""
              ? [String(user.branchId)]
              : [];
    return ids.length ? new Set(ids) : null;
  }, [user?.branchIds, user?.branchId, selfEmployee]);

  const branchListStateId = isSalesHead ? salesHeadStateId : stateId;

  const { data: states = [] } = useStates(!hideOrgScope && !isSalesHead);
  const { data: allBranchesForState = [], isLoading: branchesLoading } =
    useBranches(
      { stateId: branchListStateId || undefined },
      !hideOrgScope && !!branchListStateId,
    );

  /** Sales head: only assigned branches (not whole state). */
  const branches = useMemo(() => {
    if (!isSalesHead) return allBranchesForState;
    if (!assignedBranchIdSet) return allBranchesForState;
    return allBranchesForState.filter((b) =>
      assignedBranchIdSet.has(String(b.id)),
    );
  }, [isSalesHead, assignedBranchIdSet, allBranchesForState]);

  const loadAll = showEmployee && employeeOptionsMode === "all";
  const loadSales = showEmployee && employeeOptionsMode === "sales";
  const loadTeam =
    showEmployee && employeeOptionsMode === "team" && !teamMembersProp;

  const empScope = isSalesHead
    ? {
        branchIds: branchIds.length ? branchIds.join(",") : undefined,
      }
    : {
        stateId: stateId || undefined,
        branchId: branchId || undefined,
      };

  const { data: allEmployeesData } = useEmployees({
    status: "active",
    pageSize: 500,
    ...empScope,
    enabled: loadAll,
  });

  const { employees: salesEmployees } = useSalesEmployees({
    status: "active",
    pageSize: 200,
    ...empScope,
    enabled: loadSales,
  });

  const { data: fetchedTeamMembers = [] } = useTeamMembers(
    {
      supervisorId: supervisorId || undefined,
      ...(isSalesHead
        ? {
            branchIds: branchIds.length ? branchIds.join(",") : undefined,
          }
        : {
            stateId: stateId || undefined,
            branchId: branchId || undefined,
          }),
    },
    loadTeam,
  );

  const teamMembers = teamMembersProp ?? fetchedTeamMembers;

  const employeeOptions = useMemo(() => {
    if (!showEmployee) return [];

    if (employeeOptionsMode === "team") {
      return teamMembers.map((m) => ({
        value: String(m.id),
        label: teamMemberLabel(m),
      }));
    }

    const rows: Employee[] =
      employeeOptionsMode === "all"
        ? ((allEmployeesData?.items as Employee[] | undefined) ??
          (allEmployeesData?.data as Employee[] | undefined) ??
          [])
        : salesEmployees;

    return rows.map((e) => ({
      value: String(e.id),
      label: employeeLabel(e, includeRoleInLabel),
    }));
  }, [
    showEmployee,
    employeeOptionsMode,
    teamMembers,
    allEmployeesData,
    salesEmployees,
    includeRoleInLabel,
  ]);

  const patch = (partial: Partial<OrgScopeValue>) => {
    onChange({
      stateId,
      branchId,
      branchIds,
      employeeId,
      ...partial,
    });
  };

  const toggleBranchId = (id: string) => {
    const next = branchIds.includes(id)
      ? branchIds.filter((b) => b !== id)
      : [...branchIds, id];
    patch({
      branchIds: next,
      branchId: "",
      employeeId: "",
    });
  };

  if (hideOrgScope && !showEmployee) return null;

  return (
    <div className={cn("flex gap-3 flex-wrap items-end", className)}>
      {!hideOrgScope && !isSalesHead && (
        <>
          <div className="flex flex-col gap-1">
            {size === "md" && (
              <label className="text-xs font-medium text-gray-500">State</label>
            )}
            <select
              value={stateId}
              disabled={disabled}
              onChange={(e) =>
                patch({
                  stateId: e.target.value,
                  branchId: "",
                  branchIds: [],
                  employeeId: "",
                })
              }
              className={cn(selectClass, disabled && "opacity-50")}
              aria-label="State"
            >
              <option value="">All states</option>
              {states.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                  {s.stateCode ? ` (${s.stateCode})` : ""}
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-col gap-1">
            {size === "md" && (
              <label className="text-xs font-medium text-gray-500">
                Branch
              </label>
            )}
            <select
              value={branchId}
              disabled={disabled || !stateId}
              onChange={(e) =>
                patch({
                  branchId: e.target.value,
                  branchIds: [],
                  employeeId: "",
                })
              }
              className={cn(
                selectClass,
                (disabled || !stateId) && "opacity-50",
              )}
              aria-label="Branch"
            >
              <option value="">
                {stateId ? "All branches" : "Select state first"}
              </option>
              {branches.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name}
                  {b.branchCode ? ` (${b.branchCode})` : ""}
                </option>
              ))}
            </select>
          </div>
        </>
      )}

      {!hideOrgScope && isSalesHead && (
        <div className="flex flex-col gap-1 min-w-[12rem] max-w-[18rem]">
          {size === "md" && (
            <label className="text-xs font-medium text-gray-500">
              Branches
              {branchIds.length
                ? ` (${branchIds.length} selected)`
                : " (all assigned)"}
            </label>
          )}
          <div
            className={cn(
              "max-h-36 overflow-y-auto border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 px-2 py-1.5",
              disabled && "opacity-50",
            )}
          >
            {!salesHeadStateId ? (
              <p className="text-xs text-gray-400 py-1">
                {selfLoading || needsSelfProfile
                  ? "Loading your branches…"
                  : "Could not load your state — try signing out and back in"}
              </p>
            ) : branchesLoading ? (
              <p className="text-xs text-gray-400 py-1">Loading branches…</p>
            ) : !branches.length ? (
              <p className="text-xs text-gray-400 py-1">
                No assigned branches found
              </p>
            ) : (
              <>
                <label className="flex items-center gap-2 py-1 text-xs text-gray-700 dark:text-gray-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={branchIds.length === 0}
                    disabled={disabled}
                    onChange={() =>
                      patch({
                        branchIds: [],
                        branchId: "",
                        employeeId: "",
                      })
                    }
                    className="rounded border-gray-300"
                  />
                  <span>All</span>
                </label>
                {branches.map((b) => {
                  const id = String(b.id);
                  const checked = branchIds.includes(id);
                  return (
                    <label
                      key={id}
                      className="flex items-center gap-2 py-1 text-xs text-gray-700 dark:text-gray-300 cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={checked}
                        disabled={disabled}
                        onChange={() => toggleBranchId(id)}
                        className="rounded border-gray-300"
                      />
                      <span className="truncate">
                        {b.name}
                        {b.branchCode ? ` (${b.branchCode})` : ""}
                      </span>
                    </label>
                  );
                })}{" "}
              </>
            )}
          </div>
          {branchIds.length > 0 && (
            <button
              type="button"
              className="text-[10px] text-primary-600 hover:underline text-left"
              onClick={() => patch({ branchIds: [], employeeId: "" })}
            >
              Clear branch filter
            </button>
          )}
        </div>
      )}

      {showEmployee && (
        <div className="flex flex-col gap-1">
          {size === "md" && (
            <label className="text-xs font-medium text-gray-500">
              Employee
            </label>
          )}
          <select
            value={employeeId}
            disabled={disabled}
            onChange={(e) => patch({ employeeId: e.target.value })}
            className={cn(selectClass, disabled && "opacity-50")}
            aria-label="Employee"
          >
            <option value="">{employeePlaceholder}</option>
            {employeeOptions.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </div>
      )}
    </div>
  );
}
