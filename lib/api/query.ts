import "server-only";

import type { NextRequest } from "next/server";
import type { ZodType } from "zod";

/**
 * Query-string parsing.
 *
 * Route handlers validate `?searchParams` with the same Zod schemas used for
 * request bodies, so a bad `?limit=999` produces the same `400 VALIDATION_ERROR`
 * envelope as a bad JSON body.
 *
 * The one wrinkle is repeatable params: `?category=books&category=sports`
 * arrives as an array while `?category=books` arrives as a string. This helper
 * normalises both into `{ category: [...] }` before validation (the schemas use
 * `multiValue()` to also accept comma-separated values).
 */

/** The `meta` block every paginated list endpoint returns. */
export interface PageMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface Paginated<T> {
  items: T[];
  meta: PageMeta;
}

export function searchParamsToObject(
  params: URLSearchParams,
): Record<string, string | string[]> {
  const result: Record<string, string | string[]> = {};

  for (const key of new Set(params.keys())) {
    const values = params.getAll(key);
    result[key] = values.length > 1 ? values : values[0];
  }

  return result;
}

/**
 * Parses the request's query string with `schema`.
 *
 * Throws a `ZodError` on failure, which `withErrorHandler` converts into the
 * standard `400 VALIDATION_ERROR` response — handlers never inspect the result.
 */
export function parseQuery<T>(schema: ZodType<T>, request: NextRequest): T {
  const raw = searchParamsToObject(request.nextUrl.searchParams);
  return schema.parse(raw);
}
