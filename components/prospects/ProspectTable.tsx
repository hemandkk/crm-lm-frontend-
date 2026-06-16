"use client";

import { useState } from "react";
import Link from "next/link";
import { Plus, Download, Upload, Search } from "lucide-react";
import {
  Button,
  Badge,
  Pagination,
  EmptyState,
  Spinner,
} from "@/components/ui";
import {
  useProspects,
  useUpdateProspectStage,
  useMarkExamStatus,
  useExport,
} from "@/hooks";
import { useCourses } from "@/hooks";
import {
  cn,
  formatCurrency,
  formatDate,
  stageConfig,
} from "@/lib/utils";
import type { ProspectFilters, ProspectStage } from "@/types";

const STAGES: { value: ProspectStage | "all"; label: string }[] = [
  { value: "all", label: "All" },
  { value: "new", label: "New" },
  { value: "contacted", label: "Contacted" },
  { value: "negotiation", label: "Negotiation" },
  { value: "won", label: "Won" },
  { value: "lost", label: "Lost" },
];

interface ProspectTableProps {
  showAssignedTo?: boolean; // admin sees assigned employee column
  addLeadHref?: string;
}

export default function ProspectTable({
  showAssignedTo = false,
  addLeadHref,
}: ProspectTableProps) {
  const [activeStage, setActiveStage] = useState<ProspectStage | "all">("all");
  const [search, setSearch] = useState("");
  const [courseId, setCourseId] = useState("");
  const [page, setPage] = useState(1);

  const filters: ProspectFilters = {
    stage: activeStage === "all" ? undefined : activeStage,
    search: search || undefined,
    courseId: courseId || undefined,
    page,
    pageSize: 15,
  };

  const { data, isLoading } = useProspects(filters);
  const { data: courses } = useCourses();
  const updateStage = useUpdateProspectStage();
  const markExam = useMarkExamStatus();
  const exportMutation = useExport();

  const prospects = data?.data ?? [];

  const paymentBadge = (pct: number) => {
    if (pct === 0) return <span className="text-xs text-gray-400">None</span>;
    if (pct >= 100) return <Badge variant="success">100%</Badge>;
    if (pct >= 40) return <Badge variant="info">{pct}%</Badge>;
    return <Badge variant="warning">Advance</Badge>;
  };

  return (
    <div>
      {/* Header row */}
      <div className="flex items-center justify-between mb-4 gap-3 flex-wrap">
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search
              size={14}
              className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
            />
            <input
              type="search"
              placeholder="Search name, email, ID…"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className="pl-8 pr-3 py-1.5 text-xs rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-primary-600 w-52"
            />
          </div>
          <select
            value={courseId}
            onChange={(e) => {
              setCourseId(e.target.value);
              setPage(1);
            }}
            className="px-2.5 py-1.5 text-xs rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-600 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-primary-600"
          >
            <option value="">All courses</option>
            {courses?.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
        <div className="flex gap-2">
          <Button
            size="sm"
            variant="secondary"
            leftIcon={<Download size={13} />}
            isLoading={exportMutation.isPending}
            onClick={() =>
              exportMutation.mutate({
                entity: "leads",
                format: "xlsx",
                stage: activeStage === "all" ? undefined : activeStage,
                dateFrom: undefined,
                dateTo: undefined,
              })
            }
          >
            Export
          </Button>
          {addLeadHref && (
            <Link href={addLeadHref}>
              <Button size="sm" variant="primary" leftIcon={<Plus size={13} />}>
                Add Lead
              </Button>
            </Link>
          )}
        </div>
      </div>

      {/* Stage tabs */}
      <div className="flex gap-1 mb-4 flex-wrap">
        {STAGES.map((s) => (
          <button
            key={s.value}
            onClick={() => {
              setActiveStage(s.value);
              setPage(1);
            }}
            className={cn(
              "px-3 py-1.5 rounded-full text-xs font-medium border transition-colors",
              activeStage === s.value
                ? "bg-primary-50 text-primary-700 border-primary-200 dark:bg-primary-900/20 dark:text-primary-400 dark:border-primary-800"
                : "bg-white border-gray-200 text-gray-600 hover:bg-gray-50 dark:bg-gray-900 dark:border-gray-700 dark:text-gray-400"
            )}
          >
            {s.label}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="flex justify-center py-16">
            <Spinner size={24} />
          </div>
        ) : prospects.length === 0 ? (
          <EmptyState
            title="No prospects found"
            description="Try adjusting your filters or add a new lead."
          />
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50">
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400">
                      Prospect
                    </th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400">
                      Course
                    </th>
                    {showAssignedTo && (
                      <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400">
                        Assigned to
                      </th>
                    )}
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400">
                      Stage
                    </th>
                    <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400">
                      Deal value
                    </th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400">
                      Payment
                    </th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400">
                      Exam
                    </th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400">
                      Created
                    </th>
                    <th className="px-4 py-3" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50 dark:divide-gray-800">
                  {prospects.map((p) => (
                    <tr
                      key={p.id}
                      className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
                    >
                      <td className="px-4 py-3">
                        <Link
                          href={`/employee/leads/${p.id}`}
                          className="hover:underline"
                        >
                          <p className="text-xs font-semibold text-gray-900 dark:text-gray-100">
                            {p.name}
                          </p>
                          <p className="text-[10px] text-gray-400">{p.email}</p>
                          <p className="text-[10px] font-mono text-gray-400">
                            {p.prospectId}
                          </p>
                        </Link>
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-600 dark:text-gray-300">
                        {p.courseName}
                        {p.specialization && (
                          <span className="block text-gray-400 text-[10px]">
                            {p.specialization}
                          </span>
                        )}
                      </td>
                      {showAssignedTo && (
                        <td className="px-4 py-3 text-xs text-gray-600 dark:text-gray-300">
                          {p.assignedEmployeeName}
                        </td>
                      )}
                      <td className="px-4 py-3">
                        <select
                          value={p.stage}
                          onChange={(e) =>
                            updateStage.mutate({
                              id: p.id,
                              stage: e.target.value as ProspectStage,
                            })
                          }
                          className={cn(
                            "text-xs rounded-md px-2 py-1 border font-medium",
                            "focus:outline-none focus:ring-1 focus:ring-primary-600",
                            stageConfig[p.stage].bg,
                            stageConfig[p.stage].color,
                            "border-transparent bg-opacity-80"
                          )}
                        >
                          {STAGES.filter((s) => s.value !== "all").map((s) => (
                            <option key={s.value} value={s.value}>
                              {s.label}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className="px-4 py-3 text-right text-xs font-medium text-gray-800 dark:text-gray-200">
                        {formatCurrency(p.estimatedValue)}
                      </td>
                      <td className="px-4 py-3">
                        <div title={`₹${p.totalPaid.toLocaleString("en-IN")} of ₹${p.estimatedValue.toLocaleString("en-IN")}`}>
                          {paymentBadge(p.paymentPercentage)}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex flex-col gap-1">
                          <label className="flex items-center gap-1.5 text-[10px] text-gray-500 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={p.examAttended}
                              onChange={(e) =>
                                markExam.mutate({
                                  id: p.id,
                                  field: "examAttended",
                                  value: e.target.checked,
                                })
                              }
                              className="accent-primary-600 w-3 h-3"
                            />
                            Attended
                          </label>
                          <label className="flex items-center gap-1.5 text-[10px] text-gray-500 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={p.examCertified}
                              onChange={(e) =>
                                markExam.mutate({
                                  id: p.id,
                                  field: "examCertified",
                                  value: e.target.checked,
                                })
                              }
                              className="accent-success-600 w-3 h-3"
                            />
                            Certified
                          </label>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-400">
                        {formatDate(p.createdAt)}
                      </td>
                      <td className="px-4 py-3">
                        <Link
                          href={`/employee/leads/${p.id}`}
                          className="text-xs text-primary-600 hover:underline"
                        >
                          View
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {data && data.totalPages > 1 && (
              <Pagination
                page={data.page}
                totalPages={data.totalPages}
                total={data.total}
                pageSize={data.pageSize}
                onPageChange={setPage}
              />
            )}
          </>
        )}
      </div>
    </div>
  );
}
