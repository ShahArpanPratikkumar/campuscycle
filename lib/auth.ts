import "server-only";

import { ApiError } from "@/lib/api/errors";
import {
  getSessionActor,
  getSessionUser,
  requireSessionUser,
} from "@/lib/auth/session";
import type { AuthUser } from "@/lib/auth/types";
import type { IUser } from "@/lib/db/models/user.model";

/**
 * Server-side authentication helpers.
 *
 * These are thin wrappers around the project's session implementation
 * (`lib/auth/session.ts`, cookie-based JWT auth). API routes and server
 * components should use these (or `requireActor`) instead of duplicating
 * cookie parsing or JWT verification.
 */

/** Returns the authenticated user (safe fields only), or `null` if unauthenticated. */
export async function getAuthenticatedUser(): Promise<AuthUser | null> {
  return getSessionUser();
}

/** Returns the authenticated user (safe fields only), or throws 401. */
export async function requireAuth(): Promise<AuthUser> {
  const user = await requireSessionUser();
  if (!user) {
    throw ApiError.unauthorized("Please log in to continue.");
  }
  return user;
}

/** Returns the authenticated Mongoose user document for server-side ownership checks. */
export async function getAuthenticatedActor(): Promise<IUser | null> {
  return getSessionActor();
}
