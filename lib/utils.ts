import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { format, formatDistanceToNow, parseISO } from "date-fns";

// ─── Tailwind class merger ────────────────────────────────────────────────
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// ─── Currency formatter ───────────────────────────────────────────────────
export function formatCurrency(
  amount: number,
  compact = false
): string {
  if (compact && amount >= 100_000) {
    const lakhs = amount / 100_000;
    return `₹${lakhs % 1 === 0 ? lakhs : lakhs.toFixed(1)}L`;
  }
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount);
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
  estimatedValue: number
): "none" | "advance" | "partial" | "full" {
  if (totalPaid === 0) return "none";
  if (totalPaid >= estimatedValue) return "full";
  const pct = (totalPaid / estimatedValue) * 100;
  if (pct < 30) return "advance";
  return "partial";
}

export function getPaymentPercentage(
  totalPaid: number,
  estimatedValue: number
): number {
  if (!estimatedValue) return 0;
  return Math.min(Math.round((totalPaid / estimatedValue) * 100), 100);
}

// ─── Target status ────────────────────────────────────────────────────────
export function getTargetStatus(
  achieved: number,
  target: number
): "excellent" | "met" | "on_track" | "behind" {
  if (!target) return "behind";
  const ratio = achieved / target;
  if (ratio >= 1.2) return "excellent";
  if (ratio >= 1.0) return "met";
  if (ratio >= 0.5) return "on_track";
  return "behind";
}

export const targetStatusConfig = {
  excellent: { label: "Excellent 🏆", color: "text-success-600", bg: "bg-success-50" },
  met: { label: "Target met", color: "text-success-600", bg: "bg-success-50" },
  on_track: { label: "On track", color: "text-warning-600", bg: "bg-warning-50" },
  behind: { label: "Behind target", color: "text-danger-600", bg: "bg-danger-50" },
} as const;

// ─── Stage config ─────────────────────────────────────────────────────────
export const stageConfig = {
  new: { label: "New", color: "text-gray-600", bg: "bg-gray-100" },
  contacted: { label: "Contacted", color: "text-primary-800", bg: "bg-primary-50" },
  negotiation: { label: "Negotiation", color: "text-warning-800", bg: "bg-warning-50" },
  won: { label: "Won", color: "text-success-800", bg: "bg-success-50" },
  lost: { label: "Lost", color: "text-danger-800", bg: "bg-danger-50" },
} as const;

// ─── Payment type config ──────────────────────────────────────────────────
export const paymentTypeConfig = {
  advance: { label: "Advance", color: "text-warning-800", bg: "bg-warning-50" },
  installment: { label: "Installment", color: "text-primary-800", bg: "bg-primary-50" },
  final: { label: "Final", color: "text-success-800", bg: "bg-success-50" },
} as const;

// ─── Generate initials ────────────────────────────────────────────────────
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
  delay: number
): (...args: Parameters<T>) => void {
  let timer: ReturnType<typeof setTimeout>;
  return (...args: Parameters<T>) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), delay);
  };
}
