"use client";

import { useCallback, useEffect, useState } from "react";
import {
  Plus,
  Edit,
  Lock,
  RefreshCw,
  Search,
  EyeClosed,
  Eye,
  Copy,
} from "lucide-react";
import AppShell from "@/components/layout/AppShell";
import {
  Badge,
  Button,
  Card,
  Modal,
  Input,
  Spinner,
  EmptyState,
  Pagination,
} from "@/components/ui";
import {
  useEmployees,
  useCreateEmployee,
  useUpdateEmployee,
  useToggleEmployeeStatus,
  useResetEmployeePassword,
  useNextEmployeeId,
  useSalesEmployees,
} from "@/hooks/useEmployees";
import { useSetTeamAssignment, useTeamSupervisors } from "@/hooks/useTeam";
import { useStates, useBranches } from "@/hooks";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { cn, formatDate, generatePassword } from "@/lib/utils";
import { CREATABLE_USER_ROLES, normalizeRole, roleLabel } from "@/lib/roles";
import type { Employee, UserRole } from "@/types";
import { extractApiError } from "@/lib/api";
import toast from "react-hot-toast";

// ─── Schemas ──────────────────────────────────────────────────────────────

const FLEXIBLE_GEO_ROLES = ["accountant", "processing_team"] as const;

function isFlexibleGeoRole(role: string): boolean {
  return (FLEXIBLE_GEO_ROLES as readonly string[]).includes(role);
}

const empSchema = z
  .object({
    name: z.string().min(2, "Required"),
    email: z.email("Valid email required"),
    phone: z.string().min(10, "Required"),
    department: z.string().min(1, "Required"),
    designation: z.string().min(1, "Required"),
    password: z.string().min(8, "Min 8 characters").optional().or(z.literal("")),
    monthlyTarget: z.number().int().positive("Must be positive"),
    role: z.enum([
      "employee",
      "manager",
      "sales_head",
      "accountant",
      "processing_team",
    ]),
    stateId: z.string().optional(),
    branchId: z.string().optional(),
    reportsToManagerId: z.string().optional(),
    reportsToSalesHeadId: z.string().optional(),
  })
  .superRefine((data, ctx) => {
    if (isFlexibleGeoRole(data.role)) return;
    if (!data.stateId?.trim()) {
      ctx.addIssue({
        code: "custom",
        path: ["stateId"],
        message: "State is required",
      });
    }
    if (!data.branchId?.trim()) {
      ctx.addIssue({
        code: "custom",
        path: ["branchId"],
        message: "Branch is required",
      });
    }
  });
type EmpFormValues = z.infer<typeof empSchema>;

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

function buildEmpDefaults(employee?: Employee, password = ""): EmpFormValues {
  const normalized = normalizeRole(employee?.role) ?? "employee";
  const role =
    normalized === "admin" ? "employee" : (normalized as EmpFormValues["role"]);
  return {
    name: employee?.name ?? "",
    email: employee?.email ?? "",
    phone: employee?.phone ?? "",
    department: employee?.department ?? "Sales",
    designation: employee?.designation ?? "Executive",
    password,
    monthlyTarget:
      Number(employee?.monthlyTarget) > 0
        ? Number(employee?.monthlyTarget)
        : 60,
    role,
    stateId: employee?.stateId ? String(employee.stateId) : "",
    branchId: employee?.branchId ? String(employee.branchId) : "",
    reportsToManagerId: employee?.reportsToManagerId
      ? String(employee.reportsToManagerId)
      : "",
    reportsToSalesHeadId: employee?.reportsToSalesHeadId
      ? String(employee.reportsToSalesHeadId)
      : "",
  };
}

// ─── Create / Edit modal ──────────────────────────────────────────────────

