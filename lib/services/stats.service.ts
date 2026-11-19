import "server-only";

import { Product } from "@/lib/db/models/product.model";
import { User } from "@/lib/db/models/user.model";
import type { Category } from "@/lib/types";

/**
 * Read-only aggregation helpers.
 *
 * The marketplace and landing pages need counts that would be wasteful to
 * derive by paging through `listProducts()` (a `countDocuments`/`aggregate` is a
 * single indexed query). These live in their own service so the product service
 * stays focused on CRUD.
 */

export interface PlatformStats {
  /** Products currently browsable in the marketplace. */
  liveListings: number;
  /** Registered student profiles. */
  students: number;
  /** Available items being given away (BR-8). */
  freeItems: number;
  /** Items marked sold (BR-18). */
  soldItems: number;
}

export async function getPlatformStats(): Promise<PlatformStats> {
  const [liveListings, students, freeItems, soldItems] = await Promise.all([
    Product.countDocuments({ status: "available" }),
    User.countDocuments({}),
    Product.countDocuments({ status: "available", listingType: "free" }),
    Product.countDocuments({ status: "sold" }),
  ]);

  return { liveListings, students, freeItems, soldItems };
}

/** Available listings per category, for the landing page category grid. */
export async function getCategoryCounts(): Promise<
  Partial<Record<Category, number>>
> {
  const rows = await Product.aggregate<{ _id: Category; count: number }>([
    { $match: { status: "available" } },
    { $group: { _id: "$category", count: { $sum: 1 } } },
  ]);

  const counts: Partial<Record<Category, number>> = {};
  for (const row of rows) {
    counts[row._id] = row.count;
  }
  return counts;
}
