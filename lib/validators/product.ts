import { z } from "zod";
import { SORT_OPTIONS } from "@/lib/constants";
import {
  CATEGORY_VALUES,
  CONDITION_VALUES,
  LISTING_STATUS_VALUES,
  LISTING_TYPE_VALUES,
} from "@/lib/db/enums";
import {
  multiValue,
  objectIdSchema,
  paginationShape,
} from "@/lib/validators/common";

/**
 * Zod schemas for the `Product` resource.
 *
 * `createProductSchema` is the authoritative rule set: it enforces the
 * cross-field rules (BR-8, BR-9, BR-20) and normalises the payload (price is
 * forced to `0` for `free`/`exchange`, tags are lowercased and deduplicated).
 *
 * Updates deliberately do **not** validate in isolation. The service merges the
 * patch onto the stored document and re-parses the result with
 * `createProductSchema`, so BR-23 (changing `listingType` re-checks the price
 * rules) holds for partial updates too.
 */

const categorySchema = z.enum(CATEGORY_VALUES);
const conditionSchema = z.enum(CONDITION_VALUES);
const listingTypeSchema = z.enum(LISTING_TYPE_VALUES);
const listingStatusSchema = z.enum(LISTING_STATUS_VALUES);
const sortSchema = z.enum(SORT_OPTIONS.map((option) => option.value));

const titleField = z
  .string()
  .trim()
  .min(5, "Titles are at least 5 characters.")
  .max(120, "Titles are at most 120 characters.");

const descriptionField = z
  .string()
  .trim()
  .min(20, "Descriptions are at least 20 characters.")
  .max(4000, "Descriptions are at most 4000 characters.");

/** At most two decimal places — money is never stored as `12.345`. */
function hasAtMostTwoDecimals(value: number): boolean {
  const [, decimals = ""] = value.toString().split(".");
  return decimals.length <= 2;
}

const priceField = z
  .number({ error: "Price must be a number." })
  .min(0, "Price cannot be negative.")
  .max(1_000_000, "Price cannot exceed 1,000,000.")
  .refine(hasAtMostTwoDecimals, "Price can have at most 2 decimal places.");

const imagesField = z
  .array(z.url("Each image must be a valid URL."))
  .max(5, "A product can have at most 5 images.");

const locationField = z
  .string()
  .trim()
  .min(2, "Pickup locations are at least 2 characters.")
  .max(120, "Pickup locations are at most 120 characters.");

const tagsField = z
  .array(z.string().trim().min(1, "Tags cannot be empty.").max(24, "Tags are at most 24 characters."))
  .max(8, "A product can have at most 8 tags.");

const exchangeForField = z
  .string()
  .trim()
  .min(3, "Describe what you want in exchange (at least 3 characters).")
  .max(200, "Exchange descriptions are at most 200 characters.");

/** Lowercases, trims and de-duplicates tags while preserving order. */
export function normalizeTags(tags: string[]): string[] {
  const seen = new Set<string>();
  const normalized: string[] = [];

  for (const tag of tags) {
    const value = tag.trim().toLowerCase();
    if (value.length === 0 || seen.has(value)) continue;
    seen.add(value);
    normalized.push(value);
  }

  return normalized;
}

export const createProductSchema = z
  .object({
    title: titleField,
    description: descriptionField,
    price: priceField,
    listingType: listingTypeSchema,
    category: categorySchema,
    condition: conditionSchema,
    images: imagesField.default([]),
    location: locationField,
    exchangeFor: exchangeForField.optional(),
    tags: tagsField.default([]),
  })
  .superRefine((value, ctx) => {
    // BR-20: a `sale` product must cost something.
    if (value.listingType === "sale" && value.price <= 0) {
      ctx.addIssue({
        code: "custom",
        path: ["price"],
        message:
          "A for-sale product needs a price greater than 0. Use the \"free\" type to give it away.",
      });
    }

    // BR-9: an `exchange` product must say what it wants in return.
    if (value.listingType === "exchange" && !value.exchangeFor) {
      ctx.addIssue({
        code: "custom",
        path: ["exchangeFor"],
        message: "An exchange product must describe what you would like in return.",
      });
    }
  })
  .transform((value) => ({
    ...value,
    // BR-8 / BR-9: `free` and `exchange` are always stored at price 0.
    price: value.listingType === "sale" ? value.price : 0,
    tags: normalizeTags(value.tags),
  }));

export const updateProductSchema = z
  .object({
    title: titleField.optional(),
    description: descriptionField.optional(),
    price: priceField.optional(),
    listingType: listingTypeSchema.optional(),
    category: categorySchema.optional(),
    condition: conditionSchema.optional(),
    images: imagesField.optional(),
    location: locationField.optional(),
    /** `null` clears the field (only valid while the type is not `exchange`). */
    exchangeFor: exchangeForField.nullable().optional(),
    tags: tagsField.optional(),
    /** BR-13: status transitions are validated against the current status. */
    status: listingStatusSchema.optional(),
  })
  .superRefine((value, ctx) => {
    if (Object.keys(value).length === 0) {
      ctx.addIssue({
        code: "custom",
        message: "Provide at least one field to update.",
      });
    }
  });

export const productQuerySchema = z
  .object({
    q: z.string().trim().max(100, "Search terms are at most 100 characters.").optional(),
    category: multiValue(categorySchema),
    condition: multiValue(conditionSchema),
    type: multiValue(listingTypeSchema),
    status: multiValue(listingStatusSchema),
    minPrice: z.coerce.number().min(0, "minPrice cannot be negative.").optional(),
    maxPrice: z.coerce.number().min(0, "maxPrice cannot be negative.").optional(),
    sellerId: objectIdSchema.optional(),
    sort: sortSchema.default("newest"),
    ...paginationShape,
  })
  .superRefine((value, ctx) => {
    if (
      value.minPrice !== undefined &&
      value.maxPrice !== undefined &&
      value.minPrice > value.maxPrice
    ) {
      ctx.addIssue({
        code: "custom",
        path: ["maxPrice"],
        message: "maxPrice must be greater than or equal to minPrice.",
      });
    }
  });

export type CreateProductInput = z.output<typeof createProductSchema>;
export type UpdateProductInput = z.output<typeof updateProductSchema>;
export type ProductQuery = z.output<typeof productQuerySchema>;
