"use client";

import { useState } from "react";
import AppShell from "@/components/layout/AppShell";
import { Card, Badge, Spinner, EmptyState, Pagination } from "@/components/ui";
import { useActivityLogs } from "@/hooks";
import { formatDateTime } from "@/lib/utils";

const ACTION_BADGE: Record<
  string,
  {
    label: string;
    variant: "info" | "success" | "warning" | "danger" | "purple" | "gray";
  }
> = {
  login: { label: "Login", variant: "gray" },
  lead_create: { label: "Admission created", variant: "success" },
  lead_update: { label: "Admission updated", variant: "info" },
  stage_change: { label: "Stage change", variant: "warning" },
  admission_stage_change: {
    label: "Admission stage",
    variant: "warning",
  },
  user_create: { label: "User created", variant: "info" },
  payment_add: { label: "Payment", variant: "success" },
  payment_verify: { label: "Payment verify", variant: "success" },
  payment_verification: { label: "Payment verify", variant: "success" },
  export: { label: "Export", variant: "purple" },
  password_reset: { label: "Pwd reset", variant: "warning" },
  assign: { label: "Assign", variant: "info" },
  exam_status: { label: "Exam status", variant: "purple" },
};

export default function ActivityLogPage() {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [actionFilter, setActionFilter] = useState("");

  const { data: activityLogs, isLoading } = useActivityLogs({
    page,
    pageSize,
    dateFrom: dateFrom || undefined,
    dateTo: dateTo || undefined,
    action: actionFilter || undefined,
  });

  const data = activityLogs?.items ?? activityLogs?.data ?? [];

  return (
    <AppShell title="Activity Log" requiredRole="admin">
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
        ) : !data.length ? (
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
                  {data.map((log) => {
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
                          {log.detail && Object.keys(log.detail).length
                            ? Object.entries(log.detail)
                                .map(([k, v]) => `${k}: ${v}`)
                                .join(" · ")
                            : "—"}
                        </td>
                        <td className="px-4 py-3 text-xs font-mono text-gray-400">
                          {log.ipAddress || "—"}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            {(activityLogs?.total ?? 0) > 0 && (
              <Pagination
                page={activityLogs?.page ?? page}
                totalPages={activityLogs?.totalPages ?? 1}
                total={activityLogs?.total ?? data.length}
                pageSize={activityLogs?.pageSize ?? pageSize}
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
