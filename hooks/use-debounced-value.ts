"use client";

import { useEffect, useState } from "react";

/**
 * Returns `value` after it has stopped changing for `delayMs`.
 *
 * Used by the marketplace search box so a student can type a whole word without
 * firing a request per keystroke — the debounced value only changes once typing
 * pauses. A non-positive delay disables the debounce and mirrors `value`.
 */
export function useDebouncedValue<T>(value: T, delayMs: number): T {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    if (delayMs <= 0) return;

    const timer = setTimeout(() => setDebounced(value), delayMs);
    return () => clearTimeout(timer);
  }, [value, delayMs]);

  // A non-positive delay means "no debounce" — return the live value directly
  // rather than bouncing it through state.
  return delayMs <= 0 ? value : debounced;
}
