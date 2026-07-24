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
import { useSalesEmployees } from "@/hooks/useEmployees";
import { useAuthStore } from "@/store/authStore";
import { canDeleteExpenses } from "@/lib/roles";
import {
  formatCurrency,
  formatDate,
  resolveAssetUrl,
  toMoneyNumber,
} from "@/lib/utils";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import type { Expense } from "@/types";

const schema = z.object({
  expenseDate: z.string().min(1, "Date required"),
  description: z.string().min(1, "Description required"),
  amount: z.preprocess(
    (v) => toMoneyNumber(v),
    z.number({ error: "Enter valid amount" }).positive("Must be positive"),
  ),
  paidTo: z.string().min(1, "Paid to is required"),
  transactionId: z.string().optional(),
  installmentNumber: z.string().optional(),
});

type FormValues = z.infer<typeof schema>;

function ExpenseFormModal({
  open,
  onClose,
  expense,
}: {
  open: boolean;
  onClose: () => void;
  expense?: Expense;
}) {
  const isEdit = !!expense;
  const createMutation = useCreateExpense();
  const updateMutation = useUpdateExpense(expense?.id ?? "");
  const [receipt, setReceipt] = useState<File | null>(null);
  const [invoice, setInvoice] = useState<File | null>(null);

  const {
    register,
    control,
    handleSubmit,
    reset,
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
    },
  });

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
      title={isEdit ? "Edit expense" : "Add expense"}
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

  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [expenseType, setExpenseType] = useState("");
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
    employeeId: employeeId || undefined,
    search: search || undefined,
    page,
    pageSize,
  };

  const { data, isLoading } = useExpenses(filters);
  const { employees } = useSalesEmployees({ pageSize: 200, status: "active" });
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
            <option value="office">Office</option>
            <option value="incentive">Incentive</option>
          </select>
          <select
            value={employeeId}
            onChange={(e) => {
              setEmployeeId(e.target.value);
              setPage(1);
            }}
            className="px-3 py-1.5 text-sm border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900"
          >
            <option value="">All employees</option>
            {employees?.map((emp) => (
              <option key={emp.id} value={emp.id}>
                {emp.name}
              </option>
            ))}
          </select>
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
          {(dateFrom || dateTo || expenseType || employeeId || search) && (
            <button
              type="button"
              className="text-xs text-primary-600 hover:underline"
              onClick={() => {
                setDateFrom("");
                setDateTo("");
                setExpenseType("");
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
          Add expense
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
                                exp.expenseType === "incentive"
                                  ? "warning"
                                  : "default"
                              }
                            >
                              {exp.expenseType === "incentive"
                                ? "Incentive"
                                : "Office"}
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
                            <button
                              type="button"
                              onClick={() => openEdit(exp)}
                              className="p-1.5 rounded text-gray-400 hover:text-primary-600 hover:bg-primary-50"
                              title="Edit"
                            >
                              <Pencil size={13} />
                            </button>
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
