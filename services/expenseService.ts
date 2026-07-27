import { api } from "@/lib/api";
import { normalizePaginatedResponse } from "@/lib/pagination";
import { toMoneyNumber } from "@/lib/utils";
import type {
  Expense,
  ExpenseCreate,
  ExpenseFilters,
  ExpenseUpdate,
  PaginatedResponse,
} from "@/types";

type Raw = Record<string, unknown>;

function pick<T = unknown>(
  raw: Raw,
  ...keys: string[]
): T | undefined {
  for (const key of keys) {
    if (raw[key] !== undefined && raw[key] !== null) return raw[key] as T;
  }
  return undefined;
}

function pickStr(
  raw: Raw,
  ...keys: string[]
): string | null {
  for (const key of keys) {
    const v = raw[key];
    if (v !== undefined && v !== null && String(v).trim() !== "") {
      return String(v);
    }
  }
  return null;
}

export function normalizeExpense(rawInput: unknown): Expense {
  const raw = (rawInput ?? {}) as Raw;
  return {
    id: String(pick(raw, "id") ?? ""),
    expenseId: String(
      pick(raw, "expenseId", "expense_id", "code") ?? pick(raw, "id") ?? "",
    ),
    expenseDate: String(
      pick(raw, "expenseDate", "expense_date") ?? "",
    ).slice(0, 10),
    description: String(pick(raw, "description") ?? ""),
    amount: toMoneyNumber(pick(raw, "amount")),
    paidTo: String(pick(raw, "paidTo", "paid_to") ?? ""),
    transactionId: String(
      pick(raw, "transactionId", "transaction_id") ?? "",
    ),
    installmentNumber: String(
      pick(raw, "installmentNumber", "installment_number") ?? "",
    ),
    receiptUrl: pickStr(raw, "receiptUrl", "receipt_url"),
    invoiceUrl: pickStr(raw, "invoiceUrl", "invoice_url"),
    paymentRequestId: pickStr(
      raw,
      "paymentRequestId",
      "payment_request_id",
    ),
    expenseType: (() => {
      const v = String(pick(raw, "expenseType", "expense_type") ?? "")
        .trim()
        .toLowerCase();
      if (!v) return undefined;
      // Legacy
      if (v === "office") return "rent" as const;
      const known = [
        "salary",
        "incentive",
        "rent",
        "electricity",
        "water",
        "celebration",
        "crm",
        "software",
        "get_lead",
        "bonvoice",
        "sim_recharge",
        "marketing_management",
        "lead_gen_marketing",
        "gadget_purchase",
        "others",
      ] as const;
      return (known as readonly string[]).includes(v)
        ? (v as (typeof known)[number])
        : undefined;
    })(),
    employeeId: pickStr(raw, "employeeId", "employee_id"),
    employeeName: pickStr(raw, "employeeName", "employee_name"),
    createdById: pickStr(
      raw,
      "createdById",
      "created_by_id",
      "createdBy",
      "created_by",
    ),
    createdByName: pickStr(
      raw,
      "createdByName",
      "created_by_name",
    ),
    requestedById: pickStr(
      raw,
      "requestedById",
      "requested_by_id",
      "requestedBy",
      "requested_by",
    ),
    requestedByName: pickStr(
      raw,
      "requestedByName",
      "requested_by_name",
    ),
    approvedById: pickStr(
      raw,
      "approvedById",
      "approved_by_id",
      "approvedBy",
      "approved_by",
      "paidById",
      "paid_by_id",
    ),
    approvedByName: pickStr(
      raw,
      "approvedByName",
      "approved_by_name",
      "paidByName",
      "paid_by_name",
    ),
    verifiedById: pickStr(
      raw,
      "verifiedById",
      "verified_by_id",
      "verifiedBy",
      "verified_by",
    ),
    verifiedByName: pickStr(
      raw,
      "verifiedByName",
      "verified_by_name",
    ),
    createdAt: String(pick(raw, "createdAt", "created_at") ?? ""),
    updatedAt: String(pick(raw, "updatedAt", "updated_at") ?? ""),
  };
}

function appendExpenseForm(
  formData: FormData,
  data: ExpenseCreate | ExpenseUpdate,
) {
  if (data.expenseDate != null) formData.append("expenseDate", data.expenseDate);
  if (data.description != null) formData.append("description", data.description);
  if (data.amount != null) formData.append("amount", String(toMoneyNumber(data.amount)));
  if (data.paidTo != null) formData.append("paidTo", data.paidTo);
  if (data.transactionId != null)
    formData.append("transactionId", data.transactionId);
  if (data.installmentNumber != null)
    formData.append("installmentNumber", data.installmentNumber);
  if (data.expenseType != null) formData.append("expenseType", data.expenseType);
  if (data.employeeId != null) formData.append("employeeId", data.employeeId);
  if (data.receipt instanceof File) formData.append("receipt", data.receipt);
  if (data.invoice instanceof File) formData.append("invoice", data.invoice);
}

export const expenseService = {
  list: async (
    filters: ExpenseFilters = {},
  ): Promise<PaginatedResponse<Expense>> => {
    const res = await api.get("/expenses", { params: filters });
    return normalizePaginatedResponse(res.data, normalizeExpense);
  },

  get: async (id: string): Promise<Expense> => {
    const res = await api.get(`/expenses/${id}`);
    return normalizeExpense(res.data);
  },

  create: async (data: ExpenseCreate): Promise<Expense> => {
    const formData = new FormData();
    appendExpenseForm(formData, data);
    const res = await api.post("/expenses", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return normalizeExpense(res.data);
  },

  update: async (id: string, data: ExpenseUpdate): Promise<Expense> => {
    const formData = new FormData();
    appendExpenseForm(formData, data);
    const res = await api.patch(`/expenses/${id}`, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return normalizeExpense(res.data);
  },

  delete: async (id: string): Promise<void> => {
    await api.delete(`/expenses/${id}`);
  },
};
