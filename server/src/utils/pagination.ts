export interface PaginationParams {
  page: number;
  limit: number;
  skip: number;
}

// `type` (not `interface`) so it's structurally assignable to Record<string, unknown>
// when passed as response `meta`.
export type PaginationMeta = {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
};

/**
 * Normalizes `page`/`limit` query params into safe, bounded pagination values.
 * Defaults: page 1, limit 20. `limit` is clamped to `[1, maxLimit]`.
 */
export function getPagination(
  query: { page?: unknown; limit?: unknown },
  maxLimit = 100,
): PaginationParams {
  const page = Math.max(1, Number.parseInt(String(query.page ?? '1'), 10) || 1);
  const requested = Number.parseInt(String(query.limit ?? '20'), 10) || 20;
  const limit = Math.min(Math.max(1, requested), maxLimit);
  return { page, limit, skip: (page - 1) * limit };
}

/** Builds pagination metadata for inclusion in a list response's `meta`. */
export function buildPaginationMeta(total: number, page: number, limit: number): PaginationMeta {
  const totalPages = Math.max(1, Math.ceil(total / limit));
  return {
    page,
    limit,
    total,
    totalPages,
    hasNext: page < totalPages,
    hasPrev: page > 1,
  };
}
