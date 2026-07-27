"use client";

import { useState } from "react";
import { Plus, Pencil, Trash2, Eye, Search } from "lucide-react";
import {
  Badge,
  Button,
  Card,
  EmptyState,
  Input,
  Modal,
  Pagination,
  Spinner,
  Textarea,
} from "@/components/ui";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import DatePicker from "@/components/ui/DatePicker";
import {
  useCreateExpense,
  useDeleteExpense,
  useExpenses,
  useUpdateExpense,
} from "@/hooks/useExpenses";
import { useEmployees } from "@/hooks/useEmployees";
import { useStates, useBranches } from "@/hooks";
import OrgScopeFilters from "@/components/filters/OrgScopeFilters";
import { useAuthStore } from "@/store/authStore";
import { canDeleteExpenses, canEditExpenses } from "@/lib/roles";
import {
  expenseTypeLabel,
  expenseTypeRequiresEmployee,
  EXPENSE_TYPE_LABELS,
  formatCurrency,
  formatDate,
  resolveAssetUrl,
  toMoneyNumber,
} from "@/lib/utils";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import type { Expense, ExpenseType } from "@/types";
import { EXPENSE_TYPES } from "@/types";

function buildExpenseSchema(requireState: boolean) {
  return z
    .object({
      expenseDate: z.string().min(1, "Date required"),
      description: z.string().min(1, "Description required"),
      amount: z.preprocess(
        (v) => toMoneyNumber(v),
        z.number({ error: "Enter valid amount" }).positive("Must be positive"),
      ),
      paidTo: z.string().min(1, "Paid to is required"),
      transactionId: z.string().optional(),
      installmentNumber: z.string().optional(),
      expenseType: z.enum(EXPENSE_TYPES).default("rent"),
      employeeId: z.string().optional(),
      stateId: z.string().optional(),
      branchId: z.string().optional(),
    })
    .superRefine((data, ctx) => {
      if (
        expenseTypeRequiresEmployee(data.expenseType) &&
        !data.employeeId?.trim()
      ) {
        ctx.addIssue({
          code: "custom",
          path: ["employeeId"],
          message: "Select an employee",
        });
      }
      if (requireState && !data.stateId?.trim()) {
        ctx.addIssue({
          code: "custom",
          path: ["stateId"],
          message: "State is required",
        });
      }
    });
}

type FormValues = z.infer<ReturnType<typeof buildExpenseSchema>>;

