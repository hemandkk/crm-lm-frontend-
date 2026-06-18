"use client";

import AppShell from "@/components/layout/AppShell";
import ProspectDetail from "@/components/prospects/ProspectDetail";

interface PageProps {
  params: { id: string };
}

export default function LeadDetailPage({ params }: PageProps) {
  return (
    <AppShell title="Lead Detail" requiredRole="employee">
      <ProspectDetail id={params.id} />
    </AppShell>
  );
}
