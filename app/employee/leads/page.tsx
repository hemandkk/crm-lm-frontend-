"use client";

import AppShell from "@/components/layout/AppShell";
import ProspectTable from "@/components/prospects/ProspectTable";

export default function EmployeeLeadsPage() {
  return (
    <AppShell title="My Leads" requiredRole="employee">
      <ProspectTable addLeadHref="/employee/leads/new" />
    </AppShell>
  );
}
