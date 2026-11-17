/**
 * Domain types for CampusCycle.
 *
 * These mirror the MongoDB document shapes described in `docs/ARCHITECTURE.md`
 * (§9 Collection Design) so that the mock data used in Step 1 can be swapped for
 * real API responses in later steps without touching component props.
 *
 * Convention: the UI always works with `id` (string) rather than `_id`, and with
 * ISO date strings rather than `Date` objects, so that data can be serialised
 * across the server/client boundary without transformation.
 */

/* -------------------------------------------------------------------------- */
/*  Enums (mirrors the Mongoose enums + `lib/constants.ts` option lists)       */
/* -------------------------------------------------------------------------- */

export type Category =
  | "books"
  | "electronics"
  | "calculators"
  | "furniture"
  | "stationery"
  | "cycles"
  | "hostel"
  | "clothing"
  | "sports"
  | "other";

export type Condition = "new" | "like_new" | "good" | "fair" | "poor";

export type ListingType = "sale" | "free" | "exchange";

export type ListingStatus = "available" | "reserved" | "sold" | "deleted";

/**
 * Enquiry lifecycle (Step 6).
 *
 * `pending` → `accepted` (seller) | `rejected` (seller) | `cancelled` (buyer).
 * Every terminal state is final — see the transition table in
 * `lib/services/enquiry.service.ts`.
 */
export type EnquiryStatus = "pending" | "accepted" | "rejected" | "cancelled";

/**
 * Offer lifecycle (Step 6).
 *
 * `pending` → `accepted` | `rejected` | `withdrawn` (buyer) | `countered` (seller)
 * `countered` → `accepted` | `rejected` | `withdrawn` (all by the buyer).
 * A counter is stored on the same row (`counterPrice`) so the whole negotiation
 * is one state machine; see `lib/services/offer.service.ts`.
 */
export type OfferStatus =
  | "pending"
  | "accepted"
  | "rejected"
  | "withdrawn"
  | "countered";

export type SortOption = "newest" | "price_asc" | "price_desc" | "popular";

/**
 * How a seller prefers to be contacted about a listing.
 *
 * This is a *preference*, not contact details: the UI shows the label only and
 * never renders the seller's email address (see `docs/ARCHITECTURE.md` §6.3 —
 * "contact = enquiry only, no direct contact details exposed").
 */
export type ContactPreference = "message" | "email" | "either";

/* -------------------------------------------------------------------------- */
/*  Entities                                                                   */
/* -------------------------------------------------------------------------- */

export interface StudentStats {
  activeListings: number;
  soldCount: number;
}

export interface Student {
  id: string;
  handle: string;
  displayName: string;
  campus: string;
  department?: string;
  year?: number;
  bio?: string;
  avatarUrl?: string;
  /** Optional so Step 1 mock students and legacy callers keep compiling. */
  contactPreference?: ContactPreference;
  joinedAt: string;
  stats: StudentStats;
}

export interface Listing {
  id: string;
  sellerId: string;
  title: string;
  description: string;
  /** Stored as `0` for `free` and `exchange` listings (see BR-8 / BR-9). */
  price: number;
  listingType: ListingType;
  category: Category;
  condition: Condition;
  /** External image URLs. Empty in Step 1 — the UI falls back to a category tile. */
  images: string[];
  location: string;
  /** Required when `listingType === "exchange"` (BR-9). */
  exchangeFor?: string;
  tags: string[];
  status: ListingStatus;
  viewCount: number;
  reservedForId?: string;
  soldToId?: string;
  createdAt: string;
  updatedAt: string;
}

/** A listing joined with its seller — the shape the marketplace grid renders. */
export interface ListingWithSeller extends Listing {
  seller: Student;
}

/* -------------------------------------------------------------------------- */
/*  API response shapes (Step 3)                                               */
/* -------------------------------------------------------------------------- */

/**
 * The compact seller embedded inside product responses.
 *
 * Mirrors `UserSummaryDto` in `lib/db/serialize.ts`. It is re-declared here (and
 * not imported) so client components never pull in a `server-only` module just
 * for a type.
 */
export interface UserSummary {
  id: string;
  handle: string;
  displayName: string;
  campus: string;
  avatarUrl?: string;
  contactPreference?: ContactPreference;
}

/**
 * A product exactly as `GET /api/products` returns it.
 *
 * Structurally a `Listing` plus an optionally-populated `seller`, which is why
 * every listing component can take a plain `Listing` and stay oblivious to the
 * extra field.
 */
export interface ApiProduct extends Listing {
  seller?: UserSummary;
}

/**
 * A student profile exactly as `GET /api/users` returns it.
 *
 * Structurally a `Student` (the UI type) plus the account fields the interface
 * does not render.
 */
export interface ApiUser extends Student {
  email: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * An enquiry exactly as `GET /api/enquiries` returns it (Step 6).
 *
 * Mirrors `EnquiryDto` in `lib/db/serialize.ts`; re-declared here so client
 * components never import a `server-only` module just for a type. `product` and
 * `buyer` are populated by the list/detail endpoints.
 */
export interface ApiEnquiry {
  id: string;
  productId: string;
  sellerId: string;
  buyerId: string;
  message: string;
  /** Optional price the buyer floated alongside the question. */
  offerPrice?: number;
  status: EnquiryStatus;
  sellerResponse?: { message?: string; respondedAt?: string };
  respondedAt?: string;
  createdAt: string;
  updatedAt: string;
  product?: ApiProduct;
  buyer?: UserSummary;
}

/**
 * An offer exactly as `GET /api/offers` returns it (Step 6).
 *
 * `originalPrice` snapshots the asking price at offer time so a later listing
 * edit cannot rewrite history. `counterPrice` is the seller's counter on a
 * `countered` offer.
 */
export interface ApiOffer {
  id: string;
  productId: string;
  sellerId: string;
  buyerId: string;
  enquiryId?: string;
  originalPrice: number;
  offerPrice: number;
  counterPrice?: number;
  message?: string;
  status: OfferStatus;
  responseNote?: string;
  /** Set when the offer was rejected because a sibling offer was accepted (BR-14). */
  autoRejected: boolean;
  respondedAt?: string;
  createdAt: string;
  updatedAt: string;
  product?: ApiProduct;
  buyer?: UserSummary;
}

/**
 * A saved product exactly as `GET /api/favorites` returns it (Step 7).
 *
 * Mirrors `FavoriteDto` in `lib/db/serialize.ts`; re-declared here so client
 * components never import a `server-only` module just for a type. `availability`
 * is derived from the product's current status (BR-17), so a favourite that
 * points at a sold or removed listing still renders — it is never auto-deleted.
 */
export interface ApiFavorite {
  id: string;
  userId: string;
  productId: string;
  savedAt: string;
  availability?: "available" | "reserved" | "sold" | "unavailable";
  product?: ApiProduct;
}

export interface DashboardStats {
  listings: {
    active: number;
    reserved: number;
    sold: number;
    totalViews: number;
  };
  enquiries: {
    received: number;
    pending: number;
    accepted: number;
    rejected: number;
  };
  offers: {
    received: number;
    pending: number;
    accepted: number;
    rejected: number;
  };
  favorites: number;
}

/* -------------------------------------------------------------------------- *//*  Query / filter shapes                                                      */
/* -------------------------------------------------------------------------- */

export interface MarketplaceFilters {
  q: string;
  categories: Category[];
  conditions: Condition[];
  types: ListingType[];
  minPrice?: number;
  maxPrice?: number;
  sort: SortOption;
  page: number;
  limit: number;
}

export interface Paginated<T> {
  items: T[];
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}
