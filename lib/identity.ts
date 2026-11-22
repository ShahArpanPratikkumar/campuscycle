/**
 * Client identity.
 *
 * Legacy, no longer used by the application. Identity is now resolved from the
 * HTTP-only JWT cookie by `lib/auth/session.ts` and `lib/api/actor.ts`.
 *
 * These helpers are kept only so older imports do not break; they must not be
 * used for authentication or authorization. A client-supplied student id is
 * never trusted by the API.
 *
 * The module is deliberately free of React/Next imports so both the API client
 * and the `/setup` flow can share it. Everything touching `document` is guarded
 * so an accidental server import is a no-op rather than a crash.
 */

export const STUDENT_COOKIE = "campuscycle_student_id";

const OBJECT_ID_PATTERN = /^[0-9a-fA-F]{24}$/;
const ONE_YEAR_SECONDS = 60 * 60 * 24 * 365;

export function isValidStudentId(value: string | null | undefined): value is string {
  return typeof value === "string" && OBJECT_ID_PATTERN.test(value);
}

/** Reads the acting student id from the browser cookie, or `null`. */
export function readStudentId(): string | null {
  if (typeof document === "undefined") return null;

  const prefix = `${STUDENT_COOKIE}=`;
  const entry = document.cookie
    .split(";")
    .map((part) => part.trim())
    .find((part) => part.startsWith(prefix));

  if (!entry) return null;

  const raw = decodeURIComponent(entry.slice(prefix.length));
  return isValidStudentId(raw) ? raw : null;
}

/** Persists the acting student id. */
export function writeStudentId(id: string): void {
  if (typeof document === "undefined" || !isValidStudentId(id)) return;

  document.cookie = [
    `${STUDENT_COOKIE}=${encodeURIComponent(id)}`,
    "path=/",
    `max-age=${ONE_YEAR_SECONDS}`,
    "samesite=lax",
  ].join("; ");
}

/** Clears the acting student id. */
export function clearStudentId(): void {
  if (typeof document === "undefined") return;
  document.cookie = `${STUDENT_COOKIE}=; path=/; max-age=0; samesite=lax`;
}
