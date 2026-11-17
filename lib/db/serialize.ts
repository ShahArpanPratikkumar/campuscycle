import "server-only";

import { Types } from "mongoose";
import { CONTACT_PREFERENCE_VALUES } from "@/lib/db/enums";
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
 * Document → DTO serialisation.
 *
 * Mongoose documents (and `.lean()` results) are not safe to send straight to
 * the client: they carry `ObjectId`/`Date` instances, and their field names
 * (`_id`, `seller`) do not match the `lib/types.ts` contracts the Step 1 UI
 * already consumes (`id`, `sellerId`).
 *
 * Every serializer therefore:
 *   - accepts `unknown` and narrows defensively (so a missing field can never
 *     crash a response), and
 *   - emits plain JSON-safe data: `id` strings and ISO date strings.
 *
 * Optional keys are only attached when they actually have a value, which keeps
 * payloads small and makes `undefined` vs `null` handling predictable.
 */

/* -------------------------------------------------------------------------- */
/*  DTO shapes                                                                 */
/* -------------------------------------------------------------------------- */

export interface UserStatsDto {
  activeListings: number;
  soldCount: number;
}

/** The compact seller shape embedded inside products/enquiries/offers. */
export interface UserSummaryDto {
  id: string;
  handle: string;
  displayName: string;
  campus: string;
  avatarUrl?: string;
  contactPreference?: ContactPreference;
}

export interface UserDto extends UserSummaryDto {
  email: string;
  department?: string;
  year?: number;
  bio?: string;
  stats: UserStatsDto;
  joinedAt: string;
  createdAt: string;
  updatedAt: string;
}

export interface ProductDto {
  id: string;
  sellerId: string;
  title: string;
  description: string;
  price: number;
  listingType: ListingType;
  category: Category;
  condition: Condition;
  images: string[];
  location: string;
  exchangeFor?: string;
  tags: string[];
  status: ListingStatus;
  viewCount: number;
  reservedForId?: string;
  soldToId?: string;
  createdAt: string;
  updatedAt: string;
  /** Present only when the query populated `seller`. */
  seller?: UserSummaryDto;
}

export interface EnquiryDto {
  id: string;
  productId: string;
  sellerId: string;
  buyerId: string;
  message: string;
  offerPrice?: number;
  status: EnquiryStatus;
  sellerResponse?: { message?: string; respondedAt?: string };
  respondedAt?: string;
  createdAt: string;
  updatedAt: string;
  /** Present only when populated. */
  product?: ProductDto;
  buyer?: UserSummaryDto;
}

export interface OfferDto {
  id: string;
  productId: string;
  sellerId: string;
  buyerId: string;
  enquiryId?: string;
  /** Snapshot of the asking price when the offer was created. */
  originalPrice: number;
  /** The buyer's proposed price. */
  offerPrice: number;
  /** The seller's counter price, present only on a `countered` offer. */
  counterPrice?: number;
  message?: string;
  status: OfferStatus;
  responseNote?: string;
  autoRejected: boolean;
  respondedAt?: string;
  createdAt: string;
  updatedAt: string;
  /** Present only when populated. */
  product?: ProductDto;
  buyer?: UserSummaryDto;
}

export type FavoriteAvailability =
  | "available"
  | "reserved"
  | "sold"
  | "unavailable";

export interface FavoriteDto {
  id: string;
  userId: string;
  productId: string;
  savedAt: string;
  /** Derived from the product's current status (BR-17). */
  availability?: FavoriteAvailability;
  /** Present only when populated. */
  product?: ProductDto;
}

/* -------------------------------------------------------------------------- */
/*  Narrowing helpers                                                          */
/* -------------------------------------------------------------------------- */

function asRecord(value: unknown): Record<string, unknown> {
  return typeof value === "object" && value !== null
    ? (value as Record<string, unknown>)
    : {};
}

function isPopulated(value: unknown): boolean {
  return (
    typeof value === "object" &&
    value !== null &&
    !(value instanceof Types.ObjectId)
  );
}