function ExpenseFormModal({
  open,
  onClose,
  expense,
  requireOrgScope,
}: {
  open: boolean;
  onClose: () => void;
  expense?: Expense;
  /** Admin must associate expense to a state (branch optional) */
  requireOrgScope: boolean;
}) {
  const isEdit = !!expense;
  const createMutation = useCreateExpense();
  const updateMutation = useUpdateExpense(expense?.id ?? "");
  const [receipt, setReceipt] = useState<File | null>(null);
  const [invoice, setInvoice] = useState<File | null>(null);
  const { data: employeesData } = useEmployees({
    pageSize: 500,
    status: "active",
    enabled: open,
  });
  const employees = employeesData?.items ?? employeesData?.data ?? [];

  const schema = buildExpenseSchema(requireOrgScope);

  const {
    register,
    control,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema) as never,
    values: {
      expenseDate:
        expense?.expenseDate || new Date().toISOString().slice(0, 10),
      description: expense?.description ?? "",
      amount: expense?.amount ?? 0,
      paidTo: expense?.paidTo ?? "",
      transactionId: expense?.transactionId ?? "",
      installmentNumber: expense?.installmentNumber ?? "",
      expenseType: (expense?.expenseType ?? "rent") as ExpenseType,
      employeeId: expense?.employeeId ?? "",
      stateId: expense?.stateId ? String(expense.stateId) : "",
      branchId: expense?.branchId ? String(expense.branchId) : "",
    },
  });

  const expenseTypeValue = watch("expenseType");
  const watchedStateId = watch("stateId");
  const needsEmployee = expenseTypeRequiresEmployee(expenseTypeValue);

  const { data: states = [] } = useStates(open && requireOrgScope);
  const { data: branches = [] } = useBranches(
    { stateId: watchedStateId || undefined },
    open && requireOrgScope && !!watchedStateId,
  );

  const handleClose = () => {
    reset();
    setReceipt(null);
    setInvoice(null);
    onClose();
  };

  const onSubmit = (values: FormValues) => {
    const payload = {
      expenseDate: values.expenseDate,
      description: values.description,
      amount: toMoneyNumber(values.amount),
      paidTo: values.paidTo,
      transactionId: values.transactionId || "",
      installmentNumber: values.installmentNumber || "",
      expenseType: values.expenseType,
      employeeId: needsEmployee ? values.employeeId : undefined,
      stateId: requireOrgScope ? values.stateId?.trim() || null : undefined,
      branchId: requireOrgScope
        ? values.branchId?.trim() || null
        : undefined,
      receipt: receipt ?? undefined,
      invoice: invoice ?? undefined,
    };

    if (isEdit) {
      updateMutation.mutate(payload, { onSuccess: handleClose });
    } else {
      createMutation.mutate(payload, { onSuccess: handleClose });
    }
  };

  const pending = createMutation.isPending || updateMutation.isPending;

  return (
    <Modal
      open={open}
      onClose={handleClose}
      title={isEdit ? "Edit Expense" : "Add Expense"}
      size="lg"
      footer={
        <>
          <Button type="button" variant="secondary" onClick={handleClose}>
            Cancel
          </Button>
          <Button
            type="button"
            variant="primary"
            className="text-white"
            isLoading={pending}
            onClick={handleSubmit(onSubmit)}
          >
            {isEdit ? "Save changes" : "Record expense"}
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Controller
            name="expenseDate"
            control={control}
            render={({ field }) => (
              <DatePicker
                label="Date *"
                allowPast
                allowFuture={false}
                startMonth={new Date(2020, 0)}
                endMonth={new Date()}
                value={field.value ? new Date(field.value) : undefined}
                onChange={(date) =>
                  field.onChange(date ? date.toISOString().split("T")[0] : "")
                }
                error={errors.expenseDate?.message}
              />
            )}
          />
          <Input
            label="Amount (₹) *"
            type="number"
            step={1}
            min={1}
            error={errors.amount?.message}
            {...register("amount", { setValueAs: (v) => toMoneyNumber(v) })}
          />
        </div>

        <Textarea
          label="Description *"
          placeholder="What was this expense for?"
          error={errors.description?.message}
          {...register("description")}
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            label="Paid to *"
            placeholder="Vendor / person name"
            error={errors.paidTo?.message}
            {...register("paidTo")}
          />
          <Input
            label="Installment number"
            placeholder="e.g. 1, 2, Final"
            {...register("installmentNumber")}
          />
        </div>

        <Input
          label="Transaction ID"
          placeholder="UTR / reference number"
          {...register("transactionId")}
        />

        {requireOrgScope && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                State *
              </label>
              <select
                {...register("stateId", {
                  onChange: () => setValue("branchId", ""),
                })}
                className="px-3 py-2 text-sm border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-primary-600"
              >
                <option value="">Select state</option>
                {states.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                    {s.stateCode ? ` (${s.stateCode})` : ""}
                  </option>
                ))}
              </select>
              {errors.stateId && (
                <p className="text-xs text-danger-600">
                  {errors.stateId.message}
                </p>
              )}
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Branch
              </label>
              <select
                {...register("branchId")}
                disabled={!watchedStateId}
                className="px-3 py-2 text-sm border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-primary-600 disabled:opacity-50"
              >
                <option value="">
                  {watchedStateId
                    ? "All branches in state (optional)"
                    : "Select state first"}
                </option>
                {branches.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name}
                    {b.branchCode ? ` (${b.branchCode})` : ""}
                  </option>
                ))}
              </select>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Expense type *
            </label>
            <select
              {...register("expenseType")}
              className="px-3 py-2 text-sm border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-primary-600"
            >
              {EXPENSE_TYPES.map((t) => (
                <option key={t} value={t}>
                  {EXPENSE_TYPE_LABELS[t]}
                </option>
              ))}
            </select>
          </div>
          {needsEmployee && (
            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Employee *
              </label>
              <select
                {...register("employeeId")}
                className="px-3 py-2 text-sm border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-primary-600"
              >
                <option value="">Select employee</option>
                {employees.map((emp) => (
                  <option key={emp.id} value={emp.id}>
                    {emp.name}
                    {emp.employeeId ? ` (${emp.employeeId})` : ""}
                  </option>
                ))}
              </select>
              {errors.employeeId && (
                <p className="text-xs text-danger-600">
                  {errors.employeeId.message}
                </p>
              )}
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Receipt
            </p>
            {expense?.receiptUrl && !receipt && (
              <a
                href={resolveAssetUrl(expense.receiptUrl)}
                target="_blank"
                rel="noreferrer"
                className="text-xs text-primary-600 hover:underline block mb-1"
              >
                View current receipt
              </a>
            )}
            <Input
              type="file"
              accept=".pdf,.jpg,.jpeg,.png"
              onChange={(e) => setReceipt(e.target.files?.[0] ?? null)}
            />
            {receipt && (
              <p className="text-xs text-success-600 mt-1">{receipt.name}</p>
            )}
          </div>
          <div>
            <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Invoice
            </p>
            {expense?.invoiceUrl && !invoice && (
              <a
                href={resolveAssetUrl(expense.invoiceUrl)}
                target="_blank"
                rel="noreferrer"
                className="text-xs text-primary-600 hover:underline block mb-1"
              >
                View current invoice
              </a>
            )}
            <Input
              type="file"
              accept=".pdf,.jpg,.jpeg,.png"
              onChange={(e) => setInvoice(e.target.files?.[0] ?? null)}
            />
            {invoice && (
              <p className="text-xs text-success-600 mt-1">{invoice.name}</p>
            )}
          </div>
        </div>
      </div>
    </Modal>
  );
}

