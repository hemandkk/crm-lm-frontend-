import { api } from "@/lib/api";
import { normalizePaginatedResponse } from "@/lib/pagination";
import {
  normalizeAdmissionStage,
  normalizePaymentType,
  normalizePaymentVerification,
  normalizeStage,
  toMoneyNumber,
} from "@/lib/utils";
import type {
  Prospect,
  ProspectCreate,
  ProspectUpdate,
  ProspectFilters,
  ProspectStage,
  AdmissionStage,
  Document,
  DocumentsListResponse,
  TimelineListResponse,
  PaginatedResponse,
  Payment,
  DocType,
} from "@/types";

interface pospectID {
  next_id: string;
}

type Raw = Record<string, unknown>;

function pick<T = unknown>(raw: Raw, ...keys: string[]): T | undefined {
  for (const key of keys) {
    if (raw[key] !== undefined && raw[key] !== null) return raw[key] as T;
  }
  return undefined;
}

function normalizePayment(raw: Raw): Payment {
  const verificationRaw = pick(
    raw,
    "verificationStatus",
    "verification_status",
  );
  return {
    id: String(pick(raw, "id") ?? ""),
    prospectId: String(pick(raw, "prospectId", "prospect_id") ?? ""),
    prospectName: String(pick(raw, "prospectName", "prospect_name") ?? ""),
    amount: Number(pick(raw, "amount") ?? 0),
    paymentType: normalizePaymentType(
      pick(raw, "paymentType", "payment_type") ?? "registration_fee",
    ),
    paymentDate: String(pick(raw, "paymentDate", "payment_date") ?? "").slice(
      0,
      10,
    ),
    receiptUrl:
      (pick<string | null>(raw, "receiptUrl", "receipt_url") as
        | string
        | null) ?? null,
    notes: String(pick(raw, "notes") ?? ""),
    createdBy: String(pick(raw, "createdBy", "created_by") ?? ""),
    createdByName: String(pick(raw, "createdByName", "created_by_name") ?? ""),
    createdAt: String(pick(raw, "createdAt", "created_at") ?? ""),
    verificationStatus: normalizePaymentVerification(
      verificationRaw as string | null | undefined,
    ),
    verifiedAt:
      (pick(raw, "verifiedAt", "verified_at") as string | null) ?? null,
    verifiedByName:
      (pick(raw, "verifiedByName", "verified_by_name") as string | null) ??
      null,
  };
}

function normalizeDocument(raw: Raw): Document {
  return {
    id: Number(pick(raw, "id") ?? 0),
    document_id: String(pick(raw, "document_id", "documentId") ?? ""),
    prospect_id: Number(pick(raw, "prospect_id", "prospectId") ?? 0),
    document_type: (pick(raw, "document_type", "documentType", "docType") ??
      "aadhaar") as DocType,
    original_filename: String(
      pick(raw, "original_filename", "originalFilename", "fileName") ?? "",
    ),
    stored_filename: String(
      pick(raw, "stored_filename", "storedFilename") ?? "",
    ),
    file_url: String(pick(raw, "file_url", "fileUrl") ?? ""),
    mime_type: String(pick(raw, "mime_type", "mimeType") ?? ""),
    file_size: Number(pick(raw, "file_size", "fileSize") ?? 0),
    remarks: (pick(raw, "remarks") as string | null) ?? null,
    verified: Boolean(pick(raw, "verified") ?? false),
    created_at: String(pick(raw, "created_at", "createdAt") ?? ""),
    updated_at: String(pick(raw, "updated_at", "updatedAt") ?? ""),
  };
}

