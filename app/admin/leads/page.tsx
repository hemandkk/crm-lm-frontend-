"use client";

import AppShell from "@/components/layout/AppShell";
import ProspectTable from "@/components/prospects/ProspectTable";

export default function AdminLeadsPage() {
  return (
    <AppShell title="All Admissions" requiredRole="admin">
      <ProspectTable
        showAssignedTo
        addLeadHref="/admin/leads/new"
        basePath="/admin/leads"
      />
    </AppShell>
  );
}
