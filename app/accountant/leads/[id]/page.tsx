"use client";

import AppShell from "@/components/layout/AppShell";
import ProspectDetail from "@/components/prospects/ProspectDetail";
import { use } from "react";

export default function AccountantLeadDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  return (
    <AppShell title="Admission detail" requiredRole="accountant">
      <ProspectDetail id={id} basePath="/accountant/leads" />
    </AppShell>
  );
}
