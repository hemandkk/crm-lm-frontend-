"use client";

import { useState } from "react";
import AppShell from "@/components/layout/AppShell";
import { Card, Spinner } from "@/components/ui";
import { IncentiveStatusCard } from "@/components/dashboard";
import { useIncentiveStatus, useIncentiveSlabs } from "@/hooks";
import { formatCurrency } from "@/lib/utils";
import { cn } from "@/lib/utils";

const PERIOD_OPTIONS = [
  { value: "this_month", label: "This month" },
  { value: "last_month", label: "Last month" },
  { value: "this_year", label: "This year" },
];

export default function IncentivesPage() {
  const [period, setPeriod] = useState("this_month");

  // Map period to month string for API
  const getMonthParam = () => {
    const now = new Date();
    if (period === "last_month") {
      const d = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      return d.toISOString().split("T")[0].slice(0, 7); // YYYY-MM
    }
    return now.toISOString().split("T")[0].slice(0, 7);
  };

  const { data: incentive, isLoading } = useIncentiveStatus({
    month: period !== "this_year" ? getMonthParam() : undefined,
  });
  const { data: slabs } = useIncentiveSlabs();

  return (
    <AppShell title="Incentives" requiredRole="employee">
      {/* Period filter */}
      <div className="flex gap-2 mb-6">
        {PERIOD_OPTIONS.map((opt) => (
          <button
            key={opt.value}
            onClick={() => setPeriod(opt.value)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
              period === opt.value
                ? "bg-primary-50 text-primary-700 border-primary-200 dark:bg-primary-900/20 dark:text-primary-400 dark:border-primary-800"
                : "bg-white border-gray-200 text-gray-600 hover:bg-gray-50 dark:bg-gray-900 dark:border-gray-700 dark:text-gray-400"
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Current incentive status */}
        <Card title="Your incentive status">
          {isLoading ? (
            <div className="flex justify-center py-10">
              <Spinner />
            </div>
          ) : incentive ? (
            <IncentiveStatusCard
              eligible={incentive.eligible}
              amount={incentive.amount}
              rate={incentive.rate}
              slab={incentive.slab}
              collection={incentive.collection}
              nextBracketAmount={incentive.nextBracketAmount}
              nextBracketRate={incentive.nextBracketRate}
            />
          ) : (
            <p className="text-sm text-gray-400 text-center py-6">
              No data available for this period.
            </p>
          )}
        </Card>

        {/* Slab reference table */}
        <Card title="Incentive slab reference">
          {!slabs ? (
            <Spinner />
          ) : (
            <div className="space-y-2">
              {slabs.map((slab, i) => {
                const isActive =
                  incentive &&
                  incentive.eligible &&
                  incentive.collection >= slab.minAmount &&
                  (slab.maxAmount === null ||
                    incentive.collection < slab.maxAmount);

                const isExceeded =
                  incentive &&
                  slab.maxAmount !== null &&
                  incentive.collection >= slab.maxAmount;

                return (
                  <div
                    key={slab.id ?? i}
                    className={cn(
                      "flex items-center justify-between px-4 py-3 rounded-lg border text-sm transition-colors",
                      isActive
                        ? "border-primary-200 bg-primary-50 dark:border-primary-800 dark:bg-primary-900/20"
                        : isExceeded
                          ? "border-success-100 bg-success-50 dark:border-success-800 dark:bg-success-900/10"
                          : "border-gray-100 bg-gray-50 dark:border-gray-700 dark:bg-gray-800/40",
                    )}
                  >
                    <div>
                      <p className="text-xs font-medium text-gray-800 dark:text-gray-200">
                        {formatCurrency(slab.minAmount)}
                        {slab.maxAmount
                          ? ` — ${formatCurrency(slab.maxAmount)}`
                          : " and above"}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span
                        className={cn(
                          "text-sm font-bold",
                          isActive
                            ? "text-primary-700 dark:text-primary-400"
                            : isExceeded
                              ? "text-success-600"
                              : "text-gray-500",
                        )}
                      >
                        {slab.ratePercent}%
                      </span>
                      {isActive && (
                        <span className="text-[10px] bg-primary-100 dark:bg-primary-800 text-primary-700 dark:text-primary-300 px-1.5 py-0.5 rounded font-medium">
                          Current
                        </span>
                      )}
                      {isExceeded && (
                        <span className="text-[10px] bg-success-100 dark:bg-success-800 text-success-700 dark:text-success-300 px-1.5 py-0.5 rounded font-medium">
                          ✓ Exceeded
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </Card>
      </div>
    </AppShell>
  );
}
