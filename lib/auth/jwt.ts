import jwt, {
  JsonWebTokenError,
  NotBeforeError,
  TokenExpiredError,
  type JwtPayload,
} from "jsonwebtoken";
import {
  REMEMBER_MAX_AGE_SECONDS,
  SESSION_MAX_AGE_SECONDS,
} from "@/lib/auth/constants";

/**
 * JWT creation/verification.
 *
 * This module is imported only by server code (Route Handlers, server session
 * helpers and the routing proxy). It must never be imported from a client
 * component: the signing secret lives in `JWT_SECRET` and is never inlined into
 * a browser bundle.
 *
 * The payload carries only the minimum needed to identify an account:
 * `userId` and `email`. No password, name, phone or role is stored in the token.
 */

export interface SessionPayload extends JwtPayload {
  userId: string;
  email: string;
}

export type TokenProblem = "expired" | "invalid" | "missing";

export class AuthTokenError extends Error {
  readonly problem: TokenProblem;

  constructor(problem: TokenProblem, message: string) {
    super(message);
    this.name = "AuthTokenError";
    this.problem = problem;
  }
}

function secret(): string {
  const value = process.env.JWT_SECRET;
  if (!value || value.length < 16) {
    // Thrown at request time, not build time, so a missing secret can never
    // silently fall back to a hardcoded value.
    throw new Error(
      "JWT_SECRET is missing or too short. Set it in .env.local (at least 16 characters).",
    );
  }
  return value;
}

export function signSessionToken(
  payload: Pick<SessionPayload, "userId" | "email">,
  remember = false,
): string {
  const lifetime = remember
    ? REMEMBER_MAX_AGE_SECONDS
    : SESSION_MAX_AGE_SECONDS;

  return jwt.sign(
    { userId: payload.userId, email: payload.email.toLowerCase() },
    secret(),
    { algorithm: "HS256", expiresIn: lifetime, issuer: "campuscycle" },
  );
}

export function verifySessionToken(token: string | null | undefined): SessionPayload {
  if (!token) {
    throw new AuthTokenError("missing", "No authentication cookie was provided.");
  }

  try {
    const decoded = jwt.verify(token, secret(), {
      algorithms: ["HS256"],
      issuer: "campuscycle",
    });

    if (
      typeof decoded === "string" ||
      typeof decoded.userId !== "string" ||
      typeof decoded.email !== "string" ||
      decoded.userId.length === 0
    ) {
      throw new JsonWebTokenError("Malformed session payload.");
    }

    return decoded as SessionPayload;
  } catch (error) {
    if (error instanceof AuthTokenError) throw error;
    if (error instanceof TokenExpiredError) {
      throw new AuthTokenError("expired", "Your session has expired. Please log in again.");
    }
    if (error instanceof NotBeforeError || error instanceof JsonWebTokenError) {
      throw new AuthTokenError("invalid", "Your session is not valid. Please log in again.");
    }
    throw new AuthTokenError("invalid", "Your session could not be verified.");
  }
}

/** Lightweight boolean check used by the routing proxy. */
export function isSessionTokenValid(token: string | null | undefined): boolean {
  try {
    verifySessionToken(token);
    return true;
  } catch {
    return false;
  }
}

export function sessionErrorMessage(error: unknown): string {
  if (error instanceof AuthTokenError) return error.message;
  return "Your session could not be verified. Please log in again.";
}
