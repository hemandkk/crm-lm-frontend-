import { api } from "@/lib/api";
import { normalizePaginatedResponse } from "@/lib/pagination";
import { toMoneyNumber } from "@/lib/utils";
import type {
  PaginatedResponse,
  PaymentRequest,
  PaymentRequestCreate,
  PaymentRequestFilters,
  PaymentRequestFulfill,
  PaymentRequestStatus,
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

function normalizeStatus(raw: unknown): PaymentRequestStatus {
  const value = String(raw ?? "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "_");
  if (value === "payment_done" || value === "paymentdone") return "payment_done";
  if (value === "approved") return "approved";
  return "requested";
}

export function normalizePaymentRequest(rawInput: unknown): PaymentRequest {
  const raw = (rawInput ?? {}) as Raw;
  const approvedById = pickStr(
    raw,
    "approvedById",
    "approved_by_id",
    "approvedBy",
    "approved_by",
    "paidById",
    "paid_by_id",
    "fulfilledBy",
    "fulfilled_by",
  );
  const approvedByName = pickStr(
    raw,
    "approvedByName",
    "approved_by_name",
    "paidByName",
    "paid_by_name",
    "fulfilledByName",
    "fulfilled_by_name",
  );
  const paidById = pickStr(
    raw,
    "paidById",
    "paid_by_id",
    "approvedById",
    "approved_by_id",
  );
  const paidByName = pickStr(
    raw,
    "paidByName",
    "paid_by_name",
    "approvedByName",
    "approved_by_name",
  );

  return {
    id: String(pick(raw, "id") ?? ""),
    requestId: String(
      pick(raw, "requestId", "request_id", "code") ?? pick(raw, "id") ?? "",
    ),
    description: String(pick(raw, "description") ?? ""),
    paidToDetails: String(
      pick(raw, "paidToDetails", "paid_to_details") ?? "",
    ),
    amount: toMoneyNumber(pick(raw, "amount")),
    installmentNumber: String(
      pick(raw, "installmentNumber", "installment_number") ?? "",
    ),
    status: normalizeStatus(pick(raw, "status")),
    transactionId: pickStr(raw, "transactionId", "transaction_id"),
    paymentDate: (() => {
      const d = pick(raw, "paymentDate", "payment_date");
      return d ? String(d).slice(0, 10) : null;
    })(),
    receiptUrl: pickStr(raw, "receiptUrl", "receipt_url"),
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
    approvedById,
    approvedByName,
    paidById: paidById ?? approvedById,
    paidByName: paidByName ?? approvedByName,
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
    expenseId: pickStr(raw, "expenseId", "expense_id"),
    createdAt: String(pick(raw, "createdAt", "created_at") ?? ""),
    updatedAt: String(pick(raw, "updatedAt", "updated_at") ?? ""),
  };
}

export const paymentRequestService = {
  list: async (
    filters: PaymentRequestFilters = {},
  ): Promise<PaginatedResponse<PaymentRequest>> => {
    const params: Record<string, unknown> = { ...filters };
    if (!params.status) delete params.status;
    const res = await api.get("/payment-requests", { params });
    return normalizePaginatedResponse(res.data, normalizePaymentRequest);
  },

  get: async (id: string): Promise<PaymentRequest> => {
    const res = await api.get(`/payment-requests/${id}`);
    return normalizePaymentRequest(res.data);
  },

  create: async (data: PaymentRequestCreate): Promise<PaymentRequest> => {
    const res = await api.post("/payment-requests", {
      description: data.description,
      paidToDetails: data.paidToDetails,
      amount: toMoneyNumber(data.amount),
      installmentNumber: data.installmentNumber ?? "",
    });
    return normalizePaymentRequest(res.data);
  },

  fulfill: async (
    id: string,
    data: PaymentRequestFulfill,
  ): Promise<PaymentRequest> => {
    const formData = new FormData();
    formData.append("transactionId", data.transactionId);
    formData.append("paymentDate", data.paymentDate);
    if (data.receipt instanceof File) formData.append("receipt", data.receipt);
    const res = await api.post(`/payment-requests/${id}/fulfill`, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return normalizePaymentRequest(res.data);
  },

  verify: async (id: string): Promise<PaymentRequest> => {
    const res = await api.post(`/payment-requests/${id}/verify`);
    return normalizePaymentRequest(res.data);
  },
};
