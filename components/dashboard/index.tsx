"use client";

import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import {
  cn,
  formatCurrency,
  targetStatusConfig,
  formatCurrencySafe,
} from "@/lib/utils";
import { ProgressBar, MetricCard } from "@/components/ui";
import type { MonthlyRevenue, StageCount, EmployeePerformance } from "@/types";
import type {
  ValueType,
  NameType,
} from "recharts/types/component/DefaultTooltipContent";
// ─── Revenue chart ────────────────────────────────────────────────────────
export function RevenueChart({ data }: { data: MonthlyRevenue[] }) {
  return (
    <ResponsiveContainer width="100%" height={220}>
      <BarChart data={data} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
        <XAxis
          dataKey="month"
          tick={{ fontSize: 11 }}
          tickLine={false}
          axisLine={false}
        />
        <YAxis
          tickFormatter={(v) => formatCurrency(v, true)}
          tick={{ fontSize: 11 }}
          tickLine={false}
          axisLine={false}
        />
        <Tooltip
          formatter={(v: unknown) => [formatCurrencySafe(v), "Revenue"]}
          contentStyle={{
            fontSize: 12,
            borderRadius: 8,
            border: "1px solid #e5e7eb",
          }}
        />
        <Bar dataKey="revenue" fill="#185FA5" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}

// ─── Revenue trend line ───────────────────────────────────────────────────
export function RevenueTrendChart({ data }: { data: MonthlyRevenue[] }) {
  return (
    <ResponsiveContainer width="100%" height={220}>
      <LineChart data={data} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
        <XAxis
          dataKey="month"
          tick={{ fontSize: 11 }}
          tickLine={false}
          axisLine={false}
        />
        <YAxis
          tickFormatter={(v) => formatCurrencySafe(v, true)}
          tick={{ fontSize: 11 }}
          tickLine={false}
          axisLine={false}
        />
        <Tooltip
          formatter={(v: unknown) => [formatCurrencySafe(v), "Revenue"]}
          contentStyle={{ fontSize: 12, borderRadius: 8 }}
        />
        <Line
          type="monotone"
          dataKey="revenue"
          stroke="#185FA5"
          strokeWidth={2}
          dot={{ r: 3, fill: "#185FA5" }}
          activeDot={{ r: 5 }}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}

// ─── Stage donut chart ────────────────────────────────────────────────────
const STAGE_COLORS: Record<string, string> = {
  new: "#D3D1C7",
  contacted: "#B5D4F4",
  negotiation: "#FAC775",
  won: "#C0DD97",
  lost: "#F7C1C1",
};

export function StageDonutChart({ data }: { data: StageCount[] }) {
  return (
    <ResponsiveContainer width="100%" height={220}>
      <PieChart>
        <Pie
          data={data}
          dataKey="count"
          nameKey="stage"
          cx="50%"
          cy="50%"
          innerRadius={55}
          outerRadius={85}
          paddingAngle={2}
        >
          {data.map((entry) => (
            <Cell
              key={entry.stage}
              fill={STAGE_COLORS[entry.stage] ?? "#ddd"}
            />
          ))}
        </Pie>
        <Tooltip
          formatter={(v, name) => [v, String(name)]}
          contentStyle={{ fontSize: 12, borderRadius: 8 }}
        />
        <Legend
          formatter={(v) => <span className="text-xs capitalize">{v}</span>}
          iconSize={10}
          iconType="circle"
        />
      </PieChart>
    </ResponsiveContainer>
  );
}

// ─── Employee performance list ────────────────────────────────────────────
export function EmployeePerformanceList({
  data,
}: {
  data: EmployeePerformance[];
}) {
  return (
    <div className="space-y-3">
      {data.map((emp) => {
        const pct = Math.min(
          Math.round((emp?.targetAchieved / emp.monthlyTarget) * 100),
          130,
        );
        const cfg = targetStatusConfig[emp.targetStatus];
        return (
          <div key={emp.employeeId} className="flex items-center gap-3">
            <p className="text-xs font-medium text-gray-700 dark:text-gray-300 w-28 truncate flex-shrink-0">
              {emp.employeeName}
            </p>
            <div className="flex-1">
              <ProgressBar
                value={emp.targetAchieved}
                max={emp.monthlyTarget}
                color={
                  emp.targetStatus === "behind"
                    ? "danger"
                    : emp.targetStatus === "on_track"
                      ? "warning"
                      : "success"
                }
              />
            </div>
            <span
              className={cn(
                "text-xs font-medium w-32 text-right flex-shrink-0",
                cfg.color,
              )}
            >
              {emp.targetAchieved}/{emp.monthlyTarget} — {cfg.label}
            </span>
          </div>
        );
      })}
    </div>
  );
}

// ─── Sales target progress (employee dashboard) ───────────────────────────
interface SalesTargetBarProps {
  achieved: number;
  target: number;
  status: "excellent" | "met" | "on_track" | "behind";
}

export function SalesTargetBar({
  achieved,
  target,
  status,
}: SalesTargetBarProps) {
  const cfg = targetStatusConfig[status];
  const pct = target > 0 ? Math.round((achieved / target) * 100) : 0;
  return (
    <div>
      <div className="flex items-baseline gap-2 mb-2">
        <span className={cn("text-3xl font-bold", cfg.color)}>{achieved}</span>
        <span className="text-base text-gray-400">/{target} leads</span>
      </div>
      <ProgressBar
        value={achieved}
        max={target}
        color={
          status === "behind"
            ? "danger"
            : status === "on_track"
              ? "warning"
              : "success"
        }
        className="mb-2"
      />
      <span
        className={cn(
          "inline-block px-2 py-0.5 rounded text-xs font-medium",
          cfg.bg,
          cfg.color,
        )}
      >
        {pct}% of target — {cfg.label}
      </span>
    </div>
  );
}

// ─── Payment status summary (employee dashboard) ──────────────────────────
export function PaymentStatusSummary({
  advanceCount,
  halfPaidCount,
  fullPaidCount,
  total,
}: {
  advanceCount: number;
  halfPaidCount: number;
  fullPaidCount: number;
  total: number;
}) {
  const items = [
    { label: "Advance paid", count: advanceCount, color: "bg-warning-400" },
    { label: "50%+ paid", count: halfPaidCount, color: "bg-primary-400" },
    { label: "Fully paid", count: fullPaidCount, color: "bg-success-600" },
  ];
  return (
    <div className="space-y-2.5">
      {items.map((item) => (
        <div key={item.label} className="flex items-center gap-2.5">
          <span
            className={cn("w-2.5 h-2.5 rounded-full flex-shrink-0", item.color)}
          />
          <span className="text-xs text-gray-600 dark:text-gray-300 flex-1">
            {item.label}
          </span>
          <span className="text-xs font-semibold text-gray-900 dark:text-gray-100">
            {item.count}
          </span>
          <span className="text-[10px] text-gray-400 w-10 text-right">
            {total > 0 ? Math.round((item.count / total) * 100) : 0}%
          </span>
        </div>
      ))}
    </div>
  );
}

// ─── Incentive status card ────────────────────────────────────────────────
export function IncentiveStatusCard({
  eligible,
  amount,
  rate,
  slab,
  collection,
  nextBracketAmount,
  nextBracketRate,
}: {
  eligible: boolean;
  amount: number;
  rate: number;
  slab: string;
  collection: number;
  nextBracketAmount: number | null;
  nextBracketRate: number | null;
}) {
  return (
    <div className="space-y-3">
      <div>
        <p className="text-xs text-gray-500 mb-1">Collection this month</p>
        <p className="text-lg font-bold text-gray-900 dark:text-gray-100">
          {formatCurrency(collection)}
        </p>
        <p className="text-xs text-gray-400">{slab}</p>
      </div>
      <div className="bg-success-50 dark:bg-success-900/20 border border-success-100 dark:border-success-800 rounded-lg px-4 py-3">
        <p className="text-xs text-gray-500 mb-0.5">Your incentive</p>
        <p className="text-2xl font-bold text-success-700 dark:text-success-400">
          {formatCurrency(amount)}
        </p>
        <p className="text-xs text-gray-400 mt-0.5">{rate}% of collection</p>
      </div>
      {nextBracketAmount && nextBracketRate && (
        <div className="text-xs text-gray-500">
          Collect{" "}
          <span className="font-medium text-primary-600">
            {formatCurrency(nextBracketAmount)} more
          </span>{" "}
          to reach the{" "}
          <span className="font-medium text-success-600">
            {nextBracketRate}%
          </span>{" "}
          bracket
          <ProgressBar
            value={collection}
            max={collection + nextBracketAmount}
            color="success"
            className="mt-1.5"
          />
        </div>
      )}
    </div>
  );
}
