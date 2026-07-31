import { EmployeePerformance } from "@/types";

export default function EmployeeRow({
  employee,
}: {
  employee: EmployeePerformance;
}) {
  return (
    <div className="grid grid-cols-[260px_120px_120px_120px_120px] px-3 py-2 border-b text-xs">
      <div className="truncate font-medium">{employee.employeeName}</div>
      <div>{employee.revenue.toLocaleString()}</div>
      <div>{employee.leadsConverted}</div>
      <div>{employee.conversionRate}%</div>
      <div>{employee.targetAchieved}%</div>
    </div>
  );
}