function EmployeeFormModal({
  open,
  onClose,
  employee,
}: {
  open: boolean;
  onClose: () => void;
  employee?: Employee;
}) {
  const isEdit = !!employee;
  const createMutation = useCreateEmployee();
  const updateMutation = useUpdateEmployee(employee?.id ?? "");
  const assignmentMutation = useSetTeamAssignment();
  const [showPassword, setShowPassword] = useState(false);
  const { data: nextEmployeeId, isLoading: nextIdLoading } = useNextEmployeeId(
    open && !isEdit,
  );
  const { data: states = [] } = useStates(open);
  const generatePasswordFN = useCallback(() => generatePassword(), []);

  const {
    register,
    handleSubmit,
    getValues,
    setValue,
    reset,
    watch,
    formState: { errors },
  } = useForm<EmpFormValues>({
    resolver: zodResolver(empSchema),
    defaultValues: buildEmpDefaults(employee),
  });

  const watchedRole = watch("role");
  const watchedStateId = watch("stateId");
  const watchedBranchId = watch("branchId");
  const showReportsTo = watchedRole === "employee";
  const flexibleGeo = isFlexibleGeoRole(watchedRole);
  const geoRequired = !flexibleGeo;
  const supervisorsEnabled =
    open && showReportsTo && !!watchedStateId && !!watchedBranchId;
  const supervisorFilters = {
    stateId: watchedStateId || undefined,
    branchId: watchedBranchId || undefined,
  };

  const { data: managers = [], isLoading: managersLoading } = useTeamSupervisors(
    "manager",
    supervisorsEnabled,
    supervisorFilters,
  );
  const { data: salesHeads = [], isLoading: salesHeadsLoading } =
    useTeamSupervisors("sales_head", supervisorsEnabled, supervisorFilters);

  // Sales: branches for selected state. Flexible roles: all branches, or filtered by state.
  const { data: branches = [] } = useBranches(
    { stateId: watchedStateId || undefined },
    open && (flexibleGeo || !!watchedStateId),
  );

  useEffect(() => {
    if (!open) return;
    const password = isEdit ? "" : generatePasswordFN();
    reset(buildEmpDefaults(employee, password));
    setShowPassword(!isEdit);
  }, [open, employee, isEdit, reset, generatePasswordFN]);

  useEffect(() => {
    if (!open) return;
    const currentBranch = getValues("branchId");
    if (
      currentBranch &&
      branches.length > 0 &&
      !branches.some((b) => String(b.id) === currentBranch)
    ) {
      setValue("branchId", "");
    }
  }, [watchedStateId, branches, open, getValues, setValue]);

  // Clear supervisor picks when org scope or role changes away from employee
  useEffect(() => {
    if (!open) return;
    if (!showReportsTo || !watchedStateId || !watchedBranchId) {
      setValue("reportsToManagerId", "");
      setValue("reportsToSalesHeadId", "");
      return;
    }
    const managerId = getValues("reportsToManagerId");
    if (
      managerId &&
      managers.length > 0 &&
      !managers.some((m) => String(m.id) === managerId)
    ) {
      setValue("reportsToManagerId", "");
    }
    const salesHeadId = getValues("reportsToSalesHeadId");
    if (
      salesHeadId &&
      salesHeads.length > 0 &&
      !salesHeads.some((m) => String(m.id) === salesHeadId)
    ) {
      setValue("reportsToSalesHeadId", "");
    }
  }, [
    open,
    showReportsTo,
    watchedStateId,
    watchedBranchId,
    managers,
    salesHeads,
    getValues,
    setValue,
  ]);

  const persistAssignment = (
    employeeId: string | number,
    values: EmpFormValues,
    onDone: () => void,
  ) => {
    if (values.role !== "employee") {
      onDone();
      return;
    }
    assignmentMutation.mutate(
      {
        employeeId,
        reportsToManagerId: values.reportsToManagerId || null,
        reportsToSalesHeadId: values.reportsToSalesHeadId || null,
      },
      {
        onSuccess: onDone,
        onError: onDone,
      },
    );
  };

  const onSubmit = (values: EmpFormValues) => {
    const reportsToManagerId =
      values.role === "employee" ? values.reportsToManagerId || null : null;
    const reportsToSalesHeadId =
      values.role === "employee" ? values.reportsToSalesHeadId || null : null;
    const stateId = values.stateId?.trim() || null;
    const branchId = values.branchId?.trim() || null;

    if (isEdit) {
      const {
        password: _pw,
        reportsToManagerId: _m,
        reportsToSalesHeadId: _s,
        ...rest
      } = values;
      updateMutation.mutate(
        {
          ...rest,
          role: values.role as Exclude<UserRole, "admin">,
          stateId,
          branchId,
          reportsToManagerId,
          reportsToSalesHeadId,
        },
        {
          onSuccess: (updated) => {
            persistAssignment(updated.id || employee!.id, values, onClose);
          },
        },
      );
      return;
    }
    if (!values.password) {
      toast.error("Password is required");
      return;
    }
    createMutation.mutate(
      {
        name: values.name,
        email: values.email,
        phone: values.phone,
        department: values.department,
        designation: values.designation,
        password: values.password,
        monthlyTarget: values.monthlyTarget,
        role: values.role as Exclude<UserRole, "admin">,
        stateId,
        branchId,
        reportsToManagerId,
        reportsToSalesHeadId,
      },
      {
        onSuccess: (created) => {
          persistAssignment(created.id, values, onClose);
        },
      },
    );
  };

  const copyCredentials = async () => {
    const password = getValues("password");
    const employeeId = nextEmployeeId?.employeeId || employee?.employeeId || "";
    if (!employeeId && !password) {
      toast.error("Nothing to copy yet");
      return;
    }
    const text = `Employee ID: ${employeeId || "(pending)"}\nPassword: ${password || "(not set)"}`;
    await navigator.clipboard.writeText(text);
    toast.success("Credentials copied");
  };

  const isPending =
    (isEdit ? updateMutation.isPending : createMutation.isPending) ||
    assignmentMutation.isPending;

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={isEdit ? "Edit user" : "Create user"}
      size="lg"
      footer={
        <>
          <Button
            type="button"
            variant="secondary"
            className="w-full sm:w-auto"
            onClick={onClose}
          >
            Cancel
          </Button>
          {!isEdit && (
            <Button
              type="button"
              variant="secondary"
              className="w-full sm:w-auto"
              leftIcon={<Copy size={14} />}
              onClick={() => void copyCredentials()}
            >
              Copy credentials
            </Button>
          )}
          <Button
            type="button"
            variant="primary"
            className="w-full sm:w-auto bg-gray-600 dark:bg-gray-800 text-white"
            onClick={handleSubmit(onSubmit)}
            isLoading={isPending}
          >
            {isEdit ? "Save changes" : "Create user"}
          </Button>
        </>
      }
    >
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {!isEdit && (
          <>
            <div className="space-y-1 text-sm text-gray-600 dark:text-gray-200">
              <span className="text-xs font-medium text-gray-500">
                Employee ID
              </span>
              <div className="font-mono">
                {nextIdLoading
                  ? "Generating…"
                  : (nextEmployeeId?.employeeId ?? "—")}
              </div>
            </div>
            <p className="col-span-full text-xs text-gray-600 dark:text-gray-400 sm:col-start-1 sm:row-start-2">
              Employee ID and password are auto-generated. Use Copy credentials
              to share them.
            </p>
          </>
        )}
        {isEdit && (
          <div className="col-span-full text-sm text-gray-600 dark:text-gray-300">
            <span className="text-xs font-medium text-gray-500">
              Employee ID
            </span>
            <div className="font-mono">{employee?.employeeId ?? "—"}</div>
          </div>
        )}
        <div className="col-span-full">
          <Input
            label="Full name *"
            autoComplete="name"
            error={errors.name?.message}
            {...register("name")}
          />
        </div>
        <Input
          label="Email *"
          type="email"
          autoComplete="email"
          error={errors.email?.message}
          {...register("email")}
        />
        <Input
          label="Phone *"
          autoComplete="tel"
          error={errors.phone?.message}
          {...register("phone")}
        />
        <Input
          label="Department"
          placeholder="Sales"
          autoComplete="organization-title"
          error={errors.department?.message}
          {...register("department")}
        />
        <Input
          label="Designation"
          placeholder="Sales Executive"
          autoComplete="off"
          error={errors.designation?.message}
          {...register("designation")}
        />
        <div className="space-y-1 min-w-0">
          <label className="text-xs font-medium text-gray-500">Role *</label>
          <select
            {...register("role")}
            className="w-full max-w-full px-3 py-2.5 text-sm border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-primary-600"
          >
            {CREATABLE_USER_ROLES.map((r) => (
              <option key={r.value} value={r.value}>
                {r.label}
              </option>
            ))}
          </select>
          {errors.role?.message && (
            <p className="text-xs text-danger-600">{errors.role.message}</p>
          )}
        </div>
        <Input
          label="Monthly target (admission) *"
          type="number"
          autoComplete="off"
          error={errors.monthlyTarget?.message}
          {...register("monthlyTarget", { valueAsNumber: true })}
        />
        <div className="space-y-1 min-w-0">
          <label className="text-xs font-medium text-gray-500">
            State{geoRequired ? " *" : ""}
          </label>
          <select
            {...register("stateId", {
              onChange: () => {
                if (geoRequired || getValues("branchId")) {
                  // Keep clearing branch when state changes for sales cascade;
                  // for flexible roles also clear branch if it no longer matches.
                  setValue("branchId", "");
                }
              },
            })}
            className="w-full max-w-full px-3 py-2.5 text-sm border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-primary-600"
          >
            <option value="">
              {flexibleGeo ? "All / none (optional)" : "Select state"}
            </option>
            {states.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
                {s.stateCode ? ` (${s.stateCode})` : ""}
              </option>
            ))}
          </select>
          {errors.stateId?.message && (
            <p className="text-xs text-danger-600">{errors.stateId.message}</p>
          )}
          {flexibleGeo && (
            <p className="text-[10px] text-gray-400">
              Optional. Empty = org-wide. State only = all branches in that
              state.
            </p>
          )}
        </div>
        <div className="space-y-1 min-w-0">
          <label className="text-xs font-medium text-gray-500">
            Branch{geoRequired ? " *" : ""}
          </label>
          <select
            {...register("branchId", {
              onChange: (e) => {
                // Flexible: branch without state → infer state from branch
                if (flexibleGeo && e.target.value && !getValues("stateId")) {
                  const branch = branches.find(
                    (b) => String(b.id) === e.target.value,
                  );
                  if (branch?.stateId) {
                    setValue("stateId", String(branch.stateId));
                  }
                }
              },
            })}
            disabled={geoRequired && !watchedStateId}
            className="w-full max-w-full px-3 py-2.5 text-sm border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-primary-600 disabled:opacity-50"
          >
            <option value="">
              {geoRequired
                ? watchedStateId
                  ? "Select branch"
                  : "Select state first"
                : "All / none (optional)"}
            </option>
            {branches.map((b) => (
              <option key={b.id} value={b.id}>
                {b.name}
                {b.branchCode ? ` (${b.branchCode})` : ""}
                {flexibleGeo && !watchedStateId && b.stateName
                  ? ` — ${b.stateName}`
                  : ""}
              </option>
            ))}
          </select>
          {errors.branchId?.message && (
            <p className="text-xs text-danger-600">{errors.branchId.message}</p>
          )}
        </div>
        {showReportsTo && (
          <>
            <div className="space-y-1 min-w-0">
              <label className="text-xs font-medium text-gray-500">
                Reports to Manager
              </label>
              <select
                {...register("reportsToManagerId")}
                disabled={!supervisorsEnabled}
                className="w-full max-w-full px-3 py-2.5 text-sm border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-primary-600 disabled:opacity-50"
              >
                <option value="">
                  {!watchedStateId || !watchedBranchId
                    ? "Select state & branch first"
                    : managersLoading
                      ? "Loading…"
                      : "— None —"}
                </option>
                {managers.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name}
                    {m.employeeId ? ` (${m.employeeId})` : ""}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-1 min-w-0">
              <label className="text-xs font-medium text-gray-500">
                Reports to Sales Head
              </label>
              <select
                {...register("reportsToSalesHeadId")}
                disabled={!supervisorsEnabled}
                className="w-full max-w-full px-3 py-2.5 text-sm border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-primary-600 disabled:opacity-50"
              >
                <option value="">
                  {!watchedStateId || !watchedBranchId
                    ? "Select state & branch first"
                    : salesHeadsLoading
                      ? "Loading…"
                      : "— None —"}
                </option>
                {salesHeads.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name}
                    {m.employeeId ? ` (${m.employeeId})` : ""}
                  </option>
                ))}
              </select>
            </div>
          </>
        )}
        {!isEdit && (
          <div className="col-span-full space-y-2">
            <div className="relative">
              <Input
                label="Password *"
                type={showPassword ? "text" : "password"}
                autoComplete="new-password"
                error={errors.password?.message}
                {...register("password")}
              />
              <button
                type="button"
                onClick={() => setShowPassword((prev) => !prev)}
                className="absolute right-2 top-8 p-2 text-gray-500 hover:text-gray-800 dark:text-gray-300"
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <Eye size={16} /> : <EyeClosed size={16} />}
              </button>
            </div>
            <div className="flex flex-col sm:flex-row flex-wrap gap-2">
              <Button
                type="button"
                size="sm"
                variant="secondary"
                className="w-full sm:w-auto"
                leftIcon={<RefreshCw size={14} />}
                onClick={() => {
                  setValue("password", generatePasswordFN(), {
                    shouldValidate: true,
                  });
                  setShowPassword(true);
                }}
              >
                Regenerate
              </Button>
              <Button
                type="button"
                size="sm"
                variant="secondary"
                className="w-full sm:w-auto"
                leftIcon={<Copy size={14} />}
                onClick={() => void copyCredentials()}
              >
                Copy credentials
              </Button>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
}

