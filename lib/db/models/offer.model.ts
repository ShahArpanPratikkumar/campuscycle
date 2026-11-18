import "server-only";

import { Schema, model, models, type Model, type Types } from "mongoose";
import { OFFER_STATUS_VALUES } from "@/lib/db/enums";
import type { OfferStatus } from "@/lib/types";

/**
 * `offers` collection — a formal price proposal from a buyer.
 *
 * Only allowed on `sale` products (BR-7). Accepting an offer reserves the
 * product and auto-rejects sibling offers (BR-14).
 */

export interface IOffer {
  _id: Types.ObjectId;
  product: Types.ObjectId;
  seller: Types.ObjectId;
  buyer: Types.ObjectId;
  enquiry?: Types.ObjectId | null;
  /** Snapshot of the product's asking price when the offer was created. */
  originalPrice: number;
  /** The buyer's proposed price (> 0 and < `originalPrice`). */
  offerPrice: number;
  /** The seller's counter price, set only while `status === "countered"`. */
  counterPrice?: number;
  message?: string;
  status: OfferStatus;
  responseNote?: string;
  /** True when rejected because a sibling offer was accepted (BR-14). */
  autoRejected: boolean;
  respondedAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

const offerSchema = new Schema<IOffer>(
  {
    product: {
      type: Schema.Types.ObjectId,
      ref: "Product",
      required: [true, "An offer must reference a product."],
    },
    seller: { type: Schema.Types.ObjectId, ref: "User", required: true },
    buyer: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: [true, "An offer must have a buyer."],
    },
    enquiry: { type: Schema.Types.ObjectId, ref: "Enquiry", default: null },
    originalPrice: {
      type: Number,
      required: [true, "An offer must snapshot the asking price."],
      min: [0, "The asking price cannot be negative."],
      max: [1_000_000, "The asking price cannot exceed 1,000,000."],
    },
    offerPrice: {
      type: Number,
      required: [true, "An offer price is required."],
      min: [1, "An offer must be greater than 0."],
      max: [1_000_000, "An offer cannot exceed 1,000,000."],
    },
    counterPrice: {
      type: Number,
      min: [1, "A counter offer must be greater than 0."],
      max: [1_000_000, "A counter offer cannot exceed 1,000,000."],
    },
    message: { type: String, trim: true, maxlength: 500 },
    status: {
      type: String,
      enum: { values: OFFER_STATUS_VALUES, message: "Unknown offer status." },
      default: "pending",
      required: true,
    },
    responseNote: { type: String, trim: true, maxlength: 500 },
    autoRejected: { type: Boolean, default: false },
    respondedAt: { type: Date, default: null },
  },
  { timestamps: true, versionKey: false },
);

// All offers on a product (used by the auto-reject sweep).
offerSchema.index({ product: 1, status: 1 });
// At most one *pending* offer per (product, buyer) — BR-11.
offerSchema.index(
  { product: 1, buyer: 1 },
  { unique: true, partialFilterExpression: { status: "pending" }, name: "unique_pending_offer" },
);
// Seller inbox.
offerSchema.index({ seller: 1, status: 1, createdAt: -1 });
// Buyer history.
offerSchema.index({ buyer: 1, createdAt: -1 });

export const Offer: Model<IOffer> =
  (models.Offer as Model<IOffer> | undefined) ??
  model<IOffer>("Offer", offerSchema);
