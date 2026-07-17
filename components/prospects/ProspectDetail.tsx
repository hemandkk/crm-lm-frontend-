"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Edit,
  Copy,
  Check,
  Upload,
  Eye,
  Plus,
  Clock,
} from "lucide-react";
import {
  Button,
  Badge,
  Card,
  ProgressBar,
  Spinner,
  EmptyState,
} from "@/components/ui";
import {
  useProspect,
  useProspectTimeline,
  useProspectDocuments,
  useMarkExamStatus,
  useUpdateProspectStage,
  useUploadDocument,
} from "@/hooks/useProspects";
import { useProspectPayments, useCourses } from "@/hooks";
import AddPaymentModal from "./AddPaymentModal";
import {
  formatCurrency,
  formatDate,
  formatDateTime,
  getStageConfig,
  normalizeStage,
  paymentTypeConfig,
  resolveAssetUrl,
} from "@/lib/utils";
import type { ProspectStage, DocType } from "@/types";
import { cn } from "@/lib/utils";

const DOC_TYPES: { key: DocType; label: string }[] = [
  { key: "aadhaar", label: "Aadhaar" },
  { key: "photo", label: "Passport photo" },
  { key: "sslc", label: "SSLC" },
  { key: "plus_two", label: "+2 Certificate" },
  { key: "degree", label: "Degree" },
  { key: "agreement", label: "Agreement" },
];

const STAGES: { value: ProspectStage; label: string }[] = [
  { value: "new", label: "New" },
  { value: "contacted", label: "Contacted" },
  { value: "negotiation", label: "Negotiation" },
  { value: "won", label: "Won" },
  { value: "lost", label: "Lost" },
];