// ─── Reset password modal ─────────────────────────────────────────────────

function ResetPasswordModal({
  open,
  onClose,
  employee,
}: {
  open: boolean;
  onClose: () => void;
  employee: Employee;
}) {
  const resetMutation = useResetEmployeePassword();
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
  }, [open, employee.id, reset, generatePasswordFN]);

  const onSubmit = (values: ResetFormValues) => {
    resetMutation.mutate(
      { id: String(employee.id), newPassword: values.newPassword },
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
    const text = `Employee ID: ${employee.employeeId}\nPassword: ${password}`;
    await navigator.clipboard.writeText(text);
    toast.success("Credentials copied");
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={`Reset Password — ${employee.name}`}
      size="sm"
      footer={
        <>
          <Button
            type="button"
            variant="secondary"
            className="w-full sm:w-auto"
            onClick={onClose}
          >
            Cancel
          </Button>
          <Button
            type="button"
            variant="secondary"
            className="w-full sm:w-auto"
            leftIcon={<Copy size={13} />}
            onClick={() => void copyCredentials()}
          >
            Copy
          </Button>
          <Button
            type="button"
            variant="primary"
            className="w-full sm:w-auto bg-gray-600 dark:bg-gray-800 text-white"
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
          <span className="font-mono">{employee.employeeId}</span>. Copy it
          before saving.
        </p>
        {/* Hidden username field so browsers don't stuff the page search box */}
        <input
          type="text"
          name="username"
          autoComplete="username"
          value={employee.email || employee.employeeId || ""}
          readOnly
          tabIndex={-1}
          aria-hidden
          className="sr-only"
        />
        <div className="relative">
          <Input
            label="New password *"
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
          label="Confirm password *"
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

// ─── Deactivate employee modal (with lead transfer) ──────────────────────

function DeactivateEmployeeModal({
  open,
  onClose,
  employee,
  leadCount,
  onConfirm,
  isPending,
}: {
  open: boolean;
  onClose: () => void;
  employee: Employee;
  leadCount: number | null;
  onConfirm: (transferToId?: string) => void;
  isPending: boolean;
}) {
  const { employees: activeEmployees, isLoading: loadingEmployees } =
    useSalesEmployees({ status: "active", enabled: open, all: true });
  const [transferToId, setTransferToId] = useState<string>("");

  const candidates = activeEmployees.filter((e) => e.id !== employee.id);

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Deactivate Employee"
      size="md"
      footer={
        <>
          <Button
            type="button"
            variant="secondary"
            className="w-full sm:w-auto"
            onClick={onClose}
          >
            Cancel
          </Button>
          <Button
            type="button"
            variant="danger"
            className="w-full sm:w-auto"
            onClick={() => onConfirm(transferToId || undefined)}
            isLoading={isPending}
          >
            Deactivate
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <p className="text-sm text-gray-700 dark:text-gray-300">
          Deactivate <span className="font-semibold">{employee.name}</span>?
        </p>
        {leadCount != null && leadCount > 0 && (
          <>
            <div className="rounded-lg bg-warning-50 dark:bg-warning-900/20 border border-warning-200 dark:border-warning-800 px-4 py-3">
              <p className="text-sm text-warning-800 dark:text-warning-200">
                This employee has{" "}
                <span className="font-semibold">{leadCount}</span>{" "}
                {leadCount === 1 ? "admission" : "admissions"} assigned. Select
                a colleague to transfer them to.
              </p>
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-gray-500">
                Transfer leads to *
              </label>
              {loadingEmployees ? (
                <div className="flex items-center gap-2 py-2 text-xs text-gray-400">
                  <Spinner size={14} /> Loading employees…
                </div>
              ) : (
                <select
                  value={transferToId}
                  onChange={(e) => setTransferToId(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-primary-600"
                >
                  <option value="">— Select employee —</option>
                  {candidates.map((e) => (
                    <option key={e.id} value={e.id}>
                      {e.name} {e.employeeId ? `(${e.employeeId})` : ""}
                    </option>
                  ))}
                </select>
              )}
            </div>
          </>
        )}
        {leadCount != null && leadCount === 0 && (
          <p className="text-xs text-gray-500">
            No leads assigned — safe to deactivate.
          </p>
        )}
      </div>
    </Modal>
  );
}

// ─── Main page ─────────────────────────────────────────────────────────────

export default function EmployeesPage() {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [stateFilter, setStateFilter] = useState("");
  const [branchFilter, setBranchFilter] = useState("");
  const [createOpen, setCreateOpen] = useState(false);
  const [deactivateOpen, setdeactivateOpen] = useState(false);
  const [editEmployee, setEditEmployee] = useState<Employee | undefined>();
  const [resetEmployee, setResetEmployee] = useState<Employee | undefined>();
  const [deactivateTarget, setDeactivateTarget] = useState<
    Employee | undefined
  >();
  const [deactivateLeadCount, setDeactivateLeadCount] = useState<number | null>(
    null,
  );

  // Debounce search so typing / autofill bursts don't spam the API
  useEffect(() => {
    const timer = window.setTimeout(() => {
      const next = searchInput.trim();
      setSearch((prev) => {
        if (prev === next) return prev;
        return next;
      });
    }, 300);
    return () => window.clearTimeout(timer);
  }, [searchInput]);

  useEffect(() => {
    setPage(1);
  }, [search, statusFilter, stateFilter, branchFilter]);

  const { data: states = [] } = useStates();
  const { data: filterBranches = [] } = useBranches(
    { stateId: stateFilter || undefined },
    !!stateFilter,
  );

  const { data: employeesData, isLoading } = useEmployees({
    page,
    pageSize,
    search: search || undefined,
    status: (statusFilter as "active" | "inactive") || undefined,
    stateId: stateFilter || undefined,
    branchId: branchFilter || undefined,
  });

  const employees = employeesData?.items ?? employeesData?.data ?? [];
  const toggleStatus = useToggleEmployeeStatus();

  const openCreate = () => {
    setEditEmployee(undefined);
    setResetEmployee(undefined);
    setCreateOpen(true);
  };

  const openEdit = (emp: Employee) => {
    setCreateOpen(false);
    setResetEmployee(undefined);
    setEditEmployee(emp);
  };

  const openReset = (emp: Employee) => {
    setCreateOpen(false);
    setEditEmployee(undefined);
    setResetEmployee(emp);
  };

  const handleToggleStatus = (emp: Employee) => {
    const nextStatus = emp.status === "active" ? "inactive" : "active";
    if (nextStatus === "active") {
      toggleStatus.mutate(
        { id: String(emp.id), status: "active" },
        { onError: (err) => toast.error(extractApiError(err)) },
      );
      return;
    }
    // Deactivating — try without transfer first; backend will 400 if leads exist
    toggleStatus.mutate(
      { id: String(emp.id), status: "inactive" },
      {
        onError: (error: unknown) => {
          console.log(error);
          const axiosErr = error as {
            response?: { status?: number; data?: { leadCount?: number } };
          };
          if (
            axiosErr?.response?.status === 400 &&
            typeof axiosErr?.response?.data?.leadCount === "number"
          ) {
            alert("here");
            setdeactivateOpen(true);
            setDeactivateTarget(emp);
            setDeactivateLeadCount(axiosErr.response.data.leadCount);
          } else {
            toast.error(extractApiError(error));
          }
        },
      },
    );
  };

  const handleDeactivateConfirm = (transferToId?: string) => {
    if (!deactivateTarget) return;
    toggleStatus.mutate(
      {
        id: String(deactivateTarget.id),
        status: "inactive",
        transferToId,
      },
      {
        onSuccess: () => {
          setDeactivateTarget(undefined);
          setDeactivateLeadCount(null);
        },
        onError: (err) => {
          toast.error(extractApiError(err));
          setDeactivateTarget(undefined);
          setDeactivateLeadCount(null);
        },
      },
    );
  };

  return (
    <AppShell
      title="Users"
      requiredRole="admin"
      topbarActions={
        <Button
          type="button"
          size="sm"
          variant="primary"
          className="bg-white dark:bg-black text-black dark:text-white"
          leftIcon={<Plus size={13} />}
          onClick={openCreate}
        >
          Add User
        </Button>
      }
    >
      <div className="flex gap-3 mb-5 flex-wrap">
        <div className="relative w-full sm:w-auto">
          <Search
            size={14}
            className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
          />
          <input
            type="text"
            name="employee-list-search"
            autoComplete="off"
            autoCorrect="off"
            spellCheck={false}
            placeholder="Search name, email…"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="pl-8 pr-3 py-2 sm:py-1.5 text-sm border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-primary-600 w-full sm:w-56"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-3 py-2 sm:py-1.5 text-sm border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-600 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-primary-600 w-full sm:w-auto"
        >
          <option value="">All statuses</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </select>
        <select
          value={stateFilter}
          onChange={(e) => {
            setStateFilter(e.target.value);
            setBranchFilter("");
          }}
          className="px-3 py-2 sm:py-1.5 text-sm border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-600 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-primary-600 w-full sm:w-auto"
        >
          <option value="">All states</option>
          {states.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
              {s.stateCode ? ` (${s.stateCode})` : ""}
            </option>
          ))}
        </select>
        <select
          value={branchFilter}
          onChange={(e) => setBranchFilter(e.target.value)}
          disabled={!stateFilter}
          className="px-3 py-2 sm:py-1.5 text-sm border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-600 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-primary-600 w-full sm:w-auto disabled:opacity-50"
        >
          <option value="">
            {stateFilter ? "All branches" : "Select state first"}
          </option>
          {filterBranches.map((b) => (
            <option key={b.id} value={b.id}>
              {b.name}
              {b.branchCode ? ` (${b.branchCode})` : ""}
            </option>
          ))}
        </select>
      </div>

      <Card noPadding>
        {isLoading ? (
          <div className="flex justify-center py-16">
            <Spinner size={24} />
          </div>
        ) : !employees.length ? (
          <EmptyState title="No Employees found" />
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50">
                    {[
                      "Employee ID",
                      "Name",
                      "Role",
                      "State",
                      "Branch",
                      "Email",
                      "Phone",
                      "Dept.",
                      "Monthly Target",
                      "Status",
                      "Created",
                      "Actions",
                    ].map((h) => (
                      <th
                        key={h}
                        className={cn(
                          "text-left px-4 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 whitespace-nowrap",
                          h === "Actions" &&
                            "sticky right-0 bg-gray-200 dark:bg-gray-800/95 shadow-[-6px_0_8px_-6px_rgba(0,0,0,0.12)]",
                        )}
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50 dark:divide-gray-800">
                  {employees.map((emp) => (
                    <tr
                      key={emp.id}
                      className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
                    >
                      <td className="px-4 py-3 font-mono text-xs text-gray-500">
                        {emp.employeeId}
                      </td>
                      <td className="px-4 py-3">
                        <p className="text-xs font-semibold text-gray-900 dark:text-gray-100">
                          {emp.name}
                        </p>
                        <p className="text-[10px] text-gray-400">
                          {emp.designation}
                        </p>
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-600 dark:text-gray-300">
                        {roleLabel(emp.role)}
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-600 dark:text-gray-300">
                        {emp.stateName || "—"}
                        {emp.stateCode ? (
                          <span className="text-[10px] text-gray-400 block">
                            {emp.stateCode}
                          </span>
                        ) : null}
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-600 dark:text-gray-300">
                        {emp.branchName || "—"}
                        {emp.branchCode ? (
                          <span className="text-[10px] text-gray-400 block">
                            {emp.branchCode}
                          </span>
                        ) : null}
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-600 dark:text-gray-300">
                        {emp.email}
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-600 dark:text-gray-300">
                        {emp.phone}
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-600 dark:text-gray-300">
                        {emp.department}
                      </td>
                      <td className="px-4 py-3 text-xs font-medium text-gray-800 dark:text-gray-200 text-center">
                        {emp.monthlyTarget}
                      </td>
                      <td className="px-4 py-3">
                        <Badge
                          className="dark:text-gray-600 text-black"
                          variant={
                            emp.status === "active" ? "success" : "danger"
                          }
                        >
                          {emp.status}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-400">
                        {formatDate(emp.createdAt)}
                      </td>
                      <td className="px-3 sm:px-4 py-3 sticky right-0 bg-gray-200 dark:bg-gray-800/95 shadow-[-6px_0_8px_-6px_rgba(0,0,0,0.12)]">
                        <div className="flex items-center gap-1.5 sm:gap-1">
                          <button
                            type="button"
                            onClick={() => openEdit(emp)}
                            className="inline-flex items-center justify-center min-w-10 min-h-10 sm:min-w-8 sm:min-h-8 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
                            title="Edit"
                            aria-label="Edit user"
                          >
                            <Edit className="size-[18px] sm:size-[15px]" />
                          </button>
                          <button
                            type="button"
                            onClick={() => openReset(emp)}
                            className="inline-flex items-center justify-center min-w-10 min-h-10 sm:min-w-8 sm:min-h-8 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
                            title="Reset Password"
                            aria-label="Reset password"
                          >
                            <Lock className="size-[18px] sm:size-[15px]" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleToggleStatus(emp)}
                            disabled={toggleStatus.isPending}
                            className="inline-flex items-center justify-center min-w-10 min-h-10 sm:min-w-8 sm:min-h-8 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 disabled:opacity-50"
                            title={
                              emp.status === "active"
                                ? "Deactivate"
                                : "Activate"
                            }
                            aria-label={
                              emp.status === "active"
                                ? "Deactivate user"
                                : "Activate user"
                            }
                          >
                            <RefreshCw className="size-[18px] sm:size-[15px]" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {(employeesData?.total ?? 0) > 0 && (
              <Pagination
                page={employeesData?.page ?? page}
                totalPages={employeesData?.totalPages ?? 1}
                total={employeesData?.total ?? employees.length}
                pageSize={employeesData?.pageSize ?? pageSize}
                onPageChange={setPage}
                onPageSizeChange={(size) => {
                  setPageSize(size);
                  setPage(1);
                }}
              />
            )}
          </>
        )}
      </Card>

      {createOpen && (
        <EmployeeFormModal
          open={createOpen}
          onClose={() => setCreateOpen(false)}
        />
      )}
      {editEmployee && (
        <EmployeeFormModal
          open={!!editEmployee}
          onClose={() => setEditEmployee(undefined)}
          employee={editEmployee}
        />
      )}
      {resetEmployee && (
        <ResetPasswordModal
          open={!!resetEmployee}
          onClose={() => setResetEmployee(undefined)}
          employee={resetEmployee}
        />
      )}
      {deactivateTarget && deactivateOpen && (
        <DeactivateEmployeeModal
          open={!!deactivateTarget && deactivateOpen}
          onClose={() => {
            setDeactivateTarget(undefined);
            setDeactivateLeadCount(null);
            setdeactivateOpen(false);
          }}
          employee={deactivateTarget}
          leadCount={deactivateLeadCount}
          onConfirm={handleDeactivateConfirm}
          isPending={toggleStatus.isPending}
        />
      )}
    </AppShell>
  );
}
