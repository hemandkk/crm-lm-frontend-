"use client";

import AppShell from "@/components/layout/AppShell";
import ProspectDetail from "@/components/prospects/ProspectDetail";
import { use } from "react";

export default function ProcessingLeadDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  return (
    <AppShell title="Admission Detail" requiredRole="processing_team">
      <ProspectDetail id={id} basePath="/processing/leads" />
    </AppShell>
  );
}
