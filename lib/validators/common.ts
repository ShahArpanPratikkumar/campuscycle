import { z } from "zod";

/**
 * Validation primitives shared by every resource schema.
 *
 * Zod schemas are the single source of truth for what the API accepts: the
 * route handlers parse with them, and (from Step 3 onward) the same schemas
 * drive client-side form validation.
 */

/** 24 hex characters — the only shape a MongoDB ObjectId ever has. */
export const OBJECT_ID_PATTERN = /^[0-9a-fA-F]{24}$/;

export const objectIdSchema = z
  .string()
  .trim()
  .regex(OBJECT_ID_PATTERN, "Must be a 24-character hexadecimal ObjectId.");

export const pageSchema = z.coerce
  .number()
  .int("Page must be a whole number.")
  .min(1, "Page must be at least 1.")
  .default(1);

export const limitSchema = z.coerce
  .number()
  .int("Limit must be a whole number.")
  .min(1, "Limit must be at least 1.")
  .max(48, "Limit cannot exceed 48.")
  .default(12);

export const paginationShape = {
  page: pageSchema,
  limit: limitSchema,
} as const;

export interface Pagination {
  page: number;
  limit: number;
}

/**
 * A repeatable query parameter.
 *
 * Accepts all three shapes a URL can produce:
 *   `?tag=a`            → ["a"]
 *   `?tag=a&tag=b`      → ["a", "b"]
 *   `?tag=a,b`          → ["a", "b"]
 * and returns `undefined` when the parameter is absent.
 */
export function multiValue<T extends z.ZodTypeAny>(item: T) {
  return z.preprocess((value) => {
    if (value === undefined || value === null || value === "") return undefined;

    const flatten = (input: unknown): unknown[] =>
      Array.isArray(input) ? input : [input];

    const parts = flatten(value).flatMap((entry) =>
      typeof entry === "string" ? entry.split(",") : [entry],
    );

    const cleaned = parts
      .map((entry) => (typeof entry === "string" ? entry.trim() : entry))
      .filter((entry) => entry !== "" && entry !== undefined && entry !== null);

    return cleaned.length > 0 ? cleaned : undefined;
  }, z.array(item).optional());
}
