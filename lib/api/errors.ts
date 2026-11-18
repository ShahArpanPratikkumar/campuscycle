/**
 * Typed API errors + the shared error-code table.
 *
 * Every failure path in the API throws (or is translated into) an `ApiError`.
 * `withErrorHandler` (see `lib/api/handler.ts`) turns it into the standard
 * error envelope, so route handlers never build error responses by hand.
 *
 * The code → HTTP status mapping follows `docs/ARCHITECTURE.md` §16.
 */

export const ERROR_CODES = {
  /** 400 — body or query failed schema validation. */
  VALIDATION_ERROR: "VALIDATION_ERROR",
  /** 400 — a path/body identifier is not a valid ObjectId. */
  INVALID_ID: "INVALID_ID",
  /** 404 — the resource does not exist (or was soft-deleted). */
  NOT_FOUND: "NOT_FOUND",
  /** 401 — missing, expired or invalid authentication session. */
  UNAUTHORIZED_ACTOR: "UNAUTHORIZED_ACTOR",
  /** 403 — the actor is not the owner/addressee. */
  FORBIDDEN: "FORBIDDEN",
  /** 409 — a unique constraint was violated. */
  DUPLICATE: "DUPLICATE",
  /** 409 — the listing is not `available`. */
  LISTING_UNAVAILABLE: "LISTING_UNAVAILABLE",
  /** 422 — a business rule (BR-x) was broken. */
  RULE_VIOLATION: "RULE_VIOLATION",
  /** 500 — anything unexpected. */
  INTERNAL_ERROR: "INTERNAL_ERROR",
} as const;

export type ErrorCode = keyof typeof ERROR_CODES;

export interface ApiErrorDetail {
  field: string;
  message: string;
}

export class ApiError extends Error {
  readonly statusCode: number;
  readonly code: ErrorCode;
  readonly details?: ApiErrorDetail[];

  constructor(
    statusCode: number,
    code: ErrorCode,
    message: string,
    details?: ApiErrorDetail[],
  ) {
    super(message);
    this.name = "ApiError";
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
    Error.captureStackTrace?.(this, ApiError);
  }

  /* ---------------------------------------------------------------------- */
  /*  Factory helpers — one per documented error code                        */
  /* ---------------------------------------------------------------------- */

  static validation(
    details: ApiErrorDetail[],
    message = "The request body failed validation.",
  ): ApiError {
    return new ApiError(400, "VALIDATION_ERROR", message, details);
  }

  static invalidId(message = "That identifier is not a valid ObjectId."): ApiError {
    return new ApiError(400, "INVALID_ID", message);
  }

  static notFound(message = "The requested resource was not found."): ApiError {
    return new ApiError(404, "NOT_FOUND", message);
  }

  static unauthorized(
    message = "Authentication is required.",
  ): ApiError {
    return new ApiError(401, "UNAUTHORIZED_ACTOR", message);
  }

  static forbidden(message = "You do not have permission to do that."): ApiError {
    return new ApiError(403, "FORBIDDEN", message);
  }

  static duplicate(message = "That resource already exists."): ApiError {
    return new ApiError(409, "DUPLICATE", message);
  }

  static listingUnavailable(
    message = "This listing is no longer available.",
  ): ApiError {
    return new ApiError(409, "LISTING_UNAVAILABLE", message);
  }

  static ruleViolation(message: string, details?: ApiErrorDetail[]): ApiError {
    return new ApiError(422, "RULE_VIOLATION", message, details);
  }

  static internal(message = "Something went wrong on the server."): ApiError {
    return new ApiError(500, "INTERNAL_ERROR", message);
  }
}

/**
 * True when an error means "this resource does not exist / is not addressable",
 * as opposed to a genuine failure (a dropped database connection, a bad query).
 *
 * Server Components use this to decide between `notFound()` (a real 404) and
 * re-throwing so the route's `error.tsx` boundary handles it — a database outage
 * must never masquerade as "this listing was removed".
 */
export function isNotFoundError(error: unknown): boolean {
  return (
    error instanceof ApiError &&
    (error.code === "NOT_FOUND" || error.code === "INVALID_ID")
  );
}
