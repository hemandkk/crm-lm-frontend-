"use client";

import React, { forwardRef } from "react";
import { cn } from "@/lib/utils";
import { X, Loader2 } from "lucide-react";

// ─── Badge ────────────────────────────────────────────────────────────────
type BadgeVariant =
  | "default"
  | "success"
  | "danger"
  | "warning"
  | "info"
  | "purple"
  | "gray";

const badgeVariants: Record<BadgeVariant, string> = {
  default: "bg-gray-100 text-gray-700",
  success: "bg-success-50 text-success-800",
  danger: "bg-danger-50 text-danger-800",
  warning: "bg-warning-50 text-warning-800",
  info: "bg-primary-50 text-primary-800",
  purple: "bg-purple-50 text-purple-800",
  gray: "bg-gray-100 text-gray-600",
};

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
}

export function Badge({
  variant = "default",
  className,
  children,
  ...props
}: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center px-2 py-0.5 rounded text-xs font-medium",
        badgeVariants[variant],
        className
      )}
      {...props}
    >
      {children}
    </span>
  );
}

// ─── Button ───────────────────────────────────────────────────────────────
type ButtonVariant = "primary" | "secondary" | "danger" | "ghost";
type ButtonSize = "sm" | "md" | "lg";

const buttonVariants: Record<ButtonVariant, string> = {
  primary:
    "bg-primary-600 text-white border-primary-600 hover:bg-primary-800 hover:border-primary-800",
  secondary:
    "bg-white text-gray-700 border-gray-200 hover:bg-gray-50 dark:bg-gray-800 dark:text-gray-200 dark:border-gray-700 dark:hover:bg-gray-700",
  danger:
    "bg-danger-600 text-white border-danger-600 hover:bg-danger-800",
  ghost:
    "bg-transparent text-gray-600 border-transparent hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800",
};

const buttonSizes: Record<ButtonSize, string> = {
  sm: "px-2.5 py-1.5 text-xs gap-1.5",
  md: "px-3.5 py-2 text-sm gap-2",
  lg: "px-5 py-2.5 text-base gap-2",
};

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = "secondary",
      size = "md",
      isLoading,
      leftIcon,
      rightIcon,
      className,
      disabled,
      children,
      ...props
    },
    ref
  ) => (
    <button
      ref={ref}
      disabled={disabled || isLoading}
      className={cn(
        "inline-flex items-center justify-center font-medium border rounded-md",
        "transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-600",
        "disabled:opacity-60 disabled:pointer-events-none",
        buttonVariants[variant],
        buttonSizes[size],
        className
      )}
      {...props}
    >
      {isLoading ? (
        <Loader2 className="animate-spin" size={14} />
      ) : (
        leftIcon
      )}
      {children}
      {!isLoading && rightIcon}
    </button>
  )
);
Button.displayName = "Button";

// ─── Input ────────────────────────────────────────────────────────────────
interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
  leftElement?: React.ReactNode;
  rightElement?: React.ReactNode;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  (
    { label, error, hint, leftElement, rightElement, className, id, ...props },
    ref
  ) => {
    const inputId = id || label?.toLowerCase().replace(/\s+/g, "-");
    return (
      <div className="flex flex-col gap-1">
        {label && (
          <label
            htmlFor={inputId}
            className="text-sm font-medium text-gray-700 dark:text-gray-300"
          >
            {label}
          </label>
        )}
        <div className="relative flex items-center">
          {leftElement && (
            <div className="absolute left-2.5 text-gray-400">{leftElement}</div>
          )}
          <input
            ref={ref}
            id={inputId}
            className={cn(
              "w-full rounded-md border bg-white dark:bg-gray-900 dark:border-gray-700",
              "px-3 py-2 text-sm text-gray-900 dark:text-gray-100",
              "placeholder:text-gray-400 dark:placeholder:text-gray-500",
              "focus:outline-none focus:ring-2 focus:ring-primary-600 focus:border-primary-600",
              "disabled:bg-gray-50 disabled:text-gray-500 disabled:cursor-not-allowed",
              error
                ? "border-danger-600 focus:ring-danger-600"
                : "border-gray-300",
              leftElement && "pl-8",
              rightElement && "pr-8",
              className
            )}
            {...props}
          />
          {rightElement && (
            <div className="absolute right-2.5 text-gray-400">
              {rightElement}
            </div>
          )}
        </div>
        {error && <p className="text-xs text-danger-600">{error}</p>}
        {hint && !error && (
          <p className="text-xs text-gray-400">{hint}</p>
        )}
      </div>
    );
  }
);
Input.displayName = "Input";

