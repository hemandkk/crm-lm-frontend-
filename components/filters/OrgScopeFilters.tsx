"use client";

import { useMemo } from "react";
import { useStates, useBranches } from "@/hooks";
import { useEmployees, useSalesEmployees } from "@/hooks/useEmployees";
import { useTeamMembers } from "@/hooks/useTeam";
import { roleLabel } from "@/lib/roles";
import { cn } from "@/lib/utils";
import type { Employee } from "@/types";
import type { TeamMember } from "@/types/team";

export interface OrgScopeValue {
  stateId: string;
  branchId: string;
  employeeId: string;
}

export type EmployeeOptionsMode = "all" | "sales" | "team";

const SELECT_CLASS =
  "px-3 py-1.5 text-sm border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-600 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-primary-600 min-w-[9rem]";

const SELECT_CLASS_SM =
  "w-full sm:w-auto max-w-full sm:max-w-[200px] px-2.5 py-1.5 text-xs rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-600 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-primary-600";

function employeeLabel(
  e: Pick<
    Employee,
    "name" | "employeeId" | "branchName" | "role"
  > & { id: string | number },
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
  employeeId: string;
  onChange: (next: OrgScopeValue) => void;
  showEmployee?: boolean;
  employeeOptionsMode?: EmployeeOptionsMode;
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
}

export default function OrgScopeFilters({
  stateId,
  branchId,
  employeeId,
  onChange,
  showEmployee = true,
  employeeOptionsMode = "sales",
  supervisorId,
  teamMembers: teamMembersProp,
  includeRoleInLabel = false,
  employeePlaceholder = "All employees",
  size = "md",
  className,
  disabled = false,
}: OrgScopeFiltersProps) {
  const selectClass = size === "sm" ? SELECT_CLASS_SM : SELECT_CLASS;

  const { data: states = [] } = useStates();
  const { data: branches = [] } = useBranches(
    { stateId: stateId || undefined },
    !!stateId,
  );

  const loadAll = showEmployee && employeeOptionsMode === "all";
  const loadSales = showEmployee && employeeOptionsMode === "sales";
  const loadTeam =
    showEmployee && employeeOptionsMode === "team" && !teamMembersProp;

  const { data: allEmployeesData } = useEmployees({
    status: "active",
    pageSize: 500,
    stateId: stateId || undefined,
    branchId: branchId || undefined,
    enabled: loadAll,
  });

  const { employees: salesEmployees } = useSalesEmployees({
    status: "active",
    pageSize: 200,
    stateId: stateId || undefined,
    branchId: branchId || undefined,
    enabled: loadSales,
  });

  const { data: fetchedTeamMembers = [] } = useTeamMembers(
    { supervisorId: supervisorId || undefined },
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
      employeeId,
      ...partial,
    });
  };

  return (
    <div className={cn("flex gap-3 flex-wrap items-end", className)}>
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
          <label className="text-xs font-medium text-gray-500">Branch</label>
        )}
        <select
          value={branchId}
          disabled={disabled || !stateId}
          onChange={(e) =>
            patch({
              branchId: e.target.value,
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
