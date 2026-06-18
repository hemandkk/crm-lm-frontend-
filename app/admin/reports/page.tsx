"use client";

import { useState } from "react";
import { Download } from "lucide-react";
import AppShell from "@/components/layout/AppShell";
import { Card, Button, MetricCard, Spinner } from "@/components/ui";
import { RevenueChart, StageDonutChart } from "@/components/dashboard";
import {
  useRevenueReport,
  useEmployeePerformanceReport,
  useLeadsByStageReport,
  useExport,
} from "@/hooks";
import { useEmployees } from "@/hooks/useEmployees";
import { formatCurrency, stageConfig } from "@/lib/utils";
import type { ReportFilters } from "@/types";

export default function AdminReportsPage() {
  const [filters, setFilters] = useState<ReportFilters>({});
  const { data: employees } = useEmployees();
  const { data: revenue, isLoading: revLoading } = useRevenueReport(filters);
  const { data: empPerf, isLoading: empLoading } =
    useEmployeePerformanceReport(filters);
  const { data: byStage } = useLeadsByStageReport(filters);
  const exportMutation = useExport();

  const handleExport = (format: "xlsx" | "csv" | "pdf") => {
    exportMutation.mutate({ ...filters, format, entity: "leads" });
  };

  return (
    <AppShell
      title="Analytics"
      requiredRole="admin"
      topbarActions={
        <div className="flex gap-2">
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
        <select
          value={filters.employeeId ?? ""}
          onChange={(e) =>
            setFilters((f) => ({
              ...f,
              employeeId: e.target.value || undefined,
            }))
          }
          className="px-3 py-1.5 text-sm border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-600 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-primary-600"
        >
          <option value="">All employees</option>
          {employees?.data.map((e) => (
            <option key={e.id} value={e.id}>
              {e.name}
            </option>
          ))}
        </select>
        {(filters.dateFrom || filters.dateTo || filters.employeeId) && (
          <Button size="sm" variant="ghost" onClick={() => setFilters({})}>
            Clear filters
          </Button>
        )}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-5">
        <Card title="Revenue by month">
          {revLoading ? (
            <div className="flex justify-center py-10">
              <Spinner />
            </div>
          ) : revenue ? (
            <RevenueChart data={revenue} />
          ) : null}
        </Card>
        <Card title="Leads by stage">
          {byStage ? <StageDonutChart data={byStage} /> : <Spinner />}
        </Card>
      </div>

      {/* Employee performance table */}
      <Card title="Employee performance comparison" noPadding>
        {empLoading ? (
          <div className="flex justify-center py-12">
            <Spinner size={24} />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50">
                  {[
                    "Employee",
                    "Leads created",
                    "Won",
                    "Conversion",
                    "Revenue",
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
                      {emp.leadsCreated}
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-600 dark:text-gray-300 text-center">
                      {emp.leadsWon}
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
                      {formatCurrency(emp.totalRevenue, true)}
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
                        {emp.targetStatus.replace("_", " ")}
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
