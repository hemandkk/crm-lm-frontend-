"use client";

import { useState } from "react";
import { List, CreditCard, Award, BookOpen } from "lucide-react";
import AppShell from "@/components/layout/AppShell";
import { Card, MetricCard, Spinner } from "@/components/ui";
import {
  SalesTargetBar,
  PaymentStatusSummary,
  IncentiveStatusCard,
} from "@/components/dashboard";
import { useEmployeeDashboard } from "@/hooks";
import { formatCurrency } from "@/lib/utils";

const PERIOD_OPTIONS = [
  { value: "", label: "All time" },
  { value: "today", label: "Today" },
  { value: "this_week", label: "This week" },
  { value: "this_month", label: "This month" },
];

export default function EmployeeDashboardPage() {
  const [period, setPeriod] = useState("this_month");

  // Map period selector to dateFrom/dateTo
  const getDateFilter = () => {
    const now = new Date();
    if (period === "today") {
      const d = now.toISOString().split("T")[0];
      return { dateFrom: d, dateTo: d };
    }
    if (period === "this_week") {
      const day = now.getDay();
      const mon = new Date(now);
      mon.setDate(now.getDate() - ((day + 6) % 7));
      return {
        dateFrom: mon.toISOString().split("T")[0],
        dateTo: now.toISOString().split("T")[0],
      };
    }
    if (period === "this_month") {
      const first = new Date(now.getFullYear(), now.getMonth(), 1);
      return {
        dateFrom: first.toISOString().split("T")[0],
        dateTo: now.toISOString().split("T")[0],
      };
    }
    return {};
  };

  const { data: dash, isLoading } = useEmployeeDashboard(getDateFilter());

  return (
    <AppShell title="Dashboard" requiredRole="employee">
      {/* Period filter */}
      <div className="flex gap-2 mb-6">
        {PERIOD_OPTIONS.map((opt) => (
          <button
            key={opt.value}
            onClick={() => setPeriod(opt.value)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
              period === opt.value
                ? "bg-primary-50 text-primary-700 border-primary-200 dark:bg-gray-800 dark:bg-gray-300 dark:text-white dark:border-primary-800"
                : "bg-white border-gray-200 text-gray-600 hover:bg-gray-50 dark:bg-gray-900 dark:border-gray-700 dark:text-gray-400"
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="flex justify-center py-20">
          <Spinner size={28} />
        </div>
      ) : dash ? (
        <>
          {/* Lead count metrics */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <MetricCard
              label="Total leads"
              value={dash.totalLeads}
              icon={<List size={16} />}
            />
            <MetricCard
              label="This month"
              value={dash.leadsThisMonth}
              icon={<List size={16} />}
            />
            <MetricCard
              label="This week"
              value={dash.leadsThisWeek}
              icon={<List size={16} />}
            />
            <MetricCard
              label="Today"
              value={dash.leadsToday}
              icon={<List size={16} />}
            />
          </div>

          {/* Sales target + payment status */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-5">
            <Card title="Sales target — this month">
              <SalesTargetBar
                achieved={dash.targetAchieved}
                target={dash.monthlyTarget}
                status={dash.targetStatus}
              />
            </Card>
            <Card title="Payment status — all leads">
              <PaymentStatusSummary
                advanceCount={dash.paymentSummary.advanceCount}
                halfPaidCount={dash.paymentSummary.halfPaidCount}
                fullPaidCount={dash.paymentSummary.fullPaidCount}
                total={dash.totalLeads}
              />
            </Card>
          </div>

          {/* Collections + Incentive */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-5">
            <Card
              title="Collections"
              action={
                <span className="text-xs text-gray-400">Amount received</span>
              }
            >
              <div className="grid grid-cols-2 gap-4">
                {[
                  { label: "Today", value: dash.paymentSummary.today },
                  { label: "This week", value: dash.paymentSummary.thisWeek },
                  { label: "This month", value: dash.paymentSummary.thisMonth },
                  { label: "Total", value: dash.paymentSummary.total },
                ].map(({ label, value }) => (
                  <div
                    key={label}
                    className="bg-gray-50 dark:bg-gray-800 rounded-lg px-4 py-3"
                  >
                    <p className="text-xs text-gray-400 mb-1">{label}</p>
                    <p
                      className={`text-lg font-bold ${label === "Total" ? "text-success-600" : "text-gray-900 dark:text-gray-100"}`}
                    >
                      {formatCurrency(value, true)}
                    </p>
                  </div>
                ))}
              </div>
            </Card>

            <Card title="Your incentive">
              {dash.incentive.eligible ? (
                <IncentiveStatusCard
                  eligible={dash.incentive.eligible}
                  amount={dash.incentive.amount}
                  rate={dash.incentive.rate}
                  slab={dash.incentive.slab}
                  collection={dash.incentive.collection}
                  nextBracketAmount={dash.incentive.nextBracketAmount}
                  nextBracketRate={dash.incentive.nextBracketRate}
                />
              ) : (
                <p className="text-sm text-gray-400 text-center py-4">
                  No incentive yet this month. Keep collecting!
                </p>
              )}
            </Card>
          </div>

          {/* Exam stats */}
          <div className="grid grid-cols-2 gap-4">
            <MetricCard
              label="Exam attended"
              value={dash.examStats.attended}
              sub={`of ${dash.totalLeads} total leads`}
              icon={<BookOpen size={16} />}
            />
            <MetricCard
              label="Certified"
              value={dash.examStats.certified}
              sub={`of ${dash.examStats.attended} attended`}
              subVariant="success"
              icon={<Award size={16} />}
            />
          </div>
        </>
      ) : null}
    </AppShell>
  );
}
