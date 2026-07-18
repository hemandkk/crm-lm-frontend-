"use client";

import { Spinner } from "@/components/ui";
import AppShell from "@/components/layout/AppShell";
import ProspectForm from "@/components/prospects/ProspectForm";
import { useProspect } from "@/hooks/useProspects";
import { use } from "react";

export default function AdminEditLeadPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const { data: prospect, isLoading } = useProspect(id);

  return (
    <AppShell title="Edit Admission" requiredRole="admin">
      <div className="max-w-4xl">
        {isLoading ? (
          <div className="flex justify-center py-20">
            <Spinner size={28} />
          </div>
        ) : prospect ? (
          <ProspectForm
            mode="edit"
            prospect={prospect}
            successRedirect="/admin/leads"
          />
        ) : (
          <p className="text-sm text-gray-400">Lead not found.</p>
        )}
      </div>
    </AppShell>
  );
}
