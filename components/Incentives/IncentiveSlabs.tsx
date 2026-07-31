"use client";

import React from "react";
import { Spinner } from "@/components/ui";
import { formatCurrencySafe, cn } from "@/lib/utils";
import { IncentiveReportItem, IncentiveSlab } from "@/types";

interface Aggregated {
  mine: IncentiveReportItem | undefined;
  totalIncentive: number;
  totalLeads: number;
  dateFrom: string;
  dateTo: string;
  months: string[];
}
const IncentiveSlabs = ({
  slabs,
  aggregated,
}: {
  slabs: IncentiveSlab[] | undefined;
  aggregated: Aggregated | null;
}) => {
  const mine = aggregated?.mine;
  const leadCount = mine?.leadCount ?? 0;
  return (
    <>
      {!slabs ? (
        <div className="flex justify-center py-10">
          <Spinner />
        </div>
      ) : slabs.length === 0 ? (
        <p className="text-sm text-gray-400 text-center py-6">
          No slabs configured.
        </p>
      ) : (
        <div className="space-y-2">
          {slabs.map((slab, i) => {
            const min = Number(slab.minLeads ?? 0);
            const max = slab.maxLeads == null ? null : Number(slab.maxLeads);
            // Highlight against latest/single-month lead count only
            const compareLeads =
              aggregated?.months.length === 1 ? leadCount : 0;
            const isActive =
              !!mine &&
              aggregated?.months.length === 1 &&
              mine.eligible &&
              compareLeads >= min &&
              (max === null || compareLeads <= max);
            const isPassed =
              !!mine &&
              aggregated?.months.length === 1 &&
              max !== null &&
              compareLeads > max;

            return (
              <div
                key={slab.id ?? i}
                className={cn(
                  "flex items-center justify-between px-4 py-3 rounded-lg border text-sm transition-colors",
                  isActive
                    ? "border-primary-200 bg-primary-50 dark:border-primary-800 dark:bg-primary-900/20"
                    : isPassed
                      ? "border-success-100 bg-success-50 dark:border-success-800 dark:bg-success-900/10"
                      : "border-gray-100 bg-gray-50 dark:border-gray-700 dark:bg-gray-800/40",
                )}
              >
                <div>
                  <p className="text-xs font-medium text-gray-800 dark:text-gray-200">
                    {min}
                    {max != null ? ` – ${max}` : "+"}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span
                    className={cn(
                      "text-sm font-bold",
                      isActive
                        ? "text-primary-700 dark:text-primary-400"
                        : isPassed
                          ? "text-success-600"
                          : "text-gray-500",
                    )}
                  >
                    {formatCurrencySafe(slab.incentiveAmount)} / Admission
                  </span>
                  {isActive && (
                    <span className="text-[10px] bg-primary-100 dark:bg-primary-800 text-primary-700 dark:text-primary-300 px-1.5 py-0.5 rounded font-medium">
                      Current
                    </span>
                  )}
                  {isPassed && (
                    <span className="text-[10px] bg-success-100 dark:bg-success-800 text-success-700 dark:text-success-300 px-1.5 py-0.5 rounded font-medium">
                      Passed
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </>
  );
};

export default IncentiveSlabs;
