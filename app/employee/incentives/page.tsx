"use client";

import { useMemo, useState } from "react";
import { useQueries } from "@tanstack/react-query";
import AppShell from "@/components/layout/AppShell";
import { Card, MetricCard, Spinner } from "@/components/ui";
import { IncentiveStatusCard } from "@/components/dashboard";
import { useIncentiveSlabs } from "@/hooks";
import { reportService } from "@/services";
import { queryKeys } from "@/lib/queryClient";
import { useAuthStore } from "@/store/authStore";
import { formatCurrencySafe, cn } from "@/lib/utils";
import type { IncentiveReport, IncentiveReportItem } from "@/types";

type PeriodMode = "this_month" | "last_month" | "custom_month" | "custom_range";

function toMonthString(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

function currentMonth() {
  return toMonthString(new Date());
}

function lastMonth() {
  const d = new Date();
  d.setDate(1);
  d.setMonth(d.getMonth() - 1);
  return toMonthString(d);
}

/** Inclusive list of YYYY-MM between two dates (monthly incentive buckets). */
function monthsInRange(dateFrom: string, dateTo: string): string[] {
  const start = new Date(`${dateFrom}T00:00:00`);
  const end = new Date(`${dateTo}T00:00:00`);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || start > end) {
    return [];
  }
  const months: string[] = [];
  const cursor = new Date(start.getFullYear(), start.getMonth(), 1);
  const last = new Date(end.getFullYear(), end.getMonth(), 1);
  while (cursor <= last) {
    months.push(toMonthString(cursor));
    cursor.setMonth(cursor.getMonth() + 1);
  }
  return months;
}

function pickMyIncentive(
  items: IncentiveReportItem[],
  user: {
    id?: string | number;
    employee_id?: string;
    employeeId?: string;
  } | null,
): IncentiveReportItem | undefined {
  if (!items.length) return undefined;
  if (items.length === 1) return items[0];

  const uid = String(user?.id ?? "");
  const code = String(user?.employeeId ?? user?.employee_id ?? "");

  return (
    items.find((i) => String(i.employeeId) === uid) ||
    items.find((i) => i.employeeCode === code) ||
    items[0]
  );
}

function aggregateReports(
  reports: IncentiveReport[],
  user: Parameters<typeof pickMyIncentive>[1],
): {
  mine: IncentiveReportItem | undefined;
  totalIncentive: number;
  totalLeads: number;
  dateFrom: string;
  dateTo: string;
  months: string[];
} {
  const months = reports.map((r) => r.month).filter(Boolean);
  const dateFrom = reports
    .map((r) => r.dateFrom)
    .filter(Boolean)
    .sort()[0];
  const dateTo = reports
    .map((r) => r.dateTo)
    .filter(Boolean)
    .sort()
    .at(-1) as string;

  let totalIncentive = 0;
  let totalLeads = 0;
  let eligible = false;
  let slab: string | null = null;
  let nextBracketLeads: number | null = null;
  let nextBracketIncentive: string | number | null = null;
  let employeeId = 0;
  let employeeCode = "";
  let employeeName = "";

  for (const report of reports) {
    const mine = pickMyIncentive(report.items ?? [], user);
    if (!mine) continue;
    totalIncentive += Number(mine.amount) || 0;
    totalLeads += Number(mine.leadCount) || 0;
    eligible = eligible || mine.eligible;
    employeeId = mine.employeeId;
    employeeCode = mine.employeeCode;
    employeeName = mine.employeeName;
    // Prefer latest month's slab / next-bracket hints
    slab = mine.slab ?? slab;
    nextBracketLeads = mine.nextBracketLeads;
    nextBracketIncentive = mine.nextBracketIncentive;
  }

  const mine: IncentiveReportItem | undefined = employeeId
    ? {
        employeeId,
        employeeCode,
        employeeName,
        eligible,
        amount: totalIncentive,
        slab,
        leadCount: totalLeads,
        nextBracketLeads,
        nextBracketIncentive,
      }
    : undefined;

  return {
    mine,
    totalIncentive,
    totalLeads,
    dateFrom: dateFrom ?? "",
    dateTo: dateTo ?? "",
    months,
  };
}

