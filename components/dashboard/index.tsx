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
  ResponsiveContainer,
} from "recharts";
import {
  cn,
  formatCurrency,
  targetStatusConfig,
  formatCurrencySafe,
} from "@/lib/utils";
import { ProgressBar, MetricCard } from "@/components/ui";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import type {
  MonthlyRevenue,
  SalesByMonth,
  StageCount,
  AdmissionStageCount,
  EmployeePerformance,
  AdmissionStage,
} from "@/types";
import { ADMISSION_STAGE_LABELS } from "@/types";
type RevenueChartPoint = MonthlyRevenue | SalesByMonth;

function toChartRows(data: RevenueChartPoint[]) {
  return data.map((d) => {
    const year = "year" in d ? d.year : undefined;
    const deals =
      "deals" in d && d.deals != null
        ? Number(d.deals)
        : "leadsCount" in d && d.leadsCount != null
          ? Number(d.leadsCount)
          : 0;
    return {
      label: year ? `${d.month} ${year}` : d.month,
      month: d.month,
      revenue: Number(d.revenue) || 0,
      deals,
    };
  });
}

// ─── Revenue chart ────────────────────────────────────────────────────────
export function RevenueChart({ data }: { data: RevenueChartPoint[] }) {
  const chartData = toChartRows(data ?? []);

  return (
    <ResponsiveContainer width="100%" height={220}>
      <BarChart
        data={chartData}
        margin={{ top: 4, right: 4, left: 0, bottom: 0 }}
      >
        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
        <XAxis
          dataKey="label"
          tick={{ fontSize: 11 }}
          tickLine={false}
          axisLine={false}
        />
        <YAxis
          tickFormatter={(v) => formatCurrency(Number(v), true)}
          tick={{ fontSize: 11 }}
          tickLine={false}
          axisLine={false}
        />
        <Tooltip
          formatter={(v) => [formatCurrencySafe(v), "Revenue"]}
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
export function RevenueTrendChart({ data }: { data: RevenueChartPoint[] }) {
  const chartData = toChartRows(data ?? []);

  return (
    <ResponsiveContainer width="100%" height={220}>
      <LineChart
        data={chartData}
        margin={{ top: 4, right: 4, left: 0, bottom: 0 }}
      >
        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
        <XAxis
          dataKey="label"
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
  registered: "#3B82F6",
  fifty_percent_paid: "#F59E0B",
  exam_attended: "#8B5CF6",
  waiting_for_100_percent_payment: "#F97316",
  certificate_waiting: "#EC4899",
  waiting_result: "#06B6D4",
  result_announced: "#14B8A6",
  result_announces: "#0EA5E9",
  completed: "#22C55E",
  delivered: "#166534",
};

export function StageDonutChart({ data }: { data: AdmissionStageCount[] }) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center gap-2">
      <div className="w-full sm:flex-1 min-w-0 h-[220px]">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              dataKey="count"
              nameKey="admission_stage"
              cx="50%"
              cy="50%"
              innerRadius={55}
              outerRadius={85}
              paddingAngle={2}
            >
              {data.map((entry) => (
                <Cell
                  key={entry.admission_stage}
                  fill={STAGE_COLORS[entry.admission_stage] ?? "#ddd"}
                />
              ))}
            </Pie>
            <Tooltip
              formatter={(value, name) => [
                value,
                ADMISSION_STAGE_LABELS[name as AdmissionStage],
              ]}
              contentStyle={{ fontSize: 12, borderRadius: 8 }}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>

      <ul className="grid grid-cols-2 gap-x-3 gap-y-2 sm:grid-cols-1 sm:w-44 sm:shrink-0 px-1">
        {data.map((entry) => {
          const label =
            ADMISSION_STAGE_LABELS[entry.admission_stage as AdmissionStage] ??
            entry.admission_stage;
          return (
            <li key={entry.admission_stage} className="min-w-0 cursor-pointer">
              <Popover>
                <PopoverTrigger asChild>
                  <button
                    type="button"
                    className="cursor-pointer flex w-full items-center gap-2 min-w-0 text-left text-xs text-gray-700 dark:text-gray-300 rounded-md -mx-1 px-1 py-0.5 hover:bg-gray-50 dark:hover:bg-gray-800/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-600"
                  >
                    <span
                      className="size-2.5 rounded-full shrink-0"
                      style={{
                        backgroundColor:
                          STAGE_COLORS[entry.admission_stage] ?? "#ddd",
                      }}
                    />
                    <span className="truncate capitalize">{label}</span>
                    <span className="ml-auto tabular-nums text-gray-400 shrink-0">
                      {entry.count}
                    </span>
                  </button>
                </PopoverTrigger>
                <PopoverContent
                  side="top"
                  align="start"
                  className="w-auto max-w-[260px] p-2.5 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100"
                >
                  <p className="text-xs font-medium leading-snug">{label}</p>
                  <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-0.5">
                    Count: {entry.count}
                  </p>
                </PopoverContent>
              </Popover>
            </li>
          );
        })}
      </ul>
    </div>
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
                "text-xs font-medium w-40 text-right flex-shrink-0",
                cfg?.color ?? "",
              )}
            >
              {emp.leadsAssigned}/{emp.monthlyTarget} — {cfg?.label ?? ""}
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
        <span className={cn("text-3xl font-bold", cfg?.color ?? "")}>
          {achieved}
        </span>
        <span className="text-base text-gray-400">/{target} Admissions</span>
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
          cfg?.bg ?? "",
          cfg?.color ?? "",
        )}
      >
        {pct}% of target — {cfg?.label ?? ""}
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
    {
      label: "Advance paid",
      count: advanceCount ?? 0,
      color: "bg-warning-400",
    },
    { label: "50%+ paid", count: halfPaidCount ?? 0, color: "bg-primary-400" },
    { label: "Fully paid", count: fullPaidCount ?? 0, color: "bg-success-600" },
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
  leadCount,
  nextBracketLeads,
  nextBracketIncentive,
  // legacy aliases from older dashboard payloads
  collection,
  nextBracketAmount,
  nextBracketRate,
}: {
  eligible: boolean;
  amount: number | string;
  rate?: number;
  slab?: string | null;
  leadCount?: number;
  nextBracketLeads?: number | null;
  nextBracketIncentive?: number | string | null;
  collection?: number;
  nextBracketAmount?: number | null;
  nextBracketRate?: number | null;
}) {
  const leads = leadCount ?? collection ?? 0;
  const leadsToNext = nextBracketLeads ?? nextBracketAmount ?? null;
  const nextIncentive = nextBracketIncentive ?? nextBracketRate ?? null;
  const amountNum = Number(amount) || 0;
  const nextIncentiveNum = nextIncentive != null ? Number(nextIncentive) : null;

  return (
    <div className="space-y-3">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs text-gray-500 mb-1">Admissions this period</p>
          <p className="text-lg font-bold text-gray-900 dark:text-gray-100">
            {leads}
          </p>
          <p className="text-xs text-gray-400 mt-0.5">
            {slab ? `Slab: ${slab}` : "No slab unlocked yet"}
          </p>
        </div>
        <span
          className={cn(
            "px-2 py-0.5 rounded text-[10px] font-medium shrink-0",
            eligible
              ? "bg-success-50 text-success-700 dark:bg-success-900/30 dark:text-success-400"
              : "bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400",
          )}
        >
          {eligible ? "Eligible" : "Not eligible"}
        </span>
      </div>

      <div className="bg-success-50 dark:bg-success-900/20 border border-success-100 dark:border-success-800 rounded-lg px-4 py-3">
        <p className="text-xs text-gray-500 mb-0.5">Your Incentive</p>
        <p className="text-2xl font-bold text-success-700 dark:text-success-400">
          {formatCurrencySafe(amountNum * leads)}
        </p>
        {rate != null && (
          <p className="text-xs text-gray-400 mt-0.5">{rate}% rate</p>
        )}
      </div>

      {leadsToNext != null && leadsToNext > 0 && (
        <div className="text-xs text-gray-500">
          Add{" "}
          <span className="font-medium text-primary-600">
            {leadsToNext} more lead{leadsToNext === 1 ? "" : "s"}
          </span>
          {nextIncentiveNum != null && nextIncentiveNum > 0 && (
            <>
              {" "}
              to unlock{" "}
              <span className="font-medium text-success-600">
                {formatCurrencySafe(nextIncentiveNum)}
              </span>{" "}
              Incentive / Admission
            </>
          )}
          <ProgressBar
            value={leads}
            max={leads + leadsToNext}
            color="success"
            className="mt-1.5"
          />
        </div>
      )}
    </div>
  );
}
