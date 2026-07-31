import { useVirtualizer } from "@tanstack/react-virtual";
import { EmployeePerformance, Metric } from "@/types";
import { useRef } from "react";
import EmployeeRow from "./EmployeeChartRow";
import EmployeeCard from "./ExmployeeChartRowMobile";

interface Props {
  employees: EmployeePerformance[];
  metric: Metric;
}

export default function EmployeePerformanceTable({ employees, metric }: Props) {
  const parentRef = useRef<HTMLDivElement>(null);

  const rowVirtualizer = useVirtualizer({
    count: employees.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 110,
    overscan: 6,
  });

  return (
    <>
      {/* Sticky Header */}
      <div ref={parentRef} className="h-[650px] overflow-auto">
        <div
          className="
            hidden md:grid
            sticky top-0 z-20
            grid-cols-[260px_120px_120px_120px_120px]
            bg-white dark:bg-gray-900
            border-b
            px-3 py-3
            text-xs font-semibold
            "
        >
          <div>Employee</div>
          <div>Revenue</div>
          <div>Converted</div>
          <div>Conversion %</div>
          <div>Target %</div>
        </div>

        {/* Scrollable Body */}
        <div ref={parentRef} className="h-[650px] overflow-auto">
          <div
            style={{
              height: rowVirtualizer.getTotalSize(),
              position: "relative",
            }}
          >
            {rowVirtualizer.getVirtualItems().map((virtualRow) => {
              const employee = employees[virtualRow.index];

              return (
                <div
                  key={employee.employeeId}
                  style={{
                    position: "absolute",
                    width: "100%",
                    transform: `translateY(${virtualRow.start + 44}px)`,
                  }}
                >
                  <div className="hidden md:block">
                    <EmployeeRow employee={employee} />
                  </div>

                  <div className="md:hidden">
                    <EmployeeCard employee={employee} metric={metric} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </>
  );
}
