import "server-only";

import { Schema, model, models, type Model, type Types } from "mongoose";
import {
  CATEGORY_VALUES,
  CONDITION_VALUES,
  LISTING_STATUS_VALUES,
  LISTING_TYPE_VALUES,
} from "@/lib/db/enums";
import type {
  Category,
  Condition,
  ListingStatus,
  ListingType,
} from "@/lib/types";

/**
 * `products` collection — an item a student is selling, giving away or swapping.
 *
 * The Step 0 blueprint calls this entity `Listing`; Step 2 names the model
 * `Product` as requested. The domain fields (`listingType`, `status`, …) keep
 * their original names so the Step 1 UI types line up.
 */

export interface IProduct {
  _id: Types.ObjectId;
  /** Canonical seller reference; always set to the authenticated user's id. */
  sellerId: Types.ObjectId;
  /** Legacy alias kept so existing queries/populates keep working unchanged. */
  seller: Types.ObjectId;
  title: string;
  description: string;
  /** `0` for `free` and `exchange` listings (BR-8 / BR-9). */
  price: number;
  listingType: ListingType;
  category: Category;
  condition: Condition;
  images: string[];
  location: string;
  /** Required when `listingType === "exchange"` (BR-9). */
  exchangeFor?: string;
  tags: string[];
  status: ListingStatus;
  viewCount: number;
  reservedFor?: Types.ObjectId | null;
  reservedAt?: Date | null;
  soldTo?: Types.ObjectId | null;
  soldAt?: Date | null;
  deletedAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

const productSchema = new Schema<IProduct>(
  {
    sellerId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: [true, "A product must have a seller."],
      index: true,
    },
    seller: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: [true, "A product must have a seller."],
      index: true,
    },
    title: {
      type: String,
      required: [true, "A title is required."],
      trim: true,
      minlength: [5, "Titles are at least 5 characters."],
      maxlength: [120, "Titles are at most 120 characters."],
    },
    description: {
      type: String,
      required: [true, "A description is required."],
      trim: true,
      minlength: [20, "Descriptions are at least 20 characters."],
      maxlength: [4000, "Descriptions are at most 4000 characters."],
    },
    price: {
      type: Number,
      required: true,
      default: 0,
      min: [0, "Price cannot be negative."],
      max: [1_000_000, "Price cannot exceed 1,000,000."],
    },
    listingType: {
      type: String,
      enum: { values: LISTING_TYPE_VALUES, message: "Unknown listing type." },
      required: true,
      default: "sale",
    },
    category: {
      type: String,
      enum: { values: CATEGORY_VALUES, message: "Unknown category." },
      required: [true, "A category is required."],
    },
    condition: {
      type: String,
      enum: { values: CONDITION_VALUES, message: "Unknown condition." },
      required: [true, "A condition is required."],
    },
    images: {
      type: [String],
      default: [],
      validate: {
        validator: (value: string[]) => value.length <= 5,
        message: "A listing can have at most 5 images.",
      },
    },
    location: {
      type: String,
      required: [true, "A pickup location is required."],
      trim: true,
      minlength: [2, "Locations are at least 2 characters."],
      maxlength: [120, "Locations are at most 120 characters."],
    },
    exchangeFor: { type: String, trim: true, maxlength: 200 },
    tags: { type: [String], default: [] },
    status: {
      type: String,
      enum: { values: LISTING_STATUS_VALUES, message: "Unknown status." },
      default: "available",
      required: true,
    },
    viewCount: { type: Number, default: 0, min: 0 },
    reservedFor: { type: Schema.Types.ObjectId, ref: "User", default: null },
    reservedAt: { type: Date, default: null },
    soldTo: { type: Schema.Types.ObjectId, ref: "User", default: null },
    soldAt: { type: Date, default: null },
    deletedAt: { type: Date, default: null },
  },
  { timestamps: true, versionKey: false },
);

// Keep the canonical `sellerId` and the legacy `seller` path in sync. Existing
// seeded listings only have `seller`; the next save backfills `sellerId` for
// them automatically. New listings set both from the authenticated actor.
productSchema.pre("validate", function next() {
  if (this.sellerId && !this.seller) this.seller = this.sellerId;
  if (this.seller && !this.sellerId) this.sellerId = this.seller;
});

// Weighted full-text search across title, description and tags.
productSchema.index(
  { title: "text", description: "text", tags: "text" },
  { weights: { title: 10, tags: 5, description: 1 }, name: "product_text_search" },
);
// Browse + filter (status/category/price).
productSchema.index({ status: 1, category: 1, price: 1 });
// Seller dashboard.
productSchema.index({ seller: 1, status: 1, createdAt: -1 });
productSchema.index({ sellerId: 1, status: 1, createdAt: -1 });
// Newest sort.
productSchema.index({ status: 1, createdAt: -1 });
// Similar listings.
productSchema.index({ status: 1, category: 1, createdAt: -1 });

export const Product: Model<IProduct> =
  (models.Product as Model<IProduct> | undefined) ??
  model<IProduct>("Product", productSchema);
