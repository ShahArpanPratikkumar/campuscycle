import "server-only";

import type { QueryFilter } from "mongoose";
import { ApiError } from "@/lib/api/errors";
import type { Paginated } from "@/lib/api/query";
import { isValidObjectId } from "@/lib/db/object-id";
import { User, type IUser } from "@/lib/db/models/user.model";
import { serializeUser, type UserDto } from "@/lib/db/serialize";
import { escapeRegex } from "@/lib/utils/regex";
import type { CreateUserInput, UserQuery } from "@/lib/validators/user";

/**
 * `User` service — profile creation and lookup.
 *
 * Legacy profile creation/lookup. Public profile data remains readable, but the
 * acting user for authenticated writes is resolved from the session cookie.
 */

const HANDLE_ALPHABET = "0123456789abcdef";

/** 4 random hex characters, enough to make a generated handle unique in practice. */
function randomHandleSuffix(): string {
  let suffix = "";
  for (let index = 0; index < 4; index += 1) {
    suffix += HANDLE_ALPHABET[Math.floor(Math.random() * HANDLE_ALPHABET.length)];
  }
  return suffix;
}

/** `"Aarav Sharma"` → `"aarav-sharma"` (falls back to `"student"`). */
function slugifyHandle(displayName: string): string {
  const base = displayName
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 28);

  return base.length >= 3 ? base : "student";
}

/** Retries with a random suffix until the handle is free. */
export async function generateUniqueHandle(displayName: string): Promise<string> {
  const base = slugifyHandle(displayName);

  for (let attempt = 0; attempt < 6; attempt += 1) {
    const candidate = attempt === 0 ? base : `${base}-${randomHandleSuffix()}`;
    const taken = await User.exists({ handle: candidate });
    if (!taken) return candidate;
  }

  // The unique index is the real guarantee; this is just a last resort.
  return `${base}-${randomHandleSuffix()}`;
}

export async function createUser(input: CreateUserInput): Promise<UserDto> {
  const handle = input.handle ?? (await generateUniqueHandle(input.displayName));

  const user = await User.create({
    handle,
    displayName: input.displayName,
    email: input.email,
    campus: input.campus,
    department: input.department,
    year: input.year,
    bio: input.bio,
    avatarUrl: input.avatarUrl,
    contactPreference: input.contactPreference,
    stats: { activeListings: 0, soldCount: 0 },
  });

  return serializeUser(user.toObject());
}

export async function listUsers(
  query: UserQuery,
): Promise<Paginated<UserDto>> {
  const { page, limit, q } = query;
  const filter: QueryFilter<IUser> = {};

  if (q) {
    const pattern = new RegExp(escapeRegex(q), "i");
    filter.$or = [
      { displayName: pattern },
      { handle: pattern },
      { campus: pattern },
    ];
  }

  const [total, users] = await Promise.all([
    User.countDocuments(filter),
    User.find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean(),
  ]);

  return {
    items: users.map(serializeUser),
    meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
  };
}

/** Reads one student profile. Throws `404 NOT_FOUND` when it does not exist. */
export async function getUserById(id: string): Promise<UserDto> {
  if (!isValidObjectId(id)) {
    throw ApiError.invalidId("That student id is not a valid ObjectId.");
  }

  const user = await User.findById(id).lean();

  if (!user) {
    throw ApiError.notFound("That student profile does not exist.");
  }

  return serializeUser(user);
}
