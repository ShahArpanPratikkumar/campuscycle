import "server-only";

import type { NextRequest } from "next/server";
import { ApiError } from "@/lib/api/errors";
import { sessionErrorMessage, verifySessionToken } from "@/lib/auth/jwt";
import { AUTH_COOKIE } from "@/lib/auth/constants";
import { User, type IUser } from "@/lib/db/models/user.model";

/**
 * Actor resolution for every write endpoint.
 *
 * The acting student comes ONLY from the verified HTTP-only session cookie.
 * A client-supplied id (header, query or body) is ignored, so a buyer cannot
 * impersonate another seller when creating or editing a listing.
 */
export async function requireActor(request: NextRequest): Promise<IUser> {
  const token = request.cookies.get(AUTH_COOKIE)?.value;

  if (!token) {
    throw ApiError.unauthorized("Please log in to continue.");
  }

  let payload: ReturnType<typeof verifySessionToken>;
  try {
    payload = verifySessionToken(token);
  } catch (error) {
    throw ApiError.unauthorized(sessionErrorMessage(error));
  }

  const user = await User.findById(payload.userId).lean();
  if (!user) {
    throw ApiError.unauthorized("This account no longer exists. Please log in again.");
  }

  return user as IUser;
}
