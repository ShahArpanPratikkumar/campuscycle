import type { ListingWithSeller } from "@/lib/types";
import {
  createEnquirySchema,
  type CreateEnquiryInput,
} from "@/lib/validators/enquiry";
import { createOfferSchema, type CreateOfferInput } from "@/lib/validators/offer";

/**
 * Enquiry + offer integration point.
 *
 * The dialogs on the listing detail page validate their draft with the very same
 * Zod schemas the server uses (`createEnquirySchema` / `createOfferSchema`) and
 * then POST it through `fetchJson`. Keeping the endpoint names and payload shapes
 * in one module means the detail page and the dialogs never hand-roll a body.
 *
 * `buyerId` and `sellerId` are included so the server can cross-check the
 * buyer/seller/product combination. The server derives them anyway, so a
 * mismatched pair is rejected with `422 RULE_VIOLATION` rather than trusted.
 */

export const CONTACT_ENDPOINTS = {
  enquiries: "/api/enquiries",
  offers: "/api/offers",
} as const;

export type EnquiryDraft = CreateEnquiryInput;
export type OfferDraft = CreateOfferInput;

/** The exact body `POST /api/enquiries` expects. */
export function buildEnquiryDraft(
  listing: ListingWithSeller,
  viewerId: string,
  input: { message: string; offerPrice?: number },
): EnquiryDraft {
  return {
    productId: listing.id,
    buyerId: viewerId,
    sellerId: listing.sellerId,
    message: input.message.trim(),
    ...(input.offerPrice !== undefined ? { offerPrice: input.offerPrice } : {}),
  };
}

/** The exact body `POST /api/offers` expects. */
export function buildOfferDraft(
  listing: ListingWithSeller,
  viewerId: string,
  input: { offerPrice: number; message?: string },
): OfferDraft {
  const message = input.message?.trim();
  return {
    productId: listing.id,
    buyerId: viewerId,
    sellerId: listing.sellerId,
    offerPrice: input.offerPrice,
    ...(message && message.length > 0 ? { message } : {}),
  };
}

/** Parses a money-ish input; `undefined` when blank or not a number. */
export function parseAmount(value: string): number | undefined {
  const trimmed = value.trim();
  if (trimmed === "") return undefined;
  const parsed = Number(trimmed);
  return Number.isFinite(parsed) ? parsed : undefined;
}

/** The schemas the dialogs validate against before submitting. */
export const contactSchemas = {
  enquiry: createEnquirySchema,
  offer: createOfferSchema,
} as const;
