import { Metric } from "@/types";

export default function Toolbar(props: any) {
  return (
    <div className="flex gap-4 flex-wrap">
      <input
        placeholder="Search employee..."
        className="border rounded p-2 text-sm"
        value={props.search}
        onChange={(e) => props.setSearch(e.target.value)}
      />

      <select
        value={props.metric}
        onChange={(e) => props.setMetric(e.target.value as Metric)}
        className="px-3 py-1.5 text-sm border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-600 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-primary-600"
      >
        <option value="revenue">Revenue</option>
        <option value="leadsConverted">Leads Converted</option>
        <option value="conversionRate">Conversion %</option>
        <option value="targetAchieved">Target</option>
        <option value="incentiveAmount">Incentive</option>
      </select>

      <select
        value={props.limit}
        className="px-3 py-1.5 text-sm border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-600 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-primary-600"
        onChange={(e) => props.setLimit(Number(e.target.value))}
      >
        <option value={10}>Top 10</option>
        <option value={20}>Top 20</option>
        <option value={9999}>All</option>
      </select>
    </div>
  );
}
