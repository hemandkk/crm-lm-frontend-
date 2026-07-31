import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";
import { EmployeePerformance, Metric } from "@/types";
interface ChartItem {
  employees: EmployeePerformance[];
  metric: Metric;
}
export default function EmployeeChart({ employees, metric }: ChartItem) {
  const data = employees.map((e: EmployeePerformance) => ({
    name: e.employeeName,
    Value: Number(e[metric]),
  }));

  return (
    <div className="h-100 sm:h-125 lg:h-162.5 w-full sm:flex-1 min-w-0 overflow-x-auto">
      <ResponsiveContainer>
        <BarChart
          data={data}
          layout="vertical"
          barSize={10}
          style={{ fontSize: 6, color: "red" }}
          margin={{
            top: 10,
            right: 10,
            bottom: 10,
            left: 20,
          }}
        >
          <CartesianGrid fontSize={12} strokeDasharray="3 3" />
          <XAxis type="number" tick={{ fontSize: 11 }} />
          <YAxis
            dataKey="name"
            type="category"
            tick={{ fontSize: 10 }}
            width={110}
          />
          <Tooltip
            contentStyle={{
              fontSize: 12,
              borderRadius: 8,
              border: "1px solid #e5e7eb",
            }}
          />
          <Bar
            dataKey="Value"
            fontSize={9}
            barSize={10} // Try 8, 10, 12
            radius={[0, 6, 6, 0]}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
