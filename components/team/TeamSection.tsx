"use client";

import { useMemo, useState } from "react";
import { Download } from "lucide-react";
import AppShell from "@/components/layout/AppShell";
import { Button, Card, EmptyState, MetricCard, Spinner } from "@/components/ui";
import { RevenueChart, StageDonutChart } from "@/components/dashboard";
import TeamFilters, { getPeriodRange } from "@/components/team/TeamFilters";
import { performanceStatusBadge } from "@/components/team/performanceBadge";
import {
  useTeamAnalytics,
  useTeamExport,
  useTeamMembers,
  useTeamOverview,
  useTeamPayments,
  useTeamPerformance,
  useTeamSales,
  useTeamSupervisors,
} from "@/hooks/useTeam";
import { formatCurrency, formatCurrencySafe } from "@/lib/utils";
import type { UserRole } from "@/types";
import type {
  TeamExportType,
  TeamPerformanceRow,
  TeamQueryFilters,
  TeamSalesRow,
} from "@/types/team";

export type TeamSectionKey =
  | "overview"
  | "sales"
  | "performance"
  | "payments"
  | "analytics"
  | "exports";

const TITLES: Record<TeamSectionKey, string> = {
  overview: "Team Overview",
  sales: "Team Sales",
  performance: "Team Performance",
  payments: "Team Payments",
  analytics: "Team Analytics",
  exports: "Team Exports",
};

function rowsFrom<T>(
  data: { items?: T[]; data?: T[] } | null | undefined,
): T[] {
  return data?.items ?? data?.data ?? [];
}

function num(v: unknown): number {
  const n = typeof v === "number" ? v : Number(v);
  return Number.isFinite(n) ? n : 0;
}

interface TeamSectionProps {
  section: TeamSectionKey;
  requiredRole: UserRole | UserRole[];
  /** Admin Team area: show supervisor filter */
  showSupervisorFilter?: boolean;
}

