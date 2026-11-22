import "server-only";

import { ApiError } from "@/lib/api/errors";
import { getSessionActor, getSessionUser } from "@/lib/auth/session";
import type { AuthUser } from "@/lib/auth/types";
import { getUserById } from "@/lib/services/user.service";
import type { UserDto } from "@/lib/db/serialize";
import type { IUser } from "@/lib/db/models/user.model";

/**
 * Server Component identity helpers.
 *
 * These used to read a plain, editable student-id cookie. They now resolve the
 * authenticated user from the HTTP-only JWT cookie, so RSC pages and API routes
 * agree on who the actor is. `null` means "not authenticated".
 */

export async function getCurrentStudentId(): Promise<string | null> {
  const user = await getSessionUser();
  return user?.id ?? null;
}

/** Resolves the current authenticated user's safe account data, or `null`. */
export async function getCurrentUser(): Promise<AuthUser | null> {
  return getSessionUser();
}

/** Resolves the current student's full marketplace profile, or `null`. */
export async function getCurrentStudent(): Promise<UserDto | null> {
  const user = await getSessionUser();
  if (!user) return null;

  try {
    return await getUserById(user.id);
  } catch {
    // A deleted profile must not crash a page.
    return null;
  }
}

/**
 * Resolves the current student as the raw actor document the services expect.
 * This is the Server Component equivalent of `requireActor`.
 */
export async function getCurrentActor(): Promise<IUser | null> {
  return getSessionActor();
}

/** Server-side guard for protected layouts/pages. */
export async function requireCurrentStudent(): Promise<AuthUser> {
  const user = await getSessionUser();
  if (!user) {
    throw ApiError.unauthorized("Please log in to continue.");
  }
  return user;
}
