import { NextResponse } from "next/server";
import { ApiError, type ApiErrorDetail } from "@/lib/api/errors";

/**
 * The single response envelope used by every API route.
 *
 * Success:
 *   { "success": true,  "data": ...,  "meta"?: { page, limit, total, totalPages } }
 *
 * Error:
 *   { "success": false, "error": "...", "code": "VALIDATION_ERROR", "details"?: [...] }
 *
 * `error` is a human-readable string (what the UI shows) while `code` is the
 * stable machine-readable value the client switches on.
 */

export interface ResponseMeta {
  page?: number;
  limit?: number;
  total?: number;
  totalPages?: number;
  /** Echo of the applied filters (browse endpoint). */
  filters?: Record<string, unknown>;
}

export interface SuccessEnvelope<T> {
  success: true;
  data: T;
  /** Optional human-readable confirmation (used by auth endpoints). */
  message?: string;
  meta?: ResponseMeta;
}

export interface ErrorEnvelope {
  success: false;
  error: string;
  code: string;
  details?: ApiErrorDetail[];
}

function envelope<T>(
  data: T,
  meta?: ResponseMeta,
  message?: string,
): SuccessEnvelope<T> {
  return {
    success: true,
    data,
    ...(message ? { message } : {}),
    ...(meta ? { meta } : {}),
  };
}

/** 200 — successful read or update. */
export function jsonOk<T>(
  data: T,
  meta?: ResponseMeta,
  message?: string,
): NextResponse {
  return NextResponse.json(envelope(data, meta, message), { status: 200 });
}

/** 201 — a resource was created. */
export function jsonCreated<T>(
  data: T,
  meta?: ResponseMeta,
  message?: string,
): NextResponse {
  return NextResponse.json(envelope(data, meta, message), { status: 201 });
}

/** Builds the error envelope for an `ApiError` with its mapped status code. */
export function jsonError(error: ApiError): NextResponse {
  const body: ErrorEnvelope = {
    success: false,
    error: error.message,
    code: error.code,
    ...(error.details && error.details.length > 0
      ? { details: error.details }
      : {}),
  };
  return NextResponse.json(body, { status: error.statusCode });
}
