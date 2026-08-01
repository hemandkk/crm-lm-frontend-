"use client";

import AppShell from "@/components/layout/AppShell";
import SimpleMasterManager from "@/components/masters/SimpleMasterManager";
import {
  useDesignations,
  useCreateDesignation,
  useUpdateDesignation,
  useDeleteDesignation,
} from "@/hooks";

function DesignationManager() {
  const { data, isLoading } = useDesignations();
  const create = useCreateDesignation();
  const update = useUpdateDesignation();
  const remove = useDeleteDesignation();
  return (
    <SimpleMasterManager
      title="Designation Master"
      description="Designations used in the Add / Edit User form. Inactive Designations won't appear in the user dropdown."
      placeholder="e.g. Sales Executive"
      emptyTitle="No Designations Yet"
      emptyDescription="Add your first Designation above."
      data={data}
      isLoading={isLoading}
      create={create}
      update={update}
      remove={remove}
    />
  );
}

export default function DesignationsPage() {
  return (
    <AppShell title="Designations" requiredRole="admin">
      <div className="max-w-3xl">
        <DesignationManager />
      </div>
    </AppShell>
  );
}
