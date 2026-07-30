"use client";

import { useMemo, useState } from "react";
import AppShell from "@/components/layout/AppShell";
import { Card, MetricCard, Spinner } from "@/components/ui";
import { useIncentiveReleases, useIncentiveSlabs } from "@/hooks";
import { formatCurrencySafe, formatMonth } from "@/lib/utils";
import type {
  IncentiveReleaseData,
  IncentiveReleaseResponse,
  IncentiveReport,
} from "@/types";
import { useQueries } from "@tanstack/react-query";
import { aggregateReports, monthsInRange } from "../incentives/page";
import { useAuthStore } from "@/store/authStore";
import { queryKeys } from "@/lib/queryClient";
import { reportService } from "@/services";
import IncentiveSlabsModal from "@/components/Incentives/IncentiveSlabsModal";

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

export default function EmployeeIncentiveReleasesPage() {
  const [mode, setMode] = useState<PeriodMode>("this_month");
  const [customMonth, setCustomMonth] = useState(currentMonth);
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  const [openModal, setOpenModal] = useState<boolean>(false);

  const filters = (() => {
    if (mode === "this_month") return { month: currentMonth() };
    if (mode === "last_month") return { month: lastMonth() };
    if (mode === "custom_month")
      return customMonth ? { month: customMonth } : {};
    if (mode === "custom_range" && dateFrom && dateTo)
      return { dateFrom, dateTo };
    return {};
  })();

  const { data, isLoading } = useIncentiveReleases(filters);

  //////////////
  const user = useAuthStore((s) => s.user);
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
  const { data: slabs } = useIncentiveSlabs();

  const rangeValid =
    mode !== "custom_range" || (!!dateFrom && !!dateTo && dateFrom <= dateTo);
  const queries = useQueries({
    queries: monthsToFetch.map((month) => ({
      queryKey: queryKeys.incentives.status({ month }),
      queryFn: () => reportService.getIncentiveStatus({ month }),
      enabled: monthsToFetch.length > 0 && rangeValid,
    })),
  });
  const reports = queries
    .map((q) => q.data)
    .filter((d): d is IncentiveReport => !!d);
  const aggregated = useMemo(
    () => (reports.length ? aggregateReports(reports, user) : null),
    [reports, user],
  );
  ///////////
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

  const isResponse = (d: unknown): d is IncentiveReleaseResponse =>
    !!d && "data" in (d as Record<string, unknown>);

  const empData: IncentiveReleaseData | null = (() => {
    if (!data) return null;

    if (isResponse(data)) return data.data;

    if ("months" in (data as any)) {
      return data as unknown as IncentiveReleaseData;
    }

    const list = data as { items?: IncentiveReleaseData[] };
    return list.items?.[0] ?? null;
  })();

  const summary = empData?.summary;

  return (
    <AppShell
      title="Incentive Releases"
      requiredRole={["employee", "manager", "sales_head"]}
    >
      {/* Filters */}
      <div className="space-y-3 mb-6">
        <div className="flex gap-2 flex-wrap items-end">
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
      ) : !empData ? (
        <p className="text-sm text-gray-400 text-center py-16">
          No incentive release data for this period.
        </p>
      ) : (
        <>
          {/* Summary cards */}
          {summary && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 mb-5">
              <MetricCard
                label="Total Admissions"
                value={summary.totalAdmissions}
              />
              <MetricCard
                label="Booked Incentive"
                value={formatCurrencySafe(summary.totalBookedIncentive)}
              />
              <MetricCard
                label="Completed"
                value={summary.totalCompletedAdmissions}
              />
              <MetricCard
                label="Receivable Incentive"
                value={formatCurrencySafe(summary.totalReceivableIncentive)}
              />
            </div>
          )}

          {/* Monthly breakdown table */}
          <Card
            title="Monthly Incentive Breakdown"
            action={
              <span
                className="text-sm text-blue-500 cursor-pointer dark:text-blue-300"
                title="View Slabs"
                onClick={() => setOpenModal(true)}
              >
                View Slabs
              </span>
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
                  {empData.months.map((row) => (
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
                {summary && (
                  <tfoot>
                    <tr className="border-t-2 border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 font-semibold">
                      <td className="px-4 py-3 text-xs text-gray-800 dark:text-gray-200">
                        Total
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-800 dark:text-gray-200">
                        {summary.totalAdmissions}
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-800 dark:text-gray-200" />
                      <td className="px-4 py-3 text-xs text-gray-900 dark:text-gray-100">
                        {formatCurrencySafe(summary.totalBookedIncentive)}
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-800 dark:text-gray-200">
                        {summary.totalCompletedAdmissions}
                      </td>
                      <td className="px-4 py-3 text-xs text-success-600">
                        {formatCurrencySafe(summary.totalReceivableIncentive)}
                      </td>
                      <td className="px-4 py-3 text-xs font-medium text-gray-800 dark:text-gray-200">
                        {formatCurrencySafe(summary.totalPaid)}
                      </td>
                      <td className="px-4 py-3 text-xs font-medium text-warning-600">
                        {formatCurrencySafe(summary.balanceToPay)}
                      </td>
                    </tr>
                  </tfoot>
                )}
              </table>
            </div>

            {/* Payment summary */}
            {summary && (
              <div className="flex flex-wrap gap-4 px-4 py-3 border-t border-gray-100 dark:border-gray-800 text-xs">
                <span className="text-gray-500">
                  Total Paid:{" "}
                  <span className="font-medium text-gray-800 dark:text-gray-200">
                    {formatCurrencySafe(summary.totalPaid)}
                  </span>
                </span>
                <span className="text-gray-500">
                  Balance to Pay:{" "}
                  <span className="font-medium text-warning-600">
                    {formatCurrencySafe(summary.balanceToPay)}
                  </span>
                </span>
                <span className="text-gray-500">
                  Note: Receivable Incentive will be calculated on the basis on
                  completed admissions
                </span>
              </div>
            )}
          </Card>
        </>
      )}
      {/* Incentive slab modal */}
      <IncentiveSlabsModal
        open={openModal}
        onClose={() => {
          setOpenModal(false);
        }}
        slabs={slabs}
        aggregated={aggregated}
      />
    </AppShell>
  );
}
