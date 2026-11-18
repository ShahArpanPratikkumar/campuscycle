import type { ListingType } from "@/lib/types";

/* -------------------------------------------------------------------------- */
/*  className helper                                                           */
/* -------------------------------------------------------------------------- */

/**
 * Tiny `clsx` replacement — joins truthy class names.
 * Kept dependency-free on purpose: no `clsx`/`tailwind-merge` needed for a
 * college project, and it keeps the bundle lean.
 */
export function cn(
  ...classes: (string | false | null | undefined | 0)[]
): string {
  return classes.filter(Boolean).join(" ");
}

/* -------------------------------------------------------------------------- */
/*  Formatting                                                                 */
/* -------------------------------------------------------------------------- */

const inr = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 0,
});

/**
 * Renders a listing price, honouring the listing type.
 * `free` and `exchange` listings always store `price: 0` (BR-8 / BR-9).
 */
export function formatPrice(price: number, listingType: ListingType): string {
  if (listingType === "free") return "Free";
  if (listingType === "exchange") return "Exchange";
  return inr.format(price);
}

export function formatNumber(value: number): string {
  return new Intl.NumberFormat("en-IN").format(value);
}

/**
 * Deterministic date formatting.
 *
 * `timeZone: "UTC"` is intentional: without it the server (UTC) and the browser
 * (often IST) could format the same instant into different calendar days, which
 * causes React hydration mismatches.
 */
export function formatDate(iso: string): string {
  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(iso));
}

/** "12 Mar 2026" -> "March 2026" style month grouping for seller profiles. */
export function formatMonthYear(iso: string): string {
  return new Intl.DateTimeFormat("en-GB", {
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(iso));
}

/* -------------------------------------------------------------------------- */
/*  Text helpers                                                               */
/* -------------------------------------------------------------------------- */

export function pluralize(count: number, singular: string, plural?: string) {
  return count === 1 ? singular : (plural ?? `${singular}s`);
}

export function initials(name: string): string {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

export function truncate(value: string, max: number): string {
  return value.length <= max ? value : `${value.slice(0, max - 1).trimEnd()}…`;
}
