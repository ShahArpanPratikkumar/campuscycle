import {
  CATEGORIES,
  CONDITIONS,
  CONTACT_PREFERENCES,
  ENQUIRY_STATUSES,
  LISTING_STATUSES,
  LISTING_TYPES,
  OFFER_STATUSES,
} from "@/lib/constants";
import type {
  Category,
  Condition,
  ContactPreference,
  EnquiryStatus,
  ListingStatus,
  ListingType,
  OfferStatus,
} from "@/lib/types";

/**
 * Plain string-array enums.
 *
 * `lib/constants.ts` stores the enums as `{ value, label }` option lists for the
 * UI. Mongoose and Zod both want flat arrays, so they are derived here — one
 * source of truth, no duplicated literals.
 */

export const CATEGORY_VALUES: Category[] = CATEGORIES.map((c) => c.value);
export const CONDITION_VALUES: Condition[] = CONDITIONS.map((c) => c.value);
export const LISTING_TYPE_VALUES: ListingType[] = LISTING_TYPES.map((t) => t.value);
export const LISTING_STATUS_VALUES: ListingStatus[] = LISTING_STATUSES.map((s) => s.value);
export const CONTACT_PREFERENCE_VALUES: ContactPreference[] = CONTACT_PREFERENCES.map(
  (option) => option.value,
);
export const ENQUIRY_STATUS_VALUES: EnquiryStatus[] = ENQUIRY_STATUSES.map((s) => s.value);
export const OFFER_STATUS_VALUES: OfferStatus[] = OFFER_STATUSES.map((s) => s.value);
