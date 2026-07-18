"use client";

import { useEffect, useMemo, useState } from "react";
import { Plus, Trash2, Save, RotateCcw } from "lucide-react";
import AppShell from "@/components/layout/AppShell";
import { Card, Button, Spinner, EmptyState, Badge } from "@/components/ui";
import {
  useCourses,
  useCreateCourse,
  useDeleteCourse,
  useIncentiveSlabs,
  useUpdateIncentiveSlabs,
  useMonthlyTargetsOverview,
  useSetDefaultMonthlyTarget,
  useSetEmployeeMonthlyTarget,
  useClearEmployeeMonthlyTarget,
  useBulkSetEmployeeMonthlyTargets,
} from "@/hooks";
import { useSalesEmployees } from "@/hooks/useEmployees";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { isSalesEmployeeRole, salesEmployeeIdSet } from "@/lib/roles";
import { formatCurrency } from "@/lib/utils";
import type { BulkMonthlyTargetItem } from "@/types";

function toNumber(value: unknown): number {
  const n = typeof value === "number" ? value : Number(value);
  return Number.isFinite(n) ? n : 0;
}

// ─── Course manager ───────────────────────────────────────────────────────
function CourseManager() {
  const [newName, setNewName] = useState("");
  const { data: courses, isLoading } = useCourses();
  const createCourse = useCreateCourse();
  const deleteCourse = useDeleteCourse();

  const handleAdd = () => {
    const trimmed = newName.trim();
    if (!trimmed) return;
    createCourse.mutate({ name: trimmed }, { onSuccess: () => setNewName("") });
  };

  return (
    <Card title="Course Master">
      <div className="flex gap-2 mb-4">
        <input
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleAdd()}
          placeholder="e.g. B.Tech CSE"
          className="flex-1 px-3 py-1.5 text-sm border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-primary-600"
        />
        <Button
          size="sm"
          variant="primary"
          leftIcon={<Plus size={13} />}
          onClick={handleAdd}
          isLoading={createCourse.isPending}
        >
          Add
        </Button>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-6">
          <Spinner />
        </div>
      ) : !courses?.length ? (
        <EmptyState
          title="No courses yet"
          description="Add your first course above."
        />
      ) : (
        <ul className="space-y-2">
          {courses.map((course) => (
            <li
              key={course.id}
              className="flex items-center justify-between px-3 py-2 bg-gray-50 dark:bg-gray-800 rounded-lg"
            >
              <span className="text-sm text-gray-800 dark:text-gray-200">
                {course.name}
              </span>
              <button
                onClick={() => deleteCourse.mutate(course.id)}
                className="p-1 rounded text-gray-400 hover:text-danger-600 hover:bg-danger-50 dark:hover:bg-danger-900/20 transition-colors"
                title="Delete course"
              >
                <Trash2 size={14} />
              </button>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}

// ─── Incentive slab editor ────────────────────────────────────────────────
const slabSchema = z.object({
  slabs: z.array(
    z.object({
      minLeads: z.number().min(0, "Required"),
      maxLeads: z.number().nullable(),
      incentiveAmount: z.number().min(1),
    }),
  ),
});
type SlabFormValues = z.infer<typeof slabSchema>;

function IncentiveSlabEditor() {
  const { data: slabs, isLoading } = useIncentiveSlabs();
  const updateSlabs = useUpdateIncentiveSlabs();

  const {
    register,
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<SlabFormValues>({
    resolver: zodResolver(slabSchema),
    values: slabs ? { slabs: slabs.map((s) => ({ ...s })) } : { slabs: [] },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "slabs",
  });

  const onSubmit = (values: SlabFormValues) => {
    updateSlabs.mutate(values.slabs);
  };

  return (
    <Card title="Incentive Slabs">
      {isLoading ? (
        <div className="flex justify-center py-6">
          <Spinner />
        </div>
      ) : (
        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="space-y-3 mb-4">
            {fields.map((field, i) => (
              <div
                key={field.id}
                className="grid grid-cols-1 sm:grid-cols-12 gap-2 items-start"
              >
                <div className="sm:col-span-4">
                  <label className="text-xs text-gray-500 mb-1 block">
                    Min Admission
                  </label>
                  <input
                    type="number"
                    {...register(`slabs.${i}.minLeads`, {
                      valueAsNumber: true,
                    })}
                    className="w-full px-3 py-1.5 text-sm border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-primary-600"
                  />
                </div>
                <div className="sm:col-span-4">
                  <label className="text-xs text-gray-500 mb-1 block">
                    Max Admission
                  </label>
                  <input
                    type="number"
                    {...register(`slabs.${i}.maxLeads`, {
                      setValueAs: (v) => (v === "" ? null : Number(v)),
                    })}
                    placeholder="Unlimited"
                    className="w-full px-3 py-1.5 text-sm border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-primary-600"
                  />
                </div>
                <div className="sm:col-span-3">
                  <label className="text-xs text-gray-500 mb-1 block">
                    Amount / Conversion (₹)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    {...register(`slabs.${i}.incentiveAmount`, {
                      valueAsNumber: true,
                    })}
                    className="w-full px-3 py-1.5 text-sm border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-primary-600"
                  />
                </div>
                <div className="sm:col-span-1 flex items-end pb-0.5">
                  <button
                    type="button"
                    onClick={() => remove(i)}
                    className="p-1.5 sm:mt-5 rounded text-gray-400 hover:text-danger-600 hover:bg-danger-50 dark:hover:bg-danger-900/20"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div className="flex gap-2">
            <Button
              type="button"
              variant="secondary"
              size="sm"
              leftIcon={<Plus size={13} />}
              onClick={() =>
                append({ minLeads: 0, maxLeads: null, incentiveAmount: 5 })
              }
            >
              Add slab
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="sm"
              className="text-white dark:text-white hover:text-black dark:hover:text-white" 
              leftIcon={<Save size={13} />}
              isLoading={updateSlabs.isPending}
            >
              Save slabs
            </Button>
          </div>
        </form>
      )}
    </Card>
  );
}

// ─── Employee / org monthly targets ───────────────────────────────────────
function EmployeeTargets() {
  const { data, isLoading } = useMonthlyTargetsOverview();
  const { employees: salesEmployees } = useSalesEmployees({
    pageSize: 500,
    status: "active",
  });
  const setDefault = useSetDefaultMonthlyTarget();
  const setEmployee = useSetEmployeeMonthlyTarget();
  const clearEmployee = useClearEmployeeMonthlyTarget();
  const bulkSave = useBulkSetEmployeeMonthlyTargets();

  const [defaultDraft, setDefaultDraft] = useState("");
  /** Draft assigned values keyed by employeeId; empty string = clear on bulk */
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [dirty, setDirty] = useState<Record<string, boolean>>({});

  const salesIds = useMemo(
    () => salesEmployeeIdSet(salesEmployees),
    [salesEmployees],
  );

  useEffect(() => {
    if (data?.defaultMonthlyTarget == null) return;
    setDefaultDraft(String(toNumber(data.defaultMonthlyTarget)));
  }, [data?.defaultMonthlyTarget]);

  const salesTargetEmployees = useMemo(() => {
    const rows = data?.employees ?? [];
    return rows.filter((emp) => {
      if (emp.role != null && emp.role !== "") {
        return isSalesEmployeeRole(emp.role);
      }
      if (salesIds.size > 0) {
        const id = String(emp.employeeId);
        const code = emp.employeeCode ? String(emp.employeeCode) : "";
        return salesIds.has(id) || (code !== "" && salesIds.has(code));
      }
      return true;
    });
  }, [data?.employees, salesIds]);

  useEffect(() => {
    if (!data?.employees) return;
    const next: Record<string, string> = {};
    for (const emp of salesTargetEmployees) {
      const id = String(emp.employeeId);
      next[id] =
        emp.assignedTarget == null || emp.assignedTarget === ""
          ? ""
          : String(toNumber(emp.assignedTarget));
    }
    setDrafts(next);
    setDirty({});
  }, [data?.employees, salesTargetEmployees]);

  const saveDefault = () => {
    const value = Number(defaultDraft);
    if (!Number.isFinite(value) || value < 0) return;
    setDefault.mutate(value);
  };

  const saveOne = (employeeId: string | number) => {
    const id = String(employeeId);
    const raw = drafts[id];
    if (raw === "" || raw == null) {
      clearEmployee.mutate(employeeId);
      return;
    }
    const value = Number(raw);
    if (!Number.isFinite(value) || value < 0) return;
    setEmployee.mutate({ employeeId, monthlyTarget: value });
  };

  const saveBulk = () => {
    const items: BulkMonthlyTargetItem[] = Object.keys(dirty)
      .filter((id) => dirty[id])
      .map((employeeId) => {
        const raw = drafts[employeeId];
        return {
          employeeId,
          monthlyTarget:
            raw === "" || raw == null ? null : Number(raw),
        };
      })
      .filter(
        (item) =>
          item.monthlyTarget === null ||
          (Number.isFinite(item.monthlyTarget) && item.monthlyTarget >= 0),
      );

    if (!items.length) return;
    bulkSave.mutate(items);
  };

  const dirtyCount = Object.values(dirty).filter(Boolean).length;
  const defaultValue = toNumber(data?.defaultMonthlyTarget);

  return (
    <div className="space-y-5">
      <Card title="Org Default Monthly Target">
        <p className="text-xs text-gray-500 mb-3">
          Applies to employees without a custom assigned target.
        </p>
        <div className="flex flex-wrap items-end gap-2">
          <div>
            <label className="text-xs text-gray-500 mb-1 block">
              Default (₹)
            </label>
            <input
              type="number"
              min={0}
              value={defaultDraft}
              onChange={(e) => setDefaultDraft(e.target.value)}
              className="w-40 px-3 py-1.5 text-sm border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-primary-600"
            />
          </div>
          <Button
            size="sm"
            variant="primary"
            leftIcon={<Save size={13} />}
            onClick={saveDefault}
            isLoading={setDefault.isPending}
            className="text-black dark:text-white"
          >
            Save default
          </Button>
          {data && (
            <span className="text-xs text-gray-500 self-center">
              Current: {formatCurrency(defaultValue)}
            </span>
          )}
        </div>
      </Card>

      <Card title="Monthly Targets By Employee" noPadding>
        <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-3 border-b border-gray-100 dark:border-gray-800">
          <p className="text-xs text-gray-500">
            Assigned overrides the org default. Clear to fall back to{" "}
            {defaultValue}.
          </p>
          <Button
            size="sm"
            variant="primary"
            leftIcon={<Save size={13} />}
            onClick={saveBulk}
            disabled={!dirtyCount}
            isLoading={bulkSave.isPending}
            className="text-black dark:text-white"
          >
            Save changes{dirtyCount ? ` (${dirtyCount})` : ""}
          </Button>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-10">
            <Spinner />
          </div>
        ) : !salesTargetEmployees.length ? (
          <div className="py-8">
            <EmptyState
              title="No employees"
              description="Employee monthly targets will appear here."
            />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50">
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500">
                    Employee
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500">
                    Assigned
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500">
                    Effective
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500">
                    Source
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500">
                    Set assigned (₹)
                  </th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 dark:divide-gray-800">
                {salesTargetEmployees.map((emp) => {
                  const id = String(emp.employeeId);
                  const isAssigned =
                    emp.targetAssigned || emp.targetSource === "assigned";
                  return (
                    <tr
                      key={id}
                      className="hover:bg-gray-50 dark:hover:bg-gray-800/50"
                    >
                      <td className="px-4 py-2.5">
                        <div className="text-xs font-medium text-gray-900 dark:text-gray-100">
                          {emp.employeeName ?? `Employee #${id}`}
                        </div>
                        {emp.employeeCode && (
                          <div className="text-[11px] text-gray-400">
                            {emp.employeeCode}
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-2.5 text-xs text-gray-500">
                        {emp.assignedTarget == null || emp.assignedTarget === ""
                          ? "—"
                          : formatCurrency(toNumber(emp.assignedTarget))}
                      </td>
                      <td className="px-4 py-2.5 text-xs font-medium text-gray-800 dark:text-gray-200">
                        {formatCurrency(toNumber(emp.effectiveTarget))}
                      </td>
                      <td className="px-4 py-2.5">
                        <Badge variant={isAssigned ? "info" : "gray"}>
                          {emp.targetSource}
                        </Badge>
                      </td>
                      <td className="px-4 py-2.5">
                        <input
                          type="number"
                          min={0}
                          placeholder={`Default ${defaultValue}`}
                          value={drafts[id] ?? ""}
                          onChange={(e) => {
                            const value = e.target.value;
                            setDrafts((d) => ({ ...d, [id]: value }));
                            setDirty((d) => ({ ...d, [id]: true }));
                          }}
                          className="w-32 px-2.5 py-1 text-xs border border-gray-200 dark:border-gray-700 rounded-md bg-white dark:bg-gray-900 text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-primary-600"
                        />
                      </td>
                      <td className="px-4 py-2.5">
                        <div className="flex items-center gap-1.5">
                          <Button
                            size="sm"
                            variant="secondary"
                            onClick={() => saveOne(emp.employeeId)}
                            isLoading={
                              setEmployee.isPending || clearEmployee.isPending
                            }
                          >
                            Save
                          </Button>
                          {isAssigned && (
                            <Button
                              size="sm"
                              variant="ghost"
                              title="Clear assigned → use org default"
                              leftIcon={<RotateCcw size={12} />}
                              onClick={() =>
                                clearEmployee.mutate(emp.employeeId)
                              }
                              isLoading={clearEmployee.isPending}
                            >
                              Clear
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────
export default function MastersPage() {
  return (
    <AppShell title="Masters" requiredRole="admin">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-5">
        <CourseManager />
        <IncentiveSlabEditor />
      </div>
      <EmployeeTargets />
    </AppShell>
  );
}