export default function ProspectDetail({
  id,
  basePath = "/employee/leads",
}: {
  id: string;
  basePath?: string;
}) {
  const [copied, setCopied] = useState(false);
  const [payModalOpen, setPayModalOpen] = useState(false);

  const { data: prospect, isLoading } = useProspect(id);
  const { data: courses } = useCourses();
  const { data: timelineData } = useProspectTimeline(id, !!prospect);
  const { data: documentsData } = useProspectDocuments(id, !!prospect);
  const { data: paymentsData } = useProspectPayments(id, !!prospect);
  const documents = documentsData?.items ?? [];
  const timeline = timelineData?.items ?? [];
  const payments = paymentsData?.items ?? [];
  const markExam = useMarkExamStatus();
  const updateStage = useUpdateProspectStage();
  const uploadDoc = useUploadDocument(id);

  const copyPassword = async () => {
    if (!prospect?.password) return;
    await navigator.clipboard.writeText(prospect.password);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-20">
        <Spinner size={28} />
      </div>
    );
  }

  if (!prospect) return null;

  const paymentPct = prospect.paymentPercentage;
  const isFirstPayment = !payments || payments.length === 0;
  const courseName =
    courses?.filter((el) => el.id == prospect.courseId)[0]?.name ?? "";
  return (
    <div className="space-y-5">
      {/* Back + header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:flex-wrap">
        <div className="flex items-center gap-2 flex-wrap">
          <Link href={basePath}>
            <Button variant="ghost" size="sm" leftIcon={<ArrowLeft size={14} />}>
              Back
            </Button>
          </Link>
          <span className="font-mono text-xs text-gray-400">
            {prospect.prospectId}
          </span>
          <span
            className={cn(
              "px-2 py-0.5 rounded text-xs font-medium",
              getStageConfig(prospect.stage).bg,
              getStageConfig(prospect.stage).color,
            )}
          >
            {getStageConfig(prospect.stage).label}
          </span>
        </div>
        <div className="sm:ml-auto flex gap-2 flex-wrap w-full sm:w-auto">
          <select
            value={normalizeStage(prospect.stage)}
            onChange={(e) =>
              updateStage.mutate({
                id: prospect.id,
                stage: e.target.value as ProspectStage,
              })
            }
            className="flex-1 sm:flex-initial min-w-0 px-3 py-1.5 text-xs border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-primary-600"
          >
            {STAGES.map((s) => (
              <option key={s.value} value={s.value}>
                Move to: {s.label}
              </option>
            ))}
          </select>
          <Link href={`${basePath}/${id}/edit`} className="flex-1 sm:flex-initial">
            <Button
              size="sm"
              variant="secondary"
              leftIcon={<Edit size={13} />}
              className="w-full"
            >
              Edit
            </Button>
          </Link>
          <Button
            size="sm"
            variant="primary"
            leftIcon={<Plus size={13} />}
            onClick={() => setPayModalOpen(true)}
            className="flex-1 sm:flex-initial"
          >
            Add payment
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
        {/* Left col — details */}
        <div className="xl:col-span-2 space-y-5">
          {/* Prospect details */}
          <Card title="Prospect details">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-1">
              {[
                ["Name", prospect.name],
                ["Email", prospect.email],
                ["Phone", prospect.phone],
                ["Father's name", prospect.fatherName],
                ["Mother's name", prospect.motherName],
                [
                  "Stream/Course",
                  `${courseName}${prospect.specialization ? ` — ${prospect.specialization}` : ""}`,
                ],
                ["University", prospect.university || "—"],
                ["Deal value", formatCurrency(prospect.estimatedValue)],
                ["Promised Delivery Date", formatDate(prospect.deliveryDate)],
                ["Address", prospect.address],
                ["Delivery address", prospect.deliveryAddress || "—"],
              ].map(([label, value]) => (
                <div
                  key={label}
                  className="flex py-2 border-b border-gray-50 dark:border-gray-800 last:border-0 gap-4"
                >
                  <span className="text-xs text-gray-400 w-32 flex-shrink-0 pt-0.5">
                    {label}
                  </span>
                  <span className="text-xs text-gray-800 dark:text-gray-200 flex-1">
                    {value}
                  </span>
                </div>
              ))}
              {/* Portal password */}
              {/* <div className="flex py-2 gap-4">
                <span className="text-xs text-gray-400 w-32 flex-shrink-0 pt-0.5">
                  Portal password
                </span>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded">
                    {prospect.password || "—"}
                  </span>
                  <button
                    onClick={copyPassword}
                    className="text-gray-400 hover:text-primary-600 transition-colors"
                    title="Copy password"
                  >
                    {copied ? (
                      <Check size={13} className="text-success-600" />
                    ) : (
                      <Copy size={13} />
                    )}
                  </button>
                </div>
              </div> */}
              {/* Exam */}
              <div className="flex py-2 gap-4">
                <span className="text-xs text-gray-400 w-32 flex-shrink-0 pt-0.5">
                  Exam status
                </span>
                <div className="flex gap-3">
                  <label className="flex items-center gap-1.5 text-xs text-gray-600 dark:text-gray-300 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={prospect.examAttended}
                      onChange={(e) =>
                        markExam.mutate({
                          id: prospect.id,
                          field: "examAttended",
                          value: e.target.checked,
                        })
                      }
                      className="accent-primary-600"
                    />
                    Attended
                  </label>
                  <label className="flex items-center gap-1.5 text-xs text-gray-600 dark:text-gray-300 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={prospect.examCertified}
                      onChange={(e) =>
                        markExam.mutate({
                          id: prospect.id,
                          field: "examCertified",
                          value: e.target.checked,
                        })
                      }
                      className="accent-success-600"
                    />
                    Certified
                  </label>
                </div>
              </div>
            </div>
          </Card>

          {/* Payment history */}
          <Card
            title="Payment history"
            action={
              <div className="flex items-center gap-3">
                <span className="text-xs text-gray-500">
                  {formatCurrency(prospect.totalPaid)} of{" "}
                  {formatCurrency(prospect.estimatedValue)} ({paymentPct}%)
                </span>
                <Button
                  size="sm"
                  variant="primary"
                  className="text-black-800 hover:text-black-900 hover:bg-primary-700 dark:hover:bg-primary-700"
                  leftIcon={<Plus size={12} />}
                  onClick={() => setPayModalOpen(true)}
                >
                  Add
                </Button>
              </div>
            }
          >
            <ProgressBar
              value={paymentPct}
              color={
                paymentPct >= 100
                  ? "success"
                  : paymentPct >= 40
                    ? "primary"
                    : "warning"
              }
              className="mb-4"
            />
            {!payments?.length ? (
              <EmptyState
                icon={<Clock size={18} />}
                title="No payments yet"
                description="Add the first advance payment to get started."
              />
            ) : (
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-gray-100 dark:border-gray-800">
                    <th className="text-left py-2 font-semibold text-gray-500">
                      #
                    </th>
                    <th className="text-left py-2 font-semibold text-gray-500">
                      Date
                    </th>
                    <th className="text-right py-2 font-semibold text-gray-500">
                      Amount
                    </th>
                    <th className="text-left py-2 font-semibold text-gray-500 pl-3">
                      Type
                    </th>
                    <th className="text-left py-2 font-semibold text-gray-500">
                      Notes
                    </th>
                    <th className="py-2" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50 dark:divide-gray-800">
                  {payments.map((pay, i) => (
                    <tr
                      key={pay.id}
                      className="hover:bg-gray-50 dark:hover:bg-gray-800/50"
                    >
                      <td className="py-2.5 text-gray-400">{i + 1}</td>
                      <td className="py-2.5 text-gray-600 dark:text-gray-300">
                        {formatDate(pay.paymentDate)}
                      </td>
                      <td className="py-2.5 text-right font-medium text-gray-900 dark:text-gray-100">
                        {formatCurrency(pay.amount)}
                      </td>
                      <td className="py-2.5 pl-3">
                        <span
                          className={cn(
                            "px-1.5 py-0.5 rounded text-[10px] font-medium",
                            paymentTypeConfig[pay.paymentType].bg,
                            paymentTypeConfig[pay.paymentType].color,
                          )}
                        >
                          {paymentTypeConfig[pay.paymentType].label}
                        </span>
                      </td>
                      <td className="py-2.5 text-gray-400 max-w-[120px] truncate">
                        {pay.notes || "—"}
                      </td>
                      <td className="py-2.5">
                        {pay.receiptUrl && (
                          <a
                            href={pay.receiptUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="text-primary-600 hover:text-primary-800"
                            title="View receipt"
                          >
                            <Eye size={13} />
                          </a>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </Card>

          {/* Documents */}
          <Card title="Documents">
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {DOC_TYPES.map((doc) => {
                const uploaded = documents.find(
                  (d) => d.document_type === doc.key,
                );
                return (
                  <div key={doc.key}>
                    {uploaded ? (
                      <a
                        href={resolveAssetUrl(uploaded.file_url)}
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center gap-2 px-3 py-2.5 border border-success-200 dark:border-success-800 bg-success-50 dark:bg-success-900/10 rounded-lg hover:bg-success-100 transition-colors"
                      >
                        <Check
                          size={14}
                          className="text-success-600 flex-shrink-0"
                        />
                        <div>
                          <p className="text-xs font-medium text-success-700 dark:text-success-400">
                            {doc.label}
                          </p>
                          <p className="text-[10px] text-gray-400 truncate max-w-[100px]">
                            {uploaded.original_filename}
                          </p>
                          {uploaded.verified && (
                            <p className="text-[10px] text-success-600">
                              Verified
                            </p>
                          )}
                        </div>
                      </a>
                    ) : (
                      <label className="flex items-center gap-2 px-3 py-2.5 border border-dashed border-gray-200 dark:border-gray-700 rounded-lg cursor-pointer hover:border-primary-400 hover:bg-primary-50 dark:hover:bg-primary-900/10 transition-colors">
                        <Upload
                          size={14}
                          className="text-gray-400 flex-shrink-0"
                        />
                        <p className="text-xs text-gray-500">{doc.label}</p>
                        <input
                          type="file"
                          className="hidden"
                          accept="image/*,application/pdf"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              uploadDoc.mutate({ docType: doc.key, file });
                            }
                          }}
                        />
                      </label>
                    )}
                  </div>
                );
              })}
            </div>
          </Card>
        </div>

        {/* Right col — timeline */}
        <div>
          <Card title="Activity timeline">
            {!timeline?.length ? (
              <EmptyState title="No activity yet" />
            ) : (
              <ol className="relative border-l border-gray-200 dark:border-gray-700 ml-2 space-y-5">
                {timeline.map((event) => (
                  <li key={event.id} className="ml-4">
                    <span className="absolute -left-1.5 w-3 h-3 rounded-full border-2 border-white dark:border-gray-900 bg-primary-600" />
                    <p className="text-xs font-semibold text-gray-800 dark:text-gray-200">
                      {event?.type}
                    </p>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {event?.title}
                    </p>
                    <p className="text-[10px] text-gray-400 mt-1">
                      {formatDateTime(event?.createdAt)} · {event?.userName}
                    </p>
                  </li>
                ))}
              </ol>
            )}
          </Card>
        </div>
      </div>

      {/* Add Payment Modal */}
      <AddPaymentModal
        open={payModalOpen}
        onClose={() => setPayModalOpen(false)}
        prospectId={prospect.id}
        prospectName={prospect.name}
        isFirstPayment={isFirstPayment}
      />
    </div>
  );
}