/** Map API prospect (snake_case or camelCase) into the frontend Prospect shape. */
export function normalizeProspect(rawInput: unknown): Prospect {
  const raw = (rawInput ?? {}) as Raw;
  const docsRaw = pick<unknown[]>(raw, "documents") ?? [];
  const paymentsRaw = pick<unknown[]>(raw, "payments") ?? [];

  const deliveryDateRaw = pick(raw, "deliveryDate", "delivery_date");
  const dobRaw = pick(raw, "dob", "date_of_birth");

  return {
    id: String(pick(raw, "id") ?? ""),
    prospectId: String(pick(raw, "prospectId", "prospect_id") ?? ""),
    password: String(
      pick(raw, "password", "portalPassword", "portal_password") ?? "",
    ),
    name: String(pick(raw, "name") ?? ""),
    email: String(pick(raw, "email") ?? ""),
    phone: String(pick(raw, "phone") ?? ""),
    fatherName: String(pick(raw, "fatherName", "father_name") ?? ""),
    motherName: String(pick(raw, "motherName", "mother_name") ?? ""),
    dob: String(dobRaw ?? "").slice(0, 10),
    courseId: String(pick(raw, "courseId", "course_id") ?? ""),
    courseName: String(pick(raw, "courseName", "course_name") ?? ""),
    university: String(pick(raw, "university") ?? ""),
    specialization: String(pick(raw, "specialization") ?? ""),
    address: String(pick(raw, "address") ?? ""),
    deliveryAddress: String(
      pick(raw, "deliveryAddress", "delivery_address") ?? "",
    ),
    deliveryDate: deliveryDateRaw ? String(deliveryDateRaw).slice(0, 10) : null,
    estimatedValue: toMoneyNumber(
      pick(raw, "estimatedValue", "estimated_value") ?? 0,
    ),
    stage: normalizeStage(pick(raw, "stage") as string),
    admissionStage: normalizeAdmissionStage(
      pick(raw, "admissionStage", "admission_stage") as string,
    ),
    notes: String(pick(raw, "notes") ?? ""),
    assignedToId: (() => {
      const v = pick(
        raw,
        "assignedToId",
        "assigned_to_id",
        "assignedTo",
        "assigned_to",
      );
      if (v == null || v === "") return null;
      return String(v);
    })(),
    assignedTo: String(
      pick(
        raw,
        "assignedToId",
        "assigned_to_id",
        "assignedTo",
        "assigned_to",
      ) ?? "",
    ),
    assignedToName: String(
      pick(
        raw,
        "assignedToName",
        "assigned_to_name",
        "assignedEmployeeName",
        "assigned_employee_name",
      ) ?? "",
    ),
    assignedEmployeeName: String(
      pick(
        raw,
        "assignedToName",
        "assigned_to_name",
        "assignedEmployeeName",
        "assigned_employee_name",
      ) ?? "",
    ),
    assignedToCode: String(
      pick(raw, "assignedToCode", "assigned_to_code") ?? "",
    ),
    examAttended: Boolean(pick(raw, "examAttended", "exam_attended") ?? false),
    examCertified: Boolean(
      pick(raw, "examCertified", "exam_certified") ?? false,
    ),
    sheetsSynced: Boolean(pick(raw, "sheetsSynced", "sheets_synced") ?? false),
    totalPaid: Number(pick(raw, "totalPaid", "total_paid") ?? 0),
    paymentPercentage: Number(
      pick(raw, "paymentPercentage", "payment_percentage") ?? 0,
    ),
    paymentStatus: (pick(raw, "paymentStatus", "payment_status") ??
      "none") as Prospect["paymentStatus"],
    paymentsVerified: Boolean(
      pick(raw, "paymentsVerified", "payments_verified") ?? false,
    ),
    documents: Array.isArray(docsRaw)
      ? docsRaw.map((d) => normalizeDocument(d as Raw))
      : [],
    payments: Array.isArray(paymentsRaw)
      ? paymentsRaw.map((p) => normalizePayment(p as Raw))
      : [],
    createdAt: String(pick(raw, "createdAt", "created_at") ?? ""),
    updatedAt: String(pick(raw, "updatedAt", "updated_at") ?? ""),
  };
}

