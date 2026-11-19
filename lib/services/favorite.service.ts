import "server-only";

import { ApiError } from "@/lib/api/errors";
import { isValidObjectId } from "@/lib/db/object-id";
import { Favorite } from "@/lib/db/models/favorite.model";
import { Product } from "@/lib/db/models/product.model";
import { type IUser } from "@/lib/db/models/user.model";
import { serializeFavorite, type FavoriteDto } from "@/lib/db/serialize";

/**
 * `Favorite` service — saved products.
 *
 * Business rules implemented here:
 *   BR-5  you cannot save your own product
 *   BR-12 a product can only be saved once per student (unique index)
 *   BR-17 favourites pointing at sold/deleted products are never auto-removed;
 *         the serializer derives an `availability` label instead.
 */

const FAVORITE_POPULATE = {
  path: "product",
  populate: { path: "seller", select: "handle displayName campus avatarUrl" },
};

export async function listFavorites(actor: IUser): Promise<FavoriteDto[]> {
  const favorites = await Favorite.find({ user: actor._id })
    .sort({ createdAt: -1 })
    .populate(FAVORITE_POPULATE)
    .lean();

  return favorites.map(serializeFavorite);
}

export async function addFavorite(
  actor: IUser,
  productId: string,
): Promise<FavoriteDto> {
  if (!isValidObjectId(productId)) {
    throw ApiError.invalidId("That product id is not a valid ObjectId.");
  }

  const product = await Product.findOne({
    _id: productId,
    status: { $ne: "deleted" },
  });

  if (!product) {
    throw ApiError.notFound("That product does not exist or has been removed.");
  }

  // BR-5
  if (String(product.seller) === String(actor._id)) {
    throw ApiError.forbidden("You cannot save your own product.");
  }

  // BR-12: checked here for a friendly message; the unique index is the
  // real guarantee against a double-click race.
  const existing = await Favorite.findOne({
    user: actor._id,
    product: product._id,
  });
  if (existing) {
    throw ApiError.duplicate("You have already saved this product.");
  }

  const favorite = await Favorite.create({
    user: actor._id,
    product: product._id,
  });

  const populated = await Favorite.findById(favorite._id)
    .populate(FAVORITE_POPULATE)
    .lean();

  return serializeFavorite(populated ?? favorite.toObject());
}

export async function removeFavorite(
  actor: IUser,
  productId: string,
): Promise<{ productId: string; removed: true }> {
  if (!isValidObjectId(productId)) {
    throw ApiError.invalidId("That product id is not a valid ObjectId.");
  }

  const removed = await Favorite.findOneAndDelete({
    user: actor._id,
    product: productId,
  });

  if (!removed) {
    throw ApiError.notFound("That product is not in your saved list.");
  }

  return { productId, removed: true };
}
