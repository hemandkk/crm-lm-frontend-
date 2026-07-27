"use client";

import { useMemo, useState } from "react";
import { Users, List, TrendingUp, Award } from "lucide-react";
import AppShell from "@/components/layout/AppShell";
import { MetricCard, Card, Spinner } from "@/components/ui";
import {
  RevenueChart,
  StageDonutChart,
  EmployeePerformanceList,
} from "@/components/dashboard";
import OrgScopeFilters from "@/components/filters/OrgScopeFilters";
import { useAdminDashboard } from "@/hooks";
import { useSalesEmployees } from "@/hooks/useEmployees";
import { filterSalesPerformanceRows, salesEmployeeIdSet } from "@/lib/roles";
import { formatCurrency } from "@/lib/utils";
import { format } from "date-fns";

function toDateString(d: Date) {
  return format(d, "yyyy-MM-dd");
}

function getPeriodRange(
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
    const day = now.getDay(); // 0 Sun … 6 Sat
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

export default function AdminDashboardPage() {
  const [stateId, setStateId] = useState("");
  const [branchId, setBranchId] = useState("");
  const [employeeFilter, setEmployeeFilter] = useState("");
  const [period, setPeriod] = useState("this_month");
  const [customFrom, setCustomFrom] = useState("");
  const [customTo, setCustomTo] = useState("");

  const dateFilters = useMemo(
    () => getPeriodRange(period, customFrom, customTo),
    [period, customFrom, customTo],
  );

  const customInvalid =
    period === "custom" &&
    (!!customFrom || !!customTo) &&
    (!customFrom || !customTo || customFrom > customTo);

  const { data: dashboard, isLoading } = useAdminDashboard(
    {
      stateId: stateId || undefined,
      branchId: branchId || undefined,
      employeeId: employeeFilter || undefined,
      dateFrom: dateFilters.dateFrom,
      dateTo: dateFilters.dateTo,
    },
    {
      // Avoid calling API with incomplete custom range
      enabled:
        period !== "custom" || (!!dateFilters.dateFrom && !!dateFilters.dateTo),
    },
  );

  const { employees } = useSalesEmployees({
    pageSize: 200,
    status: "active",
    stateId: stateId || undefined,
    branchId: branchId || undefined,
  });
  const salesIds = useMemo(() => salesEmployeeIdSet(employees), [employees]);

  const onPeriodChange = (value: string) => {
    setPeriod(value);
    if (value === "custom") {
      const now = new Date();
      const first = new Date(now.getFullYear(), now.getMonth(), 1);
      if (!customFrom) setCustomFrom(toDateString(first));
      if (!customTo) setCustomTo(toDateString(now));
    }
  };

  return (
    <AppShell title="Dashboard" requiredRole="admin">
      {/* Filters */}
      <div className="flex gap-3 mb-6 flex-wrap items-end">
        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-gray-500">Period</label>
          <select
            value={period}
            onChange={(e) => onPeriodChange(e.target.value)}
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
                onChange={(e) => setCustomFrom(e.target.value)}
                className="px-3 py-1.5 text-sm border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-600 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-primary-600"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-gray-500">To</label>
              <input
                type="date"
                value={customTo}
                min={customFrom || undefined}
                onChange={(e) => setCustomTo(e.target.value)}
                className="px-3 py-1.5 text-sm border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-600 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-primary-600"
              />
            </div>
          </>
        )}

        <OrgScopeFilters
          stateId={stateId}
          branchId={branchId}
          employeeId={employeeFilter}
          employeeOptionsMode="sales"
          onChange={(next) => {
            setStateId(next.stateId);
            setBranchId(next.branchId);
            setEmployeeFilter(next.employeeId);
          }}
        />

        {(dateFilters.dateFrom || dateFilters.dateTo) && (
          <p className="text-xs text-gray-400 pb-1.5">
            {dateFilters.dateFrom}
            {dateFilters.dateTo ? ` → ${dateFilters.dateTo}` : ""}
          </p>
        )}
        {customInvalid && (
          <p className="text-xs text-danger-600 pb-1.5">
            Select a valid From / To range.
          </p>
        )}
      </div>

      {isLoading ? (
        <div className="flex justify-center py-20">
          <Spinner size={28} />
        </div>
      ) : dashboard ? (
        <>
          {/* Metrics */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-6">
            <MetricCard
              label="Total Employees"
              value={dashboard.totalEmployees}
              icon={<Users size={16} />}
            />
            <MetricCard
              label="Total Admissions"
              value={dashboard.totalLeads}
              sub={`↑ ${dashboard.leadsThisWeek} this week`}
              subVariant="success"
              icon={<List size={16} />}
            />
            <MetricCard
              label="Total Revenue"
              value={formatCurrency(dashboard.totalRevenue, true)}
              icon={<TrendingUp size={16} />}
            />
            {/* <MetricCard
              label="Conversion rate"
              value={`${dashboard?.conversionRate}%`}
              sub="Leads → paid"
              icon={<TrendingUp size={16} />}
            /> */}
            <MetricCard
              label="Certificate Delivered"
              value={dashboard.certificatesIssued}
              icon={<Award size={16} />}
            />
          </div>

          {/* Charts row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-5">
            <Card
              title="Monthly Revenue"
              action={
                <span className="text-xs text-gray-400">
                  {dateFilters.dateFrom && dateFilters.dateTo
                    ? `${dateFilters.dateFrom} → ${dateFilters.dateTo}`
                    : "Filtered period"}
                </span>
              }
            >
              <RevenueChart data={dashboard.revenueByMonth ?? []} />
            </Card>
            <Card title="Admissions By Stage">
              <StageDonutChart data={dashboard.leadsByAdmissionStage ?? []} />
            </Card>
          </div>

          {/* Employee performance */}
          <Card
            title="Employee Performance"
            action={
              <span className="text-xs text-gray-400">vs Monthly Target</span>
            }
          >
            <EmployeePerformanceList
              data={filterSalesPerformanceRows(
                dashboard.employeePerformance ?? [],
                salesIds,
              )}
            />
          </Card>
        </>
      ) : (
        <p className="text-sm text-gray-400">No data</p>
      )}
    </AppShell>
  );
}
