"use client";

import type { ComponentProps } from "react";
import {
  describedByFor,
  useFieldControl,
} from "@/components/ui/field-context";
import { cn } from "@/lib/utils";

const FIELD_BASE =
  "w-full rounded-lg border border-slate-300 bg-white text-slate-900 shadow-sm transition-colors placeholder:text-slate-400 focus:border-brand-500 focus:outline-none focus:ring-4 focus:ring-brand-500/10 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-500 aria-[invalid=true]:border-rose-400 aria-[invalid=true]:focus:ring-rose-500/10";

/**
 * Form controls.
 *
 * Each control reads its enclosing `Field` (via `FieldContext`) and wires the
 * accessibility attributes that belong on the control rather than the wrapper:
 * `aria-describedby` for the hint/error text and `aria-invalid` when the field
 * is in an error state. Anything passed explicitly still wins, so a control can
 * be used outside a `Field` (e.g. the filter panel) without surprises.
 */
export function Input({
  className,
  type = "text",
  "aria-describedby": describedBy,
  "aria-invalid": ariaInvalid,
  "aria-required": ariaRequired,
  ...rest
}: ComponentProps<"input">) {
  const field = useFieldControl();

  return (
    <input
      type={type}
      className={cn(FIELD_BASE, "h-10 px-3 text-sm", className)}
      aria-invalid={ariaInvalid ?? (field?.invalid || undefined)}
      aria-describedby={describedBy ?? describedByFor(field)}
      aria-required={ariaRequired ?? (field?.required || undefined)}
      {...rest}
    />
  );
}

export function Textarea({
  className,
  rows = 5,
  "aria-describedby": describedBy,
  "aria-invalid": ariaInvalid,
  "aria-required": ariaRequired,
  ...rest
}: ComponentProps<"textarea">) {
  const field = useFieldControl();

  return (
    <textarea
      rows={rows}
      className={cn(FIELD_BASE, "resize-y px-3 py-2.5 text-sm", className)}
      aria-invalid={ariaInvalid ?? (field?.invalid || undefined)}
      aria-describedby={describedBy ?? describedByFor(field)}
      aria-required={ariaRequired ?? (field?.required || undefined)}
      {...rest}
    />
  );
}

export function Select({
  className,
  children,
  "aria-describedby": describedBy,
  "aria-invalid": ariaInvalid,
  "aria-required": ariaRequired,
  ...rest
}: ComponentProps<"select">) {
  const field = useFieldControl();

  return (
    <select
      className={cn(
        FIELD_BASE,
        "h-10 cursor-pointer appearance-none bg-[length:1rem] bg-[right_0.6rem_center] bg-no-repeat py-0 pr-9 pl-3 text-sm",
        "bg-[url('data:image/svg+xml;utf8,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 24 24%22 fill=%22none%22 stroke=%22%2364748b%22 stroke-width=%222%22 stroke-linecap=%22round%22 stroke-linejoin=%22round%22><path d=%22m6 9 6 6 6-6%22/></svg>')]",
        className,
      )}
      aria-invalid={ariaInvalid ?? (field?.invalid || undefined)}
      aria-describedby={describedBy ?? describedByFor(field)}
      aria-required={ariaRequired ?? (field?.required || undefined)}
      {...rest}
    >
      {children}
    </select>
  );
}
