import "server-only";

import type { QueryFilter, Types } from "mongoose";
import { ApiError } from "@/lib/api/errors";
import type { Paginated } from "@/lib/api/query";
import { isValidObjectId } from "@/lib/db/object-id";
import { Enquiry } from "@/lib/db/models/enquiry.model";
import { Offer, type IOffer } from "@/lib/db/models/offer.model";
import { Product } from "@/lib/db/models/product.model";
import { type IUser } from "@/lib/db/models/user.model";
import { serializeOffer, type OfferDto } from "@/lib/db/serialize";
import { recalculateUserStats } from "@/lib/services/product.service";
import type { OfferStatus } from "@/lib/types";
import type {
  CreateOfferInput,
  OfferAction,
  OfferQuery,
  RespondOfferInput,
} from "@/lib/validators/offer";

/**
 * `Offer` service — formal price proposals.
 *
 * Business rules implemented here:
 *   BR-3  only the seller may accept/reject/counter
 *   BR-4  only the buyer may withdraw (and answer a counter)
 *   BR-5  you cannot offer on your own product
 *   BR-6  offers are only accepted while the product is `available`
 *   BR-7  offers are only valid on `sale` products
 *   BR-11 at most one pending offer per (product, buyer)
 *   BR-14 accepting an offer reserves the product and auto-rejects siblings
 *   BR-21 an offer must be greater than 0 and below the asking price
 *   BR-22 offers on reserved/sold products return 409
 *   BR-25 a counter must sit strictly between the offer and the asking price
 */

const OFFER_POPULATE = [
  {
    path: "product",
    populate: { path: "seller", select: "handle displayName campus avatarUrl" },
  },
  { path: "buyer", select: "handle displayName campus avatarUrl" },
];

interface OfferTransition {
  to: OfferStatus;
  actor: "seller" | "buyer";
}

/**
 * The offer state machine.
 *
 * `pending` is the buyer's opening move — the seller accepts, rejects, counters,
 * or the buyer withdraws. A `countered` offer hands the decision back to the
 * buyer, who can accept, reject, or withdraw. Every other status is terminal.
 */
const OFFER_TRANSITIONS: Record<
  OfferStatus,
  Partial<Record<OfferAction, OfferTransition>>
> = {
  pending: {
    accept: { to: "accepted", actor: "seller" },
    reject: { to: "rejected", actor: "seller" },
    counter: { to: "countered", actor: "seller" },
    withdraw: { to: "withdrawn", actor: "buyer" },
  },
  countered: {
    accept: { to: "accepted", actor: "buyer" },
    reject: { to: "rejected", actor: "buyer" },
    withdraw: { to: "withdrawn", actor: "buyer" },
  },
  accepted: {},
  rejected: {},
  withdrawn: {},
};

function participantRole(
  doc: { seller: unknown; buyer: unknown },
  actor: IUser,
): "seller" | "buyer" | null {
  const actorId = String(actor._id);
  if (String(doc.seller) === actorId) return "seller";
  if (String(doc.buyer) === actorId) return "buyer";
  return null;
}

async function loadOfferDto(id: Types.ObjectId | string): Promise<OfferDto | null> {
  const offer = await Offer.findById(id).populate(OFFER_POPULATE).lean();
  return offer ? serializeOffer(offer) : null;
}

export async function createOffer(
  actor: IUser,
  input: CreateOfferInput,
): Promise<OfferDto> {
  const product = await Product.findById(input.productId);

  if (!product || product.status === "deleted") {
    throw ApiError.notFound("That product does not exist or has been removed.");
  }

  // Buyer/seller/product combination integrity (mirrors the enquiry service).
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
    throw ApiError.forbidden("You cannot make an offer on your own product.");
  }

  // BR-6 / BR-22 — a sold/reserved/inactive product takes no new offers.
  if (product.status !== "available") {
    throw ApiError.listingUnavailable(
      `This product is currently "${product.status}" and is not accepting offers.`,
    );
  }

  // BR-7
  if (product.listingType !== "sale") {
    throw ApiError.ruleViolation(
      "Offers are only accepted on products listed for sale. Free and exchange items do not take offers.",
    );
  }

  // BR-21
  if (input.offerPrice >= product.price) {
    throw ApiError.ruleViolation(
      "An offer must be lower than the asking price.",
      [{ field: "offerPrice", message: `Must be less than ${product.price}.` }],
    );
  }

  if (input.enquiryId) {
    const enquiry = await Enquiry.findById(input.enquiryId);
    const valid =
      enquiry &&
      String(enquiry.product) === String(product._id) &&
      String(enquiry.buyer) === String(actor._id);

    if (!valid) {
      throw ApiError.validation(
        [
          {
            field: "enquiryId",
            message: "That enquiry does not belong to you and this product.",
          },
        ],
        "Invalid enquiry reference.",
      );
    }
  }

  // BR-11
  const existing = await Offer.findOne({
    product: product._id,
    buyer: actor._id,
    status: "pending",
  });
  if (existing) {
    throw ApiError.duplicate("You already have a pending offer on this product.");
  }

  const offer = await Offer.create({
    product: product._id,
    seller: product.seller,
    buyer: actor._id,
    enquiry: input.enquiryId,
    // BR-21: snapshot the asking price so a later edit cannot rewrite history.
    originalPrice: product.price,
    offerPrice: input.offerPrice,
    message: input.message,
    status: "pending",
  });

  return (await loadOfferDto(offer._id)) ?? serializeOffer(offer.toObject());
}

