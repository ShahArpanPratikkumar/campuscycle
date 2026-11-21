/**
 * Pure marketplace query logic — the URL ⇄ filter-object translation shared by
 * the browse page, the API route and the client filter controls.
 *
 * The actual filtering happens in MongoDB (`listProducts` in
 * `lib/services/product.service.ts`); this module only *validates and
 * normalises* the query so the database never sees a malformed filter, and
 * turns filters back into a query string for `router.push`.
 *
 * There is no in-memory filtering in Step 4: the browser only ever receives the
 * current page of already-filtered results. `collectFilterIssues` reports any
 * value that had to be dropped, so the UI can explain itself instead of
 * silently ignoring a hand-edited URL.
 */

import { CATEGORIES, CONDITIONS, LISTING_TYPES, MARKETPLACE_LIMITS } from "@/lib/constants";
import type { ProductQuery } from "@/lib/validators/product";
import type {
  Category,
  Condition,
  ListingType,
  MarketplaceFilters,
  SortOption,
} from "@/lib/types";

export type RawSearchParams = Record<string, string | string[] | undefined>;

/* -------------------------------------------------------------------------- */
/*  Query-string <-> filter object                                             */
/* -------------------------------------------------------------------------- */

function toArray(value: string | string[] | undefined): string[] {
  if (value === undefined) return [];
  return Array.isArray(value) ? value : [value];
}

function isOneOf<T extends string>(value: string, allowed: readonly T[]): value is T {
  return (allowed as readonly string[]).includes(value);
}

const CATEGORY_VALUES = CATEGORIES.map((c) => c.value);
const CONDITION_VALUES = CONDITIONS.map((c) => c.value);
const TYPE_VALUES = LISTING_TYPES.map((t) => t.value);
const SORT_VALUES: SortOption[] = ["newest", "price_asc", "price_desc", "popular"];

export const DEFAULT_FILTERS: MarketplaceFilters = {
  q: "",
  categories: [],
  conditions: [],
  types: [],
  minPrice: undefined,
  maxPrice: undefined,
  sort: "newest",
  page: 1,
  limit: MARKETPLACE_LIMITS.defaultPageSize,
};

function parsePrice(value: string | undefined): number | undefined {
  if (value === undefined || value.trim() === "") return undefined;
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed < 0) return undefined;
  return Math.min(Math.round(parsed), MARKETPLACE_LIMITS.maxPrice);
}

function parsePositiveInt(value: string | undefined, fallback: number, max?: number) {
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed < 1) return fallback;
  return max ? Math.min(parsed, max) : parsed;
}

/**
 * Turns raw `searchParams` into a validated filter object.
 *
 * Invalid values are ignored rather than thrown, so a hand-edited URL can never
 * crash the page. This is the same defensive posture the API route will take.
 */
export function parseMarketplaceFilters(raw: RawSearchParams): MarketplaceFilters {
  const categories = Array.from(
    new Set(toArray(raw.category).filter((v) => isOneOf(v, CATEGORY_VALUES))),
  );
  const conditions = Array.from(
    new Set(toArray(raw.condition).filter((v) => isOneOf(v, CONDITION_VALUES))),
  );
  const types = Array.from(
    new Set(toArray(raw.type).filter((v) => isOneOf(v, TYPE_VALUES))),
  );

  let minPrice = parsePrice(toArray(raw.minPrice)[0]);
  let maxPrice = parsePrice(toArray(raw.maxPrice)[0]);
  if (minPrice !== undefined && maxPrice !== undefined && minPrice > maxPrice) {
    [minPrice, maxPrice] = [maxPrice, minPrice];
  }

  const sortRaw = toArray(raw.sort)[0];
  const sort: SortOption =
    sortRaw && isOneOf(sortRaw, SORT_VALUES) ? sortRaw : DEFAULT_FILTERS.sort;

  const qRaw = toArray(raw.q)[0] ?? "";

  return {
    q: qRaw.trim().slice(0, 100),
    categories,
    conditions,
    types,
    minPrice,
    maxPrice,
    sort,
    page: parsePositiveInt(toArray(raw.page)[0], 1),
    limit: parsePositiveInt(
      toArray(raw.limit)[0],
      MARKETPLACE_LIMITS.defaultPageSize,
      48,
    ),
  };
}

/* -------------------------------------------------------------------------- */
/*  Invalid-query reporting                                                    */
/* -------------------------------------------------------------------------- */

export interface FilterIssue {
  /** The query parameter at fault, e.g. `category`. */
  field: string;
  /** The raw value the user supplied. */
  value: string;
  /** A human-readable explanation shown in the "filters ignored" banner. */
  message: string;
}

/**
 * Reports every value in the query string that `parseMarketplaceFilters` had to
 * drop or adjust, so the browse page can tell the student *why* their link
 * behaved differently instead of silently ignoring it.
 *
 * It never throws: an invalid URL still renders a best-effort result page.
 * Values that were silently clamped (e.g. `limit=999` → `48`) are not reported;
 * only genuinely unusable input is.
 */