/** Reads an ObjectId (or the `_id` of a populated document) as a hex string. */
function refId(value: unknown): string {
  if (value == null) return "";
  if (typeof value === "string") return value;
  if (value instanceof Types.ObjectId) return value.toString();
  const record = asRecord(value);
  if ("_id" in record) return refId(record._id);
  return String(value);
}

function refIdOrUndefined(value: unknown): string | undefined {
  if (value == null) return undefined;
  const id = refId(value);
  return id.length > 0 ? id : undefined;
}

function isoDate(value: unknown): string | undefined {
  if (value == null) return undefined;
  const date = value instanceof Date ? value : new Date(value as string | number);
  return Number.isNaN(date.getTime()) ? undefined : date.toISOString();
}

function requiredIso(value: unknown): string {
  return isoDate(value) ?? new Date(0).toISOString();
}

function str(value: unknown, fallback = ""): string {
  return typeof value === "string" ? value : fallback;
}

function num(value: unknown, fallback = 0): number {
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}

function bool(value: unknown, fallback = false): boolean {
  return typeof value === "boolean" ? value : fallback;
}

function strArray(value: unknown): string[] {
  return Array.isArray(value)
    ? value.filter((item): item is string => typeof item === "string")
    : [];
}

function optionalString(value: unknown): string | undefined {
  return typeof value === "string" && value.length > 0 ? value : undefined;
}

function optionalNumber(value: unknown): number | undefined {
  return typeof value === "number" && Number.isFinite(value) ? value : undefined;
}

/** Narrows an arbitrary value to a known contact preference, else `undefined`. */
function contactPreference(value: unknown): ContactPreference | undefined {
  return typeof value === "string" &&
    (CONTACT_PREFERENCE_VALUES as readonly string[]).includes(value)
    ? (value as ContactPreference)
    : undefined;
}

/* -------------------------------------------------------------------------- */
/*  Serializers                                                                */
/* -------------------------------------------------------------------------- */

export function serializeUserSummary(input: unknown): UserSummaryDto {
  const user = asRecord(input);
  const dto: UserSummaryDto = {
    id: refId(user._id),
    handle: str(user.handle),
    displayName: str(user.displayName),
    campus: str(user.campus),
  };
  const avatarUrl = optionalString(user.avatarUrl);
  if (avatarUrl) dto.avatarUrl = avatarUrl;
  const preference = contactPreference(user.contactPreference);
  if (preference) dto.contactPreference = preference;
  return dto;
}

export function serializeUser(input: unknown): UserDto {
  const user = asRecord(input);
  const stats = asRecord(user.stats);

  const dto: UserDto = {
    ...serializeUserSummary(user),
    email: str(user.email),
    stats: {
      activeListings: num(stats.activeListings),
      soldCount: num(stats.soldCount),
    },
    joinedAt: requiredIso(user.createdAt),
    createdAt: requiredIso(user.createdAt),
    updatedAt: requiredIso(user.updatedAt),
  };

  const department = optionalString(user.department);
  if (department) dto.department = department;
  const year = optionalNumber(user.year);
  if (year !== undefined) dto.year = year;
  const bio = optionalString(user.bio);
  if (bio) dto.bio = bio;

  return dto;
}

export function serializeProduct(input: unknown): ProductDto {
  const product = asRecord(input);

  const dto: ProductDto = {
    id: refId(product._id),
    sellerId: refId(product.sellerId ?? product.seller),
    title: str(product.title),
    description: str(product.description),
    price: num(product.price),
    listingType: str(product.listingType, "sale") as ListingType,
    category: str(product.category, "other") as Category,
    condition: str(product.condition, "good") as Condition,
    images: strArray(product.images),
    location: str(product.location),
    tags: strArray(product.tags),
    status: str(product.status, "available") as ListingStatus,
    viewCount: num(product.viewCount),
    createdAt: requiredIso(product.createdAt),
    updatedAt: requiredIso(product.updatedAt),
  };

  const exchangeFor = optionalString(product.exchangeFor);
  if (exchangeFor) dto.exchangeFor = exchangeFor;
  const reservedForId = refIdOrUndefined(product.reservedFor);
  if (reservedForId) dto.reservedForId = reservedForId;
  const soldToId = refIdOrUndefined(product.soldTo);
  if (soldToId) dto.soldToId = soldToId;
  if (isPopulated(product.seller)) {
    dto.seller = serializeUserSummary(product.seller);
  }

  return dto;
}