export default function ExpensesPage() {
  const role = useAuthStore((s) => s.role);
  const canDelete = canDeleteExpenses(role);
  const canEdit = canEditExpenses(role);
  const requireOrgScope = role === "admin";

  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [expenseType, setExpenseType] = useState("");
  const [stateId, setStateId] = useState("");
  const [branchId, setBranchId] = useState("");
  const [employeeId, setEmployeeId] = useState("");
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Expense | undefined>();
  const [deleting, setDeleting] = useState<Expense | null>(null);

  const filters = {
    dateFrom: dateFrom || undefined,
    dateTo: dateTo || undefined,
    expenseType: expenseType || undefined,
    stateId: stateId || undefined,
    branchId: branchId || undefined,
    employeeId: employeeId || undefined,
    search: search || undefined,
    page,
    pageSize,
  };

  const { data, isLoading } = useExpenses(filters);
  const deleteMutation = useDeleteExpense();
  const expenses = data?.items ?? data?.data ?? [];

  const openCreate = () => {
    setEditing(undefined);
    setFormOpen(true);
  };

  const openEdit = (expense: Expense) => {
    setEditing(expense);
    setFormOpen(true);
  };

  return (
    <>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
        <div className="flex flex-wrap gap-2 items-center">
          <input
            type="date"
            value={dateFrom}
            onChange={(e) => {
              setDateFrom(e.target.value);
              setPage(1);
            }}
            className="px-3 py-1.5 text-sm border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900"
          />
          <span className="text-xs text-gray-400">to</span>
          <input
            type="date"
            value={dateTo}
            onChange={(e) => {
              setDateTo(e.target.value);
              setPage(1);
            }}
            className="px-3 py-1.5 text-sm border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900"
          />
          <select
            value={expenseType}
            onChange={(e) => {
              setExpenseType(e.target.value);
              setPage(1);
            }}
            className="px-3 py-1.5 text-sm border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900"
          >
            <option value="">All types</option>
            {EXPENSE_TYPES.map((t) => (
              <option key={t} value={t}>
                {EXPENSE_TYPE_LABELS[t]}
              </option>
            ))}
          </select>
          <OrgScopeFilters
            stateId={stateId}
            branchId={branchId}
            employeeId={employeeId}
            employeeOptionsMode="sales"
            className="gap-2"
            onChange={(next) => {
              setStateId(next.stateId);
              setBranchId(next.branchId);
              setEmployeeId(next.employeeId);
              setPage(1);
            }}
          />
          <div className="relative">
            <Search
              size={14}
              className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400"
            />
            <input
              type="search"
              placeholder="Search…"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  setSearch(searchInput.trim());
                  setPage(1);
                }
              }}
              className="pl-8 pr-3 py-1.5 text-sm border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 w-44"
            />
          </div>
          {(dateFrom ||
            dateTo ||
            expenseType ||
            stateId ||
            branchId ||
            employeeId ||
            search) && (
            <button
              type="button"
              className="text-xs text-primary-600 hover:underline"
              onClick={() => {
                setDateFrom("");
                setDateTo("");
                setExpenseType("");
                setStateId("");
                setBranchId("");
                setEmployeeId("");
                setSearch("");
                setSearchInput("");
                setPage(1);
              }}
            >
              Clear
            </button>
          )}
        </div>
        <Button
          type="button"
          variant="primary"
          className="text-white"
          leftIcon={<Plus size={14} />}
          onClick={openCreate}
        >
          Add Expense
        </Button>
      </div>

      <Card noPadding>
        {isLoading ? (
          <div className="flex justify-center py-16">
            <Spinner size={24} />
          </div>
        ) : !expenses.length ? (
          <EmptyState
            title="No expenses found"
            description="Record expenses or verify a payment request to add one."
          />
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50">
                    {[
                      "ID",
                      "Date",
                      "Type",
                      "Description",
                      "Paid to",
                      "Employee",
                      "Amount",
                      "Txn ID",
                      "Installment",
                      "Actors",
                      "Files",
                      "Actions",
                    ].map((h) => (
                      <th
                        key={h}
                        className="text-left px-4 py-3 text-xs font-semibold text-gray-500"
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50 dark:divide-gray-800">
                  {expenses.map((exp) => {
                    const receiptHref = resolveAssetUrl(exp.receiptUrl);
                    const invoiceHref = resolveAssetUrl(exp.invoiceUrl);
                    return (
                      <tr
                        key={exp.id}
                        className="hover:bg-gray-50 dark:hover:bg-gray-800/40"
                      >
                        <td className="px-4 py-3 text-xs font-mono text-gray-600">
                          {exp.expenseId || exp.id}
                        </td>
                        <td className="px-4 py-3 text-xs whitespace-nowrap">
                          {formatDate(exp.expenseDate)}
                        </td>
                        <td className="px-4 py-3 text-xs">
                          {exp.expenseType ? (
                            <Badge
                              variant={
                                expenseTypeRequiresEmployee(exp.expenseType)
                                  ? "warning"
                                  : "default"
                              }
                            >
                              {expenseTypeLabel(exp.expenseType)}
                            </Badge>
                          ) : (
                            <span className="text-gray-400">—</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-xs max-w-[200px]">
                          <p className="truncate font-medium text-gray-900 dark:text-gray-100">
                            {exp.description}
                          </p>
                          {exp.paymentRequestId && (
                            <Badge variant="info" className="mt-1 text-[10px]">
                              From request
                            </Badge>
                          )}
                        </td>
                        <td className="px-4 py-3 text-xs text-gray-600">
                          {exp.paidTo || "—"}
                        </td>
                        <td className="px-4 py-3 text-xs text-gray-600">
                          {exp.employeeName || "—"}
                        </td>
                        <td className="px-4 py-3 text-xs font-semibold">
                          {formatCurrency(exp.amount)}
                        </td>
                        <td className="px-4 py-3 text-xs font-mono text-gray-500 max-w-[120px] truncate">
                          {exp.transactionId || "—"}
                        </td>
                        <td className="px-4 py-3 text-xs">
                          {exp.installmentNumber || "—"}
                        </td>
                        <td className="px-4 py-3 text-[10px] text-gray-500 space-y-0.5 max-w-[160px]">
                          {exp.requestedByName ||
                          exp.approvedByName ||
                          exp.verifiedByName ||
                          exp.createdByName ? (
                            <>
                              {exp.requestedByName && (
                                <p>
                                  <span className="text-gray-400">Requested:</span>{" "}
                                  {exp.requestedByName}
                                </p>
                              )}
                              {exp.approvedByName && (
                                <p>
                                  <span className="text-gray-400">Paid:</span>{" "}
                                  {exp.approvedByName}
                                </p>
                              )}
                              {exp.verifiedByName && (
                                <p>
                                  <span className="text-gray-400">Verified:</span>{" "}
                                  {exp.verifiedByName}
                                </p>
                              )}
                              {exp.createdByName && (
                                <p>
                                  <span className="text-gray-400">Created:</span>{" "}
                                  {exp.createdByName}
                                </p>
                              )}
                            </>
                          ) : (
                            <span className="text-gray-300">—</span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex gap-1">
                            {receiptHref ? (
                              <a
                                href={receiptHref}
                                target="_blank"
                                rel="noreferrer"
                                className="p-1.5 rounded text-gray-400 hover:text-primary-600"
                                title="Receipt"
                              >
                                <Eye size={13} />
                              </a>
                            ) : null}
                            {invoiceHref ? (
                              <a
                                href={invoiceHref}
                                target="_blank"
                                rel="noreferrer"
                                className="p-1.5 rounded text-gray-400 hover:text-primary-600 text-[10px] underline"
                                title="Invoice"
                              >
                                Inv
                              </a>
                            ) : null}
                            {!receiptHref && !invoiceHref && (
                              <span className="text-xs text-gray-300">—</span>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex gap-1">
                            {canEdit && (
                              <button
                                type="button"
                                onClick={() => openEdit(exp)}
                                className="p-1.5 rounded text-gray-400 hover:text-primary-600 hover:bg-primary-50"
                                title="Edit"
                              >
                                <Pencil size={13} />
                              </button>
                            )}
                            {canDelete && (
                              <button
                                type="button"
                                onClick={() => setDeleting(exp)}
                                className="p-1.5 rounded text-gray-400 hover:text-red-600 hover:bg-red-50"
                                title="Delete"
                              >
                                <Trash2 size={13} />
                              </button>
                            )}
                            {!canEdit && !canDelete && (
                              <span className="text-xs text-gray-300">—</span>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            {(data?.total ?? 0) > 0 && (
              <Pagination
                page={data?.page ?? page}
                totalPages={data?.totalPages ?? 1}
                total={data?.total ?? expenses.length}
                pageSize={data?.pageSize ?? pageSize}
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

      <ExpenseFormModal
        open={formOpen}
        onClose={() => {
          setFormOpen(false);
          setEditing(undefined);
        }}
        expense={editing}
        requireOrgScope={requireOrgScope}
      />

      <ConfirmDialog
        open={!!deleting}
        onOpenChange={(open) => !open && setDeleting(null)}
        title="Delete expense?"
        description={`This will permanently delete ${deleting?.expenseId || "this expense"}.`}
        confirmText="Delete"
        onConfirm={() => {
          if (deleting) deleteMutation.mutate(deleting.id);
        }}
      />
    </>
  );
}