export function collectFilterIssues(raw: RawSearchParams): FilterIssue[] {
  const issues: FilterIssue[] = [];

  function checkEnum(field: string, allowed: readonly string[], label: string) {
    for (const value of toArray(raw[field])) {
      if (value !== "" && !isOneOf(value, allowed)) {
        issues.push({
          field,
          value,
          message: `“${value}” is not a known ${label}, so it was ignored.`,
        });
      }
    }
  }

  checkEnum("category", CATEGORY_VALUES, "category");
  checkEnum("condition", CONDITION_VALUES, "condition");
  checkEnum("type", TYPE_VALUES, "listing type");

  const sortRaw = toArray(raw.sort)[0];
  if (sortRaw && !isOneOf(sortRaw, SORT_VALUES)) {
    issues.push({
      field: "sort",
      value: sortRaw,
      message: `“${sortRaw}” is not a known sort order, so “newest” was used.`,
    });
  }

  function checkNumber(field: "minPrice" | "maxPrice" | "page" | "limit") {
    const value = toArray(raw[field])[0];
    if (value === undefined || value.trim() === "") return undefined;

    const parsed = Number(value);
    if (!Number.isFinite(parsed) || parsed < 0) {
      const noun = field === "minPrice" || field === "maxPrice" ? "price" : field;
      issues.push({
        field,
        value,
        message: `“${value}” is not a valid ${noun}, so it was ignored.`,
      });
      return undefined;
    }
    return parsed;
  }

  const minPrice = checkNumber("minPrice");
  const maxPrice = checkNumber("maxPrice");
  checkNumber("page");
  checkNumber("limit");

  if (minPrice !== undefined && maxPrice !== undefined && minPrice > maxPrice) {
    issues.push({
      field: "price",
      value: `${minPrice}–${maxPrice}`,
      message: `The minimum price (${minPrice}) was higher than the maximum (${maxPrice}), so they were swapped.`,
    });
  }

  return issues;
}

/** Serialises filters back into a query string for `router.push`. */
export function filtersToSearchParams(
  filters: Partial<MarketplaceFilters>,
): URLSearchParams {
  const params = new URLSearchParams();

  if (filters.q) params.set("q", filters.q);
  filters.categories?.forEach((value) => params.append("category", value));
  filters.conditions?.forEach((value) => params.append("condition", value));
  filters.types?.forEach((value) => params.append("type", value));
  if (filters.minPrice !== undefined) params.set("minPrice", String(filters.minPrice));
  if (filters.maxPrice !== undefined) params.set("maxPrice", String(filters.maxPrice));
  if (filters.sort && filters.sort !== DEFAULT_FILTERS.sort) {
    params.set("sort", filters.sort);
  }
  if (filters.page && filters.page > 1) params.set("page", String(filters.page));
  if (filters.limit && filters.limit !== DEFAULT_FILTERS.limit) {
    params.set("limit", String(filters.limit));
  }

  return params;
}

/** Number of filters the user has actively applied (used for the "Filters (2)" chip). */
export function countActiveFilters(filters: MarketplaceFilters): number {
  return (
    filters.categories.length +
    filters.conditions.length +
    filters.types.length +
    (filters.minPrice !== undefined ? 1 : 0) +
    (filters.maxPrice !== undefined ? 1 : 0) +
    (filters.q ? 1 : 0)
  );
}

/**
 * Adapts the URL-shaped `MarketplaceFilters` into the validated `ProductQuery`
 * the product service (and `GET /api/products`) accepts.
 *
 * The UI keeps plural keys (`categories`) because that is what the filter
 * controls toggle, while the API uses the singular repeatable param names
 * (`category`) it exposes on the wire.
 */
export function filtersToProductQuery(filters: MarketplaceFilters): ProductQuery {
  const q = filters.q.trim();

  return {
    q: q.length > 0 ? q : undefined,
    category: filters.categories.length > 0 ? filters.categories : undefined,
    condition: filters.conditions.length > 0 ? filters.conditions : undefined,
    type: filters.types.length > 0 ? filters.types : undefined,
    minPrice: filters.minPrice,
    maxPrice: filters.maxPrice,
    sort: filters.sort,
    page: filters.page,
    limit: filters.limit,
  };
}

/* -------------------------------------------------------------------------- */
/*  Small helpers shared by the client filter controls                         */
/* -------------------------------------------------------------------------- */

export function toggleValue<T>(list: T[], value: T): T[] {
  return list.includes(value) ? list.filter((item) => item !== value) : [...list, value];
}

export function hasActiveFilters(filters: MarketplaceFilters): boolean {
  return countActiveFilters(filters) > 0;
}

export type { Category, Condition, ListingType };
