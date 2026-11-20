import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

export interface PaginationProps {
  page: number;
  totalPages: number;
  /** Builds the href for a given page — keeps this component URL-shape agnostic. */
  buildHref: (page: number) => string;
  className?: string;
}

/**
 * Page navigator rendered as real links so pagination works without JS and
 * produces shareable URLs. Rendered on the server (no client bundle cost).
 */
export function Pagination({
  page,
  totalPages,
  buildHref,
  className,
}: PaginationProps) {
  if (totalPages <= 1) return null;

  const pages = pageWindow(page, totalPages);

  return (
    <nav
      className={cn("flex items-center justify-center gap-1.5", className)}
      aria-label="Pagination"
    >
      <PageArrow
        href={buildHref(page - 1)}
        disabled={page <= 1}
        label="Previous page"
        direction="prev"
      />

      {pages.map((entry, index) =>
        entry === "gap" ? (
          <span
            key={`gap-${index}`}
            aria-hidden="true"
            className="px-1.5 text-sm text-slate-400"
          >
            …
          </span>
        ) : (
          <Link
            key={entry}
            href={buildHref(entry)}
            aria-label={`Page ${entry}`}
            aria-current={entry === page ? "page" : undefined}
            className={cn(
              "inline-flex size-9 items-center justify-center rounded-lg text-sm font-medium transition-colors",
              entry === page
                ? "bg-brand-600 text-white"
                : "border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 hover:text-slate-900",
            )}
          >
            {entry}
          </Link>
        ),
      )}

      <PageArrow
        href={buildHref(page + 1)}
        disabled={page >= totalPages}
        label="Next page"
        direction="next"
      />
    </nav>
  );
}

function PageArrow({
  href,
  disabled,
  label,
  direction,
}: {
  href: string;
  disabled: boolean;
  label: string;
  direction: "prev" | "next";
}) {
  const Icon = direction === "prev" ? ChevronLeft : ChevronRight;

  if (disabled) {
    return (
      <span
        aria-disabled="true"
        className="inline-flex size-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-300"
      >
        <Icon className="size-4" aria-hidden="true" />
      </span>
    );
  }

  return (
    <Link
      href={href}
      aria-label={label}
      className="inline-flex size-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 transition-colors hover:bg-slate-50 hover:text-slate-900"
    >
      <Icon className="size-4" aria-hidden="true" />
    </Link>
  );
}

/** Produces `[1, "gap", 4, 5, 6, "gap", 12]` style windows. */
function pageWindow(page: number, totalPages: number): (number | "gap")[] {
  const delta = 1;
  const range: number[] = [];
  const result: (number | "gap")[] = [];

  for (
    let i = Math.max(2, page - delta);
    i <= Math.min(totalPages - 1, page + delta);
    i += 1
  ) {
    range.push(i);
  }

  if (page - delta > 2) result.push(1, "gap");
  else result.push(1);

  result.push(...range);

  if (page + delta < totalPages - 1) result.push("gap", totalPages);
  else if (totalPages > 1) result.push(totalPages);

  return result.filter((entry, index, array) => array.indexOf(entry) === index);
}
