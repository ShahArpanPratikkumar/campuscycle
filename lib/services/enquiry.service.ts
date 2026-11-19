import "server-only";

import type { QueryFilter, Types } from "mongoose";
import { ApiError } from "@/lib/api/errors";
import type { Paginated } from "@/lib/api/query";
import { isValidObjectId } from "@/lib/db/object-id";
import { Enquiry, type IEnquiry } from "@/lib/db/models/enquiry.model";
import { Product } from "@/lib/db/models/product.model";
import { type IUser } from "@/lib/db/models/user.model";
import { serializeEnquiry, type EnquiryDto } from "@/lib/db/serialize";
import type { EnquiryStatus } from "@/lib/types";
import type {
  CreateEnquiryInput,
  EnquiryAction,
  EnquiryQuery,
  RespondEnquiryInput,
} from "@/lib/validators/enquiry";

/**
 * `Enquiry` service — structured buyer → seller questions.
 *
 * Business rules implemented here:
 *   BR-3  only the seller may accept/reject
 *   BR-4  only the buyer may cancel
 *   BR-5  you cannot enquire on your own product
 *   BR-6  enquiries are only accepted while the product is `available`
 *   BR-10 at most one pending enquiry per (product, buyer)
 *   BR-15 accepting an enquiry does **not** reserve the product
 *   BR-22 enquiries on reserved/sold products return 409
 */

const ENQUIRY_POPULATE = [
  {
    path: "product",
    populate: { path: "seller", select: "handle displayName campus avatarUrl" },
  },
  { path: "buyer", select: "handle displayName campus avatarUrl" },
];

const ACTION_TARGET: Record<EnquiryAction, EnquiryStatus> = {
  accept: "accepted",
  reject: "rejected",
  cancel: "cancelled",
};

const ENQUIRY_RESPONDER: Record<EnquiryAction, "seller" | "buyer"> = {
  accept: "seller",
  reject: "seller",
  cancel: "buyer",
};

const ENQUIRY_ALLOWED: Record<EnquiryStatus, EnquiryStatus[]> = {
  pending: ["accepted", "rejected", "cancelled"],
  // Every terminal state is final: an answered/cancelled enquiry never reopens.
  accepted: [],
  rejected: [],
  cancelled: [],
};

/** Which side of the conversation the actor is on, or `null` if neither. */
function participantRole(
  doc: { seller: unknown; buyer: unknown },
  actor: IUser,
): "seller" | "buyer" | null {
  const actorId = String(actor._id);
  if (String(doc.seller) === actorId) return "seller";
  if (String(doc.buyer) === actorId) return "buyer";
  return null;
}

async function loadEnquiryDto(id: Types.ObjectId | string): Promise<EnquiryDto | null> {
  const enquiry = await Enquiry.findById(id).populate(ENQUIRY_POPULATE).lean();
  return enquiry ? serializeEnquiry(enquiry) : null;
}

export async function createEnquiry(
  actor: IUser,
  input: CreateEnquiryInput,
): Promise<EnquiryDto> {
  const product = await Product.findById(input.productId);

  if (!product || product.status === "deleted") {
    throw ApiError.notFound("That product does not exist or has been removed.");
  }

  // Buyer/seller/product combination integrity: the buyer is always the actor
  // and the seller is always the product owner. A client that supplies either id
  // must agree with the server's derivation (BR: invalid combinations).
  if (input.buyerId && input.buyerId !== String(actor._id)) {
    throw ApiError.ruleViolation(
      "The buyerId you supplied does not match the acting student.",
      [{ field: "buyerId", message: "Must be the acting student's id." }],
    );
  }
  if (input.sellerId && input.sellerId !== String(product.seller)) {
    throw ApiError.ruleViolation(
      "The sellerId you supplied does not own this product.",
      [{ field: "sellerId", message: "Must be the product owner's id." }],
    );
  }

  // BR-5
  if (String(product.seller) === String(actor._id)) {
    throw ApiError.forbidden("You cannot send an enquiry on your own product.");
  }

  // BR-6 / BR-22
  if (product.status !== "available") {
    throw ApiError.listingUnavailable(
      `This product is currently "${product.status}" and is not accepting enquiries.`,
    );
  }

  // BR-21 (enquiry variant): an offered price must undercut the asking price.
  if (
    input.offerPrice !== undefined &&
    product.listingType === "sale" &&
    input.offerPrice >= product.price
  ) {
    throw ApiError.ruleViolation(
      "An offered price must be lower than the asking price.",
      [
        {
          field: "offerPrice",
          message: `Must be less than ${product.price}.`,
        },
      ],
    );
  }

  // BR-10
  const existing = await Enquiry.findOne({
    product: product._id,
    buyer: actor._id,
    status: "pending",
  });
  if (existing) {
    throw ApiError.duplicate(
      "You already have a pending enquiry on this product.",
    );
  }

  const enquiry = await Enquiry.create({
    product: product._id,
    seller: product.seller,
    buyer: actor._id,
    message: input.message,
    offerPrice: input.offerPrice,
    status: "pending",
  });

  return (await loadEnquiryDto(enquiry._id)) ?? serializeEnquiry(enquiry.toObject());
}

