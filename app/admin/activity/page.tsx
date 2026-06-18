"use client";

import { useState } from "react";
import AppShell from "@/components/layout/AppShell";
import { Card, Badge, Spinner, EmptyState, Pagination } from "@/components/ui";
import { useActivityLogs } from "@/hooks";
import { formatDateTime } from "@/lib/utils";
import type { BadgeVariant } from "@/components/ui";

const ACTION_BADGE: Record<
  string,
  {
    label: string;
    variant: "info" | "success" | "warning" | "danger" | "purple" | "gray";
  }
> = {
  login: { label: "Login", variant: "gray" },
  lead_create: { label: "Lead created", variant: "success" },
  lead_update: { label: "Lead updated", variant: "info" },
  stage_change: { label: "Stage change", variant: "warning" },
  user_create: { label: "User created", variant: "info" },
  payment_add: { label: "Payment", variant: "success" },
  export: { label: "Export", variant: "purple" },
  password_reset: { label: "Pwd reset", variant: "warning" },
};

export default function ActivityLogPage() {
  const [page, setPage] = useState(1);
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [actionFilter, setActionFilter] = useState("");

  const { data, isLoading } = useActivityLogs({
    page,
    pageSize: 25,
    dateFrom: dateFrom || undefined,
    dateTo: dateTo || undefined,
    action: actionFilter || undefined,
  });

  return (
    <AppShell title="Activity Log" requiredRole="admin">
      {/* Filters */}
      <div className="flex gap-3 mb-5 flex-wrap">
        <input
          type="date"
          value={dateFrom}
          onChange={(e) => {
            setDateFrom(e.target.value);
            setPage(1);
          }}
          className="px-3 py-1.5 text-sm border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-600 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-primary-600"
        />
        <input
          type="date"
          value={dateTo}
          onChange={(e) => {
            setDateTo(e.target.value);
            setPage(1);
          }}
          className="px-3 py-1.5 text-sm border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-600 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-primary-600"
        />
        <select
          value={actionFilter}
          onChange={(e) => {
            setActionFilter(e.target.value);
            setPage(1);
          }}
          className="px-3 py-1.5 text-sm border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-600 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-primary-600"
        >
          <option value="">All actions</option>
          {Object.entries(ACTION_BADGE).map(([key, val]) => (
            <option key={key} value={key}>
              {val.label}
            </option>
          ))}
        </select>
      </div>

      <Card noPadding>
        {isLoading ? (
          <div className="flex justify-center py-16">
            <Spinner size={24} />
          </div>
        ) : !data?.data.length ? (
          <EmptyState
            title="No activity found"
            description="Try adjusting your filters."
          />
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50">
                    {[
                      "Time",
                      "User",
                      "Role",
                      "Action",
                      "Detail",
                      "IP Address",
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
                  {data.data.map((log) => {
                    const actionCfg = ACTION_BADGE[log.action] ?? {
                      label: log.action,
                      variant: "gray" as const,
                    };
                    return (
                      <tr
                        key={log.id}
                        className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
                      >
                        <td className="px-4 py-3 text-xs text-gray-400 whitespace-nowrap">
                          {formatDateTime(log.createdAt)}
                        </td>
                        <td className="px-4 py-3 text-xs font-medium text-gray-800 dark:text-gray-200">
                          {log.userName}
                        </td>
                        <td className="px-4 py-3 text-xs text-gray-500 capitalize">
                          {log.userType}
                        </td>
                        <td className="px-4 py-3">
                          <Badge variant={actionCfg.variant}>
                            {actionCfg.label}
                          </Badge>
                        </td>
                        <td className="px-4 py-3 text-xs text-gray-600 dark:text-gray-300 max-w-[240px] truncate">
                          {log.detail
                            ? Object.entries(log.detail)
                                .map(([k, v]) => `${k}: ${v}`)
                                .join(" · ")
                            : "—"}
                        </td>
                        <td className="px-4 py-3 text-xs font-mono text-gray-400">
                          {log.ipAddress}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            {data.totalPages > 1 && (
              <Pagination
                page={data.page}
                totalPages={data.totalPages}
                total={data.total}
                pageSize={data.pageSize}
                onPageChange={setPage}
              />
            )}
          </>
        )}
      </Card>
    </AppShell>
  );
}
