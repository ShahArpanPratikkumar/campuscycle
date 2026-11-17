import type {
  Category,
  Condition,
  ContactPreference,
  EnquiryStatus,
  ListingStatus,
  ListingType,
  OfferStatus,
  SortOption,
} from "@/lib/types";

/* -------------------------------------------------------------------------- */
/*  App identity                                                               */
/* -------------------------------------------------------------------------- */

export const APP_NAME = "CampusCycle";
export const APP_TAGLINE = "Give it a second life on campus.";
export const APP_DESCRIPTION =
  "A campus-scoped marketplace where students buy, sell, give away and exchange textbooks, electronics, calculators, furniture and more.";

/* -------------------------------------------------------------------------- */
/*  Badge tones (shared by every badge component so colour stays consistent)    */
/* -------------------------------------------------------------------------- */

export type BadgeTone =
  | "neutral"
  | "brand"
  | "success"
  | "warning"
  | "danger"
  | "info";

/* -------------------------------------------------------------------------- */
/*  Option lists                                                               */
/* -------------------------------------------------------------------------- */

export interface Option<T extends string> {
  value: T;
  label: string;
}

export const CATEGORIES: (Option<Category> & { blurb: string })[] = [
  { value: "books", label: "Books & Notes", blurb: "Textbooks, novels, printed notes" },
  { value: "electronics", label: "Electronics", blurb: "Laptops, phones, headphones" },
  { value: "calculators", label: "Calculators", blurb: "Scientific and graphing" },
  { value: "furniture", label: "Furniture", blurb: "Chairs, tables, lamps, shelves" },
  { value: "stationery", label: "Stationery", blurb: "Pens, files, drawing kits" },
  { value: "cycles", label: "Cycles & Transport", blurb: "Bicycles, helmets, scooters" },
  { value: "hostel", label: "Hostel Essentials", blurb: "Mattresses, buckets, kettles" },
  { value: "clothing", label: "Clothing", blurb: "Lab coats, jackets, uniforms" },
  { value: "sports", label: "Sports & Fitness", blurb: "Rackets, gym gear, shoes" },
  { value: "other", label: "Other", blurb: "Anything else useful" },
];

export const CONDITIONS: (Option<Condition> & { hint: string })[] = [
  { value: "new", label: "Brand new", hint: "Unused, sealed or untouched" },
  { value: "like_new", label: "Like new", hint: "Used once or twice" },
  { value: "good", label: "Good", hint: "Works well, minor wear" },
  { value: "fair", label: "Fair", hint: "Visible wear, fully usable" },
  { value: "poor", label: "Well used", hint: "Heavy wear, priced accordingly" },
];

export const LISTING_TYPES: (Option<ListingType> & { description: string })[] = [
  { value: "sale", label: "For Sale", description: "Sell for a price" },
  { value: "free", label: "Free", description: "Give it away at no cost" },
  { value: "exchange", label: "Exchange", description: "Swap for something else" },
];

export const LISTING_STATUSES: (Option<ListingStatus> & { tone: BadgeTone })[] = [
  { value: "available", label: "Available", tone: "success" },
  { value: "reserved", label: "Reserved", tone: "warning" },
  { value: "sold", label: "Sold", tone: "neutral" },
  // The stored status is `deleted` (a soft delete, BR-16); the UI vocabulary is
  // "Inactive" so sellers see a neutral outcome rather than a scary one.
  { value: "deleted", label: "Inactive", tone: "danger" },
];

export const ENQUIRY_STATUSES: (Option<EnquiryStatus> & { tone: BadgeTone })[] = [
  { value: "pending", label: "Pending", tone: "warning" },
  { value: "accepted", label: "Accepted", tone: "success" },
  { value: "rejected", label: "Declined", tone: "danger" },
  { value: "cancelled", label: "Cancelled", tone: "neutral" },
];

export const OFFER_STATUSES: (Option<OfferStatus> & { tone: BadgeTone })[] = [
  { value: "pending", label: "Pending", tone: "warning" },
  { value: "accepted", label: "Accepted", tone: "success" },
  { value: "rejected", label: "Declined", tone: "danger" },
  { value: "withdrawn", label: "Withdrawn", tone: "neutral" },
  { value: "countered", label: "Countered", tone: "info" },
];

export const SORT_OPTIONS: Option<SortOption>[] = [
  { value: "newest", label: "Newest first" },
  { value: "price_asc", label: "Price: low to high" },
  { value: "price_desc", label: "Price: high to low" },
  { value: "popular", label: "Most viewed" },
];

/**
 * How a seller prefers to be contacted about a listing.
 *
 * A preference only — no phone number or address is ever stored or shown. The
 * actual contact still happens through the in-app enquiry flow (BR: contact =
 * enquiry only), so `message` is the safe default.
 */
export const CONTACT_PREFERENCES: (Option<ContactPreference> & {
  description: string;
})[] = [
  {
    value: "message",
    label: "In-app messages",
    description: "Buyers reach you through CampusCycle enquiries.",
  },
  {
    value: "email",
    label: "Email",
    description: "Buyers may email you at your profile address.",
  },
  {
    value: "either",
    label: "Either is fine",
    description: "Enquiries or email — whatever is easiest.",
  },
];

/* -------------------------------------------------------------------------- */
/*  Lookup helpers (O(1) option access for labels + tones)                      */
/* -------------------------------------------------------------------------- */

export function categoryLabel(value: Category): string {
  return CATEGORIES.find((c) => c.value === value)?.label ?? "Other";
}

export function conditionLabel(value: Condition): string {
  return CONDITIONS.find((c) => c.value === value)?.label ?? value;
}

export function listingTypeLabel(value: ListingType): string {
  return LISTING_TYPES.find((t) => t.value === value)?.label ?? value;
}

/** Display label for a seller's contact preference (falls back to in-app). */
export function contactPreferenceLabel(
  value: ContactPreference | undefined,
): string {
  return (
    CONTACT_PREFERENCES.find((option) => option.value === value)?.label ??
    CONTACT_PREFERENCES[0].label
  );
}

export function listingStatusMeta(value: ListingStatus) {
  return (
    LISTING_STATUSES.find((s) => s.value === value) ?? {
      value,
      label: value,
      tone: "neutral" as BadgeTone,
    }
  );
}

export function enquiryStatusMeta(value: EnquiryStatus) {
  return (
    ENQUIRY_STATUSES.find((s) => s.value === value) ?? {
      value,
      label: value,
      tone: "neutral" as BadgeTone,
    }
  );
}

export function offerStatusMeta(value: OfferStatus) {
  return (
    OFFER_STATUSES.find((s) => s.value === value) ?? {
      value,
      label: value,
      tone: "neutral" as BadgeTone,
    }
  );
}

/* -------------------------------------------------------------------------- */
/*  Marketplace limits (kept in sync with the API query validation rules)       */
/* -------------------------------------------------------------------------- */

export const MARKETPLACE_LIMITS = {
  /** Upper bound of the price-range filter. */
  maxPrice: 50000,
  /** Items per page. Mirrors the API `limit` default (1–48). */
  defaultPageSize: 9,
  /** Home page preview size. */
  homePreviewSize: 6,
  /** Max images per listing (BR: 0–5). */
  maxImages: 5,
  /** Similar listings shown on the detail page. */
  similarListings: 3,
} as const;
