import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { format, formatDistanceToNow, parseISO } from "date-fns";

// ─── Tailwind class merger ────────────────────────────────────────────────
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// ─── Money helpers ────────────────────────────────────────────────────────
/** Parse money to whole rupees (avoids float noise like 5999.999 → 5999). */
export function toMoneyNumber(value: unknown): number {
  if (value == null || value === "") return 0;
  if (typeof value === "number") {
    return Number.isFinite(value) ? Math.round(value) : 0;
  }
  const cleaned = String(value)
    .trim()
    .replace(/[₹,\s]/g, "");
  const n = Number(cleaned);
  return Number.isFinite(n) ? Math.round(n) : 0;
}

// ─── Currency formatter ───────────────────────────────────────────────────
export function formatCurrency(amount: number, compact = false): string {
  const value = toMoneyNumber(amount);
  if (compact && value >= 100_000) {
    const lakhs = value / 100_000;
    return `₹${lakhs % 1 === 0 ? lakhs : lakhs.toFixed(1)}L`;
  }
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(value);
}
export function formatCurrencySafe(amount: unknown, compact = false): string {
  return formatCurrency(toMoneyNumber(amount), compact);
}
// ─── Date formatters ──────────────────────────────────────────────────────
export function formatDate(dateStr: string | null | undefined): string {
  if (!dateStr) return "—";
  try {
    return format(parseISO(dateStr), "dd MMM yyyy");
  } catch {
    return dateStr;
  }
}

export function formatDateTime(dateStr: string | null | undefined): string {
  if (!dateStr) return "—";
  try {
    return format(parseISO(dateStr), "dd MMM yyyy, hh:mm a");
  } catch {
    return dateStr;
  }
}

export function formatRelative(dateStr: string): string {
  try {
    return formatDistanceToNow(parseISO(dateStr), { addSuffix: true });
  } catch {
    return dateStr;
  }
}

// ─── Payment helpers ──────────────────────────────────────────────────────
export function getPaymentStatus(
  totalPaid: number,
  estimatedValue: number,
): "none" | "advance" | "partial" | "full" {
  if (totalPaid === 0) return "none";
  if (totalPaid >= estimatedValue) return "full";
  const pct = (totalPaid / estimatedValue) * 100;
  if (pct < 30) return "advance";
  return "partial";
}

export function getPaymentPercentage(
  totalPaid: number,
  estimatedValue: number,
): number {
  if (!estimatedValue) return 0;
  return Math.min(Math.round((totalPaid / estimatedValue) * 100), 100);
}

// ─── Target status ────────────────────────────────────────────────────────
export function getTargetStatus(
  achieved: number,
  target: number,
): "excellent" | "met" | "on_track" | "behind" {
  if (!target) return "behind";
  const ratio = achieved / target;
  if (ratio >= 1.2) return "excellent";
  if (ratio >= 1.0) return "met";
  if (ratio >= 0.5) return "on_track";
  return "behind";
}

export const targetStatusConfig = {
  excellent: {
    label: "Excellent 🏆",
    color: "text-success-600",
    bg: "bg-success-50",
  },
  met: { label: "Target met", color: "text-success-600", bg: "bg-success-50" },
  achieved: { label: "Target met", color: "text-success-600", bg: "bg-success-50" },

  on_track: {
    label: "On track",
    color: "text-warning-600",
    bg: "bg-warning-50",
  },
  behind: {
    label: "Behind target",
    color: "text-danger-600",
    bg: "bg-danger-50",
  },
  not_started: { label: "Not started", color: "text-danger-600", bg: "bg-danger-50" },
} as const;

// ─── Stage config ─────────────────────────────────────────────────────────
export const stageConfig = {
  new: { label: "New", color: "text-gray-600", bg: "bg-gray-100" },
  contacted: {
    label: "Contacted",
    color: "text-primary-800",
    bg: "bg-primary-50",
  },
  negotiation: {
    label: "Negotiation",
    color: "text-warning-800",
    bg: "bg-warning-50",
  },
  won: { label: "Won", color: "text-success-800", bg: "bg-success-50" },
  lost: { label: "Lost", color: "text-danger-800", bg: "bg-danger-50" },
} as const;

export type StageConfigKey = keyof typeof stageConfig;

/** Normalize API stage values (e.g. "NEW", "Won") to a known config key. */
export function normalizeStage(
  stage: string | null | undefined,
): StageConfigKey {
  const key = String(stage ?? "new")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "_") as StageConfigKey;
  return key in stageConfig ? key : "new";
}

export function getStageConfig(stage: string | null | undefined) {
  return stageConfig[normalizeStage(stage)];
}

// ─── Admission stage config (separate from CRM stage) ─────────────────────
export const admissionStageConfig = {
  registered: {
    label: "Registered",
    color: "text-gray-700",
    bg: "bg-gray-100",
  },
  fifty_percent_paid: {
    label: "50% Paid",
    color: "text-primary-800",
    bg: "bg-primary-50",
  },
  exam_attended: {
    label: "Exam Attended",
    color: "text-warning-800",
    bg: "bg-warning-50",
  },
  waiting_for_100_percent_payment: {
    label: "Waiting for 100%",
    color: "text-purple-800",
    bg: "bg-purple-50",
  },
  certificate_waiting: {
    label: "Certificate Waiting",
    color: "text-success-800",
    bg: "bg-success-50",
  },
  waiting_result: {
    label: "Waiting Result",
    color: "text-primary-800",
    bg: "bg-primary-50",
  },
  result_announced: {
    label: "Result Announced",
    color: "text-warning-800",
    bg: "bg-warning-50",
  },
  completed: {
    label: "Completed",
    color: "text-success-800",
    bg: "bg-success-50",
  },
  delivered: {
    label: "Delivered",
    color: "text-success-900",
    bg: "bg-success-100",
  },
} as const;

