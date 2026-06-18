"use client";

import { Spinner } from "@/components/ui";
import AppShell from "@/components/layout/AppShell";
import ProspectForm from "@/components/prospects/ProspectForm";
import { useProspect } from "@/hooks/useProspects";

interface PageProps {
  params: { id: string };
}

export default function EditLeadPage({ params }: PageProps) {
  const { data: prospect, isLoading } = useProspect(params.id);

  return (
    <AppShell title="Edit Lead" requiredRole="employee">
      <div className="max-w-4xl">
        {isLoading ? (
          <div className="flex justify-center py-20">
            <Spinner size={28} />
          </div>
        ) : prospect ? (
          <ProspectForm mode="edit" prospect={prospect} />
        ) : (
          <p className="text-sm text-gray-400">Lead not found.</p>
        )}
      </div>
    </AppShell>
  );
}
