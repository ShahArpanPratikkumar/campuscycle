import { z } from "zod";
import { CONTACT_PREFERENCE_VALUES } from "@/lib/db/enums";
import { paginationShape } from "@/lib/validators/common";

/**
 * Zod schemas for the `User` (student) resource.
 *
 * This is the legacy public profile resource: it has no password field. The
 * acting user is resolved from the authenticated session cookie, never from a
 * client-supplied id.
 */

/** Lowercase letters, digits and single hyphens; must start/end alphanumeric. */
export const HANDLE_PATTERN = /^[a-z0-9][a-z0-9-]{1,38}[a-z0-9]$/;

const handleField = z
  .string()
  .trim()
  .toLowerCase()
  .min(3, "Handles are at least 3 characters.")
  .max(40, "Handles are at most 40 characters.")
  .regex(
    HANDLE_PATTERN,
    "Use lowercase letters, numbers and hyphens only (e.g. aarav-7f2c).",
  );

const displayNameField = z
  .string()
  .trim()
  .min(2, "Display names are at least 2 characters.")
  .max(60, "Display names are at most 60 characters.");

const emailField = z.string().trim().toLowerCase().pipe(z.email());

const campusField = z
  .string()
  .trim()
  .min(2, "Campus names are at least 2 characters.")
  .max(80, "Campus names are at most 80 characters.");

const contactPreferenceSchema = z.enum(CONTACT_PREFERENCE_VALUES);

export const createUserSchema = z.object({
  /** Optional — a unique handle is generated from `displayName` when omitted. */
  handle: handleField.optional(),
  displayName: displayNameField,
  email: emailField,
  campus: campusField,
  department: z.string().trim().max(80, "Departments are at most 80 characters.").optional(),
  year: z.number().int().min(1).max(5).optional(),
  bio: z.string().trim().max(300, "Bios are at most 300 characters.").optional(),
  avatarUrl: z.url("Avatar must be a valid URL.").optional(),
  contactPreference: contactPreferenceSchema.optional(),
});

export const updateUserSchema = z.object({
  displayName: displayNameField.optional(),
  campus: campusField.optional(),
  department: z.string().trim().max(80).nullable().optional(),
  year: z.number().int().min(1).max(5).nullable().optional(),
  bio: z.string().trim().max(300).nullable().optional(),
  avatarUrl: z.url("Avatar must be a valid URL.").nullable().optional(),
  contactPreference: contactPreferenceSchema.nullable().optional(),
});

export const userQuerySchema = z.object({
  q: z.string().trim().max(100, "Search terms are at most 100 characters.").optional(),
  ...paginationShape,
});

export type CreateUserInput = z.output<typeof createUserSchema>;
export type UpdateUserInput = z.output<typeof updateUserSchema>;
export type UserQuery = z.output<typeof userQuerySchema>;