export type AdmissionStageConfigKey = keyof typeof admissionStageConfig;

export function normalizeAdmissionStage(
  stage: string | null | undefined,
): AdmissionStageConfigKey {
  const key = String(stage ?? "registered")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "_") as AdmissionStageConfigKey;
  return key in admissionStageConfig ? key : "registered";
}

export function getAdmissionStageConfig(stage: string | null | undefined) {
  return admissionStageConfig[normalizeAdmissionStage(stage)];
}

/**
 * Stages only admin + processing_team may set.
 * Employees can view options but cannot select them.
 */
export const RESTRICTED_ADMISSION_STAGES = [
  "waiting_result",
  "result_announced",
  "completed",
  "delivered",
] as const satisfies readonly AdmissionStageConfigKey[];

/** @deprecated use RESTRICTED_ADMISSION_STAGES */
export const ADMIN_ONLY_ADMISSION_STAGES = RESTRICTED_ADMISSION_STAGES;

export const ADMISSION_STAGE_OPTIONS: {
  value: AdmissionStageConfigKey;
  label: string;
  /** Restricted to admin + processing_team */
  adminOnly: boolean;
}[] = (Object.keys(admissionStageConfig) as AdmissionStageConfigKey[]).map(
  (value) => ({
    value,
    label: admissionStageConfig[value].label,
    adminOnly: (RESTRICTED_ADMISSION_STAGES as readonly string[]).includes(
      value,
    ),
  }),
);

export function isRestrictedAdmissionStage(
  stage: string | null | undefined,
): boolean {
  return (RESTRICTED_ADMISSION_STAGES as readonly string[]).includes(
    normalizeAdmissionStage(stage),
  );
}

/** @deprecated use isRestrictedAdmissionStage */
export function isAdminOnlyAdmissionStage(
  stage: string | null | undefined,
): boolean {
  return isRestrictedAdmissionStage(stage);
}

export const paymentVerificationConfig = {
  verified: {
    label: "Verified",
    color: "text-success-800",
    bg: "bg-success-50",
  },
  not_verified: {
    label: "Not verified",
    color: "text-warning-800",
    bg: "bg-warning-50",
  },
  not_credited: {
    label: "Not credited",
    color: "text-danger-800",
    bg: "bg-danger-50",
  },
} as const;

export type PaymentVerificationConfigKey =
  keyof typeof paymentVerificationConfig;

export function normalizePaymentVerification(
  status: string | null | undefined,
): PaymentVerificationConfigKey {
  const key = String(status ?? "not_verified")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "_") as PaymentVerificationConfigKey;
  return key in paymentVerificationConfig ? key : "not_verified";
}

// ─── Payment type config ──────────────────────────────────────────────────
export const paymentTypeConfig = {
  advance: { label: "Advance", color: "text-warning-800", bg: "bg-warning-50" },
  installment: {
    label: "Installment",
    color: "text-primary-800",
    bg: "bg-primary-50",
  },
  final: { label: "Final", color: "text-success-800", bg: "bg-success-50" },
} as const;

/**
 * Resolve a lead specialization value (name or legacy code) to a display name.
 * Lead stores free-text name; older rows may still hold a code.
 */
export function resolveSpecializationName(
  value: string | null | undefined,
  specializations?: Array<{
    name?: string | null;
    specializationCode?: string | null;
  }> | null,
): string {
  const raw = String(value ?? "").trim();
  if (!raw) return "";
  if (!specializations?.length) return raw;

  const byName = specializations.find(
    (s) => String(s.name ?? "").trim().toLowerCase() === raw.toLowerCase(),
  );
  if (byName?.name) return String(byName.name);

  const byCode = specializations.find(
    (s) =>
      String(s.specializationCode ?? "")
        .trim()
        .toLowerCase() === raw.toLowerCase(),
  );
  if (byCode?.name) return String(byCode.name);

  return raw;
}

// ─── Generate initials ────────────────────────────────────────────────────
/** Resolve API-relative upload paths like `/uploads/...` to an absolute URL. */
export function resolveAssetUrl(path: string | null | undefined): string {
  if (!path) return "";
  if (/^https?:\/\//i.test(path)) return path;

  // Prefer explicit public app/asset host (mirrors backend APP_BASE_URL)
  const assetBase = (
    process.env.NEXT_PUBLIC_APP_BASE_URL ||
    process.env.NEXT_PUBLIC_ASSET_BASE_URL ||
    ""
  ).replace(/\/$/, "");

  if (assetBase) {
    return `${assetBase}${path.startsWith("/") ? path : `/${path}`}`;
  }

  const apiBase =
    process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";
  // Static files are usually served from host root, not under /api/v1
  const origin = apiBase.replace(/\/api\/v1\/?$/, "");
  return `${origin}${path.startsWith("/") ? path : `/${path}`}`;
}

export function getInitials(name: string): string {
  return name
    .split(" ")
    .slice(0, 2)
    .map((n) => n[0])
    .join("")
    .toUpperCase();
}

// ─── Debounce ─────────────────────────────────────────────────────────────
export function debounce<T extends (...args: unknown[]) => void>(
  fn: T,
  delay: number,
): (...args: Parameters<T>) => void {
  let timer: ReturnType<typeof setTimeout>;
  return (...args: Parameters<T>) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), delay);
  };
}



//─── Password Generator ──────────────────────────────────────────────────────
export const generatePassword = () => {
  const chars =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*";
  let password = "";
  for (let i = 0; i < 10; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return password;
};