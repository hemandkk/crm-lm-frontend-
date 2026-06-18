"use client";

import { useState } from "react";
import { Plus, Trash2, Save } from "lucide-react";
import AppShell from "@/components/layout/AppShell";
import { Card, Button, Input, Spinner, EmptyState } from "@/components/ui";
import {
  useCourses,
  useCreateCourse,
  useDeleteCourse,
  useIncentiveSlabs,
  useUpdateIncentiveSlabs,
} from "@/hooks";
import { useEmployees, useSetEmployeeTarget } from "@/hooks/useEmployees";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { formatCurrency } from "@/lib/utils";
import type { IncentiveSlab } from "@/types";

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
    <Card title="Course master">
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
      minAmount: z.number().min(0, "Required"),
      maxAmount: z.number().nullable(),
      ratePercent: z.number().min(0).max(100, "Max 100%"),
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
    <Card title="Incentive slabs">
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
                className="grid grid-cols-12 gap-2 items-start"
              >
                <div className="col-span-4">
                  <label className="text-xs text-gray-500 mb-1 block">
                    Min amount (₹)
                  </label>
                  <input
                    type="number"
                    {...register(`slabs.${i}.minAmount`, {
                      valueAsNumber: true,
                    })}
                    className="w-full px-3 py-1.5 text-sm border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-primary-600"
                  />
                </div>
                <div className="col-span-4">
                  <label className="text-xs text-gray-500 mb-1 block">
                    Max amount (₹, blank = unlimited)
                  </label>
                  <input
                    type="number"
                    {...register(`slabs.${i}.maxAmount`, {
                      setValueAs: (v) => (v === "" ? null : Number(v)),
                    })}
                    placeholder="Unlimited"
                    className="w-full px-3 py-1.5 text-sm border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-primary-600"
                  />
                </div>
                <div className="col-span-3">
                  <label className="text-xs text-gray-500 mb-1 block">
                    Rate (%)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    {...register(`slabs.${i}.ratePercent`, {
                      valueAsNumber: true,
                    })}
                    className="w-full px-3 py-1.5 text-sm border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-primary-600"
                  />
                </div>
                <div className="col-span-1 flex items-end pb-0.5">
                  <button
                    type="button"
                    onClick={() => remove(i)}
                    className="p-1.5 mt-5 rounded text-gray-400 hover:text-danger-600 hover:bg-danger-50 dark:hover:bg-danger-900/20"
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
                append({ minAmount: 0, maxAmount: null, ratePercent: 5 })
              }
            >
              Add slab
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="sm"
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

// ─── Employee targets ─────────────────────────────────────────────────────
function EmployeeTargets() {
  const { data: employees } = useEmployees();
  const setTarget = useSetEmployeeTarget();
  const [targets, setTargets] = useState<Record<string, number>>({});

  return (
    <Card title="Monthly targets by employee" noPadding>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50">
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500">
                Employee
              </th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500">
                Current target
              </th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500">
                New target
              </th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50 dark:divide-gray-800">
            {employees?.data
              .filter((e) => e.status === "active")
              .map((emp) => (
                <tr
                  key={emp.id}
                  className="hover:bg-gray-50 dark:hover:bg-gray-800/50"
                >
                  <td className="px-4 py-2.5 text-xs font-medium text-gray-900 dark:text-gray-100">
                    {emp.name}
                  </td>
                  <td className="px-4 py-2.5 text-xs text-gray-500">
                    {emp.monthlyTarget} leads/month
                  </td>
                  <td className="px-4 py-2.5">
                    <input
                      type="number"
                      defaultValue={emp.monthlyTarget}
                      onChange={(e) =>
                        setTargets((t) => ({
                          ...t,
                          [emp.id]: Number(e.target.value),
                        }))
                      }
                      className="w-24 px-2.5 py-1 text-xs border border-gray-200 dark:border-gray-700 rounded-md bg-white dark:bg-gray-900 text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-primary-600"
                    />
                  </td>
                  <td className="px-4 py-2.5">
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => {
                        const t = targets[emp.id];
                        if (t) setTarget.mutate({ id: emp.id, target: t });
                      }}
                      isLoading={setTarget.isPending}
                    >
                      Save
                    </Button>
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>
    </Card>
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
