import "server-only";

import { ApiError } from "@/lib/api/errors";
import { verifyPassword } from "@/lib/auth/password";
import { signSessionToken } from "@/lib/auth/jwt";
import { toAuthUser } from "@/lib/auth/serialize";
import type { AuthUser } from "@/lib/auth/types";
import { User } from "@/lib/db/models/user.model";
import { generateUniqueHandle } from "@/lib/services/user.service";
import type { LoginInput, RegisterInput } from "@/lib/validators/auth";

/**
 * Authentication business logic.
 *
 * Every password is hashed by the User schema hook before `create()` persists
 * it, and only `toAuthUser()` is ever returned to a route handler — so a hash
 * cannot leak through an API response.
 */

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

function isDuplicateKeyError(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    (error as { code?: unknown }).code === 11000
  );
}

export interface RegisterResult {
  user: AuthUser;
}

export interface LoginResult {
  user: AuthUser;
  token: string;
}

export async function registerUser(input: RegisterInput): Promise<RegisterResult> {
  const email = normalizeEmail(input.email);

  if (await User.exists({ email })) {
    throw ApiError.duplicate("An account with this email already exists.");
  }

  try {
    const handle = await generateUniqueHandle(input.name);

    // `campus` is required by the existing profile schema. Registration only
    // asks for account fields, so a neutral default is used; the rest of the
    // profile remains exactly as the marketplace expects it.
    const user = await User.create({
      handle,
      displayName: input.name,
      name: input.name,
      email,
      phone: input.phone,
      password: input.password,
      avatar: input.avatar,
      avatarUrl: input.avatar,
      campus: "Campus",
      contactPreference: "message",
      stats: { activeListings: 0, soldCount: 0 },
    });

    return { user: toAuthUser(user.toObject()) };
  } catch (error) {
    if (isDuplicateKeyError(error)) {
      throw ApiError.duplicate("An account with this email already exists.");
    }
    throw error;
  }
}

export async function loginUser(input: LoginInput): Promise<LoginResult> {
  const email = normalizeEmail(input.email);

  // `+password` is required because the field is `select: false` by default.
  const user = await User.findOne({ email }).select("+password").lean();

  // The same generic message is used for an unknown email, a legacy profile
  // without a password, and a wrong password — no account enumeration.
  const invalid = () =>
    ApiError.unauthorized("Invalid email or password.");

  if (!user || typeof user.password !== "string" || user.password.length === 0) {
    throw invalid();
  }

  const matches = await verifyPassword(input.password, user.password);
  if (!matches) throw invalid();

  const safeUser = toAuthUser(user);
  const token = signSessionToken(
    { userId: safeUser.id, email: safeUser.email },
    input.remember,
  );

  return { user: safeUser, token };
}
