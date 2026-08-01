"use client";

import AppShell from "@/components/layout/AppShell";
import SimpleMasterManager from "@/components/masters/SimpleMasterManager";
import {
  useDepartments,
  useCreateDepartment,
  useUpdateDepartment,
  useDeleteDepartment,
} from "@/hooks";

function DepartmentManager() {
  const { data, isLoading } = useDepartments();
  const create = useCreateDepartment();
  const update = useUpdateDepartment();
  const remove = useDeleteDepartment();
  return (
    <SimpleMasterManager
      title="Department Master"
      description="Departments used in the Add / Edit User form. Inactive Departments won't appear in the user dropdown."
      placeholder="e.g. Sales"
      emptyTitle="No Departments yet"
      emptyDescription="Add your first Department above."
      data={data}
      isLoading={isLoading}
      create={create}
      update={update}
      remove={remove}
    />
  );
}

export default function DepartmentsPage() {
  return (
    <AppShell title="Departments" requiredRole="admin">
      <div className="max-w-3xl">
        <DepartmentManager />
      </div>
    </AppShell>
  );
}