// ─── Select ───────────────────────────────────────────────────────────────
interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  hint?: string;
  options: { value: string; label: string }[];
  placeholder?: string;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  (
    { label, error, hint, options, placeholder, className, id, ...props },
    ref
  ) => {
    const selectId = id || label?.toLowerCase().replace(/\s+/g, "-");
    return (
      <div className="flex flex-col gap-1">
        {label && (
          <label
            htmlFor={selectId}
            className="text-sm font-medium text-gray-700 dark:text-gray-300"
          >
            {label}
          </label>
        )}
        <select
          ref={ref}
          id={selectId}
          className={cn(
            "w-full rounded-md border bg-white dark:bg-gray-900 dark:border-gray-700",
            "px-3 py-2 text-sm text-gray-900 dark:text-gray-100",
            "focus:outline-none focus:ring-2 focus:ring-primary-600 focus:border-primary-600",
            "disabled:bg-gray-50 disabled:cursor-not-allowed",
            error ? "border-danger-600" : "border-gray-300",
            className
          )}
          {...props}
        >
          {placeholder && (
            <option value="" disabled>
              {placeholder}
            </option>
          )}
          {options.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
        {error && <p className="text-xs text-danger-600">{error}</p>}
        {hint && !error && <p className="text-xs text-gray-400">{hint}</p>}
      </div>
    );
  }
);
Select.displayName = "Select";

// ─── Textarea ─────────────────────────────────────────────────────────────
interface TextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ label, error, className, id, ...props }, ref) => {
    const taId = id || label?.toLowerCase().replace(/\s+/g, "-");
    return (
      <div className="flex flex-col gap-1">
        {label && (
          <label
            htmlFor={taId}
            className="text-sm font-medium text-gray-700 dark:text-gray-300"
          >
            {label}
          </label>
        )}
        <textarea
          ref={ref}
          id={taId}
          className={cn(
            "w-full rounded-md border bg-white dark:bg-gray-900 dark:border-gray-700",
            "px-3 py-2 text-sm text-gray-900 dark:text-gray-100",
            "placeholder:text-gray-400 resize-y min-h-[80px]",
            "focus:outline-none focus:ring-2 focus:ring-primary-600",
            error ? "border-danger-600" : "border-gray-300",
            className
          )}
          {...props}
        />
        {error && <p className="text-xs text-danger-600">{error}</p>}
      </div>
    );
  }
);
Textarea.displayName = "Textarea";

// ─── Modal ────────────────────────────────────────────────────────────────
interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  size?: "sm" | "md" | "lg" | "xl";
  footer?: React.ReactNode;
}

const modalSizes = {
  sm: "max-w-sm",
  md: "max-w-lg",
  lg: "max-w-2xl",
  xl: "max-w-4xl",
};

