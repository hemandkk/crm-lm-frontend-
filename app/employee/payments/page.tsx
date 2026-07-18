"use client";

import { useState } from "react";
import { Eye } from "lucide-react";
import AppShell from "@/components/layout/AppShell";
import {
  Card,
  MetricCard,
  Spinner,
  EmptyState,
  Pagination,
} from "@/components/ui";
import { usePayments, usePaymentSummary } from "@/hooks";
import {
  cn,
  formatCurrency,
  formatDate,
  paymentTypeConfig,
  resolveAssetUrl,
} from "@/lib/utils";

export default function PaymentsPage() {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  const filters = {
    dateFrom: dateFrom || undefined,
    dateTo: dateTo || undefined,
    page,
    pageSize,
  };

  const { data: paymentsData, isLoading } = usePayments(filters);
  const payments = paymentsData?.items ?? paymentsData?.data ?? [];
  const { data: summary } = usePaymentSummary({
    dateFrom: dateFrom || undefined,
    dateTo: dateTo || undefined,
  });

  return (
    <AppShell title="Payments" requiredRole={["employee", "manager", "sales_head"]}>
      {summary && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <MetricCard
            label="Today"
            value={formatCurrency(summary.collected.today, true)}
          />
          <MetricCard
            label="This week"
            value={formatCurrency(summary.collected.thisWeek, true)}
          />
          <MetricCard
            label="This month"
            value={formatCurrency(summary.collected.thisMonth, true)}
            subVariant="success"
          />
          <MetricCard
            label="Total collected"
            value={formatCurrency(summary.totalCollected, true)}
            subVariant="success"
          />
        </div>
      )}

      <div className="flex gap-3 mb-5 flex-wrap items-center">
        <span className="text-xs text-gray-500">Filter by date:</span>
        <input
          type="date"
          value={dateFrom}
          onChange={(e) => {
            setDateFrom(e.target.value);
            setPage(1);
          }}
          className="px-3 py-1.5 text-sm border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-600 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-primary-600"
        />
        <span className="text-xs text-gray-400">to</span>
        <input
          type="date"
          value={dateTo}
          onChange={(e) => {
            setDateTo(e.target.value);
            setPage(1);
          }}
          className="px-3 py-1.5 text-sm border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-600 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-primary-600"
        />
        {(dateFrom || dateTo) && (
          <button
            type="button"
            onClick={() => {
              setDateFrom("");
              setDateTo("");
              setPage(1);
            }}
            className="text-xs text-primary-600 hover:underline"
          >
            Clear
          </button>
        )}
      </div>

      <Card noPadding>
        {isLoading ? (
          <div className="flex justify-center py-16">
            <Spinner size={24} />
          </div>
        ) : !payments.length ? (
          <EmptyState
            title="No payments found"
            description="No payment records match your current filters."
          />
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50">
                    {["Date", "Admission", "Amount", "Type", "Notes", "Receipt"].map(
                      (h) => (
                        <th
                          key={h}
                          className="text-left px-4 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400"
                        >
                          {h}
                        </th>
                      ),
                    )}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50 dark:divide-gray-800">
                  {payments.map((pay) => {
                    const typeCfg =
                      paymentTypeConfig[pay.paymentType] ??
                      paymentTypeConfig.advance;
                    const receiptHref = resolveAssetUrl(pay.receiptUrl);
                    return (
                      <tr
                        key={pay.id}
                        className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
                      >
                        <td className="px-4 py-3 text-xs text-gray-500 whitespace-nowrap">
                          {formatDate(pay.paymentDate)}
                        </td>
                        <td className="px-4 py-3 text-xs font-medium text-gray-900 dark:text-gray-100">
                          {pay.prospectName}
                        </td>
                        <td className="px-4 py-3 text-xs font-semibold text-gray-900 dark:text-gray-100">
                          {formatCurrency(pay.amount)}
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={cn(
                              "px-2 py-0.5 rounded text-[10px] font-medium",
                              typeCfg.bg,
                              typeCfg.color,
                            )}
                          >
                            {typeCfg.label}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-xs text-gray-400 max-w-[160px] truncate">
                          {pay.notes || "—"}
                        </td>
                        <td className="px-4 py-3">
                          {receiptHref ? (
                            <a
                              href={receiptHref}
                              target="_blank"
                              rel="noreferrer"
                              className="p-1.5 inline-flex rounded text-gray-400 hover:text-primary-600 hover:bg-primary-50 dark:hover:bg-primary-900/20 transition-colors"
                              title="View receipt"
                            >
                              <Eye size={13} />
                            </a>
                          ) : (
                            <span className="text-xs text-gray-300">—</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            {(paymentsData?.total ?? 0) > 0 && (
              <Pagination
                page={paymentsData?.page ?? page}
                totalPages={paymentsData?.totalPages ?? 1}
                total={paymentsData?.total ?? payments.length}
                pageSize={paymentsData?.pageSize ?? pageSize}
                onPageChange={setPage}
                onPageSizeChange={(size) => {
                  setPageSize(size);
                  setPage(1);
                }}
              />
            )}
          </>
        )}
      </Card>
    </AppShell>
  );
}
