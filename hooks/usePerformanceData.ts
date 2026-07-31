import { useMemo } from "react";
import { EmployeePerformance, Metric } from "@/types";

interface Props {
  employees: EmployeePerformance[];
  metric: Metric;
  search: string;
  limit: number;
  sortBy?: string;
  sortOrder?: string;
}

export function usePerformanceData({
  employees,
  metric,
  search,
  limit,
  sortBy,
  sortOrder,
}: Props) {
  return useMemo(() => {
    const filtered = employees
      .filter(
        (e) =>
          !["accountant", "processing_team"].includes(
            e.role?.toLowerCase() ?? "",
          ),
      )
      .filter((e) =>
        e.employeeName.toLowerCase().includes(search.toLowerCase()),
      )
      .sort((a, b) => Number(b[metric] ?? 0) - Number(a[metric] ?? 0));

    /* .sort((a, b) => {
        const aVal = a[sortBy];
        const bVal = b[sortBy];

        if (typeof aVal === "string") {
          return sortOrder === "asc"
            ? String(aVal).localeCompare(String(bVal))
            : String(bVal).localeCompare(String(aVal));
        }

        return sortOrder === "asc"
          ? Number(aVal ?? 0) - Number(bVal ?? 0)
          : Number(bVal ?? 0) - Number(aVal ?? 0);
      }); */

    return limit === 9999 ? filtered : filtered.slice(0, limit);
  }, [employees, metric, search, limit]);
}
