import { z } from "zod";
import { OFFER_STATUS_VALUES } from "@/lib/db/enums";
import {
  multiValue,
  objectIdSchema,
  paginationShape,
} from "@/lib/validators/common";

/**
 * Zod schemas for the `Offer` resource.
 *
 * An offer is a commitment: accepting one reserves the product and rejects the
 * other pending offers on it (BR-14). Offers are only valid on `sale` products
 * (BR-7) and must undercut the asking price (BR-21) — both checked in the
 * service, where the product is loaded.
 */

export const OFFER_ACTIONS = ["accept", "reject", "withdraw", "counter"] as const;

export const createOfferSchema = z.object({
  productId: objectIdSchema,
  /** Optional: derived from the acting student; validated when supplied. */
  buyerId: objectIdSchema.optional(),
  /** Optional: derived from the product; validated when supplied. */
  sellerId: objectIdSchema.optional(),
  offerPrice: z
    .number({ error: "Offer price must be a number." })
    .gt(0, "An offer must be greater than 0.")
    .max(1_000_000, "An offer cannot exceed 1,000,000."),
  message: z.string().trim().max(500, "Messages are at most 500 characters.").optional(),
  /** Optional link to the enquiry this offer grew out of. */
  enquiryId: objectIdSchema.optional(),
});

export const respondOfferSchema = z.object({
  action: z.enum(OFFER_ACTIONS),
  /** Required when `action === "counter"`; the seller's counter price. */
  counterPrice: z
    .number({ error: "Counter price must be a number." })
    .gt(0, "A counter offer must be greater than 0.")
    .max(1_000_000, "A counter offer cannot exceed 1,000,000.")
    .optional(),
  /** Optional note stored on `responseNote`. */
  note: z.string().trim().max(500, "Notes are at most 500 characters.").optional(),
});

export const offerQuerySchema = z.object({
  role: z.enum(["seller", "buyer", "all"]).default("all"),
  status: multiValue(z.enum(OFFER_STATUS_VALUES)),
  productId: objectIdSchema.optional(),
  ...paginationShape,
});

export type CreateOfferInput = z.output<typeof createOfferSchema>;
export type RespondOfferInput = z.output<typeof respondOfferSchema>;
export type OfferQuery = z.output<typeof offerQuerySchema>;
export type OfferAction = (typeof OFFER_ACTIONS)[number];
