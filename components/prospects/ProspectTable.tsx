"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  Plus,
  Download,
  Search,
  MoreHorizontal,
  Eye,
  Pencil,
  CreditCard,
  Upload,
  Copy,
  Lock,
  UserPlus,
  EyeClosed,
  RefreshCw,
} from "lucide-react";
import toast from "react-hot-toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

import {
  Button,
  Badge,
  Pagination,
  EmptyState,
  Spinner,
  Modal,
  Input,
} from "@/components/ui";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  useProspects,
  useUpdateProspectStage,
  useUpdateProspectAdmissionStage,
  useMarkExamStatus,
  useExportProspects,
} from "@/hooks/useProspects";
import { useCourses, useSpecializations } from "@/hooks";
import {
  ADMISSION_STAGE_OPTIONS,
  cn,
  formatCurrency,
  formatDate,
  getAdmissionStageConfig,
  getStageConfig,
  isRestrictedAdmissionStage,
  isCompletedAdmissionStage,
  normalizeAdmissionStage,
  normalizeStage,
  resolveSpecializationName,
  generatePassword,
  toBranchIdsParam,
} from "@/lib/utils";
import {
  ACCOUNTANT_VISIBLE_ADMISSION_STAGE,
  PROCESSING_VISIBLE_ADMISSION_STAGES,
  canEditAdmissionStage,
  canEditLeadFields,
  canRecordPayment,
  canSetRestrictedAdmissionStage,
  canSetCompletedAdmissionStage,
} from "@/lib/roles";
import { useAuthStore } from "@/store/authStore";
import type {
  AdmissionStage,
  Prospect,
  ProspectFilters,
  ProspectStage,
} from "@/types";
import PaymentModal from "@/components/ui/PaymentModal";
import { useResetProspectPassword } from "@/hooks/useProspects";
import OrgScopeFilters from "@/components/filters/OrgScopeFilters";
import UploadDocumentModal from "./UploadDocumentModal";
import AssignProspectModal from "./AssignProspectModal";

const STAGES: { value: ProspectStage | "all"; label: string }[] = [
  { value: "all", label: "All" },
  { value: "new", label: "New" },
  { value: "contacted", label: "Contacted" },
  { value: "negotiation", label: "Negotiation" },
  { value: "won", label: "Won" },
  { value: "lost", label: "Lost" },
];

const ADMISSION_FILTERS: { value: AdmissionStage | "all"; label: string }[] = [
  { value: "all", label: "All admission" },
  ...ADMISSION_STAGE_OPTIONS.map((s) => ({
    value: s.value as AdmissionStage,
    label: s.label,
  })),
];

const resetSchema = z
  .object({
    newPassword: z.string().min(8, "Min 8 characters"),
    confirm: z.string(),
  })
  .refine((d) => d.newPassword === d.confirm, {
    message: "Passwords don't match",
    path: ["confirm"],
  });
type ResetFormValues = z.infer<typeof resetSchema>;

// ─── Reset password modal ─────────────────────────────────────────────────

