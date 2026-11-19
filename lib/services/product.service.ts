import "server-only";

import type { HydratedDocument, QueryFilter, Types } from "mongoose";
import { ApiError } from "@/lib/api/errors";
import type { Paginated } from "@/lib/api/query";
import { isValidObjectId } from "@/lib/db/object-id";
import { Product, type IProduct } from "@/lib/db/models/product.model";
import { User, type IUser } from "@/lib/db/models/user.model";
import { serializeProduct, type ProductDto } from "@/lib/db/serialize";
import type { ListingStatus } from "@/lib/types";
import { escapeRegex } from "@/lib/utils/regex";
import {
  createProductSchema,
  type CreateProductInput,
  type ProductQuery,
  type UpdateProductInput,
} from "@/lib/validators/product";

/**
 * `Product` service — CRUD, search and status transitions.
 *
 * Business rules implemented here:
 *   BR-2  only the owner may update or delete
 *   BR-8  `free` products are stored at price 0
 *   BR-9  `exchange` products require `exchangeFor` and price 0
 *   BR-13 legal status transitions only
 *   BR-16 delete is a soft delete (`status: "deleted"`)
 *   BR-18 `soldAt` is stamped when a product is marked sold
 *   BR-20 `sale` products must cost more than 0
 *   BR-23 changing `listingType` re-validates the price rules
 *   BR-24 seller stats are recalculated after every status change
 */

const SELLER_POPULATE = {
  path: "seller",
  select: "handle displayName campus avatarUrl",
};

/** BR-13 — the only status moves the API allows. */
export const ALLOWED_STATUS_TRANSITIONS: Record<ListingStatus, ListingStatus[]> = {
  available: ["reserved", "sold", "deleted"],
  reserved: ["available", "sold", "deleted"],
  // `sold` is terminal except for an explicit relist.
  sold: ["available"],
  deleted: [],
};

export function canTransition(from: ListingStatus, to: ListingStatus): boolean {
  if (from === to) return true;
  return ALLOWED_STATUS_TRANSITIONS[from].includes(to);
}

function assertTransition(from: ListingStatus, to: ListingStatus): void {
  if (!canTransition(from, to)) {
    throw ApiError.ruleViolation(
      `A product cannot move from "${from}" to "${to}".`,
      [{ field: "status", message: `"${from}" → "${to}" is not an allowed transition.` }],
    );
  }
}

/** Applies the timestamp side effects that accompany a status change. */
function applyStatus(
  product: HydratedDocument<IProduct>,
  next: ListingStatus,
): void {
  product.status = next;

  if (next === "reserved") {
    product.reservedAt = new Date();
  }
  if (next === "sold") {
    product.soldAt = new Date();
  }
  if (next === "deleted") {
    product.deletedAt = new Date();
  }
  if (next === "available") {
    // Relisting clears the reservation/sale bookkeeping.
    product.reservedFor = null;
    product.reservedAt = null;
    product.soldTo = null;
    product.soldAt = null;
  }
}

type SortSpec = Record<string, 1 | -1>;

function buildSort(sort: ProductQuery["sort"]): SortSpec {
  switch (sort) {
    case "price_asc":
      return { price: 1, createdAt: -1 };
    case "price_desc":
      return { price: -1, createdAt: -1 };
    case "popular":
      return { viewCount: -1, createdAt: -1 };
    default:
      return { createdAt: -1 };
  }
}

/** Recomputes the denormalised seller counters (BR-24). */
export async function recalculateUserStats(
  userId: Types.ObjectId | string,
): Promise<void> {
  const [activeListings, soldCount] = await Promise.all([
    Product.countDocuments({
      seller: userId,
      status: { $in: ["available", "reserved"] },
    }),
    Product.countDocuments({ seller: userId, status: "sold" }),
  ]);

  await User.updateOne(
    { _id: userId },
    { $set: { "stats.activeListings": activeListings, "stats.soldCount": soldCount } },
  );
}

async function loadProductDto(id: unknown): Promise<ProductDto | null> {
  const product = await Product.findById(id).populate(SELLER_POPULATE).lean();
  return product ? serializeProduct(product) : null;
}

