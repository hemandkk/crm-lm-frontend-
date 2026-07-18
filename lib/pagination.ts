import type { PaginatedResponse } from "@/types";

/** Normalize list API payloads (camelCase or snake_case) into a stable shape. */
export function normalizePaginatedResponse<T>(
  raw: unknown,
  mapItem?: (item: unknown) => T,
): PaginatedResponse<T> {
  const r = (raw ?? {}) as Record<string, unknown>;
  const rows = (Array.isArray(r.items)
    ? r.items
    : Array.isArray(r.data)
      ? r.data
      : Array.isArray(r.results)
        ? r.results
        : []) as unknown[];

  const items = mapItem ? rows.map(mapItem) : (rows as T[]);
  const page = Math.max(1, Number(r.page ?? 1) || 1);
  const pageSize = Math.max(
    1,
    Number(r.pageSize ?? r.page_size ?? (items.length || 20)) || 20,
  );
  const total = Math.max(0, Number(r.total ?? r.count ?? items.length) || 0);
  const totalPagesRaw = Number(r.totalPages ?? r.total_pages);
  const totalPages =
    Number.isFinite(totalPagesRaw) && totalPagesRaw > 0
      ? totalPagesRaw
      : total === 0
        ? 0
        : Math.max(1, Math.ceil(total / pageSize));

  return {
    data: items,
    items,
    total,
    page,
    pageSize,
    totalPages,
  };
}

/** Page numbers with ellipsis for a sliding window around the current page. */
export function getVisiblePages(
  current: number,
  totalPages: number,
): Array<number | "ellipsis"> {
  if (totalPages <= 0) return [];
  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, i) => i + 1);
  }

  const pages = new Set<number>([1, totalPages, current]);
  for (let p = current - 1; p <= current + 1; p++) {
    if (p >= 1 && p <= totalPages) pages.add(p);
  }
  if (current <= 3) {
    pages.add(2);
    pages.add(3);
    pages.add(4);
  }
  if (current >= totalPages - 2) {
    pages.add(totalPages - 1);
    pages.add(totalPages - 2);
    pages.add(totalPages - 3);
  }

  const sorted = [...pages].sort((a, b) => a - b);
  const result: Array<number | "ellipsis"> = [];
  for (let i = 0; i < sorted.length; i++) {
    const page = sorted[i];
    if (i > 0 && page - sorted[i - 1] > 1) {
      result.push("ellipsis");
    }
    result.push(page);
  }
  return result;
}

export const PAGE_SIZE_OPTIONS = [10, 15, 20, 25, 50] as const;
