import { z } from "zod";
import { ENQUIRY_STATUS_VALUES } from "@/lib/db/enums";
import {
  multiValue,
  objectIdSchema,
  paginationShape,
} from "@/lib/validators/common";

/**
 * Zod schemas for the `Enquiry` resource.
 *
 * An enquiry is a conversation: it never reserves the product (BR-15).
 */

export const ENQUIRY_ACTIONS = ["accept", "reject", "cancel"] as const;

export const createEnquirySchema = z.object({
  productId: objectIdSchema,
  /** Optional: derived from the acting student; validated when supplied (BR: combinations). */
  buyerId: objectIdSchema.optional(),
  /** Optional: derived from the product; validated when supplied. */
  sellerId: objectIdSchema.optional(),
  message: z
    .string()
    .trim()
    .min(5, "Messages are at least 5 characters.")
    .max(1000, "Messages are at most 1000 characters."),
  /** Optional price the buyer floats; must be > 0 and below the asking price. */
  offerPrice: z
    .number({ error: "Offered price must be a number." })
    .gt(0, "An offered price must be greater than 0.")
    .max(1_000_000, "An offered price cannot exceed 1,000,000.")
    .optional(),
});

export const respondEnquirySchema = z.object({
  action: z.enum(ENQUIRY_ACTIONS),
  /** Optional reply stored on `sellerResponse` for accept/reject. */
  response: z.string().trim().max(500, "Responses are at most 500 characters.").optional(),
});

export const enquiryQuerySchema = z.object({
  role: z.enum(["seller", "buyer", "all"]).default("all"),
  status: multiValue(z.enum(ENQUIRY_STATUS_VALUES)),
  productId: objectIdSchema.optional(),
  ...paginationShape,
});

export type CreateEnquiryInput = z.output<typeof createEnquirySchema>;
export type RespondEnquiryInput = z.output<typeof respondEnquirySchema>;
export type EnquiryQuery = z.output<typeof enquiryQuerySchema>;
export type EnquiryAction = (typeof ENQUIRY_ACTIONS)[number];
