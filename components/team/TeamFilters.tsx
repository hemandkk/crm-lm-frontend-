"use client";

import type { TeamMember, TeamSupervisor } from "@/types/team";

export interface TeamFilterState {
  period: string;
  customFrom: string;
  customTo: string;
  employeeId: string;
  supervisorId: string;
}

export function toDateString(d: Date) {
  return d.toISOString().split("T")[0];
}

export function getPeriodRange(
  period: string,
  customFrom: string,
  customTo: string,
): { dateFrom?: string; dateTo?: string } {
  const now = new Date();
  const today = toDateString(now);

  if (period === "today") {
    return { dateFrom: today, dateTo: today };
  }

  if (period === "this_week") {
    const day = now.getDay();
    const monday = new Date(now);
    monday.setDate(now.getDate() - ((day + 6) % 7));
    return { dateFrom: toDateString(monday), dateTo: today };
  }

  if (period === "this_month") {
    const first = new Date(now.getFullYear(), now.getMonth(), 1);
    return { dateFrom: toDateString(first), dateTo: today };
  }

  if (period === "custom") {
    if (!customFrom || !customTo || customFrom > customTo) return {};
    return { dateFrom: customFrom, dateTo: customTo };
  }

  return {};
}

interface TeamFiltersProps {
  period: string;
  customFrom: string;
  customTo: string;
  employeeId: string;
  supervisorId: string;
  onPeriodChange: (value: string) => void;
  onCustomFromChange: (value: string) => void;
  onCustomToChange: (value: string) => void;
  onEmployeeChange: (value: string) => void;
  onSupervisorChange?: (value: string) => void;
  members: TeamMember[];
  supervisors?: TeamSupervisor[];
  showSupervisorFilter?: boolean;
  showEmployeeFilter?: boolean;
}

export default function TeamFilters({
  period,
  customFrom,
  customTo,
  employeeId,
  supervisorId,
  onPeriodChange,
  onCustomFromChange,
  onCustomToChange,
  onEmployeeChange,
  onSupervisorChange,
  members,
  supervisors = [],
  showSupervisorFilter = false,
  showEmployeeFilter = true,
}: TeamFiltersProps) {
  const handlePeriodChange = (value: string) => {
    onPeriodChange(value);
    if (value === "custom") {
      const now = new Date();
      const first = new Date(now.getFullYear(), now.getMonth(), 1);
      if (!customFrom) onCustomFromChange(toDateString(first));
      if (!customTo) onCustomToChange(toDateString(now));
    }
  };

  return (
    <div className="flex gap-3 mb-6 flex-wrap items-end">
      <div className="flex flex-col gap-1">
        <label className="text-xs font-medium text-gray-500">Period</label>
        <select
          value={period}
          onChange={(e) => handlePeriodChange(e.target.value)}
          className="px-3 py-1.5 text-sm border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-600 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-primary-600"
        >
          <option value="today">Today</option>
          <option value="this_week">This week</option>
          <option value="this_month">This month</option>
          <option value="custom">Custom range</option>
        </select>
      </div>

      {period === "custom" && (
        <>
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-gray-500">From</label>
            <input
              type="date"
              value={customFrom}
              max={customTo || undefined}
              onChange={(e) => onCustomFromChange(e.target.value)}
              className="px-3 py-1.5 text-sm border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-600 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-primary-600"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-gray-500">To</label>
            <input
              type="date"
              value={customTo}
              min={customFrom || undefined}
              onChange={(e) => onCustomToChange(e.target.value)}
              className="px-3 py-1.5 text-sm border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-600 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-primary-600"
            />
          </div>
        </>
      )}

      {showSupervisorFilter && (
        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-gray-500">
            Supervisor
          </label>
          <select
            value={supervisorId}
            onChange={(e) => onSupervisorChange?.(e.target.value)}
            className="px-3 py-1.5 text-sm border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-600 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-primary-600 min-w-[10rem]"
          >
            <option value="">All teams</option>
            {supervisors.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
                {s.role ? ` (${s.role.replace("_", " ")})` : ""}
              </option>
            ))}
          </select>
        </div>
      )}

      {showEmployeeFilter && (
        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-gray-500">Employee</label>
          <select
            value={employeeId}
            onChange={(e) => onEmployeeChange(e.target.value)}
            className="px-3 py-1.5 text-sm border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-600 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-primary-600 min-w-[10rem]"
          >
            <option value="">All team members</option>
            {members.map((m) => (
              <option key={m.id} value={m.id}>
                {m.name}
                {m.employeeId ? ` (${m.employeeId})` : ""}
              </option>
            ))}
          </select>
        </div>
      )}
    </div>
  );
}