function ResetPasswordModal({
  open,
  onClose,
  prospect,
}: {
  open: boolean;
  onClose: () => void;
  prospect: Prospect;
}) {
  const resetMutation = useResetProspectPassword();
  const [showPassword, setShowPassword] = useState(true);
  const generatePasswordFN = useCallback(() => generatePassword(), []);

  const {
    register,
    handleSubmit,
    setValue,
    getValues,
    formState: { errors },
    reset,
  } = useForm<ResetFormValues>({
    resolver: zodResolver(resetSchema),
    defaultValues: { newPassword: "", confirm: "" },
  });

  useEffect(() => {
    if (!open) return;
    const password = generatePasswordFN();
    reset({ newPassword: password, confirm: password });
    setShowPassword(true);
  }, [open, prospect.id, reset, generatePasswordFN]);

  const onSubmit = (values: ResetFormValues) => {
    resetMutation.mutate(
      { id: String(prospect.id), newPassword: values.newPassword },
      {
        onSuccess: () => {
          reset({ newPassword: "", confirm: "" });
          onClose();
        },
      },
    );
  };

  const copyCredentials = async () => {
    const password = getValues("newPassword");
    const text = `Employee ID: ${prospect.prospectId}\nPassword: ${password}`;
    await navigator.clipboard.writeText(text);
    toast.success("Credentials copied");
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={`Reset password — ${prospect.name}`}
      size="sm"
      footer={
        <>
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button
            type="button"
            variant="secondary"
            leftIcon={<Copy size={13} />}
            onClick={() => void copyCredentials()}
          >
            Copy
          </Button>
          <Button
            type="button"
            variant="primary"
            className="bg-gray-600 dark:bg-gray-800 text-white"
            onClick={handleSubmit(onSubmit)}
            isLoading={resetMutation.isPending}
          >
            Reset password
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <p className="text-xs text-gray-500">
          A new password was generated for{" "}
          <span className="font-mono">{prospect.prospectId}</span>. Copy it
          before saving.
        </p>
        {/* Hidden username field so browsers don't stuff the page search box */}
        <input
          type="text"
          name="username"
          autoComplete="username"
          value={prospect.email || prospect.prospectId || ""}
          readOnly
          tabIndex={-1}
          aria-hidden
          className="sr-only"
        />
        <div className="relative">
          <Input
            label="New Password *"
            type={showPassword ? "text" : "password"}
            autoComplete="new-password"
            error={errors.newPassword?.message}
            {...register("newPassword")}
          />
          <button
            type="button"
            onClick={() => setShowPassword((prev) => !prev)}
            className="absolute right-3 top-9 p-0.5 text-gray-500 hover:text-gray-800 dark:text-gray-300"
            aria-label={showPassword ? "Hide password" : "Show password"}
          >
            {showPassword ? <Eye size={14} /> : <EyeClosed size={14} />}
          </button>
        </div>
        <Input
          label="Confirm Password *"
          type={showPassword ? "text" : "password"}
          autoComplete="new-password"
          error={errors.confirm?.message}
          {...register("confirm")}
        />
        <Button
          type="button"
          size="sm"
          variant="secondary"
          leftIcon={<RefreshCw size={12} />}
          onClick={() => {
            const password = generatePasswordFN();
            setValue("newPassword", password, { shouldValidate: true });
            setValue("confirm", password, { shouldValidate: true });
            setShowPassword(true);
          }}
        >
          Regenerate
        </Button>
      </div>
    </Modal>
  );
}

interface ProspectTableProps {
  showAssignedTo?: boolean;
  addLeadHref?: string;
  basePath?: string;
  /** Optional controlled filter for assigned user */
  assignedToId?: string;
}
export default function ProspectTable({
  showAssignedTo = false,
  addLeadHref,
  basePath = "/employee/leads",
  assignedToId: assignedToIdProp,
}: ProspectTableProps) {
  const role = useAuthStore((s) => s.role);
  const isAccountant = role === "accountant";
  const isProcessing = role === "processing_team";
  const canEditFields = canEditLeadFields(role);
  const canEditAdmission = canEditAdmissionStage(role);
  const canSetRestricted = canSetRestrictedAdmissionStage(role);
  const canSetCompleted = canSetCompletedAdmissionStage(role);
  const canPay = canRecordPayment(role);
  const canFilterByUser =
    role === "admin" || role === "manager" || role === "sales_head";
  const showAdminColumns = role === "admin";
  const showAssigneeColumn = showAssignedTo || canFilterByUser;

  const [activeStage, setActiveStage] = useState<ProspectStage | "all">("all");
  const [activeAdmissionStage, setActiveAdmissionStage] = useState<
    AdmissionStage | "all"
  >("all");
  const [search, setSearch] = useState("");
  const [courseId, setCourseId] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(15);
  const [createdFrom, setCreatedFrom] = useState("");
  const [createdTo, setCreatedTo] = useState("");
  const [stateId, setStateId] = useState("");
  const [branchId, setBranchId] = useState("");
  const [branchIds, setBranchIds] = useState<string[]>([]);
  const [selectedAssignedToId, setSelectedAssignedToId] = useState("");
  const isSalesHead = role === "sales_head";
  const branchIdsParam = toBranchIdsParam(branchIds);
  const [paymentsVerifiedFilter, setPaymentsVerifiedFilter] = useState<
    "all" | "not_verified" | "not_credited"
  >(role === "accountant" ? "not_verified" : "all");
  const [menuOpenId, setMenuOpenId] = useState<string | null>(null);
  const [paymentTarget, setPaymentTarget] = useState<Prospect | null>(null);
  const [uploadTarget, setUploadTarget] = useState<Prospect | null>(null);
  const [assignTarget, setAssignTarget] = useState<Prospect | null>(null);

  const [resetProspect, setResetProsepect] = useState<Prospect | undefined>();

  const assignedToId = assignedToIdProp || selectedAssignedToId || undefined;

  const admissionFilterOptions: {
    value: AdmissionStage | "all";
    label: string;
  }[] = ADMISSION_FILTERS;

  const filters: ProspectFilters = {
    stage: canEditFields && activeStage !== "all" ? activeStage : undefined,
    admissionStage:
      activeAdmissionStage === "all" ? undefined : activeAdmissionStage,
    admissionStages: undefined,
    search: search || undefined,
    courseId: courseId || undefined,
    assignedToId,
    ...(canFilterByUser
      ? isSalesHead
        ? { branchIds: branchIdsParam }
        : {
            stateId: stateId || undefined,
            branchId: branchId || undefined,
          }
      : {}),
    paymentsVerified:
      role === "accountant" && paymentsVerifiedFilter !== "all"
        ? paymentsVerifiedFilter
        : undefined,
    createdFrom: createdFrom || undefined,
    createdTo: createdTo || undefined,
    page,
    pageSize,
  };
  /* 
  console.log("activeAdmissionStage", activeAdmissionStage);
  console.log(filters); */
  const { data, isLoading } = useProspects(filters);
  const { data: courses } = useCourses();
  const { data: specializations } = useSpecializations();
  const updateStage = useUpdateProspectStage();
  const updateAdmissionStage = useUpdateProspectAdmissionStage();
  const markExam = useMarkExamStatus();
  const exportMutation = useExportProspects();

  const prospects = data?.items ?? data?.data ?? [];

  const paymentBadge = (pct: number) => {
    if (pct === 0) return <span className="text-xs text-gray-400">None</span>;
    if (pct >= 100) return <Badge variant="success">100%</Badge>;
    if (pct >= 40) return <Badge variant="info">{pct}%</Badge>;
    return <Badge variant="warning">Advance</Badge>;
  };

  const getCourseName = (id: string) => {
    const courseName = courses?.filter((el) => el.id == id)[0]?.name ?? "";
    return courseName;
  };

  const handleExport = () => {
    exportMutation.mutate({
      stage: filters.stage,
      admissionStage: filters.admissionStage,
      search: filters.search,
      courseId: filters.courseId,
      assignedToId: filters.assignedToId,
      stateId: filters.stateId,
      branchId: filters.branchId,
      branchIds: filters.branchIds,
      paymentsVerified: filters.paymentsVerified,
      createdFrom: filters.createdFrom,
      createdTo: filters.createdTo,
    });
  };

  return (
    <div className="w-full min-w-0">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 gap-3">
        <div className="flex flex-col xs:flex-row sm:flex-row items-stretch sm:items-center gap-4 w-full sm:w-auto min-w-0">
          <div className="relative flex-1 sm:flex-initial min-w-0">
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
              className="w-full sm:w-52 pl-8 pr-3 py-1.5 text-xs rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-primary-600"
            />
          </div>
          <div className="relative flex-1 sm:flex-initial min-w-0">
            <select
              value={courseId}
              onChange={(e) => {
                setCourseId(e.target.value);
                setPage(1);
              }}
              className="w-full sm:w-auto px-2.5 py-1.5 text-xs rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-600 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-primary-600"
            >
              <option value="">All courses</option>
              {courses?.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
          {canFilterByUser && (
            <OrgScopeFilters
              size="sm"
              className="gap-2"
              stateId={stateId}
              branchId={branchId}
              branchIds={branchIds}
              employeeId={assignedToIdProp || selectedAssignedToId}
              employeeOptionsMode={role === "admin" ? "all" : "team"}
              includeRoleInLabel={role === "admin"}
              variant={isSalesHead ? "sales_head" : "default"}
              employeePlaceholder={
                role === "admin" ? "All users" : "Any team employee"
              }
              disabled={!!assignedToIdProp}
              onChange={(next) => {
                if (assignedToIdProp) return;
                setStateId(next.stateId);
                setBranchId(next.branchId);
                setBranchIds(next.branchIds);
                setSelectedAssignedToId(next.employeeId);
                setPage(1);
              }}
            />
          )}
        </div>
        <div className="flex gap-2 shrink-0">
          {canEditFields && (
            <Button
              size="sm"
              variant="secondary"
              leftIcon={<Download size={13} />}
              isLoading={exportMutation.isPending}
              className="text-black border-gray-700 dark:bg-gray-800 flex-1 sm:flex-initial"
              onClick={handleExport}
            >
              Export
            </Button>
          )}
          {addLeadHref && canEditFields && (
            <Link href={addLeadHref} className="flex-1 sm:flex-initial">
              <Button
                className="bg-gray-800 text-white dark:bg-gray-800 w-full"
                size="sm"
                variant="primary"
                leftIcon={<Plus size={13} />}
              >
                Add Admission
              </Button>
            </Link>
          )}
        </div>
      </div>
      <div className="flex gap-3 mb-4 flex-wrap items-center">
        <span className="text-xs text-gray-500">Filter by date:</span>
        <input
          type="date"
          value={createdFrom}
          onChange={(e) => {
            setCreatedFrom(e.target.value);
            setPage(1);
          }}
          className="px-3 py-1.5 text-xs rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-600 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-primary-600"
        />
        <span className="text-xs text-gray-400">to</span>
        <input
          type="date"
          value={createdTo}
          onChange={(e) => {
            setCreatedTo(e.target.value);
            setPage(1);
          }}
          className="px-3 py-1.5 text-xs rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-600 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-primary-600"
        />
        {isAccountant && (
          <select
            value={paymentsVerifiedFilter}
            onChange={(e) => {
              setPaymentsVerifiedFilter(
                e.target.value as "all" | "not_verified" | "not_credited",
              );
              setPage(1);
            }}
            className="px-3 py-1.5 text-xs rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-600 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-primary-600"
            aria-label="Payment verification"
          >
            <option value="not_verified">Not verified</option>
            <option value="not_credited">Not credited</option>
            <option value="all">All</option>
          </select>
        )}
        {(createdFrom || createdTo) && (
          <button
            type="button"
            onClick={() => {
              setCreatedFrom("");
              setCreatedTo("");
              setPage(1);
            }}
            className="text-xs text-primary-600 hover:underline"
          >
            Clear
          </button>
        )}
      </div>
      <div className="space-y-2 mb-4">
        {/*  {canEditFields && (
          <div className="flex gap-1 flex-wrap">
            {STAGES.map((s) => (
              <button
                key={s.value}
                type="button"
                onClick={() => {
                  setActiveStage(s.value);
                  setPage(1);
                }}
                className={cn(
                  "px-3 py-1.5 rounded-full text-xs font-medium border transition-colors",
                  activeStage === s.value
                    ? "bg-primary-50 text-primary-700 border-primary-200 dark:bg-primary-900/20 dark:text-primary-400 dark:border-primary-800"
                    : "bg-white border-gray-200 text-gray-600 hover:bg-gray-50 dark:bg-gray-900 dark:border-gray-700 dark:text-gray-400",
                )}
              >
                {s.label}
              </button>
            ))}
          </div>
        )} */}
        <div className="flex gap-1 flex-wrap items-center">
          <span className="text-[10px] font-semibold uppercase tracking-wide text-gray-400 mr-1">
            Admission
          </span>
          {admissionFilterOptions.map((s) => (
            <button
              key={s.value}
              type="button"
              /* disabled={isAccountant} */
              onClick={() => {
                // if (isAccountant) return;
                setActiveAdmissionStage(s.value);
                setPage(1);
              }}
              className={cn(
                "px-3 py-1.5 rounded-full text-xs font-medium border transition-colors",
                activeAdmissionStage === s.value
                  ? "bg-success-50 text-success-800 border-success-200 dark:bg-success-900/20 dark:text-success-400 dark:border-success-800"
                  : "bg-white border-gray-200 text-gray-600 hover:bg-gray-50 dark:bg-gray-900 dark:border-gray-700 dark:text-gray-400",
              )}
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>
      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="flex justify-center py-16">
            <Spinner size={24} />
          </div>
        ) : prospects.length === 0 ? (
          <EmptyState
            title="No Admission(s) found"
            description="Try adjusting your filters."
          />
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50">
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400">
                      SL. No.
                    </th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400">
                      Name
                    </th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400">
                      Phone
                    </th>

                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400">
                      Course
                    </th>

                    {showAssigneeColumn && (
                      <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400">
                        Assigned to
                      </th>
                    )}
                    {showAdminColumns && (
                      <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400">
                        State
                      </th>
                    )}
                    {showAdminColumns && (
                      <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400">
                        Branch
                      </th>
                    )}

                    {/* <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400">
                      Stage
                    </th> */}
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400">
                      Admission Stage
                    </th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400">
                      Total Paid
                    </th>
                    <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400">
                      Deal value
                    </th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400">
                      Payment
                    </th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400">
                      Verified
                    </th>
                    {canEditFields && (
                      <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400">
                        Exam
                      </th>
                    )}
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400">
                      Created
                    </th>
                    <th className="px-4 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 text-right">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50 dark:divide-gray-800">
                  {prospects.map((p, index) => (
                    <tr
                      key={p.id}
                      className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
                    >
                      <td className="px-4 py-3 text-xs text-gray-600 dark:text-gray-300">
                        {index + 1}
                      </td>
                      <td className="px-4 py-3">
                        <Link
                          href={`${basePath}/${p.id}`}
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
                        {p.phone}
                      </td>

                      <td className="px-4 py-3 text-xs text-gray-600 dark:text-gray-300">
                        {getCourseName(p.courseId)}
                        {p.specialization && (
                          <span className="block text-gray-400 text-[10px]">
                            {resolveSpecializationName(
                              p.specialization,
                              specializations,
                            )}
                          </span>
                        )}
                        {p.university && (
                          <span className="block text-gray-400 text-[11px]">
                            {p.university}
                          </span>
                        )}
                      </td>

                      {showAssigneeColumn && (
                        <td className="px-4 py-3 text-xs text-gray-600 dark:text-gray-300">
                          {p.assignedToName || p.assignedEmployeeName || (
                            <span className="text-gray-400">Unassigned</span>
                          )}
                          {p.assignedToCode && (
                            <span className="block text-[10px] text-gray-400">
                              {p.assignedToCode}
                            </span>
                          )}
                        </td>
                      )}

                      {showAdminColumns && (
                        <td className="px-4 py-3 text-xs text-gray-600 dark:text-gray-300">
                          {p.phone}
                        </td>
                      )}
                      {showAdminColumns && (
                        <td className="px-4 py-3 text-xs text-gray-600 dark:text-gray-300">
                          {p.phone}
                        </td>
                      )}
                      {/* <td className="px-4 py-3">
                        {canEditFields ? (
                          <select
                            value={normalizeStage(p.stage)}
                            onChange={(e) =>
                              updateStage.mutate({
                                id: p.id,
                                stage: e.target.value as ProspectStage,
                              })
                            }
                            className={cn(
                              "text-xs rounded-md px-2 py-1 border font-medium",
                              "focus:outline-none focus:ring-1 focus:ring-primary-600",
                              getStageConfig(p.stage).bg,
                              getStageConfig(p.stage).color,
                              "border-transparent bg-opacity-80",
                            )}
                          >
                            {STAGES.filter((s) => s.value !== "all").map(
                              (s) => (
                                <option
                                  key={s.value}
                                  value={s.value}
                                  className="bg-white dark:bg-gray-900 text-gray-600 dark:text-gray-300"
                                >
                                  {s.label}
                                </option>
                              ),
                            )}
                          </select>
                        ) : (
                          <span
                            className={cn(
                              "inline-flex px-2 py-0.5 rounded text-xs font-medium",
                              getStageConfig(p.stage).bg,
                              getStageConfig(p.stage).color,
                            )}
                          >
                            {getStageConfig(p.stage).label}
                          </span>
                        )}
                      </td> */}
                      <td className="px-4 py-3">
                        {canEditAdmission ? (
                          <select
                            value={normalizeAdmissionStage(p.admissionStage)}
                            onChange={(e) => {
                              const next = e.target.value as AdmissionStage;
                              if (
                                !canSetRestricted &&
                                isRestrictedAdmissionStage(next)
                              ) {
                                toast.error(
                                  "Only admin or processing team can set this admission stage",
                                );
                                e.target.value = normalizeAdmissionStage(
                                  p.admissionStage,
                                );
                                return;
                              }
                              if (
                                !canSetCompleted &&
                                isCompletedAdmissionStage(next)
                              ) {
                                toast.error(
                                  "You cannot set the Completed admission stage",
                                );
                                e.target.value = normalizeAdmissionStage(
                                  p.admissionStage,
                                );
                                return;
                              }
                              updateAdmissionStage.mutate({
                                id: p.id,
                                admissionStage: next,
                              });
                            }}
                            disabled={updateAdmissionStage.isPending}
                            className={cn(
                              "text-xs rounded-md px-2 py-1 border font-medium max-w-[12rem]",
                              "focus:outline-none focus:ring-1 focus:ring-primary-600",
                              getAdmissionStageConfig(p.admissionStage).bg,
                              getAdmissionStageConfig(p.admissionStage).color,
                              "border-transparent bg-opacity-80",
                            )}
                          >
                            {ADMISSION_STAGE_OPTIONS.map((s) => (
                              <option
                                key={s.value}
                                value={s.value}
                                disabled={
                                  (s.adminOnly && !canSetRestricted) ||
                                  (s.processingTeamBlocked && !canSetCompleted)
                                }
                                className="bg-white dark:bg-gray-900 text-gray-600 dark:text-gray-300"
                              >
                                {s.label}
                                {s.adminOnly && !canSetRestricted
                                  ? " (restricted)"
                                  : s.processingTeamBlocked && !canSetCompleted
                                    ? " (restricted)"
                                    : ""}
                              </option>
                            ))}
                          </select>
                        ) : (
                          <span
                            className={cn(
                              "inline-flex px-2 py-0.5 rounded text-xs font-medium",
                              getAdmissionStageConfig(p.admissionStage).bg,
                              getAdmissionStageConfig(p.admissionStage).color,
                            )}
                          >
                            {getAdmissionStageConfig(p.admissionStage).label}
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-600 dark:text-gray-300">
                        {p.totalPaid}
                      </td>
                      <td className="px-4 py-3 text-right text-xs font-medium text-gray-800 dark:text-gray-200">
                        {formatCurrency(p.estimatedValue)}
                      </td>
                      <td className="px-4 py-3">
                        <div
                          title={`₹${p?.totalPaid?.toLocaleString("en-IN")} of ₹${p.estimatedValue.toLocaleString("en-IN")}`}
                        >
                          {paymentBadge(p?.paymentPercentage ?? 0)}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        {p.paymentsVerified ? (
                          <Badge variant="success">Payments verified</Badge>
                        ) : (
                          <span className="text-xs text-gray-400">Pending</span>
                        )}
                      </td>
                      {canEditFields && (
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
                              Certificate Delivered
                            </label>
                          </div>
                        </td>
                      )}
                      <td className="px-4 py-3 text-xs text-gray-400">
                        {formatDate(p.createdAt)}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <Popover
                          open={menuOpenId === p.id}
                          onOpenChange={(open) =>
                            setMenuOpenId(open ? p.id : null)
                          }
                        >
                          <PopoverTrigger asChild>
                            <button
                              type="button"
                              className="inline-flex items-center justify-center w-8 h-8 rounded-md border border-gray-200 dark:border-gray-700 text-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800"
                              aria-label="More actions"
                            >
                              <MoreHorizontal size={16} />
                            </button>
                          </PopoverTrigger>
                          <PopoverContent align="end" className="w-48 p-1">
                            <Link
                              href={`${basePath}/${p.id}`}
                              className="flex items-center gap-2 px-2.5 py-2 text-xs rounded-md hover:bg-gray-50 dark:hover:bg-gray-800"
                              onClick={() => setMenuOpenId(null)}
                            >
                              <Eye size={13} /> View
                            </Link>
                            {canPay && (
                              <button
                                type="button"
                                className="w-full flex items-center gap-2 px-2.5 py-2 text-xs rounded-md hover:bg-gray-50 dark:hover:bg-gray-800"
                                onClick={() => {
                                  setPaymentTarget(p);
                                  setMenuOpenId(null);
                                }}
                              >
                                <CreditCard size={13} /> Add payment
                              </button>
                            )}
                            {canEditFields && (
                              <>
                                <Link
                                  href={`${basePath}/${p.id}/edit`}
                                  className="flex items-center gap-2 px-2.5 py-2 text-xs rounded-md hover:bg-gray-50 dark:hover:bg-gray-800"
                                  onClick={() => setMenuOpenId(null)}
                                >
                                  <Pencil size={13} /> Edit
                                </Link>
                                <button
                                  type="button"
                                  className="w-full flex items-center gap-2 px-2.5 py-2 text-xs rounded-md hover:bg-gray-50 dark:hover:bg-gray-800"
                                  onClick={() => {
                                    setUploadTarget(p);
                                    setMenuOpenId(null);
                                  }}
                                >
                                  <Upload size={13} /> Upload document
                                </button>
                                {showAssigneeColumn && (
                                  <button
                                    type="button"
                                    className="w-full flex items-center gap-2 px-2.5 py-2 text-xs rounded-md hover:bg-gray-50 dark:hover:bg-gray-800"
                                    onClick={() => {
                                      setAssignTarget(p);
                                      setMenuOpenId(null);
                                    }}
                                  >
                                    <UserPlus size={13} /> Assign / Reassign
                                  </button>
                                )}
                                <button
                                  type="button"
                                  className="w-full flex items-center gap-2 px-2.5 py-2 text-xs rounded-md hover:bg-gray-50 dark:hover:bg-gray-800"
                                  onClick={() => setResetProsepect(p)}
                                >
                                  <Lock size={13} /> Reset Password
                                </button>
                              </>
                            )}
                          </PopoverContent>
                        </Popover>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {data && (data.total ?? 0) > 0 && (
              <Pagination
                page={data.page ?? page}
                totalPages={data.totalPages ?? 1}
                total={data.total ?? prospects.length}
                pageSize={data.pageSize ?? pageSize}
                onPageChange={setPage}
                onPageSizeChange={(size) => {
                  setPageSize(size);
                  setPage(1);
                }}
              />
            )}
          </>
        )}
      </div>
      {paymentTarget && (
        <PaymentModal
          open={!!paymentTarget}
          onClose={() => setPaymentTarget(null)}
          prospectId={paymentTarget.id}
        />
      )}
      {uploadTarget && (
        <UploadDocumentModal
          open={!!uploadTarget}
          onClose={() => setUploadTarget(null)}
          prospectId={uploadTarget.id}
          prospectName={uploadTarget.name}
        />
      )}
      {assignTarget && (
        <AssignProspectModal
          open={!!assignTarget}
          onClose={() => setAssignTarget(null)}
          prospect={assignTarget}
        />
      )}
      {resetProspect && (
        <ResetPasswordModal
          open={!!resetProspect}
          onClose={() => setResetProsepect(undefined)}
          prospect={resetProspect}
        />
      )}
    </div>
  );
}