export default function IncentivesPage() {
  const user = useAuthStore((s) => s.user);
  const [mode, setMode] = useState<PeriodMode>("this_month");
  const [customMonth, setCustomMonth] = useState(currentMonth);
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  const monthsToFetch = useMemo(() => {
    if (mode === "this_month") return [currentMonth()];
    if (mode === "last_month") return [lastMonth()];
    if (mode === "custom_month") return customMonth ? [customMonth] : [];
    if (mode === "custom_range") {
      if (!dateFrom || !dateTo) return [];
      return monthsInRange(dateFrom, dateTo);
    }
    return [];
  }, [mode, customMonth, dateFrom, dateTo]);

  const rangeValid =
    mode !== "custom_range" ||
    (!!dateFrom && !!dateTo && dateFrom <= dateTo && monthsToFetch.length > 0);

  const queries = useQueries({
    queries: monthsToFetch.map((month) => ({
      queryKey: queryKeys.incentives.status({ month }),
      queryFn: () => reportService.getIncentiveStatus({ month }),
      enabled: monthsToFetch.length > 0 && rangeValid,
    })),
  });

  const isLoading = queries.some((q) => q.isLoading || q.isFetching);
  const reports = queries
    .map((q) => q.data)
    .filter((d): d is IncentiveReport => !!d);

  const aggregated = useMemo(
    () => (reports.length ? aggregateReports(reports, user) : null),
    [reports, user],
  );

  const { data: slabs } = useIncentiveSlabs();
  const mine = aggregated?.mine;
  const leadCount = mine?.leadCount ?? 0;

  const periodLabel =
    mode === "custom_range" && aggregated?.months.length
      ? aggregated.months.length === 1
        ? aggregated.months[0]
        : `${aggregated.months[0]} → ${aggregated.months.at(-1)}`
      : monthsToFetch[0] ?? "—";

  const setPreset = (next: PeriodMode) => {
    setMode(next);
    if (next === "custom_month" && !customMonth) setCustomMonth(currentMonth());
    if (next === "custom_range") {
      const m = currentMonth();
      if (!dateFrom) setDateFrom(`${m}-01`);
      if (!dateTo) {
        const [y, mo] = m.split("-").map(Number);
        const lastDay = new Date(y, mo, 0).getDate();
        setDateTo(`${m}-${String(lastDay).padStart(2, "0")}`);
      }
    }
  };

  return (
    <AppShell title="Incentives" requiredRole="employee">
      <div className="space-y-4 mb-6">
        <div className="flex gap-2 flex-wrap">
          {(
            [
              ["this_month", "This month"],
              ["last_month", "Last month"],
              ["custom_month", "Pick month"],
              ["custom_range", "Custom dates"],
            ] as const
          ).map(([value, label]) => (
            <button
              key={value}
              type="button"
              onClick={() => setPreset(value)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                mode === value
                  ? "bg-primary-50 text-primary-700 border-primary-200 dark:bg-primary-900/20 dark:text-primary-400 dark:border-primary-800"
                  : "bg-white border-gray-200 text-gray-600 hover:bg-gray-50 dark:bg-gray-900 dark:border-gray-700 dark:text-gray-400"
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {mode === "custom_month" && (
          <div className="flex flex-col sm:flex-row sm:items-end gap-3">
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-gray-600 dark:text-gray-300">
                Month
              </label>
              <input
                type="month"
                value={customMonth}
                onChange={(e) => setCustomMonth(e.target.value)}
                className="px-3 py-1.5 text-sm rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-primary-600"
              />
            </div>
            <p className="text-xs text-gray-400 pb-1.5">
              Incentives are calculated per calendar month.
            </p>
          </div>
        )}

        {mode === "custom_range" && (
          <div className="flex flex-col sm:flex-row sm:items-end gap-3 flex-wrap">
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-gray-600 dark:text-gray-300">
                From
              </label>
              <input
                type="date"
                value={dateFrom}
                max={dateTo || undefined}
                onChange={(e) => setDateFrom(e.target.value)}
                className="px-3 py-1.5 text-sm rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-primary-600"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-gray-600 dark:text-gray-300">
                To
              </label>
              <input
                type="date"
                value={dateTo}
                min={dateFrom || undefined}
                onChange={(e) => setDateTo(e.target.value)}
                className="px-3 py-1.5 text-sm rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-primary-600"
              />
            </div>
            <p className="text-xs text-gray-400 pb-1.5 max-w-md">
              Range spans {monthsToFetch.length || 0} month
              {monthsToFetch.length === 1 ? "" : "s"}. Totals sum each month’s
              incentive.
            </p>
            {dateFrom && dateTo && dateFrom > dateTo && (
              <p className="text-xs text-danger-600">
                “From” must be on or before “To”.
              </p>
            )}
          </div>
        )}
      </div>

      {aggregated && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 mb-5">
          <MetricCard
            label="Period"
            value={periodLabel}
            sub={
              aggregated.dateFrom && aggregated.dateTo
                ? `${aggregated.dateFrom} → ${aggregated.dateTo}`
                : undefined
            }
          />
          <MetricCard label="Your leads" value={leadCount} />
          <MetricCard
            label="Total incentive"
            value={formatCurrencySafe(aggregated.totalIncentive)}
            sub={
              aggregated.months.length > 1
                ? `Sum of ${aggregated.months.length} months`
                : undefined
            }
          />
          <MetricCard
            label="Months included"
            value={aggregated.months.length}
            sub={aggregated.months.join(", ")}
          />
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <Card title="Your incentive status">
          {!rangeValid ? (
            <p className="text-sm text-gray-400 text-center py-6">
              Select a valid date range to view incentives.
            </p>
          ) : isLoading ? (
            <div className="flex justify-center py-10">
              <Spinner />
            </div>
          ) : mine ? (
            <IncentiveStatusCard
              eligible={mine.eligible}
              amount={mine.amount}
              slab={mine.slab}
              leadCount={mine.leadCount}
              nextBracketLeads={
                aggregated?.months.length === 1 ? mine.nextBracketLeads : null
              }
              nextBracketIncentive={
                aggregated?.months.length === 1
                  ? mine.nextBracketIncentive
                  : null
              }
            />
          ) : (
            <p className="text-sm text-gray-400 text-center py-6">
              No incentive data for this period.
            </p>
          )}
        </Card>

        <Card title="Incentive slab reference">
          {!slabs ? (
            <div className="flex justify-center py-10">
              <Spinner />
            </div>
          ) : slabs.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-6">
              No slabs configured.
            </p>
          ) : (
            <div className="space-y-2">
              {slabs.map((slab, i) => {
                const min = Number(slab.minLeads ?? 0);
                const max =
                  slab.maxLeads == null ? null : Number(slab.maxLeads);
                // Highlight against latest/single-month lead count only
                const compareLeads =
                  aggregated?.months.length === 1 ? leadCount : 0;
                const isActive =
                  !!mine &&
                  aggregated?.months.length === 1 &&
                  mine.eligible &&
                  compareLeads >= min &&
                  (max === null || compareLeads <= max);
                const isPassed =
                  !!mine &&
                  aggregated?.months.length === 1 &&
                  max !== null &&
                  compareLeads > max;

                return (
                  <div
                    key={slab.id ?? i}
                    className={cn(
                      "flex items-center justify-between px-4 py-3 rounded-lg border text-sm transition-colors",
                      isActive
                        ? "border-primary-200 bg-primary-50 dark:border-primary-800 dark:bg-primary-900/20"
                        : isPassed
                          ? "border-success-100 bg-success-50 dark:border-success-800 dark:bg-success-900/10"
                          : "border-gray-100 bg-gray-50 dark:border-gray-700 dark:bg-gray-800/40",
                    )}
                  >
                    <div>
                      <p className="text-xs font-medium text-gray-800 dark:text-gray-200">
                        {min}
                        {max != null ? ` – ${max}` : "+"} leads
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span
                        className={cn(
                          "text-sm font-bold",
                          isActive
                            ? "text-primary-700 dark:text-primary-400"
                            : isPassed
                              ? "text-success-600"
                              : "text-gray-500",
                        )}
                      >
                        {formatCurrencySafe(slab.incentiveAmount)}
                      </span>
                      {isActive && (
                        <span className="text-[10px] bg-primary-100 dark:bg-primary-800 text-primary-700 dark:text-primary-300 px-1.5 py-0.5 rounded font-medium">
                          Current
                        </span>
                      )}
                      {isPassed && (
                        <span className="text-[10px] bg-success-100 dark:bg-success-800 text-success-700 dark:text-success-300 px-1.5 py-0.5 rounded font-medium">
                          Passed
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </Card>
      </div>

      {aggregated && aggregated.months.length > 1 && (
        <Card title="Monthly breakdown" className="mt-5" noPadding>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50">
                  {["Month", "Leads", "Eligible", "Incentive"].map((h) => (
                    <th
                      key={h}
                      className="text-left px-4 py-3 text-xs font-semibold text-gray-500"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 dark:divide-gray-800">
                {reports.map((report) => {
                  const row = pickMyIncentive(report.items ?? [], user);
                  return (
                    <tr key={report.month}>
                      <td className="px-4 py-3 text-xs font-medium text-gray-800 dark:text-gray-200">
                        {report.month}
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-600">
                        {row?.leadCount ?? 0}
                      </td>
                      <td className="px-4 py-3 text-xs">
                        {row?.eligible ? (
                          <span className="text-success-600">Yes</span>
                        ) : (
                          <span className="text-gray-400">No</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-xs font-medium text-gray-900 dark:text-gray-100">
                        {formatCurrencySafe(row?.amount ?? 0)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </AppShell>
  );
}
