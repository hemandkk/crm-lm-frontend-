"use client";

import AppShell from "@/components/layout/AppShell";
import ProspectTable from "@/components/prospects/ProspectTable";

export default function ProcessingLeadsPage() {
  return (
    <AppShell title="Admissions — Processing" requiredRole="processing_team">
      <ProspectTable basePath="/processing/leads" />
    </AppShell>
  );
}
