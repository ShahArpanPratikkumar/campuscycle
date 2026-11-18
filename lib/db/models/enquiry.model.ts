import "server-only";

import { Schema, model, models, type Model, type Types } from "mongoose";
import { ENQUIRY_STATUS_VALUES } from "@/lib/db/enums";
import type { EnquiryStatus } from "@/lib/types";

/**
 * `enquiries` collection — a structured question from a buyer about a product.
 *
 * `seller` is denormalised from the product so the seller inbox is a single
 * indexed query with no join (docs/ARCHITECTURE.md §10).
 */

export interface IEnquiryResponse {
  message?: string;
  respondedAt?: Date;
}

export interface IEnquiry {
  _id: Types.ObjectId;
  product: Types.ObjectId;
  seller: Types.ObjectId;
  buyer: Types.ObjectId;
  message: string;
  /** Optional price the buyer floated alongside the question (BR-21 variant). */
  offerPrice?: number;
  status: EnquiryStatus;
  sellerResponse?: IEnquiryResponse;
  respondedAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

const enquirySchema = new Schema<IEnquiry>(
  {
    product: {
      type: Schema.Types.ObjectId,
      ref: "Product",
      required: [true, "An enquiry must reference a product."],
    },
    seller: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    buyer: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: [true, "An enquiry must have a buyer."],
    },
    message: {
      type: String,
      required: [true, "A message is required."],
      trim: true,
      minlength: [5, "Messages are at least 5 characters."],
      maxlength: [1000, "Messages are at most 1000 characters."],
    },
    offerPrice: { type: Number, min: [1, "An offered price must be greater than 0."] },
    status: {
      type: String,
      enum: { values: ENQUIRY_STATUS_VALUES, message: "Unknown enquiry status." },
      default: "pending",
      required: true,
    },
    sellerResponse: {
      message: { type: String, trim: true, maxlength: 500 },
      respondedAt: { type: Date },
    },
    respondedAt: { type: Date, default: null },
  },
  { timestamps: true, versionKey: false },
);

// At most one *pending* enquiry per (product, buyer) — BR-10.
enquirySchema.index(
  { product: 1, buyer: 1 },
  { unique: true, partialFilterExpression: { status: "pending" }, name: "unique_pending_enquiry" },
);
// Seller inbox.
enquirySchema.index({ seller: 1, status: 1, createdAt: -1 });
// Buyer history.
enquirySchema.index({ buyer: 1, createdAt: -1 });

export const Enquiry: Model<IEnquiry> =
  (models.Enquiry as Model<IEnquiry> | undefined) ??
  model<IEnquiry>("Enquiry", enquirySchema);