export async function listOffers(
  query: OfferQuery,
  actor: IUser,
): Promise<Paginated<OfferDto>> {
  const { page, limit, role, status, productId } = query;
  const filter: QueryFilter<IOffer> = {};

  if (role === "seller") {
    filter.seller = actor._id;
  } else if (role === "buyer") {
    filter.buyer = actor._id;
  } else {
    filter.$or = [{ seller: actor._id }, { buyer: actor._id }];
  }

  if (status && status.length > 0) filter.status = { $in: status };
  if (productId) filter.product = productId;

  const [total, offers] = await Promise.all([
    Offer.countDocuments(filter),
    Offer.find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .populate(OFFER_POPULATE)
      .lean(),
  ]);

  return {
    items: offers.map(serializeOffer),
    meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
  };
}

export async function getOfferById(
  id: string,
  actor: IUser,
): Promise<OfferDto> {
  if (!isValidObjectId(id)) {
    throw ApiError.invalidId("That offer id is not a valid ObjectId.");
  }

  const offer = await Offer.findById(id);
  if (!offer) {
    throw ApiError.notFound("That offer does not exist.");
  }
  if (!participantRole(offer, actor)) {
    throw ApiError.forbidden("You are not part of this offer.");
  }

  return (await loadOfferDto(id)) ?? serializeOffer(offer.toObject());
}

export async function respondToOffer(
  actor: IUser,
  id: string,
  input: RespondOfferInput,
): Promise<OfferDto> {
  if (!isValidObjectId(id)) {
    throw ApiError.invalidId("That offer id is not a valid ObjectId.");
  }

  const offer = await Offer.findById(id);
  if (!offer) {
    throw ApiError.notFound("That offer does not exist.");
  }

  const role = participantRole(offer, actor);
  if (!role) {
    throw ApiError.forbidden("You are not part of this offer.");
  }

  // 1) Is this move allowed from the offer's current status at all?
  const transition = OFFER_TRANSITIONS[offer.status][input.action];
  if (!transition) {
    throw ApiError.ruleViolation(
      `This offer is "${offer.status}" and can no longer be ${input.action}.`,
    );
  }

  // 2) Is the actor the side that owns this move?
  if (transition.actor !== role) {
    throw ApiError.forbidden(
      transition.actor === "seller"
        ? "Only the seller can do that to this offer."
        : "Only the buyer can do that to this offer.",
    );
  }

  const now = new Date();

  if (input.action === "counter") {
    // BR-25: a counter must sit strictly between the buyer's offer and the
    // original asking price.
    if (input.counterPrice === undefined) {
      throw ApiError.ruleViolation("A counter offer needs a price.", [
        { field: "counterPrice", message: "A counter price is required." },
      ]);
    }
    if (input.counterPrice <= offer.offerPrice) {
      throw ApiError.ruleViolation(
        "A counter offer must be higher than the buyer's offer.",
        [
          {
            field: "counterPrice",
            message: `Must be greater than ${offer.offerPrice}.`,
          },
        ],
      );
    }
    if (input.counterPrice > offer.originalPrice) {
      throw ApiError.ruleViolation(
        "A counter offer cannot exceed the asking price.",
        [
          {
            field: "counterPrice",
            message: `Must be at most ${offer.originalPrice}.`,
          },
        ],
      );
    }
    offer.counterPrice = input.counterPrice;
  }

  if (transition.to === "accepted") {
    // BR-14: accepting reserves the product for this buyer and auto-rejects
    // every other live negotiation on it (pending *and* countered).
    const product = await Product.findById(offer.product);

    if (!product || product.status !== "available") {
      throw ApiError.listingUnavailable(
        "This product is no longer available to accept an offer on.",
      );
    }

    product.status = "reserved";
    product.reservedFor = offer.buyer;
    product.reservedAt = now;
    await product.save();

    await Offer.updateMany(
      {
        product: offer.product,
        status: { $in: ["pending", "countered"] },
        _id: { $ne: offer._id },
      },
      {
        $set: {
          status: "rejected",
          autoRejected: true,
          respondedAt: now,
          responseNote: "Another offer on this product was accepted.",
        },
      },
    );

    await recalculateUserStats(product.seller);
  }

  offer.status = transition.to;
  offer.respondedAt = now;
  if (input.note) offer.responseNote = input.note;

  await offer.save();

  return (await loadOfferDto(offer._id)) ?? serializeOffer(offer.toObject());
}