export const prospectService = {
  list: async (
    filters: ProspectFilters = {},
  ): Promise<PaginatedResponse<Prospect>> => {
    const { admissionStages, ...rest } = filters;
    const params: Record<string, unknown> = { ...rest };
    if (admissionStages?.length) {
      params.admissionStages = admissionStages.join(",");
    }
    const res = await api.get("/prospects", { params });
    return normalizePaginatedResponse(res.data, (row) =>
      normalizeProspect(row),
    );
  },

  get: async (id: string): Promise<Prospect> => {
    const res = await api.get(`/prospects/${id}`);
    return normalizeProspect(res.data);
  },

  create: async (data: ProspectCreate | FormData): Promise<Prospect> => {
    if (data instanceof FormData) {
      const res = await api.post("/prospects", data, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      return normalizeProspect(res.data);
    }
    const res = await api.post("/prospects", data);
    return normalizeProspect(res.data);
  },

  update: async (
    id: string,
    data: ProspectUpdate | FormData,
  ): Promise<Prospect> => {
    if (data instanceof FormData) {
      const res = await api.put(`/prospects/${id}`, data, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      return normalizeProspect(res.data);
    }
    const res = await api.put(`/prospects/${id}`, data);
    return normalizeProspect(res.data);
  },

  updateStage: async (id: string, stage: ProspectStage): Promise<Prospect> => {
    const res = await api.patch(`/prospects/${id}/stage`, { stage });
    return normalizeProspect(res.data);
  },

  updateAdmissionStage: async (
    id: string,
    admissionStage: AdmissionStage,
  ): Promise<Prospect> => {
    const res = await api.patch(`/prospects/${id}/admission-stage`, {
      admissionStage,
    });
    return normalizeProspect(res.data);
  },

  /** Admin-only: assign / reassign / unassign (null) */
  assign: async (
    id: string,
    assignedToId: number | string | null,
  ): Promise<Prospect> => {
    const res = await api.patch(`/prospects/${id}/assign`, { assignedToId });
    return normalizeProspect(res.data);
  },

  markExam: async (
    id: string,
    field: "examAttended" | "examCertified",
    value: boolean,
  ): Promise<Prospect> => {
    const res = await api.patch(`/prospects/${id}/exam`, {
      [field]: value,
    });
    return normalizeProspect(res.data);
  },
  markCertifiy: async (
    id: string,
    field: "examAttended" | "examCertified",
    value: boolean,
  ): Promise<Prospect> => {
    const res = await api.patch(`/prospects/${id}/certify`, {
      [field]: value,
    });
    return normalizeProspect(res.data);
  },

  getTimeline: async (id: string): Promise<TimelineListResponse> => {
    const res = await api.get<TimelineListResponse>(
      `/prospects/${id}/timeline`,
    );
    return res.data;
  },

  getDocuments: async (id: string): Promise<DocumentsListResponse> => {
    const res = await api.get<DocumentsListResponse>(
      `/prospects/${id}/documents`,
    );
    return res.data;
  },

  uploadDocument: async (
    id: string,
    documentType: string,
    file: File,
  ): Promise<Document> => {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("document_type", documentType);
    const res = await api.post<Document>(
      `/prospects/${id}/documents`,
      formData,
      {
        headers: { "Content-Type": "multipart/form-data" },
      },
    );
    return res.data;
  },

  deleteDocument: async (documentId: number | string): Promise<void> => {
    await api.delete(`/documents/${documentId}`);
  },

  bulkImport: async (
    file: File,
  ): Promise<{ imported: number; errors: string[] }> => {
    const formData = new FormData();
    formData.append("file", file);
    const res = await api.post<{ imported: number; errors: string[] }>(
      "/prospects/bulk-import",
      formData,
      { headers: { "Content-Type": "multipart/form-data" } },
    );
    return res.data;
  },

  /** Download filtered leads as Excel (no pagination). */
  export: async (filters: ProspectFilters = {}): Promise<void> => {
    const res = await api.get("/prospects/export", {
      params: {
        stage: filters.stage,
        admissionStage: filters.admissionStage,
        search: filters.search,
        courseId: filters.courseId,
        assignedToId: filters.assignedToId ?? filters.assignedTo,
      },
      responseType: "blob",
    });

    const blob = new Blob([res.data as BlobPart], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "admissions_export.xlsx";
    document.body.appendChild(a);
    a.click();
    a.remove();
    window.URL.revokeObjectURL(url);
  },

  getNextProspectId: async (): Promise<pospectID> => {
    const res = await api.get<pospectID>(
      `/prospects/utility/next-prospect-id/`,
    );
    return res.data;
  },

  resetPassword: async (id: string, newPassword: string): Promise<void> => {
    await api.post(`/prospects/${id}/reset-password`, { newPassword });
  },
};
