/**
 * Form error helpers.
 *
 * Client forms validate their draft with the *same* Zod schemas the API uses
 * (`createProductSchema`, `createUserSchema`, …). When the parse fails we need
 * to turn `error.issues` into a `{ field: message }` map so each control can
 * show its message inline. That mapping is identical everywhere, so it lives
 * here instead of being copy-pasted into every form.
 *
 * Only the first message per field is kept: a control can render one error, and
 * Zod can emit several issues for a single field.
 */

export interface ZodLikeIssue {
  path: readonly PropertyKey[];
  message: string;
}

export function zodIssuesToFieldErrors(
  issues: readonly ZodLikeIssue[],
): Record<string, string> {
  const errors: Record<string, string> = {};

  for (const issue of issues) {
    const key = issue.path[0];
    if (typeof key !== "string" || key.length === 0) continue;
    if (!(key in errors)) errors[key] = issue.message;
  }

  return errors;
}