export function serializeEnquiry(input: unknown): EnquiryDto {
  const enquiry = asRecord(input);

  const dto: EnquiryDto = {
    id: refId(enquiry._id),
    productId: refId(enquiry.product),
    sellerId: refId(enquiry.seller),
    buyerId: refId(enquiry.buyer),
    message: str(enquiry.message),
    status: str(enquiry.status, "pending") as EnquiryStatus,
    createdAt: requiredIso(enquiry.createdAt),
    updatedAt: requiredIso(enquiry.updatedAt),
  };

  const offerPrice = optionalNumber(enquiry.offerPrice);
  if (offerPrice !== undefined) dto.offerPrice = offerPrice;

  const respondedAt = isoDate(enquiry.respondedAt);
  if (respondedAt) dto.respondedAt = respondedAt;

  const response = asRecord(enquiry.sellerResponse);
  const responseMessage = optionalString(response.message);
  const responseAt = isoDate(response.respondedAt);
  if (responseMessage || responseAt) {
    dto.sellerResponse = {};
    if (responseMessage) dto.sellerResponse.message = responseMessage;
    if (responseAt) dto.sellerResponse.respondedAt = responseAt;
  }

  if (isPopulated(enquiry.product)) {
    dto.product = serializeProduct(enquiry.product);
  }
  if (isPopulated(enquiry.buyer)) {
    dto.buyer = serializeUserSummary(enquiry.buyer);
  }

  return dto;
}

export function serializeOffer(input: unknown): OfferDto {
  const offer = asRecord(input);

  const dto: OfferDto = {
    id: refId(offer._id),
    productId: refId(offer.product),
    sellerId: refId(offer.seller),
    buyerId: refId(offer.buyer),
    originalPrice: num(offer.originalPrice),
    offerPrice: num(offer.offerPrice),
    status: str(offer.status, "pending") as OfferStatus,
    autoRejected: bool(offer.autoRejected),
    createdAt: requiredIso(offer.createdAt),
    updatedAt: requiredIso(offer.updatedAt),
  };

  const enquiryId = refIdOrUndefined(offer.enquiry);
  if (enquiryId) dto.enquiryId = enquiryId;
  const counterPrice = optionalNumber(offer.counterPrice);
  if (counterPrice !== undefined) dto.counterPrice = counterPrice;
  const message = optionalString(offer.message);
  if (message) dto.message = message;
  const responseNote = optionalString(offer.responseNote);
  if (responseNote) dto.responseNote = responseNote;
  const respondedAt = isoDate(offer.respondedAt);
  if (respondedAt) dto.respondedAt = respondedAt;

  if (isPopulated(offer.product)) dto.product = serializeProduct(offer.product);
  if (isPopulated(offer.buyer)) dto.buyer = serializeUserSummary(offer.buyer);

  return dto;
}

/** Maps a product status onto the favourites availability label (BR-17). */
export function availabilityOf(status: unknown): FavoriteAvailability {
  switch (status) {
    case "available":
      return "available";
    case "reserved":
      return "reserved";
    case "sold":
      return "sold";
    default:
      return "unavailable";
  }
}

export function serializeFavorite(input: unknown): FavoriteDto {
  const favorite = asRecord(input);

  const dto: FavoriteDto = {
    id: refId(favorite._id),
    userId: refId(favorite.user),
    productId: refId(favorite.product),
    savedAt: requiredIso(favorite.createdAt),
  };

  if (isPopulated(favorite.product)) {
    const product = serializeProduct(favorite.product);
    dto.product = product;
    dto.availability = availabilityOf(product.status);
  }

  return dto;
}
