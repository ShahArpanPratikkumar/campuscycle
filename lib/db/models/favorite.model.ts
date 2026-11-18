import "server-only";

import { Schema, model, models, type Model, type Types } from "mongoose";

/**
 * `favorites` collection — a saved product marker.
 *
 * The compound unique index makes duplicate saves impossible at the database
 * level, not just in application code (BR-12).
 */

export interface IFavorite {
  _id: Types.ObjectId;
  user: Types.ObjectId;
  product: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const favoriteSchema = new Schema<IFavorite>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: [true, "A favourite must belong to a user."],
    },
    product: {
      type: Schema.Types.ObjectId,
      ref: "Product",
      required: [true, "A favourite must reference a product."],
    },
  },
  { timestamps: true, versionKey: false },
);

// Duplicate-proof: one favourite per (user, product).
favoriteSchema.index({ user: 1, product: 1 }, { unique: true });
// Favourites page ordering.
favoriteSchema.index({ user: 1, createdAt: -1 });
// "How many students saved this?" (future feature).
favoriteSchema.index({ product: 1 });

export const Favorite: Model<IFavorite> =
  (models.Favorite as Model<IFavorite> | undefined) ??
  model<IFavorite>("Favorite", favoriteSchema);
