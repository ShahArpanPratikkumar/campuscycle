import "server-only";

import mongoose from "mongoose";
import { NextResponse, type NextRequest } from "next/server";
import { ZodError } from "zod";
import { ApiError, type ApiErrorDetail } from "@/lib/api/errors";
import { jsonError } from "@/lib/api/response";
import { connectToDatabase } from "@/lib/db/connect";

/**
 * Route-handler wrapper.
 *
 * Every API route is exported as `withErrorHandler(handler)`. The wrapper:
 *   1. ensures the database is connected (once per process),
 *   2. runs the handler,
 *   3. translates *any* thrown error into the standard error envelope.
 *
 * That last part is the important one — handlers throw `ApiError` and never
 * build error responses themselves, and Mongoose/Zod errors are mapped
 * centrally so the client always gets a predictable shape and status code.
 */

export type ApiHandler<C = unknown> = (
  request: NextRequest,
  context: C,
) => Promise<Response> | Response;

export function withErrorHandler<C = unknown>(
  handler: ApiHandler<C>,
): ApiHandler<C> {
  return async (request, context) => {
    try {
      await connectToDatabase();
      return await handler(request, context);
    } catch (error) {
      return toErrorResponse(error, request);
    }
  };
}

/* -------------------------------------------------------------------------- */
/*  Error translation                                                          */
/* -------------------------------------------------------------------------- */

function zodDetails(error: ZodError): ApiErrorDetail[] {
  return error.issues.map((issue) => ({
    field: issue.path.length > 0 ? issue.path.join(".") : "(body)",
    message: issue.message,
  }));
}

interface DuplicateKeyError {
  code: number;
  keyValue?: Record<string, unknown>;
}

function isDuplicateKeyError(error: unknown): error is DuplicateKeyError {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    (error as { code?: unknown }).code === 11000
  );
}

/** Maps a thrown value to the documented error envelope. */
export function toErrorResponse(
  error: unknown,
  request?: NextRequest,
): NextResponse {
  if (error instanceof ApiError) {
    return jsonError(error);
  }

  if (error instanceof ZodError) {
    return jsonError(
      ApiError.validation(zodDetails(error), "One or more fields are invalid."),
    );
  }

  if (error instanceof mongoose.Error.ValidationError) {
    const details: ApiErrorDetail[] = Object.values(error.errors).map(
      (issue) => ({ field: issue.path, message: issue.message }),
    );
    return jsonError(
      ApiError.validation(details, "The document failed schema validation."),
    );
  }

  if (error instanceof mongoose.Error.CastError) {
    return jsonError(
      ApiError.invalidId(`"${String(error.value)}" is not a valid ${error.kind}.`),
    );
  }

  if (isDuplicateKeyError(error)) {
    const field = error.keyValue ? Object.keys(error.keyValue).join(", ") : undefined;
    return jsonError(
      ApiError.duplicate(
        field
          ? `A record with that ${field} already exists.`
          : "That record already exists.",
      ),
    );
  }

  // Database connection failures must return a safe 500 without echoing the
  // connection string or driver internals.
  const errorName =
    typeof error === "object" && error !== null && "name" in error
      ? String((error as { name?: unknown }).name)
      : "";
  if (
    errorName.includes("MongoServerSelection") ||
    errorName.includes("MongooseServerSelection") ||
    errorName.includes("MongoNetwork") ||
    errorName.includes("MongoTimeout")
  ) {
    return jsonError(
      ApiError.internal("The database is temporarily unavailable. Please try again later."),
    );
  }

  // Unknown failure: log the details server-side, return a generic message so
  // stack traces and connection strings never reach the client.
  console.error(
    `[api] Unhandled error on ${request?.method ?? "REQUEST"} ${request?.nextUrl.pathname ?? "unknown"}:`,
    error,
  );
  return jsonError(ApiError.internal());
}
