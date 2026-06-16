"use client";

import { useState } from "react";
import { Users, List, TrendingUp, Award } from "lucide-react";
import AppShell from "@/components/layout/AppShell";
import { MetricCard, Card, Spinner } from "@/components/ui";
import {
  RevenueChart,
  StageDonutChart,
  EmployeePerformanceList,
} from "@/components/dashboard";
import { useAdminDashboard } from "@/hooks";
import { useEmployees } from "@/hooks/useEmployees";
import { formatCurrency } from "@/lib/utils";

export default function AdminDashboardPage() {
  const [employeeFilter, setEmployeeFilter] = useState("");
  const [period, setPeriod] = useState("this_month");

  const { data: dashboard, isLoading } = useAdminDashboard({
    employeeId: employeeFilter || undefined,
  });
  const { data: employees } = useEmployees();

  return (
    <AppShell title="Dashboard" requiredRole="admin">
      {/* Filters */}
      <div className="flex gap-3 mb-6 flex-wrap">
        <select
          value={period}
          onChange={(e) => setPeriod(e.target.value)}
          className="px-3 py-1.5 text-sm border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-600 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-primary-600"
        >
          <option value="today">Today</option>
          <option value="this_week">This week</option>
          <option value="this_month">This month</option>
          <option value="custom">Custom range</option>
        </select>
        <select
          value={employeeFilter}
          onChange={(e) => setEmployeeFilter(e.target.value)}
          className="px-3 py-1.5 text-sm border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-600 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-primary-600"
        >
          <option value="">All employees</option>
          {employees?.data.map((e) => (
            <option key={e.id} value={e.id}>
              {e.name}
            </option>
          ))}
        </select>
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
              label="Total employees"
              value={dashboard.totalEmployees}
              icon={<Users size={16} />}
            />
            <MetricCard
              label="Total leads"
              value={dashboard.totalLeads}
              sub={`↑ ${dashboard.leadsThisWeek} this week`}
              subVariant="success"
              icon={<List size={16} />}
            />
            <MetricCard
              label="Total revenue"
              value={formatCurrency(dashboard.totalRevenue, true)}
              sub="↑ 12% vs last month"
              subVariant="success"
              icon={<TrendingUp size={16} />}
            />
            <MetricCard
              label="Conversion rate"
              value={`${dashboard.conversionRate}%`}
              sub="Leads → paid"
              icon={<TrendingUp size={16} />}
            />
            <MetricCard
              label="Certificates"
              value={dashboard.certificatesIssued}
              sub="Issued to date"
              icon={<Award size={16} />}
            />
          </div>

          {/* Charts row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-5">
            <Card
              title="Monthly revenue"
              action={
                <span className="text-xs text-gray-400">Last 6 months</span>
              }
            >
              <RevenueChart data={dashboard.revenueByMonth} />
            </Card>
            <Card title="Leads by stage">
              <StageDonutChart data={dashboard.leadsByStage} />
            </Card>
          </div>

          {/* Employee performance */}
          <Card
            title="Employee performance"
            action={
              <span className="text-xs text-gray-400">vs monthly target</span>
            }
          >
            <EmployeePerformanceList data={dashboard.employeePerformance} />
          </Card>
        </>
      ) : (
        <p>No data</p>
      )}
    </AppShell>
  );
}
