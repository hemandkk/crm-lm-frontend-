"use client";

import { use } from "react";
import { Spinner } from "@/components/ui";
import AppShell from "@/components/layout/AppShell";
import ProspectForm from "@/components/prospects/ProspectForm";
import { useProspect } from "@/hooks/useProspects";

export default function EditLeadPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const { data: prospect, isLoading, isError } = useProspect(id);

  return (
    <AppShell title="Edit Admission" requiredRole={["employee", "manager", "sales_head"]}>
      <div className="max-w-4xl">
        {isLoading ? (
          <div className="flex justify-center py-20">
            <Spinner size={28} />
          </div>
        ) : prospect ? (
          <ProspectForm
            mode="edit"
            prospect={prospect}
            successRedirect={`/employee/leads/${id}`}
          />
        ) : (
          <p className="text-sm text-gray-400">
            {isError ? "Failed to load admission." : "Admission not found."}
          </p>
        )}
      </div>
    </AppShell>
  );
}