export default function TeamSection({
  section,
  requiredRole,
  showSupervisorFilter = false,
}: TeamSectionProps) {
  const [period, setPeriod] = useState("this_month");
  const [customFrom, setCustomFrom] = useState("");
  const [customTo, setCustomTo] = useState("");
  const [stateId, setStateId] = useState("");
  const [branchId, setBranchId] = useState("");
  const [employeeId, setEmployeeId] = useState("");
  const [supervisorId, setSupervisorId] = useState("");

  const dateRange = useMemo(
    () => getPeriodRange(period, customFrom, customTo),
    [period, customFrom, customTo],
  );

  const filtersEnabled =
    period !== "custom" || (!!dateRange.dateFrom && !!dateRange.dateTo);

  const filters: TeamQueryFilters = {
    dateFrom: dateRange.dateFrom,
    dateTo: dateRange.dateTo,
    stateId: stateId || undefined,
    branchId: branchId || undefined,
    employeeId: employeeId || undefined,
    supervisorId: showSupervisorFilter ? supervisorId || undefined : undefined,
  };

  const supervisorParams = {
    ...(stateId ? { stateId } : {}),
    ...(branchId ? { branchId } : {}),
  };
  const { data: managers = [] } = useTeamSupervisors(
    "manager",
    showSupervisorFilter,
    supervisorParams,
  );

  const { data: salesHeads = [] } = useTeamSupervisors(
    "sales_head",
    showSupervisorFilter,
    supervisorParams,
  );

  const supervisors = useMemo(
    () => [...managers, ...salesHeads],
    [managers, salesHeads],
  );

  // Admin: optional supervisorId. Manager/sales_head: omit (own team forced by API).
  const memberParams = {
    ...(showSupervisorFilter && supervisorId ? { supervisorId } : {}),
    ...(stateId ? { stateId } : {}),
    ...(branchId ? { branchId } : {}),
  };

  const { data: teamMembers = [] } = useTeamMembers(memberParams, true);

  const overview = useTeamOverview(
    filters,
    section === "overview" && filtersEnabled,
  );
  console.log("overview", overview.data);
  const sales = useTeamSales(filters, section === "sales" && filtersEnabled);
  const performance = useTeamPerformance(
    filters,
    section === "performance" && filtersEnabled,
  );
  const payments = useTeamPayments(
    filters,
    section === "payments" && filtersEnabled,
  );
  const analytics = useTeamAnalytics(
    filters,
    section === "analytics" && filtersEnabled,
  );
  const exportMutation = useTeamExport();

  const salesRows = rowsFrom<TeamSalesRow>(sales.data);
  const perfRows = rowsFrom<TeamPerformanceRow>(performance.data);
  const paymentRows = rowsFrom(payments.data);
  const overviewPerf = overview.data?.employeePerformance ?? [];

  const chartMonths =
    analytics.data?.revenueByMonth ??
    analytics.data?.salesByMonth ??
    overview.data?.revenueByMonth ??
    [];
  const stageData =
    analytics.data?.leadsByStage ?? overview.data?.leadsByStage ?? [];

  const handleExport = (exportType: TeamExportType, format: "xlsx" | "csv") => {
    exportMutation.mutate({
      exportType,
      format,
      dateFrom: filters.dateFrom,
      dateTo: filters.dateTo,
      stateId: filters.stateId,
      branchId: filters.branchId,
      employeeId: filters.employeeId,
      supervisorId: filters.supervisorId,
    });
  };

  return (
    <AppShell title={TITLES[section]} requiredRole={requiredRole}>
      {section !== "exports" && (
        <TeamFilters
          period={period}
          customFrom={customFrom}
          customTo={customTo}
          stateId={stateId}
          branchId={branchId}
          employeeId={employeeId}
          supervisorId={supervisorId}
          onPeriodChange={setPeriod}
          onCustomFromChange={setCustomFrom}
          onCustomToChange={setCustomTo}
          onStateChange={setStateId}
          onBranchChange={setBranchId}
          onEmployeeChange={setEmployeeId}
          onSupervisorChange={(v) => {
            setSupervisorId(v);
            setEmployeeId("");
          }}
          members={teamMembers}
          supervisors={supervisors}
          showSupervisorFilter={showSupervisorFilter}
        />
      )}

      {section === "overview" && (
        <>
          {overview.isLoading ? (
            <div className="flex justify-center py-20">
              <Spinner size={28} />
            </div>
          ) : overview.data ? (
            <>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-6">
                <MetricCard
                  label="Team Members"
                  value={
                    overview.data.teamSize ??
                    overview.data.totalMembers ??
                    overview.data.totalEmployees ??
                    teamMembers.length ??
                    0
                  }
                />
                <MetricCard
                  label="Admissions"
                  value={overview.data.totalAdmissions ?? 0}
                />
                <MetricCard
                  label="High Performers"
                  value={overview.data.highPerformers ?? "-"}
                />
                <MetricCard
                  label="Low Performers"
                  value={overview.data.lowPerformers ?? "-"}
                />
                {/* <MetricCard
                  label="Won"
                  value={overview.data.leadsWon ?? 0}
                /> */}
                {/* <MetricCard
                  label="Revenue"
                  value={formatCurrencySafe(
                    overview.data.totalRevenue ?? 0,
                    true,
                  )}
                /> */}
                <MetricCard
                  label="Collected"
                  value={formatCurrencySafe(
                    overview.data.totalCollection ?? 0,
                    true,
                  )}
                />
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-5">
                {!!chartMonths.length && (
                  <Card title="Revenue By Month">
                    <RevenueChart
                      data={chartMonths.map((m) => ({
                        month: String(m.month ?? ""),
                        year: Number(m.year ?? 0),
                        revenue: m.revenue ?? 0,
                        deals: Number(m.deals ?? 0),
                      }))}
                    />
                  </Card>
                )}
                {/* {!!stageData.length && (
                  <Card title="Admissions By Stage">
                    <StageDonutChart
                      data={stageData.map((s) => ({
                        stage: (s.stage ?? "new") as never,
                        count: Number(s.count ?? 0),
                      }))}
                    />
                  </Card>
                )} */}
              </div>
              {!!overviewPerf.length && (
                <Card title="Team performance" noPadding>
                  <PerformanceTable rows={overviewPerf} />
                </Card>
              )}
            </>
          ) : (
            <EmptyState title="No team overview data" />
          )}
        </>
      )}

      {section === "sales" && (
        <>
          {sales.isLoading ? (
            <div className="flex justify-center py-20">
              <Spinner size={28} />
            </div>
          ) : sales.data ? (
            <>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <MetricCard
                  label="Total Revenue"
                  value={formatCurrencySafe(sales.data.totalRevenue ?? 0, true)}
                />
                <MetricCard
                  label="Total Admissions"
                  value={sales.data.totalAdmissions ?? 0}
                />
                {/* <MetricCard
                  label="Leads Converted"
                  value={sales.data.leadsConverted ?? 0}
                />
                <MetricCard
                  label="Conversion Rate"
                  value={`${sales.data.conversionRate ?? 0}%`}
                /> */}
              </div>

              <Card title="Sales By Employee" noPadding>
                {!salesRows.length ? (
                  <div className="py-10">
                    <EmptyState title="No sales breakdown available" />
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50">
                          {[
                            "Employee",
                            "Revenue",
                            "Admission",
                            /* "Target", */
                            "Incentive",
                          ].map((h) => (
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
                        {salesRows.map((row, i) => (
                          <tr key={String(row.employeeId ?? i)}>
                            <td className="px-4 py-3 text-xs font-semibold">
                              {row.employeeName ?? row.name ?? "—"}
                            </td>
                            <td className="px-4 py-3 text-xs">
                              {formatCurrencySafe(row.totalRevenue ?? 0, true)}
                            </td>
                            <td className="px-4 py-3 text-xs">
                              {row.totalAdmissions ??
                                row.deals ??
                                row.leads ??
                                0}
                            </td>
                            {/* <td className="px-4 py-3 text-xs">
                              {row.monthlyTarget ?? "—"}
                            </td> */}
                            <td className="px-4 py-3 text-xs text-success-600">
                              {formatCurrencySafe(row.incentive ?? 0)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </Card>
            </>
          ) : (
            <EmptyState title="No sales data" />
          )}
        </>
      )}

      {section === "performance" && (
        <Card title="Performance" noPadding>
          {performance.isLoading ? (
            <div className="flex justify-center py-16">
              <Spinner size={24} />
            </div>
          ) : !perfRows.length ? (
            <div className="py-10">
              <EmptyState title="No performance data" />
            </div>
          ) : (
            <PerformanceTable rows={perfRows} />
          )}
        </Card>
      )}

      {/* {section === "payments" && (
        <>
          {payments.isLoading ? (
            <div className="flex justify-center py-20">
              <Spinner size={28} />
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-5">
                <MetricCard
                  label="Total collected"
                  value={formatCurrencySafe(
                    payments.data?.totalCollected ??
                      payments.data?.collected?.total ??
                      0,
                    true,
                  )}
                />
                <MetricCard
                  label="Today"
                  value={formatCurrencySafe(
                    payments.data?.today ??
                      payments.data?.collected?.today ??
                      0,
                    true,
                  )}
                />
                <MetricCard
                  label="This week"
                  value={formatCurrencySafe(
                    payments.data?.thisWeek ??
                      payments.data?.collected?.thisWeek ??
                      0,
                    true,
                  )}
                />
                <MetricCard
                  label="This month"
                  value={formatCurrencySafe(
                    payments.data?.thisMonth ??
                      payments.data?.collected?.thisMonth ??
                      0,
                    true,
                  )}
                />
              </div>
              <Card title="Collections By Employee" noPadding>
                {!paymentRows.length ? (
                  <div className="py-10">
                    <EmptyState title="No payment data" />
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50">
                          {["Employee", "Collected", "Payments"].map((h) => (
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
                        {paymentRows.map((row, i) => (
                          <tr key={String(row.employeeId ?? i)}>
                            <td className="px-4 py-3 text-xs font-semibold">
                              {String(row.employeeName ?? row.name ?? "—")}
                            </td>
                            <td className="px-4 py-3 text-xs">
                              {formatCurrencySafe(
                                row.totalCollected ?? row.collected ?? 0,
                                true,
                              )}
                            </td>
                            <td className="px-4 py-3 text-xs">
                              {num(row.paymentCount)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </Card>
            </>
          )}
        </>
      )}

      {section === "analytics" && (
        <>
          {analytics.isLoading ? (
            <div className="flex justify-center py-20">
              <Spinner size={28} />
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
              <Card title="Revenue By Month">
                {chartMonths.length ? (
                  <RevenueChart
                    data={chartMonths.map((m) => ({
                      month: String(m.month ?? ""),
                      year: Number(m.year ?? 0),
                      revenue: m.revenue ?? 0,
                      deals: Number(m.deals ?? 0),
                    }))}
                  />
                ) : (
                  <p className="text-sm text-gray-400 py-10 text-center">
                    No revenue trend
                  </p>
                )}
              </Card>
              <Card title="Admissions By Stage">
                {stageData.length ? (
                  <StageDonutChart
                    data={stageData.map((s) => ({
                      stage: (s.stage ?? "new") as never,
                      count: Number(s.count ?? 0),
                    }))}
                  />
                ) : (
                  <p className="text-sm text-gray-400 py-10 text-center">
                    No stage data
                  </p>
                )}
              </Card>
              {(analytics.data?.salesByEmployee?.length ?? 0) > 0 && (
                <Card
                  title="Sales By Employee"
                  className="lg:col-span-2"
                  noPadding
                >
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50">
                          {["Employee", "Revenue", "Deals"].map((h) => (
                            <th
                              key={h}
                              className="text-left px-4 py-3 text-xs font-semibold text-gray-500"
                            >
                              {h}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {(analytics.data?.salesByEmployee ?? []).map(
                          (row, i) => (
                            <tr key={String(row.employeeId ?? i)}>
                              <td className="px-4 py-3 text-xs font-semibold">
                                {row.employeeName ?? row.name ?? "—"}
                              </td>
                              <td className="px-4 py-3 text-xs">
                                {formatCurrencySafe(row.revenue ?? 0, true)}
                              </td>
                              <td className="px-4 py-3 text-xs">
                                {row.deals ?? 0}
                              </td>
                            </tr>
                          ),
                        )}
                      </tbody>
                    </table>
                  </div>
                </Card>
              )}
            </div>
          )}
        </>
      )} */}

      {section === "exports" && (
        <div className="space-y-5">
          <TeamFilters
            period={period}
            customFrom={customFrom}
            customTo={customTo}
            stateId={stateId}
            branchId={branchId}
            employeeId={employeeId}
            supervisorId={supervisorId}
            onPeriodChange={setPeriod}
            onCustomFromChange={setCustomFrom}
            onCustomToChange={setCustomTo}
            onStateChange={setStateId}
            onBranchChange={setBranchId}
            onEmployeeChange={setEmployeeId}
            onSupervisorChange={(v) => {
              setSupervisorId(v);
              setEmployeeId("");
            }}
            members={teamMembers}
            supervisors={supervisors}
            showSupervisorFilter={showSupervisorFilter}
          />
          <Card title="Download Team Reports">
            <p className="text-xs text-gray-500 mb-4">
              Exports use the Team APIs (not admin /reports). Choose type and
              format.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {(
                [
                  "sales",
                  "performance",
                  /* "payments",
                  "analytics", */
                ] as TeamExportType[]
              ).map((type) => (
                <div
                  key={type}
                  className="flex items-center justify-between gap-2 rounded-lg border border-gray-200 dark:border-gray-700 px-3 py-2.5"
                >
                  <span className="text-sm font-medium capitalize text-gray-800 dark:text-gray-200">
                    {type}
                  </span>
                  <div className="flex gap-1">
                    {(["xlsx", "csv"] as const).map((fmt) => (
                      <Button
                        key={fmt}
                        size="sm"
                        variant="secondary"
                        leftIcon={<Download size={12} />}
                        isLoading={exportMutation.isPending}
                        onClick={() => handleExport(type, fmt)}
                      >
                        {fmt.toUpperCase()}
                      </Button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      )}
    </AppShell>
  );
}

function PerformanceTable({ rows }: { rows: TeamPerformanceRow[] }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50">
            {[
              "Employee",
              "Status",
              "Target",
              "Admissions",
              "Converted",
              "Revenue",
              "Incentive",
            ].map((h) => (
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
          {rows.map((row, i) => (
            <tr key={String(row.employeeId ?? i)}>
              <td className="px-4 py-3 text-xs font-semibold">
                {row.employeeName ?? row.name ?? "—"}
              </td>
              <td className="px-4 py-3">
                {performanceStatusBadge(row.performanceStatus)}
              </td>
              <td className="px-4 py-3">{row.monthlyTarget}</td>
              <td className="px-4 py-3 text-xs text-center">
                {row.admissions ?? 0}
              </td>
              <td className="px-4 py-3 text-xs text-center">
                {row.leadsConverted ?? row.leadsCreated ?? 0}
              </td>

              <td className="px-4 py-3 text-xs">
                {formatCurrency(num(row.collection), true)}
              </td>
              <td className="px-4 py-3 text-xs text-success-600">
                {formatCurrencySafe(row.incentiveAmount ?? 0)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
