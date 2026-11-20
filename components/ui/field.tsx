"use client";

import type { ReactNode } from "react";
import { FieldProvider } from "@/components/ui/field-context";
import { cn } from "@/lib/utils";

export interface FieldProps {
  /** Must match the `id` of the control inside so clicking the label focuses it. */
  htmlFor?: string;
  label: string;
  hint?: string;
  error?: string;
  required?: boolean;
  optional?: boolean;
  className?: string;
  /** Rendered on the right of the label row, e.g. a character counter. */
  labelAccessory?: ReactNode;
  children: ReactNode;
}

/**
 * Label + control + hint/error wrapper.
 *
 * Every form control in the app is wrapped in a `Field`, which guarantees the
 * same spacing, the same required-marker convention and — importantly — that
 * validation messages are announced to screen readers. The field publishes its
 * hint/error ids through `FieldContext`, and the `Input`/`Textarea`/`Select`
 * inside picks them up as `aria-describedby` / `aria-invalid` automatically.
 */
export function Field({
  htmlFor,
  label,
  hint,
  error,
  required,
  optional,
  className,
  labelAccessory,
  children,
}: FieldProps) {
  // The ids are only defined when the matching element is actually rendered,
  // so `aria-describedby` can never point at a missing node.
  const hintId = htmlFor && hint ? `${htmlFor}-hint` : undefined;
  const errorId = htmlFor && error ? `${htmlFor}-error` : undefined;
  const invalid = Boolean(error);

  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      <div className="flex items-baseline justify-between gap-3">
        <label
          htmlFor={htmlFor}
          className="text-sm font-medium text-slate-700"
        >
          {label}
          {required ? (
            <span className="ml-0.5 text-rose-500" aria-hidden="true">
              *
            </span>
          ) : null}
          {optional ? (
            <span className="ml-1.5 text-xs font-normal text-slate-400">
              Optional
            </span>
          ) : null}
        </label>
        {labelAccessory}
      </div>

      <FieldProvider
        value={{ hintId, errorId, invalid, required: Boolean(required) }}
      >
        {children}
      </FieldProvider>

      {error ? (
        <p id={errorId} role="alert" className="text-xs font-medium text-rose-600">
          {error}
        </p>
      ) : hint ? (
        <p id={hintId} className="text-xs text-slate-500">
          {hint}
        </p>
      ) : null}
    </div>
  );
}

/** Groups related fields with a heading — used by the listing form. */
export function FieldGroup({
  title,
  description,
  children,
  className,
}: {
  title: string;
  description?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <fieldset className={cn("flex flex-col gap-4", className)}>
      <legend className="flex flex-col gap-1">
        <span className="text-sm font-semibold text-slate-900">{title}</span>
        {description ? (
          <span className="text-xs text-slate-500">{description}</span>
        ) : null}
      </legend>
      {children}
    </fieldset>
  );
}
