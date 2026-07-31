export default function EmployeeTable({ employees }: any) {
  return (
    <div className="rounded-lg border overflow-auto">
      <table className="w-full">
        <thead>
          <tr>
            <th>Name</th>
            <th>Revenue</th>
            <th>Leads</th>
            <th>Converted</th>
            <th>Conversion</th>
          </tr>
        </thead>

        <tbody>
          {employees.map((e: any) => (
            <tr key={e.employeeId}>
              <td>{e.employeeName}</td>
              <td>{e.revenue}</td>
              <td>{e.leadsAssigned}</td>
              <td>{e.leadsConverted}</td>
              <td>{e.conversionRate}%</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
