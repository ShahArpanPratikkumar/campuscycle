/**
 * Browser-side API client.
 *
 * Every client mutation goes through `fetchJson`, which:
 *   1. sends the HTTP-only session cookie with a same-origin request (the
 *      browser does this automatically — no token is read or attached),
 *   2. parses the standard `{ success, data | error, code, details }` envelope,
 *   3. throws a typed `ApiClientError` on any non-success response.
 *
 * Keeping the envelope handling in one place means forms never have to know
 * about status codes, and every error message the UI shows comes straight from
 * the server rather than a hand-written guess.
 *
 * This module is intentionally free of `server-only` so client components can
 * import it. It is never imported by a Server Component.
 */

export interface ApiErrorDetail {
  field: string;
  message: string;
}

interface ApiEnvelope<T> {
  success: boolean;
  data?: T;
  error?: string;
  code?: string;
  details?: ApiErrorDetail[];
}

export class ApiClientError extends Error {
  readonly status: number;
  readonly code: string;
  readonly details?: ApiErrorDetail[];

  constructor(
    status: number,
    code: string,
    message: string,
    details?: ApiErrorDetail[],
  ) {
    super(message);
    this.name = "ApiClientError";
    this.status = status;
    this.code = code;
    this.details = details;
  }

  /** Field-level messages keyed by field name, for inline form errors. */
  fieldErrors(): Record<string, string> {
    const errors: Record<string, string> = {};
    for (const detail of this.details ?? []) {
      if (detail.field && !(detail.field in errors)) {
        errors[detail.field] = detail.message;
      }
    }
    return errors;
  }
}

export async function fetchJson<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const init = options;

  const headers = new Headers(init.headers);
  headers.set("accept", "application/json");
  if (init.body && !headers.has("content-type")) {
    headers.set("content-type", "application/json");
  }

  let response: Response;
  try {
    response = await fetch(path, {
      ...init,
      headers,
      credentials: "same-origin",
    });
  } catch {
    throw new ApiClientError(
      0,
      "NETWORK_ERROR",
      "Could not reach the server. Check your connection and try again.",
    );
  }

  const text = await response.text();
  let payload: ApiEnvelope<T> | null = null;
  if (text.length > 0) {
    try {
      payload = JSON.parse(text) as ApiEnvelope<T>;
    } catch {
      payload = null;
    }
  }

  if (!response.ok || !payload || payload.success !== true) {
    throw new ApiClientError(
      response.status,
      payload?.code ?? "INTERNAL_ERROR",
      payload?.error ?? `The request failed (HTTP ${response.status}).`,
      payload?.details,
    );
  }

  return payload.data as T;
}
