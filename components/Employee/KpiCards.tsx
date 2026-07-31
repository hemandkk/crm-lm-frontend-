import { EmployeePerformance } from "@/types";

export default function KpiCards({
  employees,
}: {
  employees: EmployeePerformance[];
}) {
  const totalRevenue = employees.reduce((s, e) => s + Number(e.revenue), 0);

  const totalLeads = employees.reduce((s, e) => s + e.leadsAssigned, 0);

  const converted = employees.reduce((s, e) => s + Number(e.leadsConverted), 0);

  const avgConversion = totalLeads === 0 ? 0 : (converted / totalLeads) * 100;

  const target = employees.reduce((s, e) => s + Number(e.targetAchieved), 0);

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
      <Card title="Revenue" value={`₹${totalRevenue.toLocaleString()}`} />
      <Card title="Assigned Leads" value={totalLeads} />

      <Card title="Conversion" value={`${avgConversion.toFixed(1)}%`} />

      <Card title="Target Achieved" value={target} />
    </div>
  );
}

function Card({
  title,
  value,
}: {
  title: string;
  value: string | number | undefined;
}) {
  return (
    <div className="rounded-lg border p-5">
      <div className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
        {title}
      </div>

      <div className="text-lg sm:text-2xl font-semibold text-gray-900 dark:text-gray-100 break-words">
        {value}
      </div>
    </div>
  );
}
