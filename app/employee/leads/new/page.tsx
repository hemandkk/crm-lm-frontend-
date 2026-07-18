"use client";

import AppShell from "@/components/layout/AppShell";
import ProspectForm from "@/components/prospects/ProspectForm";

export default function NewLeadPage() {
  return (
    <AppShell title="Add Admission" requiredRole={["employee", "manager", "sales_head"]}>
      <div className="max-w-4xl">
        <ProspectForm mode="create" />
      </div>
    </AppShell>
  );
}
