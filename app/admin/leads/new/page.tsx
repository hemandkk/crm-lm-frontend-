"use client";

import AppShell from "@/components/layout/AppShell";
import ProspectForm from "@/components/prospects/ProspectForm";

export default function AdminNewLeadPage() {
  return (
    <AppShell title="Add Lead" requiredRole="admin">
      <div className="max-w-4xl">
        <ProspectForm mode="create" successRedirect="/admin/leads" />
      </div>
    </AppShell>
  );
}
