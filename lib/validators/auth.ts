import { z } from "zod";

/**
 * Server-side validation for the authentication endpoints.
 *
 * The browser repeats some of these checks for instant feedback, but these
 * schemas are authoritative: every request is validated again on the server
 * before it touches MongoDB.
 */

const emailField = z
  .string({ error: "Email is required." })
  .trim()
  .toLowerCase()
  .pipe(z.email("Enter a valid email address."));

const passwordField = z
  .string({ error: "Password is required." })
  .min(8, "Password must be at least 8 characters long.")
  .max(128, "Password must be at most 128 characters long.");

const phoneField = z
  .string()
  .trim()
  .max(20, "Phone number is too long.")
  .refine(
    (value) => {
      if (value.length === 0) return true;
      const digits = value.replace(/\D/g, "");
      return (
        /^\+?[0-9][0-9\s()-]*$/.test(value) &&
        digits.length >= 7 &&
        digits.length <= 15
      );
    },
    "Enter a valid phone number (7–15 digits).",
  )
  .optional()
  .transform((value) => (value && value.length > 0 ? value : undefined));

export const registerSchema = z
  .object({
    name: z
      .string({ error: "Full name is required." })
      .trim()
      .min(2, "Full name must be at least 2 characters long.")
      .max(60, "Full name must be at most 60 characters long."),
    email: emailField,
    phone: phoneField,
    password: passwordField,
    /** Optional second check so the API also rejects mismatched submissions. */
    confirmPassword: z.string().optional(),
    /** Optional avatar URL; never a credential. */
    avatar: z.url("Avatar must be a valid URL.").optional(),
  })
  .superRefine((value, ctx) => {
    if (
      value.confirmPassword !== undefined &&
      value.confirmPassword !== value.password
    ) {
      ctx.addIssue({
        code: "custom",
        path: ["confirmPassword"],
        message: "Passwords do not match.",
      });
    }
  });

export const loginSchema = z.object({
  email: emailField,
  password: z
    .string({ error: "Password is required." })
    .min(1, "Password is required.")
    .max(128, "Password is too long."),
  remember: z.boolean().optional().default(false),
});

export type RegisterInput = z.output<typeof registerSchema>;
export type LoginInput = z.output<typeof loginSchema>;
