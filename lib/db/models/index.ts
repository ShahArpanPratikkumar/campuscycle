/**
 * Barrel file for the Mongoose models.
 *
 * Importing from `@/lib/db/models` guarantees every model is registered before
 * a `populate()` call runs, which avoids the classic
 * "Schema hasn't been registered for model X" error.
 */

export { User, type IUser, type IUserStats } from "@/lib/db/models/user.model";
export { Product, type IProduct } from "@/lib/db/models/product.model";
export {
  Enquiry,
  type IEnquiry,
  type IEnquiryResponse,
} from "@/lib/db/models/enquiry.model";
export { Offer, type IOffer } from "@/lib/db/models/offer.model";
export { Favorite, type IFavorite } from "@/lib/db/models/favorite.model";
