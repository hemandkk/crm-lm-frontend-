"use client";

import AppShell from "@/components/layout/AppShell";
import ProspectTable from "@/components/prospects/ProspectTable";

export default function AccountantLeadsPage() {
  return (
    <AppShell title="Certificate Waiting — Payment verification" requiredRole="accountant">
      <ProspectTable basePath="/accountant/leads" />
    </AppShell>
  );
}
