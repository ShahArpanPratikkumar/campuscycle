"use client";

import { createContext, useContext } from "react";

/**
 * Field ↔ control accessibility wiring.
 *
 * `Field` renders the label, the hint and the error message, and owns the
 * generated `id`s for the hint/error elements. The control inside the field
 * (an `Input`, `Textarea` or `Select`) is the one that must carry
 * `aria-describedby` pointing at those ids and `aria-invalid` when it is in an
 * error state — otherwise screen-reader users hear the label but never the
 * validation message.
 *
 * Rather than have every call site thread those attributes by hand (and get it
 * subtly wrong), `Field` publishes them here and the controls pick them up
 * automatically. Explicit props still win, so a control can always override.
 */
export interface FieldControlState {
  /** `id` of the hint element, present only while a hint is shown. */
  hintId?: string;
  /** `id` of the error element, present only while an error is shown. */
  errorId?: string;
  /** `true` when the field currently has a validation error. */
  invalid: boolean;
  /** `true` when the field is marked required. */
  required: boolean;
}

const FieldContext = createContext<FieldControlState | null>(null);

export const FieldProvider = FieldContext.Provider;

/** Reads the enclosing `Field`'s a11y state, or `null` outside a `Field`. */
export function useFieldControl(): FieldControlState | null {
  return useContext(FieldContext);
}

/**
 * The `aria-describedby` value a control should use given its field state:
 * the error id while invalid, otherwise the hint id.
 */
export function describedByFor(
  field: FieldControlState | null,
): string | undefined {
  if (!field) return undefined;
  return field.invalid ? field.errorId : field.hintId;
}