export function Modal({
  open,
  onClose,
  title,
  children,
  size = "md",
  footer,
}: ModalProps) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
      />
      <div
        className={cn(
          "relative w-full bg-white dark:bg-gray-900 rounded-xl shadow-xl",
          "border border-gray-200 dark:border-gray-700",
          modalSizes[size]
        )}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-gray-800">
          <h2 className="text-base font-semibold text-gray-900 dark:text-gray-100">
            {title}
          </h2>
          <button
            onClick={onClose}
            className="p-1 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-800"
          >
            <X size={16} />
          </button>
        </div>
        <div className="px-6 py-5 overflow-y-auto max-h-[70vh]">
          {children}
        </div>
        {footer && (
          <div className="px-6 py-4 border-t border-gray-100 dark:border-gray-800 flex justify-end gap-2">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Card ─────────────────────────────────────────────────────────────────
interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  title?: string;
  action?: React.ReactNode;
  noPadding?: boolean;
}

export function Card({
  title,
  action,
  noPadding,
  className,
  children,
  ...props
}: CardProps) {
  return (
    <div
      className={cn(
        "bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl shadow-sm",
        className
      )}
      {...props}
    >
      {(title || action) && (
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-gray-800">
          {title && (
            <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-200">
              {title}
            </h3>
          )}
          {action && <div>{action}</div>}
        </div>
      )}
      <div className={cn(!noPadding && "p-5")}>{children}</div>
    </div>
  );
}

// ─── Metric Card ──────────────────────────────────────────────────────────
interface MetricCardProps {
  label: string;
  value: string | number;
  sub?: string;
  subVariant?: "success" | "danger" | "muted";
  icon?: React.ReactNode;
  className?: string;
}

const subVariants = {
  success: "text-success-600",
  danger: "text-danger-600",
  muted: "text-gray-400",
};

export function MetricCard({
  label,
  value,
  sub,
  subVariant = "muted",
  icon,
  className,
}: MetricCardProps) {
  return (
    <div
      className={cn(
        "bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700",
        "rounded-xl p-4 shadow-sm",
        className
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
            {label}
          </p>
          <p className="text-2xl font-semibold text-gray-900 dark:text-gray-100">
            {value}
          </p>
          {sub && (
            <p className={cn("text-xs mt-1", subVariants[subVariant])}>
              {sub}
            </p>
          )}
        </div>
        {icon && (
          <div className="p-2 rounded-lg bg-primary-50 dark:bg-primary-900/20 text-primary-600">
            {icon}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Spinner ──────────────────────────────────────────────────────────────
export function Spinner({
  size = 20,
  className,
}: {
  size?: number;
  className?: string;
}) {
  return (
    <Loader2
      size={size}
      className={cn("animate-spin text-primary-600", className)}
    />
  );
}

// ─── Empty state ──────────────────────────────────────────────────────────
export function EmptyState({
  icon,
  title,
  description,
  action,
}: {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center gap-3">
      {icon && (
        <div className="p-3 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-400">
          {icon}
        </div>
      )}
      <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
        {title}
      </p>
      {description && (
        <p className="text-xs text-gray-400 max-w-xs">{description}</p>
      )}
      {action}
    </div>
  );
}

// ─── Pagination ───────────────────────────────────────────────────────────
interface PaginationProps {
  page: number;
  totalPages: number;
  total: number;
  pageSize: number;
  onPageChange: (page: number) => void;
}

export function Pagination({
  page,
  totalPages,
  total,
  pageSize,
  onPageChange,
}: PaginationProps) {
  const start = (page - 1) * pageSize + 1;
  const end = Math.min(page * pageSize, total);

  return (
    <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100 dark:border-gray-800">
      <p className="text-xs text-gray-500">
        Showing {start}–{end} of {total}
      </p>
      <div className="flex gap-1">
        <Button
          size="sm"
          variant="ghost"
          disabled={page <= 1}
          onClick={() => onPageChange(page - 1)}
        >
          ‹ Prev
        </Button>
        {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
          const p = i + 1;
          return (
            <Button
              key={p}
              size="sm"
              variant={p === page ? "primary" : "ghost"}
              onClick={() => onPageChange(p)}
            >
              {p}
            </Button>
          );
        })}
        <Button
          size="sm"
          variant="ghost"
          disabled={page >= totalPages}
          onClick={() => onPageChange(page + 1)}
        >
          Next ›
        </Button>
      </div>
    </div>
  );
}

// ─── Progress Bar ─────────────────────────────────────────────────────────
export function ProgressBar({
  value,
  max = 100,
  color = "primary",
  className,
}: {
  value: number;
  max?: number;
  color?: "primary" | "success" | "danger" | "warning";
  className?: string;
}) {
  const pct = Math.min(Math.round((value / max) * 100), 100);
  const colorMap = {
    primary: "bg-primary-600",
    success: "bg-success-600",
    danger: "bg-danger-600",
    warning: "bg-warning-600",
  };
  return (
    <div
      className={cn(
        "w-full h-2 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden",
        className
      )}
    >
      <div
        className={cn("h-full rounded-full transition-all", colorMap[color])}
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}
