/**
 * Authentication constants that are safe to import from anywhere.
 *
 * The cookie *name* is not a secret — the value is an HTTP-only JWT that client
 * JavaScript can neither read nor write. Never put the JWT secret here.
 */
export const AUTH_COOKIE = "campuscycle_session";

/** Default session lifetime (12 hours). */
export const SESSION_MAX_AGE_SECONDS = 60 * 60 * 12;

/** "Remember me" session lifetime (30 days). */
export const REMEMBER_MAX_AGE_SECONDS = 60 * 60 * 24 * 30;