export async function listProducts(
  query: ProductQuery,
): Promise<Paginated<ProductDto>> {
  const { page, limit, q, category, condition, type, status, sellerId } = query;
  const { minPrice, maxPrice, sort } = query;

  const filter: QueryFilter<IProduct> = {};

  // Visibility: an explicit `status` filter wins; otherwise a seller's own
  // profile shows everything but deleted products, and browse shows `available`.
  if (status && status.length > 0) {
    filter.status = { $in: status };
  } else if (sellerId) {
    filter.status = { $ne: "deleted" };
  } else {
    filter.status = "available";
  }

  if (sellerId) filter.seller = sellerId;
  if (category && category.length > 0) filter.category = { $in: category };
  if (condition && condition.length > 0) filter.condition = { $in: condition };
  if (type && type.length > 0) filter.listingType = { $in: type };

  if (minPrice !== undefined || maxPrice !== undefined) {
    const price: { $gte?: number; $lte?: number } = {};
    if (minPrice !== undefined) price.$gte = minPrice;
    if (maxPrice !== undefined) price.$lte = maxPrice;
    filter.price = price;
  }

  // Full-text-style search. A case-insensitive substring regex is used rather
  // than MongoDB `$text` so partial words ("calc" → "calculator") match, which
  // is what students expect from a marketplace search box. The user's input is
  // escaped (see `escapeRegex`) so it can never be read as a regex, and the
  // `$or` covers the product name and description (plus tags, a nice bonus).
  if (q) {
    const pattern = new RegExp(escapeRegex(q), "i");
    filter.$or = [
      { title: pattern },
      { description: pattern },
      { tags: pattern },
    ];
  }

  const [total, products] = await Promise.all([
    Product.countDocuments(filter),
    Product.find(filter)
      .sort(buildSort(sort))
      .skip((page - 1) * limit)
      .limit(limit)
      .populate(SELLER_POPULATE)
      .lean(),
  ]);

  return {
    items: products.map(serializeProduct),
    meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
  };
}

export async function getProductById(id: string): Promise<ProductDto> {
  if (!isValidObjectId(id)) {
    throw ApiError.invalidId("That product id is not a valid ObjectId.");
  }

  const product = await Product.findOne({
    _id: id,
    status: { $ne: "deleted" },
  })
    .populate(SELLER_POPULATE)
    .lean();

  if (!product) {
    throw ApiError.notFound("That product does not exist or has been removed.");
  }

  return serializeProduct(product);
}

export async function createProduct(
  actor: IUser,
  input: CreateProductInput,
): Promise<ProductDto> {
  // The seller is taken exclusively from the authenticated session actor.
  // Any `sellerId`/`seller` value supplied by the browser is stripped by the
  // Zod schema before it reaches this service.
  const product = await Product.create({
    seller: actor._id,
    sellerId: actor._id,
    title: input.title,
    description: input.description,
    price: input.price,
    listingType: input.listingType,
    category: input.category,
    condition: input.condition,
    images: input.images,
    location: input.location,
    exchangeFor: input.exchangeFor,
    tags: input.tags,
    status: "available",
  });

  await recalculateUserStats(actor._id);

  return (await loadProductDto(product._id)) ?? serializeProduct(product.toObject());
}

export async function updateProduct(
  actor: IUser,
  id: string,
  patch: UpdateProductInput,
): Promise<ProductDto> {
  if (!isValidObjectId(id)) {
    throw ApiError.invalidId("That product id is not a valid ObjectId.");
  }

  const product = await Product.findOne({ _id: id, status: { $ne: "deleted" } });

  if (!product) {
    throw ApiError.notFound("That product does not exist or has been removed.");
  }
  if (String(product.sellerId ?? product.seller) !== String(actor._id)) {
    throw ApiError.forbidden("You can only edit your own products.");
  }

  const { status: nextStatus, ...contentPatch } = patch;

  // BR-23: merge the patch onto the stored document, then re-validate the whole
  // thing against the create rules — a partial update can still break BR-8/9/20
  // (e.g. switching `sale` → `free` while leaving a non-zero price behind).
  const merged: Record<string, unknown> = {
    title: product.title,
    description: product.description,
    price: product.price,
    listingType: product.listingType,
    category: product.category,
    condition: product.condition,
    images: product.images,
    location: product.location,
    tags: product.tags,
  };
  if (product.exchangeFor) merged.exchangeFor = product.exchangeFor;

  for (const [key, value] of Object.entries(contentPatch)) {
    if (value === undefined) continue;
    if (value === null) {
      delete merged[key];
      continue;
    }
    merged[key] = value;
  }

  const validated = createProductSchema.parse(merged);

  product.title = validated.title;
  product.description = validated.description;
  product.price = validated.price;
  product.listingType = validated.listingType;
  product.category = validated.category;
  product.condition = validated.condition;
  product.images = validated.images;
  product.location = validated.location;
  product.tags = validated.tags;
  product.exchangeFor = validated.exchangeFor;

  if (nextStatus && nextStatus !== product.status) {
    assertTransition(product.status, nextStatus);
    applyStatus(product, nextStatus);
  }

  await product.save();
  await recalculateUserStats(actor._id);

  return (await loadProductDto(product._id)) ?? serializeProduct(product.toObject());
}

export async function deleteProduct(
  actor: IUser,
  id: string,
): Promise<ProductDto> {
  if (!isValidObjectId(id)) {
    throw ApiError.invalidId("That product id is not a valid ObjectId.");
  }

  const product = await Product.findById(id);

  if (!product || product.status === "deleted") {
    throw ApiError.notFound("That product does not exist or has already been removed.");
  }
  if (String(product.sellerId ?? product.seller) !== String(actor._id)) {
    throw ApiError.forbidden("You can only remove your own products.");
  }

  // BR-16: soft delete so enquiries/offers/favourites keep their history.
  assertTransition(product.status, "deleted");
  applyStatus(product, "deleted");

  await product.save();
  await recalculateUserStats(actor._id);

  return (await loadProductDto(product._id)) ?? serializeProduct(product.toObject());
}
