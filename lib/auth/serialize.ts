import "server-only";

import { Types } from "mongoose";
import type { AuthUser } from "@/lib/auth/types";

/**
 * Converts a User document (hydrated or `.lean()`) into the only shape the
 * browser ever receives. Password/hash fields are deliberately never read here.
 */
export function toAuthUser(input: unknown): AuthUser {
  const user =
    typeof input === "object" && input !== null
      ? (input as Record<string, unknown>)
      : {};

  let id = "";
  const rawId = user._id ?? user.id;
  if (rawId instanceof Types.ObjectId) id = rawId.toString();
  else if (typeof rawId === "string") id = rawId;
  else if (rawId && typeof rawId === "object" && "toString" in rawId) {
    id = String(rawId.toString());
  }

  const name =
    typeof user.name === "string" && user.name.trim().length > 0
      ? user.name
      : typeof user.displayName === "string"
        ? user.displayName
        : "";

  const avatar =
    typeof user.avatar === "string" && user.avatar.length > 0
      ? user.avatar
      : typeof user.avatarUrl === "string" && user.avatarUrl.length > 0
        ? user.avatarUrl
        : null;

  return {
    id,
    name,
    email: typeof user.email === "string" ? user.email : "",
    phone: typeof user.phone === "string" && user.phone.length > 0 ? user.phone : undefined,
    avatar,
  };
}
