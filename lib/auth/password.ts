import "server-only";

import bcrypt from "bcryptjs";

const SALT_ROUNDS = 12;

/** Hashes a plain-text password with bcrypt. Never store the returned value in the browser. */
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, SALT_ROUNDS);
}

/** Recognises an existing bcrypt hash so schema hooks never hash twice. */
export function isHashedPassword(value: string): boolean {
  return /^\$2[aby]\$\d{2}\$/.test(value);
}

/** Constant-time-ish bcrypt comparison used by the login endpoint. */
export async function verifyPassword(
  password: string,
  hash: string,
): Promise<boolean> {
  try {
    return await bcrypt.compare(password, hash);
  } catch {
    // A corrupt/unsupported hash must be treated as a failed login, never a 500.
    return false;
  }
}
