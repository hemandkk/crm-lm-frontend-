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
import OrgScopeFilters from "@/components/filters/OrgScopeFilters";
import { usePayments, usePaymentSummary } from "@/hooks";
import { useAuthStore } from "@/store/authStore";
import {
  cn,
  formatCurrency,
  formatDate,
  paymentTypeConfig,
  resolveAssetUrl,
  toBranchIdsParam,
} from "@/lib/utils";

export default function PaymentsPage() {
  const role = useAuthStore((s) => s.role);
  const canFilterOrg = role === "manager" || role === "sales_head";
  const isSalesHead = role === "sales_head";

  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [stateId, setStateId] = useState("");
  const [branchId, setBranchId] = useState("");
  const [branchIds, setBranchIds] = useState<string[]>([]);
  const [employeeId, setEmployeeId] = useState("");

  const branchIdsParam = toBranchIdsParam(branchIds);
  const orgScope = isSalesHead
    ? { branchIds: branchIdsParam }
    : {
        stateId: stateId || undefined,
        branchId: branchId || undefined,
      };

  const filters = {
    dateFrom: dateFrom || undefined,
    dateTo: dateTo || undefined,
    ...orgScope,
    employeeId: employeeId || undefined,
    page,
    pageSize,
  };

  const { data: paymentsData, isLoading } = usePayments(filters);
  const payments = paymentsData?.items ?? paymentsData?.data ?? [];
  const { data: summary } = usePaymentSummary({
    dateFrom: dateFrom || undefined,
    dateTo: dateTo || undefined,
    ...orgScope,
    employeeId: employeeId || undefined,
  });

  return (
    <AppShell
      title="Payments"
      requiredRole={["employee", "manager", "sales_head"]}
    >
      {summary && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <MetricCard
            label="Today"
            value={formatCurrency(summary.collected.today, true)}
          />
          <MetricCard
            label="This Week"
            value={formatCurrency(summary.collected.thisWeek, true)}
          />
          <MetricCard
            label="This Month"
            value={formatCurrency(summary.collected.thisMonth, true)}
            subVariant="success"
          />
          <MetricCard
            label="Total Collected"
            value={formatCurrency(summary.totalCollected, true)}
            subVariant="success"
          />
        </div>
      )}

      <div className="flex gap-3 mb-5 flex-wrap items-end">
        <span className="text-xs text-gray-500 pb-1.5">Filter by date:</span>
        <input
          type="date"
          value={dateFrom}
          onChange={(e) => {
            setDateFrom(e.target.value);
            setPage(1);
          }}
          className="px-3 py-1.5 text-sm border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-600 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-primary-600"
        />
        <span className="text-xs text-gray-400 pb-1.5">to</span>
        <input
          type="date"
          value={dateTo}
          onChange={(e) => {
            setDateTo(e.target.value);
            setPage(1);
          }}
          className="px-3 py-1.5 text-sm border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-600 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-primary-600"
        />
        {canFilterOrg && (
          <OrgScopeFilters
            stateId={stateId}
            branchId={branchId}
            branchIds={branchIds}
            employeeId={employeeId}
            employeeOptionsMode="team"
            employeePlaceholder="All team members"
            variant={isSalesHead ? "sales_head" : "default"}
            onChange={(next) => {
              setStateId(next.stateId);
              setBranchId(next.branchId);
              setBranchIds(next.branchIds);
              setEmployeeId(next.employeeId);
              setPage(1);
            }}
          />
        )}
        {(dateFrom ||
          dateTo ||
          stateId ||
          branchId ||
          branchIds.length > 0 ||
          employeeId) && (
          <button
            type="button"
            onClick={() => {
              setDateFrom("");
              setDateTo("");
              setStateId("");
              setBranchId("");
              setBranchIds([]);
              setEmployeeId("");
              setPage(1);
            }}
            className="text-xs text-primary-600 hover:underline pb-1.5"
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
            title="No Payments found"
            description="No payment records match your current filters."
          />
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50">
                    {[
                      "Date",
                      "Name of Admission",
                      "Amount",
                      "Type",
                      "Notes",
                      "Receipt",
                    ].map((h) => (
                      <th
                        key={h}
                        className="text-left px-4 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 whitespace-nowrap"
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50 dark:divide-gray-800">
                  {payments.map((pay) => {
                    const typeCfg =
                      paymentTypeConfig[pay.paymentType] ??
                      paymentTypeConfig.registration_fee;
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
