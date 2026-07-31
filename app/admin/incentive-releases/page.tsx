"use client";

import { useMemo, useState } from "react";
import AppShell from "@/components/layout/AppShell";
import { Card, MetricCard, Spinner } from "@/components/ui";
import { Button } from "@/components/ui";
import { useIncentiveReleases } from "@/hooks";
import OrgScopeFilters from "@/components/filters/OrgScopeFilters";
import { formatCurrencySafe, formatMonth } from "@/lib/utils";
import type {
  IncentiveReleaseData,
  IncentiveReleaseListResponse,
} from "@/types";

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

type PeriodMode = "this_month" | "last_month" | "custom_month" | "custom_range";

export default function AdminIncentiveReleasesPage() {
  const [mode, setMode] = useState<PeriodMode>("this_month");
  const [customMonth, setCustomMonth] = useState(currentMonth);
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [stateId, setStateId] = useState("");
  const [branchId, setBranchId] = useState("");
  const [employeeId, setEmployeeId] = useState<string>("");

  const filters = (() => {
    if (mode === "this_month") return { month: currentMonth() };
    if (mode === "last_month") return { month: lastMonth() };
    if (mode === "custom_month")
      return customMonth ? { month: customMonth } : {};
    if (mode === "custom_range" && dateFrom && dateTo)
      return { dateFrom, dateTo };
    return {};
  })();

  const filtersWithEmployee = {
    ...filters,
    ...(stateId ? { stateId } : {}),
    ...(branchId ? { branchId } : {}),
    ...(employeeId ? { employeeId } : {}),
  };

  const { data, isLoading } = useIncentiveReleases(filtersWithEmployee);

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

  const rangeValid =
    mode !== "custom_range" || (!!dateFrom && !!dateTo && dateFrom <= dateTo);

  const isListResponse = (
    d: IncentiveReleaseData | IncentiveReleaseListResponse,
  ): d is IncentiveReleaseListResponse => {
    return "items" in d;
  };
  const items = !data ? [] : "items" in data ? data.items : [data];

  const overallSummary = useMemo(() => {
    return items.reduce(
      (acc, e) => {
        acc.totalAdmissions += Number(e.summary?.totalAdmissions ?? 0);
        acc.totalBookedIncentive += Number(
          e.summary?.totalBookedIncentive ?? 0,
        );
        acc.totalCompletedAdmissions += Number(
          e.summary?.totalCompletedAdmissions ?? 0,
        );
        acc.totalReceivableIncentive += Number(
          e.summary?.totalReceivableIncentive ?? 0,
        );
        acc.totalPaid += Number(e.summary?.totalPaid ?? 0);
        acc.balanceToPay += Number(e.summary?.balanceToPay ?? 0);

        return acc;
      },
      {
        totalAdmissions: 0,
        totalBookedIncentive: 0,
        totalCompletedAdmissions: 0,
        totalReceivableIncentive: 0,
        totalPaid: 0,
        balanceToPay: 0,
      },
    );
  }, [items]);
  const periodLabel =
    data?.month ??
    (mode === "custom_range" ? `${dateFrom} → ${dateTo}` : customMonth);

  return (
    <AppShell title="Incentive Releases" requiredRole="admin">
      {/* Filters */}
      <div className="space-y-3 mb-6">
        <div className="flex gap-2 flex-wrap items-end">
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
            <input
              type="month"
              value={customMonth}
              onChange={(e) => setCustomMonth(e.target.value)}
              className="px-3 py-1.5 text-sm rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-primary-600"
            />
          )}

          {mode === "custom_range" && (
            <>
              <input
                type="date"
                value={dateFrom}
                max={dateTo || undefined}
                onChange={(e) => setDateFrom(e.target.value)}
                className="px-3 py-1.5 text-sm rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-primary-600"
              />
              <span className="text-xs text-gray-400 pb-1.5">to</span>
              <input
                type="date"
                value={dateTo}
                min={dateFrom || undefined}
                onChange={(e) => setDateTo(e.target.value)}
                className="px-3 py-1.5 text-sm rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-primary-600"
              />
            </>
          )}

          <OrgScopeFilters
            stateId={stateId}
            branchId={branchId}
            employeeId={employeeId}
            employeeOptionsMode="sales"
            onChange={(next) => {
              setStateId(next.stateId);
              setBranchId(next.branchId);
              setEmployeeId(next.employeeId);
            }}
          />

          {(employeeId ||
            stateId ||
            branchId ||
            customMonth ||
            dateFrom ||
            dateTo) &&
            mode !== "this_month" && (
              <Button
                size="sm"
                variant="ghost"
                onClick={() => {
                  setEmployeeId("");
                  setStateId("");
                  setBranchId("");
                  setMode("this_month");
                }}
              >
                Clear
              </Button>
            )}
        </div>

        {mode === "custom_range" && dateFrom && dateTo && dateFrom > dateTo && (
          <p className="text-xs text-danger-600">
            &quot;From&quot; must be on or before &quot;To&quot;.
          </p>
        )}
      </div>

      {/* Loading */}
      {isLoading ? (
        <div className="flex justify-center py-16">
          <Spinner size={28} />
        </div>
      ) : items.length === 0 ? (
        <p className="text-sm text-gray-400 text-center py-16">
          No incentive release data for this period.
        </p>
      ) : (
        <>
          {/* Summary cards for single employee */}
          {items.length === 1 && items[0].summary && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 mb-5">
              <MetricCard
                label="Total Admissions"
                value={items[0].summary.totalAdmissions}
              />
              <MetricCard
                label="Booked Incentive"
                value={formatCurrencySafe(
                  items[0].summary.totalBookedIncentive,
                )}
              />
              <MetricCard
                label="Completed Admissions"
                value={items[0].summary.totalCompletedAdmissions}
              />
              <MetricCard
                label="Receivable Incentive"
                value={formatCurrencySafe(
                  items[0].summary.totalReceivableIncentive,
                )}
              />
            </div>
          )}

          {/* Per-employee monthly breakdown */}
          {items.map((emp) => (
            <Card
              key={emp.employeeId}
              title={
                items.length > 1
                  ? `${emp.employeeName} (${emp.employeeCode})`
                  : "Monthly Incentive Breakdown"
              }
              noPadding
              className="mb-5"
            >
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50">
                      {[
                        "Month",
                        "Admissions",
                        "Slab Rate",
                        "Booked Incentive",
                        "Completed",
                        "Receivable Incentive",
                        "Paid",
                        "Pending",
                      ].map((h) => (
                        <th
                          key={h}
                          className="text-left px-4 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400"
                        >
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50 dark:divide-gray-800">
                    {emp.months.map((row) => (
                      <tr
                        key={row.month}
                        className="hover:bg-gray-50 dark:hover:bg-gray-800/50"
                      >
                        <td className="px-4 py-3 text-xs font-medium text-gray-800 dark:text-gray-200">
                          {formatMonth(row?.month)}
                        </td>
                        <td className="px-4 py-3 text-xs text-gray-600 dark:text-gray-300">
                          {row.admissions}
                        </td>
                        <td className="px-4 py-3 text-xs text-gray-600 dark:text-gray-300">
                          {formatCurrencySafe(row.slabRate)}
                        </td>
                        <td className="px-4 py-3 text-xs font-medium text-gray-900 dark:text-gray-100">
                          {formatCurrencySafe(row.bookedIncentive)}
                        </td>
                        <td className="px-4 py-3 text-xs text-gray-600 dark:text-gray-300">
                          {row.completedAdmissions}
                        </td>
                        <td className="px-4 py-3 text-xs font-medium text-success-600">
                          {formatCurrencySafe(row.receivableIncentive)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  {emp.summary && (
                    <tfoot>
                      <tr className="border-t-2 border-gray-400 dark:border-gray-600 bg-gray-50 dark:bg-gray-800/50 font-semibold">
                        <td className="px-4 py-3 text-xs text-gray-800 dark:text-gray-200">
                          Total
                        </td>
                        <td className="px-4 py-3 text-xs text-gray-800 dark:text-gray-200">
                          {emp.summary.totalAdmissions}
                        </td>
                        <td className="px-4 py-3 text-xs text-gray-800 dark:text-gray-200" />
                        <td className="px-4 py-3 text-xs text-gray-900 dark:text-gray-100">
                          {formatCurrencySafe(emp.summary.totalBookedIncentive)}
                        </td>
                        <td className="px-4 py-3 text-xs text-gray-800 dark:text-gray-200">
                          {emp.summary.totalCompletedAdmissions}
                        </td>
                        <td className="px-4 py-3 text-xs text-success-600">
                          {formatCurrencySafe(
                            emp.summary.totalReceivableIncentive,
                          )}
                        </td>
                        <td className="px-4 py-3 text-xs font-medium text-gray-800 dark:text-gray-200">
                          {formatCurrencySafe(emp.summary.totalPaid)}
                        </td>
                        <td className="px-4 py-3 text-xs font-medium text-warning-600">
                          {formatCurrencySafe(emp.summary.balanceToPay)}
                        </td>
                      </tr>
                    </tfoot>
                  )}
                </table>
              </div>

              {/* Summary row for multi-employee view */}
              {items.length > 1 && emp.summary && (
                <div className="flex flex-wrap gap-4 px-4 py-3 border-t border-gray-100 dark:border-gray-800 text-xs">
                  <span className="text-gray-500">
                    Total Paid:{" "}
                    <span className="font-medium text-gray-800 dark:text-gray-200">
                      {formatCurrencySafe(emp.summary.totalPaid)}
                    </span>
                  </span>
                  <span className="text-gray-500">
                    Balance to Pay:{" "}
                    <span className="font-medium text-warning-600">
                      {formatCurrencySafe(emp.summary.balanceToPay)}
                    </span>
                  </span>
                </div>
              )}
            </Card>
          ))}

          {/* Overall summary for multi-employee view */}
          {items.length > 1 && (
            <Card title="Overall Summary" className="mb-5">
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <div>
                  <p className="text-xs text-gray-500 mb-1">Total Admissions</p>
                  <p className="text-lg font-bold text-gray-900 dark:text-gray-100">
                    {overallSummary.totalAdmissions}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 mb-1">
                    Total Booked Incentive
                  </p>
                  <p className="text-lg font-bold text-gray-900 dark:text-gray-100">
                    {formatCurrencySafe(overallSummary.totalBookedIncentive)}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 mb-1">Total Completed</p>
                  <p className="text-lg font-bold text-gray-900 dark:text-gray-100">
                    {items.reduce(
                      (sum, e) =>
                        sum + (e.summary?.totalCompletedAdmissions ?? 0),
                      0,
                    )}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 mb-1">Total Receivable</p>
                  <p className="text-lg font-bold text-success-600">
                    {formatCurrencySafe(
                      overallSummary.totalReceivableIncentive,
                    )}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 mb-1">Total Paid</p>
                  <p className="text-lg font-bold text-gray-900 dark:text-gray-100">
                    {formatCurrencySafe(overallSummary.totalPaid)}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 mb-1">Balance to Pay</p>
                  <p className="text-lg font-bold text-warning-600">
                    {formatCurrencySafe(overallSummary.balanceToPay)}
                  </p>
                </div>
              </div>
            </Card>
          )}
        </>
      )}
    </AppShell>
  );
}
