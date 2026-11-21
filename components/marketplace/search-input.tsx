"use client";

import { Loader2, Search, X } from "lucide-react";
import { useEffect, useId, useRef, useState } from "react";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import { cn } from "@/lib/utils";

export interface SearchInputProps {
  /** Server-provided value so the field reflects the current URL. */
  defaultValue?: string;
  placeholder?: string;
  label?: string;
  size?: "md" | "lg";
  onSubmit: (value: string) => void;
  /**
   * When greater than 0, the field also submits automatically once typing
   * pauses for this many milliseconds (live search). `0` keeps submit-only
   * behaviour (Enter or the search button), which is what the hero search uses.
   */
  liveDebounceMs?: number;
  /** Shows a spinner and `aria-busy` while a navigation is in flight. */
  pending?: boolean;
  className?: string;
}

/**
 * Reusable search field.
 *
 * It keeps its own draft value so typing never triggers a request on every
 * keystroke; it calls `onSubmit` on Enter/button, and — when `liveDebounceMs`
 * is set — once the student stops typing.
 *
 * URL changes that happen *outside* this field (removing the search chip,
 * "clear all", back/forward) are adopted when the field is not focused, so a
 * slow response can never overwrite what the student is still typing.
 */
export function SearchInput({
  defaultValue = "",
  placeholder = "Search listings…",
  label = "Search listings",
  size = "md",
  onSubmit,
  liveDebounceMs = 0,
  pending = false,
  className,
}: SearchInputProps) {
  const [value, setValue] = useState(defaultValue);
  const inputRef = useRef<HTMLInputElement>(null);
  const onSubmitRef = useRef(onSubmit);
  const serverValueRef = useRef(defaultValue);
  const debouncedValue = useDebouncedValue(value, liveDebounceMs);
  const inputId = useId();

  // Keep the latest callback in a ref so the effects below do not re-run (and
  // re-submit) just because the parent handed us a new function identity.
  useEffect(() => {
    onSubmitRef.current = onSubmit;
  });

  // Adopt an external URL change (chip removal, clear-all, back button).
  useEffect(() => {
    if (serverValueRef.current === defaultValue) return;
    serverValueRef.current = defaultValue;

    if (
      typeof document === "undefined" ||
      document.activeElement !== inputRef.current
    ) {
      setValue(defaultValue);
    }
  }, [defaultValue]);

  // Live search: submit once typing pauses, but never re-submit a value the URL
  // already reflects.
  useEffect(() => {
    if (liveDebounceMs <= 0) return;

    const trimmed = debouncedValue.trim();
    if (trimmed === serverValueRef.current.trim()) return;
    onSubmitRef.current(trimmed);
  }, [debouncedValue, liveDebounceMs]);

  function submitNow(next: string) {
    const trimmed = next.trim();
    setValue(next);
    serverValueRef.current = trimmed;
    onSubmitRef.current(trimmed);
  }

  return (
    <form
      role="search"
      onSubmit={(event) => {
        event.preventDefault();
        submitNow(value);
      }}
      className={cn("relative", className)}
    >
      <label htmlFor={inputId} className="sr-only">
        {label}
      </label>

      {pending ? (
        <Loader2
          className={cn(
            "pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 animate-spin text-brand-500",
            size === "lg" ? "size-5" : "size-4",
          )}
          aria-hidden="true"
        />
      ) : (
        <Search
          className={cn(
            "pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-slate-400",
            size === "lg" ? "size-5" : "size-4",
          )}
          aria-hidden="true"
        />
      )}

      <input
        ref={inputRef}
        id={inputId}
        type="search"
        name="q"
        value={value}
        onChange={(event) => setValue(event.target.value)}
        placeholder={placeholder}
        autoComplete="off"
        aria-busy={pending || undefined}
        className={cn(
          "w-full rounded-lg border border-slate-300 bg-white text-slate-900 shadow-sm transition-colors placeholder:text-slate-400 focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10 focus:outline-none",
          size === "lg"
            ? "h-12 pr-28 pl-11 text-base"
            : "h-10 pr-20 pl-9 text-sm",
        )}
      />

      <div className="absolute top-1/2 right-2 flex -translate-y-1/2 items-center gap-1">
        {value ? (
          <button
            type="button"
            onClick={() => submitNow("")}
            aria-label="Clear search"
            className="inline-flex size-7 items-center justify-center rounded-md text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700"
          >
            <X className="size-4" aria-hidden="true" />
          </button>
        ) : null}

        <button
          type="submit"
          aria-label="Search"
          className={cn(
            "inline-flex items-center gap-1.5 rounded-md bg-brand-600 font-medium text-white transition-colors hover:bg-brand-700",
            size === "lg"
              ? "h-8 px-3.5 text-sm"
              : "size-7 justify-center",
          )}
        >
          <Search className="size-3.5" aria-hidden="true" />
          {size === "lg" ? "Search" : null}
        </button>
      </div>
    </form>
  );
}
