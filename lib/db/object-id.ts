import { Types } from "mongoose";

const OBJECT_ID_PATTERN = /^[0-9a-fA-F]{24}$/;

/**
 * Strict ObjectId guard.
 *
 * `mongoose.Types.ObjectId.isValid` accepts any 12-character string, which
 * would let a request like `/api/products/abcdefghijkl` reach the database and
 * fail later. This checks the real 24-hex-character shape instead, so bad ids
 * are rejected at the edge with `400 INVALID_ID`.
 */
export function isValidObjectId(value: unknown): value is string {
  return typeof value === "string" && OBJECT_ID_PATTERN.test(value);
}

export function toObjectId(value: string): Types.ObjectId {
  return new Types.ObjectId(value);
}
