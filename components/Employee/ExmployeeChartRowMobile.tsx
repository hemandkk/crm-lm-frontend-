import { EmployeePerformance, Metric } from "@/types";

interface Props {
  employee: EmployeePerformance;
  metric: Metric;
}

export default function EmployeeCard({ employee, metric }: Props) {
  return (
    <div className="mx-2 mb-2 rounded-xl border p-3 shadow-sm">
      <div className="flex justify-between">
        <div>
          <div className="font-semibold text-sm">{employee.employeeName}</div>

          <div className="text-[11px] text-gray-500">
            {employee.employeeCode}
          </div>
        </div>

        <div className="text-right">
          <div className="font-bold">
            {Number(employee[metric]).toLocaleString()}
          </div>

          <div className="text-[11px] text-gray-400">{metric}</div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-y-1 mt-3 text-xs">
        <span>Revenue</span>
        <span className="text-right">₹{employee.revenue.toLocaleString()}</span>

        <span>Converted</span>
        <span className="text-right">{employee.leadsConverted}</span>

        <span>Conversion</span>
        <span className="text-right">{employee.conversionRate}%</span>

        <span>Target</span>
        <span className="text-right">{employee.targetAchieved}%</span>
      </div>
    </div>
  );
}
