import "server-only";

import { Schema, model, models, type Model, type Types } from "mongoose";
import { hashPassword, isHashedPassword } from "@/lib/auth/password";
import { CONTACT_PREFERENCE_VALUES } from "@/lib/db/enums";
import type { ContactPreference } from "@/lib/types";

/**
 * `users` collection — a student's profile and authentication anchor.
 *
 * The original profile fields are preserved so every existing marketplace
 * feature keeps working. The account fields required by authentication
 * (`name`, `phone`, `password`, `avatar`) are additive. `password` is selected
 * out by default and hashed by a schema hook, so no API response can leak it
 * accidentally. Identity is now resolved from the HTTP-only JWT cookie (see
 * `lib/auth/session.ts`), never from a client-supplied id.
 */

export interface IUserStats {
  activeListings: number;
  soldCount: number;
}

export interface IUser {
  _id: Types.ObjectId;
  handle: string;
  displayName: string;
  /** Full name captured at registration (mirrors `displayName` for the UI). */
  name?: string;
  email: string;
  /** Phone number captured at registration. */
  phone?: string;
  /** Bcrypt hash. Never selected by default and never serialised to the client. */
  password?: string;
  /** Optional account avatar (separate from the legacy profile `avatarUrl`). */
  avatar?: string;
  campus: string;
  department?: string;
  year?: number;
  bio?: string;
  avatarUrl?: string;
  /** How the seller prefers to be contacted (a preference, never raw details). */
  contactPreference?: ContactPreference;
  stats: IUserStats;
  createdAt: Date;
  updatedAt: Date;
}

const userSchema = new Schema<IUser>(
  {
    handle: {
      type: String,
      required: [true, "A handle is required."],
      unique: true,
      lowercase: true,
      trim: true,
      minlength: [3, "Handles are at least 3 characters."],
      maxlength: [40, "Handles are at most 40 characters."],
    },
    displayName: {
      type: String,
      required: [true, "A display name is required."],
      trim: true,
      minlength: [2, "Display names are at least 2 characters."],
      maxlength: [60, "Display names are at most 60 characters."],
    },
    name: {
      type: String,
      trim: true,
      minlength: [2, "Names are at least 2 characters."],
      maxlength: [60, "Names are at most 60 characters."],
    },
    email: {
      type: String,
      required: [true, "An email is required."],
      unique: true,
      lowercase: true,
      trim: true,
      set: (value: string) =>
        typeof value === "string" ? value.trim().toLowerCase() : value,
    },
    phone: {
      type: String,
      trim: true,
      maxlength: [20, "Phone numbers are at most 20 characters."],
    },
    password: {
      type: String,
      select: false,
      validate: {
        validator: (value: string | undefined) =>
          !value || isHashedPassword(value),
        message: "Passwords must be hashed before storage.",
      },
    },
    avatar: {
      type: String,
      trim: true,
    },
    campus: {
      type: String,
      required: [true, "A campus is required."],
      trim: true,
      minlength: [2, "Campus names are at least 2 characters."],
      maxlength: [80, "Campus names are at most 80 characters."],
    },
    department: { type: String, trim: true, maxlength: 80 },
    year: { type: Number, min: 1, max: 5 },
    bio: { type: String, trim: true, maxlength: 300 },
    avatarUrl: { type: String, trim: true },
    contactPreference: {
      type: String,
      enum: CONTACT_PREFERENCE_VALUES,
      default: "message",
    },
    stats: {
      activeListings: { type: Number, default: 0, min: 0 },
      soldCount: { type: Number, default: 0, min: 0 },
    },
  },
  {
    timestamps: true,
    versionKey: false,
    toJSON: {
      transform(_document, result: Record<string, unknown>) {
        // Belt-and-braces: even an explicitly selected hash never leaves a JSON
        // response, no matter which serializer a future route happens to use.
        delete result.password;
        return result;
      },
    },
  },
);

// Normalise identity fields and hash passwords before any write. The validator
// above then guarantees that only a bcrypt hash can ever be persisted.
userSchema.pre("validate", async function next() {
  if (typeof this.email === "string") {
    this.email = this.email.trim().toLowerCase();
  }
  if (!this.name && this.displayName) this.name = this.displayName;
  if (!this.displayName && this.name) this.displayName = this.name;

  if (
    typeof this.password === "string" &&
    this.password.length > 0 &&
    !isHashedPassword(this.password)
  ) {
    this.password = await hashPassword(this.password);
  }
});

// `unique: true` above already creates the handle/email indexes.
userSchema.index({ createdAt: -1 });

export const User: Model<IUser> =
  (models.User as Model<IUser> | undefined) ?? model<IUser>("User", userSchema);
