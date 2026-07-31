import { EmployeePerformance, Metric } from "@/types";
import { useVirtualizer } from "@tanstack/react-virtual";
import { useMemo, useRef } from "react";

interface Props {
  employees: EmployeePerformance[];
  metric: Metric;
}

export default function VirtualPerformanceChart({ employees, metric }: Props) {
  const parentRef = useRef<HTMLDivElement>(null);

  const max = useMemo(
    () => Math.max(...employees.map((e) => Number(e[metric] ?? 0)), 1),
    [employees, metric],
  );

  const rowVirtualizer = useVirtualizer({
    count: employees.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 32,
    overscan: 8,
  });

  return (
    <div ref={parentRef} className="h-100 overflow-auto border rounded-xl">
      <div
        style={{
          height: rowVirtualizer.getTotalSize(),
          position: "relative",
        }}
      >
        {rowVirtualizer.getVirtualItems().map((row) => {
          const emp = employees[row.index];
          const value = Number(emp[metric] ?? 0);

          return (
            <div
              key={emp.employeeId}
              className="absolute left-0 top-0 w-full px-3 text-xs"
              style={{
                transform: `translateY(${row.start}px)`,
              }}
            >
              <div className="flex items-center gap-2 h-8">
                <div className="w-12 text-xs text-gray-400">
                  #{row.index + 1}
                </div>

                <div className="w-56 truncate font-medium text-xs">
                  {emp.employeeName}
                </div>

                <div className="flex-1 bg-gray-100 rounded-full h-3 overflow-hidden">
                  <div
                    className="bg-blue-600 h-full rounded-full transition-all"
                    style={{
                      width: `${(value / max) * 100}%`,
                    }}
                  />
                </div>

                <div className="w-24 text-right  text-sm">
                  {metric === "conversionRate"
                    ? `${value}%`
                    : value.toLocaleString()}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