export async function listEnquiries(
  query: EnquiryQuery,
  actor: IUser,
): Promise<Paginated<EnquiryDto>> {
  const { page, limit, role, status, productId } = query;
  const filter: QueryFilter<IEnquiry> = {};

  if (role === "seller") {
    filter.seller = actor._id;
  } else if (role === "buyer") {
    filter.buyer = actor._id;
  } else {
    filter.$or = [{ seller: actor._id }, { buyer: actor._id }];
  }

  if (status && status.length > 0) filter.status = { $in: status };
  if (productId) filter.product = productId;

  const [total, enquiries] = await Promise.all([
    Enquiry.countDocuments(filter),
    Enquiry.find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .populate(ENQUIRY_POPULATE)
      .lean(),
  ]);

  return {
    items: enquiries.map(serializeEnquiry),
    meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
  };
}

export async function getEnquiryById(
  id: string,
  actor: IUser,
): Promise<EnquiryDto> {
  if (!isValidObjectId(id)) {
    throw ApiError.invalidId("That enquiry id is not a valid ObjectId.");
  }

  const enquiry = await Enquiry.findById(id);
  if (!enquiry) {
    throw ApiError.notFound("That enquiry does not exist.");
  }
  if (!participantRole(enquiry, actor)) {
    throw ApiError.forbidden("You are not part of this enquiry.");
  }

  return (await loadEnquiryDto(id)) ?? serializeEnquiry(enquiry.toObject());
}

export async function respondToEnquiry(
  actor: IUser,
  id: string,
  input: RespondEnquiryInput,
): Promise<EnquiryDto> {
  if (!isValidObjectId(id)) {
    throw ApiError.invalidId("That enquiry id is not a valid ObjectId.");
  }

  const enquiry = await Enquiry.findById(id);
  if (!enquiry) {
    throw ApiError.notFound("That enquiry does not exist.");
  }

  const role = participantRole(enquiry, actor);
  if (!role) {
    throw ApiError.forbidden("You are not part of this enquiry.");
  }
  if (ENQUIRY_RESPONDER[input.action] !== role) {
    throw ApiError.forbidden(
      input.action === "cancel"
        ? "Only the buyer can cancel this enquiry."
        : "Only the seller can respond to this enquiry.",
    );
  }

  const target = ACTION_TARGET[input.action];
  if (!ENQUIRY_ALLOWED[enquiry.status].includes(target)) {
    throw ApiError.ruleViolation(
      `This enquiry is "${enquiry.status}" and can no longer be ${target}.`,
    );
  }

  const now = new Date();
  enquiry.status = target;
  enquiry.respondedAt = now;

  if (input.response) {
    enquiry.sellerResponse = { message: input.response, respondedAt: now };
  }

  await enquiry.save();

  // BR-15: accepting an enquiry is a conversation milestone — it deliberately
  // does *not* reserve the product. Only an accepted offer reserves it.

  return (await loadEnquiryDto(enquiry._id)) ?? serializeEnquiry(enquiry.toObject());
}
