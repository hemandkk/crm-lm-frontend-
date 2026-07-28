"use client";

import { useState } from "react";
import { Plus, CheckCircle2, Upload, Eye, Search } from "lucide-react";
import {
  Badge,
  Button,
  Card,
  EmptyState,
  Input,
  Modal,
  Pagination,
  Select,
  Spinner,
  Textarea,
} from "@/components/ui";
import DatePicker from "@/components/ui/DatePicker";
import {
  useCreatePaymentRequest,
  useFulfillPaymentRequest,
  usePaymentRequests,
  useVerifyPaymentRequest,
} from "@/hooks/usePaymentRequests";
import { useEmployees } from "@/hooks/useEmployees";
import { useAuthStore } from "@/store/authStore";
import {
  canFulfillPaymentRequests,
  canVerifyPaymentRequests,
} from "@/lib/roles";
import {
  cn,
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
import type { PaymentRequest, PaymentRequestStatus } from "@/types";
import { EXPENSE_TYPES } from "@/types";
import type { BadgeVariant } from "@/components/ui";

const STATUS_OPTIONS: { value: string; label: string }[] = [
  { value: "", label: "All statuses" },
  { value: "requested", label: "Requested" },
  { value: "payment_done", label: "Payment done" },
  { value: "approved", label: "Approved" },
];

const statusConfig: Record<
  PaymentRequestStatus,
  { label: string; variant: BadgeVariant }
> = {
  requested: { label: "Requested", variant: "warning" },
  payment_done: { label: "Payment done", variant: "info" },
  approved: { label: "Approved", variant: "success" },
};

const createSchema = z
  .object({
    description: z.string().min(1, "Description required"),
    paidToDetails: z.string().min(1, "Account / UPI details required"),
    amount: z.preprocess(
      (v) => toMoneyNumber(v),
      z.number({ error: "Enter valid amount" }).positive("Must be positive"),
    ),
    installmentNumber: z.string().optional(),
    paymentType: z.enum(EXPENSE_TYPES).default("rent"),
    employeeId: z.string().optional(),
  })
  .superRefine((data, ctx) => {
    if (
      expenseTypeRequiresEmployee(data.paymentType) &&
      !data.employeeId?.trim()
    ) {
      ctx.addIssue({
        code: "custom",
        path: ["employeeId"],
        message: "Select an employee",
      });
    }
  });

type CreateFormValues = z.infer<typeof createSchema>;

const fulfillSchema = z.object({
  transactionId: z.string().min(1, "Transaction ID required"),
  paymentDate: z.string().min(1, "Payment date required"),
});

type FulfillFormValues = z.infer<typeof fulfillSchema>;

function CreateRequestModal({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const createMutation = useCreatePaymentRequest();
  const { data: employeesData } = useEmployees({
    pageSize: 500,
    status: "active",
    enabled: open,
  });
  const employees = employeesData?.items ?? employeesData?.data ?? [];
  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors },
  } = useForm<CreateFormValues>({
    resolver: zodResolver(createSchema) as never,
    defaultValues: {
      description: "",
      paidToDetails: "",
      amount: 0,
      installmentNumber: "",
      paymentType: "rent",
      employeeId: "",
    },
  });

  const paymentType = watch("paymentType");
  const needsEmployee = expenseTypeRequiresEmployee(paymentType);

  const handleClose = () => {
    reset();
    onClose();
  };

  const onSubmit = (values: CreateFormValues) => {
    createMutation.mutate(
      {
        description: values.description,
        paidToDetails: values.paidToDetails,
        amount: toMoneyNumber(values.amount),
        installmentNumber: values.installmentNumber || "",
        paymentType: values.paymentType,
        employeeId: needsEmployee ? values.employeeId : undefined,
      },
      { onSuccess: handleClose },
    );
  };

  return (
    <Modal
      open={open}
      onClose={handleClose}
      title="New payment request"
      size="md"
      footer={
        <>
          <Button type="button" variant="secondary" onClick={handleClose}>
            Cancel
          </Button>
          <Button
            type="button"
            variant="primary"
            className="text-white"
            isLoading={createMutation.isPending}
            onClick={handleSubmit(onSubmit)}
          >
            Submit request
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <Textarea
          label="Description *"
          placeholder="What is this payment for?"
          error={errors.description?.message}
          {...register("description")}
        />
        <Textarea
          label="Paid To — Account / UPI Details *"
          placeholder="Bank account, IFSC, UPI ID…"
          error={errors.paidToDetails?.message}
          {...register("paidToDetails")}
        />
        <div className="grid grid-cols-2 gap-4">
          <Input
            label="Amount To Pay (₹) *"
            type="number"
            step={1}
            min={1}
            error={errors.amount?.message}
            {...register("amount", { setValueAs: (v) => toMoneyNumber(v) })}
          />
          <Input
            label="Installment Number"
            placeholder="e.g. 1, 2"
            {...register("installmentNumber")}
          />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Payment Type *
            </label>
            <select
              {...register("paymentType")}
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
      </div>
    </Modal>
  );
}

function FulfillModal({
  open,
  onClose,
  request,
}: {
  open: boolean;
  onClose: () => void;
  request: PaymentRequest | null;
}) {
  const fulfillMutation = useFulfillPaymentRequest();
  const [receipt, setReceipt] = useState<File | null>(null);

  const {
    register,
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FulfillFormValues>({
    resolver: zodResolver(fulfillSchema),
    values: {
      transactionId: "",
      paymentDate: new Date().toISOString().slice(0, 10),
    },
  });

  const handleClose = () => {
    reset();
    setReceipt(null);
    onClose();
  };

  const onSubmit = (values: FulfillFormValues) => {
    if (!request) return;
    fulfillMutation.mutate(
      {
        id: request.id,
        data: {
          transactionId: values.transactionId,
          paymentDate: values.paymentDate,
          receipt: receipt ?? undefined,
        },
      },
      { onSuccess: handleClose },
    );
  };

  return (
    <Modal
      open={open}
      onClose={handleClose}
      title={`Fulfill — ${request?.requestId || "request"}`}
      size="md"
      footer={
        <>
          <Button type="button" variant="secondary" onClick={handleClose}>
            Cancel
          </Button>
          <Button
            type="button"
            variant="primary"
            className="text-white"
            isLoading={fulfillMutation.isPending}
            onClick={handleSubmit(onSubmit)}
          >
            Mark payment done
          </Button>
        </>
      }
    >
      {request && (
        <div className="mb-4 rounded-lg border border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-900/40 p-3 text-xs space-y-1">
          <p>
            <span className="text-gray-500">Amount:</span>{" "}
            <strong>{formatCurrency(request.amount)}</strong>
          </p>
          <p>
            <span className="text-gray-500">Pay to:</span>{" "}
            {request.paidToDetails}
          </p>
          <p className="text-gray-600">{request.description}</p>
        </div>
      )}
      <div className="space-y-4">
        <Input
          label="Transaction ID *"
          placeholder="UTR / reference"
          error={errors.transactionId?.message}
          {...register("transactionId")}
        />
        <Controller
          name="paymentDate"
          control={control}
          render={({ field }) => (
            <DatePicker
              label="Payment Date *"
              allowPast
              allowFuture={false}
              startMonth={new Date(2020, 0)}
              endMonth={new Date()}
              value={field.value ? new Date(field.value) : undefined}
              onChange={(date) =>
                field.onChange(date ? date.toISOString().split("T")[0] : "")
              }
              error={errors.paymentDate?.message}
            />
          )}
        />
        <div>
          <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Receipt
          </p>
          <Input
            type="file"
            accept=".pdf,.jpg,.jpeg,.png"
            onChange={(e) => setReceipt(e.target.files?.[0] ?? null)}
          />
          {receipt && (
            <p className="text-xs text-success-600 mt-1">{receipt.name}</p>
          )}
        </div>
      </div>
    </Modal>
  );
}

export default function PaymentRequestsPage() {
  const role = useAuthStore((s) => s.role);
  const canFulfill = canFulfillPaymentRequests(role);
  const canVerify = canVerifyPaymentRequests(role);
  const isAccountant = role === "accountant";

  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [status, setStatus] = useState<PaymentRequestStatus | "">("");
  const [paymentType, setPaymentType] = useState<string>("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");

  const [createOpen, setCreateOpen] = useState(false);
  const [fulfilling, setFulfilling] = useState<PaymentRequest | null>(null);

  const filters = {
    status: status || undefined,
    paymentType: paymentType || undefined,
    dateFrom: dateFrom || undefined,
    dateTo: dateTo || undefined,
    search: search || undefined,
    page,
    pageSize,
  };

  const { data, isLoading } = usePaymentRequests(filters);
  const verifyMutation = useVerifyPaymentRequest();
  const requests = data?.items ?? data?.data ?? [];

  return (
    <>
      <div className="flex flex-col gap-3 mb-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex flex-wrap gap-2 items-center">
            <Select
              options={STATUS_OPTIONS}
              value={status}
              onChange={(e) => {
                setStatus(e.target.value as PaymentRequestStatus | "");
                setPage(1);
              }}
              className="w-40 text-sm"
            />
            <select
              value={paymentType}
              onChange={(e) => {
                setPaymentType(e.target.value);
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
            {(status || paymentType || dateFrom || dateTo || search) && (
              <button
                type="button"
                className="text-xs text-primary-600 hover:underline"
                onClick={() => {
                  setStatus("");
                  setPaymentType("");
                  setDateFrom("");
                  setDateTo("");
                  setSearch("");
                  setSearchInput("");
                  setPage(1);
                }}
              >
                Clear
              </button>
            )}
          </div>

          {isAccountant && (
            <Button
              type="button"
              variant="primary"
              className="text-white"
              leftIcon={<Plus size={14} />}
              onClick={() => setCreateOpen(true)}
            >
              New request
            </Button>
          )}
        </div>

        <div className="flex flex-wrap gap-2 text-[11px] text-gray-500">
          <span className="font-medium text-gray-600 dark:text-gray-400">
            Workflow:
          </span>
          <span>Requested</span>
          <span>→</span>
          <span>Admin pays (payment done)</span>
          <span>→</span>
          <span>Accountant verifies → Expense</span>
        </div>
      </div>

      <Card noPadding>
        {isLoading ? (
          <div className="flex justify-center py-16">
            <Spinner size={24} />
          </div>
        ) : !requests.length ? (
          <EmptyState
            title="No payment requests"
            description={
              isAccountant
                ? "Create a request when you need admin to make a payment."
                : "No requests match your filters."
            }
          />
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50">
                    {[
                      "ID",
                      "Status",
                      "Type",
                      "Description",
                      "Pay to",
                      "Employee",
                      "Amount",
                      "Installment",
                      "Payment details",
                      "Actors",
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
                  {requests.map((req) => {
                    const cfg =
                      statusConfig[req.status] ?? statusConfig.requested;
                    const receiptHref = resolveAssetUrl(req.receiptUrl);
                    return (
                      <tr
                        key={req.id}
                        className="hover:bg-gray-50 dark:hover:bg-gray-800/40"
                      >
                        <td className="px-4 py-3 text-xs font-mono">
                          {req.requestId || req.id}
                          <p className="text-[10px] text-gray-400 mt-0.5">
                            {formatDate(req.createdAt)}
                          </p>
                        </td>
                        <td className="px-4 py-3">
                          <Badge variant={cfg.variant}>{cfg.label}</Badge>
                        </td>
                        <td className="px-4 py-3 text-xs">
                          <Badge
                            variant={
                              expenseTypeRequiresEmployee(req.paymentType)
                                ? "warning"
                                : "default"
                            }
                          >
                            {expenseTypeLabel(req.paymentType)}
                          </Badge>
                        </td>
                        <td className="px-4 py-3 text-xs max-w-[180px]">
                          <p className="truncate font-medium text-gray-900 dark:text-gray-100">
                            {req.description}
                          </p>
                        </td>
                        <td className="px-4 py-3 text-xs text-gray-600 max-w-[160px]">
                          <p className="whitespace-pre-wrap line-clamp-3">
                            {req.paidToDetails}
                          </p>
                        </td>
                        <td className="px-4 py-3 text-xs text-gray-600">
                          {req.employeeName || "—"}
                        </td>
                        <td className="px-4 py-3 text-xs font-semibold whitespace-nowrap">
                          {formatCurrency(req.amount)}
                        </td>
                        <td className="px-4 py-3 text-xs">
                          {req.installmentNumber || "—"}
                        </td>
                        <td className="px-4 py-3 text-xs text-gray-500">
                          {req.status === "requested" ? (
                            <span className="text-gray-300">—</span>
                          ) : (
                            <div className="space-y-0.5">
                              <p className="font-mono truncate max-w-[140px]">
                                {req.transactionId || "—"}
                              </p>
                              <p>
                                {req.paymentDate
                                  ? formatDate(req.paymentDate)
                                  : "—"}
                              </p>
                              {receiptHref && (
                                <a
                                  href={receiptHref}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="inline-flex items-center gap-1 text-primary-600 hover:underline"
                                >
                                  <Eye size={12} /> Receipt
                                </a>
                              )}
                            </div>
                          )}
                        </td>
                        <td className="px-4 py-3 text-[10px] text-gray-500 space-y-0.5 max-w-[160px]">
                          {req.requestedByName ||
                          req.approvedByName ||
                          req.paidByName ||
                          req.verifiedByName ? (
                            <>
                              {req.requestedByName && (
                                <p>
                                  <span className="text-gray-400">
                                    Requested:
                                  </span>{" "}
                                  {req.requestedByName}
                                </p>
                              )}
                              {(req.approvedByName || req.paidByName) && (
                                <p>
                                  <span className="text-gray-400">Paid:</span>{" "}
                                  {req.approvedByName || req.paidByName}
                                </p>
                              )}
                              {req.verifiedByName && (
                                <p>
                                  <span className="text-gray-400">
                                    Verified:
                                  </span>{" "}
                                  {req.verifiedByName}
                                </p>
                              )}
                            </>
                          ) : (
                            <span className="text-gray-300">—</span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex flex-col gap-1.5 items-start">
                            {canFulfill && req.status === "requested" && (
                              <Button
                                type="button"
                                size="sm"
                                variant="secondary"
                                leftIcon={<Upload size={12} />}
                                onClick={() => setFulfilling(req)}
                              >
                                Fulfill
                              </Button>
                            )}
                            {canVerify && req.status === "payment_done" && (
                              <Button
                                type="button"
                                size="sm"
                                variant="primary"
                                className={cn("text-white")}
                                leftIcon={<CheckCircle2 size={12} />}
                                isLoading={verifyMutation.isPending}
                                onClick={() => verifyMutation.mutate(req.id)}
                              >
                                Verify payment
                              </Button>
                            )}
                            {req.status === "approved" && (
                              <span className="text-[10px] text-success-600">
                                Added to expenses
                              </span>
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
                total={data?.total ?? requests.length}
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

      <CreateRequestModal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
      />
      <FulfillModal
        open={!!fulfilling}
        onClose={() => setFulfilling(null)}
        request={fulfilling}
      />
    </>
  );
}
