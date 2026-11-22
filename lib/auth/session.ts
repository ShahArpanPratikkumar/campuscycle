import "server-only";

import { cookies } from "next/headers";
import { ApiError } from "@/lib/api/errors";
import { AUTH_COOKIE } from "@/lib/auth/constants";
import {
  AuthTokenError,
  sessionErrorMessage,
  verifySessionToken,
  type SessionPayload,
} from "@/lib/auth/jwt";
import { toAuthUser } from "@/lib/auth/serialize";
import type { AuthUser } from "@/lib/auth/types";
import { User, type IUser } from "@/lib/db/models/user.model";

/**
 * Server-side session resolution.
 *
 * The HTTP-only cookie is the single source of truth. Client JavaScript never
 * sees the JWT, and a client-supplied user id (header or body) is never trusted.
 */

export async function getSessionToken(): Promise<string | null> {
  const store = await cookies();
  return store.get(AUTH_COOKIE)?.value ?? null;
}

export async function setSessionCookie(
  token: string,
  remember: boolean,
): Promise<void> {
  const store = await cookies();
  store.set({
    name: AUTH_COOKIE,
    value: token,
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: remember
      ? 60 * 60 * 24 * 30
      : 60 * 60 * 12,
  });
}

export async function clearSessionCookie(): Promise<void> {
  const store = await cookies();
  store.delete(AUTH_COOKIE);
}

/** Returns the verified payload, or `null` for missing/expired/invalid tokens. */
export async function getSessionPayload(): Promise<SessionPayload | null> {
  const token = await getSessionToken();
  try {
    return verifySessionToken(token);
  } catch {
    return null;
  }
}

/** Returns safe public user data for the current session, or `null`. */
export async function getSessionUser(): Promise<AuthUser | null> {
  const payload = await getSessionPayload();
  if (!payload) return null;

  try {
    const user = await User.findById(payload.userId).lean();
    return user ? toAuthUser(user) : null;
  } catch {
    // A stale session (deleted account, DB reset) is simply "not logged in".
    return null;
  }
}

/** Returns the raw actor document services expect, or `null` when unauthenticated. */
export async function getSessionActor(): Promise<IUser | null> {
  const payload = await getSessionPayload();
  if (!payload) return null;

  try {
    const user = await User.findById(payload.userId).lean();
    return (user as IUser | null) ?? null;
  } catch {
    return null;
  }
}

/** Throws a 401 when there is no valid session (used by protected server code). */
export async function requireSessionUser(): Promise<AuthUser> {
  const token = await getSessionToken();
  if (!token) {
    throw ApiError.unauthorized("Please log in to continue.");
  }

  let payload: SessionPayload;
  try {
    payload = verifySessionToken(token);
  } catch (error) {
    throw ApiError.unauthorized(sessionErrorMessage(error));
  }

  try {
    const user = await User.findById(payload.userId).lean();
    if (!user) {
      throw ApiError.unauthorized("This account no longer exists. Please log in again.");
    }
    return toAuthUser(user);
  } catch (error) {
    if (error instanceof ApiError) throw error;
    throw ApiError.internal("The account could not be loaded.");
  }
}

/** Re-exported so auth routes can distinguish an expired token from a bad one. */
export { AuthTokenError };
