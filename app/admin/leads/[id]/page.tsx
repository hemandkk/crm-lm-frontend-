"use client";

import AppShell from "@/components/layout/AppShell";
import ProspectDetail from "@/components/prospects/ProspectDetail";
import { use } from "react";

export default function AdminLeadDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  return (
    <AppShell title="Admission Detail" requiredRole="admin">
      <ProspectDetail id={id} basePath="/admin/leads" />
    </AppShell>
  );
}
