"use client";

import { useMemo, useState } from "react";
import { Download } from "lucide-react";
import AppShell from "@/components/layout/AppShell";
import { Card, Button, MetricCard, Spinner } from "@/components/ui";
import { RevenueChart, StageDonutChart } from "@/components/dashboard";
import {
  useRevenueReport,
  useEmployeePerformanceReport,
  //useLeadsByStageReport,
  useLeadsByAdmissionStageReport,
  useExport,
} from "@/hooks";
import OrgScopeFilters from "@/components/filters/OrgScopeFilters";
import { useSalesEmployees } from "@/hooks/useEmployees";
import { filterSalesPerformanceRows, salesEmployeeIdSet } from "@/lib/roles";
import { formatCurrency, formatCurrencySafe, toTitleCase } from "@/lib/utils";
import type {
  EmployeePerformance,
  ReportFilters,
  //StageCount,
  AdmissionStageCount,
} from "@/types";

export default function AdminReportsPage() {
  const [filters, setFilters] = useState<ReportFilters>({});
  const { employees } = useSalesEmployees({
    pageSize: 200,
    status: "active",
    stateId: filters.stateId,
    branchId: filters.branchId,
  });
  const salesIds = useMemo(() => salesEmployeeIdSet(employees), [employees]);
  const { data: revenue, isLoading: revLoading } = useRevenueReport(filters);
  const { data: empPerfData, isLoading: empLoading } =
    useEmployeePerformanceReport(filters);
  const empPerf = filterSalesPerformanceRows(
    (empPerfData?.items as EmployeePerformance[]) || [],
    salesIds,
  );
  /* const { data: byStageData, isLoading: byStageLoading } =
    useLeadsByStageReport(filters); */
  const { data: byAdmissionStageData, isLoading: byStageLoading } =
    useLeadsByAdmissionStageReport(filters);
  // const byStage = (byStageData?.items as unknown as StageCount[]) || [];
  const byAdmissionStage =
    (byAdmissionStageData?.items as unknown as AdmissionStageCount[]) || [];
  const exportMutation = useExport();

  const handleExport = (format: "xlsx" | "csv" | "pdf") => {
    exportMutation.mutate({ ...filters, format, entity: "leads" });
  };

  const salesByEmployee = filterSalesPerformanceRows(
    revenue?.salesByEmployee ?? [],
    salesIds,
  );

  return (
    <AppShell
      title="Analytics"
      requiredRole="admin"
      topbarActions={
        <div className="flex gap-1 sm:gap-2">
          {(["xlsx", "csv", "pdf"] as const).map((fmt) => (
            <Button
              key={fmt}
              size="sm"
              variant="secondary"
              leftIcon={<Download size={13} />}
              onClick={() => handleExport(fmt)}
              isLoading={exportMutation.isPending}
            >
              {fmt.toUpperCase()}
            </Button>
          ))}
        </div>
      }
    >
      {/* Filters */}
      <div className="flex gap-3 mb-6 flex-wrap">
        <input
          type="date"
          value={filters.dateFrom ?? ""}
          onChange={(e) =>
            setFilters((f) => ({ ...f, dateFrom: e.target.value }))
          }
          className="px-3 py-1.5 text-sm border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-600 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-primary-600"
        />
        <input
          type="date"
          value={filters.dateTo ?? ""}
          onChange={(e) =>
            setFilters((f) => ({ ...f, dateTo: e.target.value }))
          }
          className="px-3 py-1.5 text-sm border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-600 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-primary-600"
        />
        <OrgScopeFilters
          stateId={filters.stateId ?? ""}
          branchId={filters.branchId ?? ""}
          employeeId={filters.employeeId ?? ""}
          employeeOptionsMode="sales"
          onChange={(next) =>
            setFilters((f) => ({
              ...f,
              stateId: next.stateId || undefined,
              branchId: next.branchId || undefined,
              employeeId: next.employeeId || undefined,
            }))
          }
        />
        {(filters.dateFrom ||
          filters.dateTo ||
          filters.employeeId ||
          filters.stateId ||
          filters.branchId) && (
          <Button size="sm" variant="ghost" onClick={() => setFilters({})}>
            Clear filters
          </Button>
        )}
      </div>

      {/* Revenue summary */}
      {revenue && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-5">
          <MetricCard
            label="Total Revenue"
            value={formatCurrencySafe(revenue.totalRevenue, true)}
          />
          <MetricCard
            label="Collected Today"
            value={formatCurrencySafe(revenue.paymentCollected.today, true)}
          />
          <MetricCard
            label="This Week"
            value={formatCurrencySafe(revenue.paymentCollected.thisWeek, true)}
          />
          <MetricCard
            label="This Month"
            value={formatCurrencySafe(revenue.paymentCollected.thisMonth, true)}
          />
        </div>
      )}

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-5">
        <Card title="Revenue By Month">
          {revLoading ? (
            <div className="flex justify-center py-10">
              <Spinner />
            </div>
          ) : revenue?.salesByMonth?.length ? (
            <RevenueChart data={revenue.salesByMonth} />
          ) : (
            <p className="text-sm text-gray-400 py-10 text-center">
              No revenue data
            </p>
          )}
        </Card>
        <Card title="Admissions By Stage">
          {!byStageLoading ? (
            <StageDonutChart data={byAdmissionStage} />
          ) : (
            <Spinner />
          )}
        </Card>
      </div>

      {/* Employee sales from revenue report */}
      {salesByEmployee.length > 0 && (
        <Card title="Sales By Employee" noPadding className="mb-5">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50">
                  {[
                    "Employee",
                    "Collected Amount",
                    "No of Admissions",
                    "Target",
                    "Achieved",
                    "Incentive",
                    "Status",
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
                {salesByEmployee.map((emp) => (
                  <tr
                    key={emp.employeeId}
                    className="hover:bg-gray-50 dark:hover:bg-gray-800/50"
                  >
                    <td className="px-4 py-3 text-xs font-semibold text-gray-900 dark:text-gray-100">
                      {emp.employeeName}
                    </td>
                    <td className="px-4 py-3 text-xs font-medium text-gray-900 dark:text-gray-100">
                      {formatCurrencySafe(emp.revenue, true)}
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-600 dark:text-gray-300">
                      {emp.targetAchieved}
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-600 dark:text-gray-300">
                      {emp.monthlyTarget}
                    </td>

                    <td className="px-4 py-3 text-xs text-gray-600 dark:text-gray-300 text-center">
                      {emp.deals}
                    </td>
                    <td className="px-4 py-3 text-xs text-success-600 font-medium">
                      {formatCurrencySafe(emp.incentiveAmount)}
                    </td>
                    <td className="px-4 py-3 text-xs">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-medium ${
                          emp.targetStatus === "excellent"
                            ? "bg-success-50 text-success-700"
                            : emp.targetStatus === "met"
                              ? "bg-success-50 text-success-600"
                              : emp.targetStatus === "on_track"
                                ? "bg-warning-50 text-warning-700"
                                : "bg-danger-50 text-danger-700"
                        }`}
                      >
                        {toTitleCase(emp.targetStatus)}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Employee performance table */}
      <Card title="Employee Performance Comparison" noPadding>
        {empLoading ? (
          <div className="flex justify-center py-12">
            <Spinner size={24} />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-300 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50">
                  {[
                    "Employee",
                    "No of Admissions",
                    "Completed",
                    "Conversion %",
                    "Total Collection",
                    "Incentive",
                    "Status",
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
                {empPerf?.map((emp) => (
                  <tr
                    key={emp.employeeId}
                    className="hover:bg-gray-50 dark:hover:bg-gray-800/50"
                  >
                    <td className="px-4 py-3 text-xs font-semibold text-gray-900 dark:text-gray-100">
                      {emp.employeeName}
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-600 dark:text-gray-300 text-center">
                      {emp.leadsAssigned}
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-600 dark:text-gray-300 text-center">
                      {emp.leadsConverted}
                    </td>
                    <td className="px-4 py-3 text-xs font-medium text-center">
                      <span
                        className={
                          emp.conversionRate >= 60
                            ? "text-success-600"
                            : emp.conversionRate >= 40
                              ? "text-primary-600"
                              : "text-warning-600"
                        }
                      >
                        {emp.conversionRate}%
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs font-medium text-gray-900 dark:text-gray-100">
                      {formatCurrencySafe(emp?.revenue, true)}
                    </td>
                    <td className="px-4 py-3 text-xs text-success-600 font-medium">
                      {formatCurrency(emp.incentiveAmount)}
                    </td>
                    <td className="px-4 py-3 text-xs">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-medium ${
                          emp.targetStatus === "excellent"
                            ? "bg-success-50 text-success-700"
                            : emp.targetStatus === "met"
                              ? "bg-success-50 text-success-600"
                              : emp.targetStatus === "on_track"
                                ? "bg-warning-50 text-warning-700"
                                : "bg-danger-50 text-danger-700"
                        }`}
                      >
                        {toTitleCase(emp.targetStatus)}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </AppShell>
  );
}
