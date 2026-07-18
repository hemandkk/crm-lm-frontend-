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
} from "@/hooks/useEmployees";
import { useSetTeamAssignment, useTeamSupervisors } from "@/hooks/useTeam";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { formatDate, generatePassword } from "@/lib/utils";
import { CREATABLE_USER_ROLES, normalizeRole, roleLabel } from "@/lib/roles";
import type { Employee, UserRole } from "@/types";
import toast from "react-hot-toast";

// ─── Schemas ──────────────────────────────────────────────────────────────

const empSchema = z.object({
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
  reportsToManagerId: z.string().optional(),
  reportsToSalesHeadId: z.string().optional(),
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
    monthlyTarget: Number(employee?.monthlyTarget) > 0
      ? Number(employee?.monthlyTarget)
      : 60,
    role,
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
  const { data: managers = [] } = useTeamSupervisors("manager", open);
  const { data: salesHeads = [] } = useTeamSupervisors("sales_head", open);
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
  const showReportsTo = watchedRole === "employee";

  useEffect(() => {
    if (!open) return;
    const password = isEdit ? "" : generatePasswordFN();
    reset(buildEmpDefaults(employee, password));
    setShowPassword(!isEdit);
  }, [open, employee, isEdit, reset, generatePasswordFN]);

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

    if (isEdit) {
      const { password: _pw, reportsToManagerId: _m, reportsToSalesHeadId: _s, ...rest } =
        values;
      updateMutation.mutate(
        {
          ...rest,
          role: values.role as Exclude<UserRole, "admin">,
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
      size="md"
      footer={
        <>
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button
            type="button"
            variant="primary"
            className="bg-gray-600 dark:bg-gray-800 text-white"
            onClick={handleSubmit(onSubmit)}
            isLoading={isPending}
          >
            {isEdit ? "Save changes" : "Create user"}
          </Button>
          {!isEdit && (
            <Button
              type="button"
              variant="secondary"
              leftIcon={<Copy size={13} />}
              onClick={() => void copyCredentials()}
            >
              Copy credentials
            </Button>
          )}
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
            <p className="col-span-2 text-xs text-gray-600 dark:text-gray-400">
              Employee ID and password are auto-generated. Use Copy credentials
              to share them.
            </p>
          </>
        )}
        {isEdit && (
          <div className="col-span-2 text-sm text-gray-600 dark:text-gray-300">
            <span className="text-xs font-medium text-gray-500">
              Employee ID
            </span>
            <div className="font-mono">{employee?.employeeId ?? "—"}</div>
          </div>
        )}
        <div className="col-span-2">
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
        <div className="space-y-1">
          <label className="text-xs font-medium text-gray-500">Role *</label>
          <select
            {...register("role")}
            className="w-full px-3 py-2 text-sm border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-primary-600"
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
        {showReportsTo && (
          <>
            <div className="space-y-1">
              <label className="text-xs font-medium text-gray-500">
                Reports to Manager
              </label>
              <select
                {...register("reportsToManagerId")}
                className="w-full px-3 py-2 text-sm border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-primary-600"
              >
                <option value="">— None —</option>
                {managers.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name}
                    {m.employeeId ? ` (${m.employeeId})` : ""}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-gray-500">
                Reports to Sales Head
              </label>
              <select
                {...register("reportsToSalesHeadId")}
                className="w-full px-3 py-2 text-sm border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-primary-600"
              >
                <option value="">— None —</option>
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
          <div className="col-span-2 space-y-2">
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
                className="absolute right-3 top-9 p-0.5 text-gray-500 hover:text-gray-800 dark:text-gray-300"
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <Eye size={14} /> : <EyeClosed size={14} />}
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                size="sm"
                variant="secondary"
                leftIcon={<RefreshCw size={12} />}
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
                leftIcon={<Copy size={12} />}
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
      title={`Reset password — ${employee.name}`}
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

// ─── Main page ─────────────────────────────────────────────────────────────

export default function EmployeesPage() {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [createOpen, setCreateOpen] = useState(false);
  const [editEmployee, setEditEmployee] = useState<Employee | undefined>();
  const [resetEmployee, setResetEmployee] = useState<Employee | undefined>();

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
  }, [search, statusFilter]);

  const { data: employeesData, isLoading } = useEmployees({
    page,
    pageSize,
    search: search || undefined,
    status: (statusFilter as "active" | "inactive") || undefined,
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
        <div className="relative">
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
            className="pl-8 pr-3 py-1.5 text-sm border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-primary-600 w-56"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-3 py-1.5 text-sm border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-600 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-primary-600"
        >
          <option value="">All statuses</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </select>
      </div>

      <Card noPadding>
        {isLoading ? (
          <div className="flex justify-center py-16">
            <Spinner size={24} />
          </div>
        ) : !employees.length ? (
          <EmptyState title="No employees found" />
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
                        className="text-left px-4 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 whitespace-nowrap"
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
                      <td className="px-4 py-3">
                        <div className="flex gap-1">
                          <button
                            type="button"
                            onClick={() => openEdit(emp)}
                            className="p-1.5 rounded text-gray-400 hover:text-primary-600 hover:bg-primary-50 dark:hover:bg-primary-900/20 transition-colors"
                            title="Edit"
                          >
                            <Edit size={13} />
                          </button>
                          <button
                            type="button"
                            onClick={() => openReset(emp)}
                            className="p-1.5 rounded text-gray-400 hover:text-warning-600 hover:bg-warning-50 dark:hover:bg-warning-900/20 transition-colors"
                            title="Reset password"
                          >
                            <Lock size={13} />
                          </button>
                          <button
                            type="button"
                            onClick={() =>
                              toggleStatus.mutate({
                                id: String(emp.id),
                                status:
                                  emp.status === "active"
                                    ? "inactive"
                                    : "active",
                              })
                            }
                            disabled={toggleStatus.isPending}
                            className="p-1.5 rounded text-gray-400 hover:text-success-600 hover:bg-success-50 dark:hover:bg-success-900/20 transition-colors disabled:opacity-50"
                            title={
                              emp.status === "active"
                                ? "Deactivate"
                                : "Activate"
                            }
                          >
                            <RefreshCw size={13} />
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
    </AppShell>
  );
}
