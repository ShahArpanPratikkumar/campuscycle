"use client";

import { RouteError } from "@/components/common/route-error";

/**
 * Listing detail error boundary.
 *
 * The page resolves the product *before* its `<Suspense>` boundary and only
 * calls `notFound()` for a genuine "missing" error. Everything else — a dropped
 * database connection, a timeout, a malformed document — reaches this boundary,
 * so a database outage is never disguised as "this listing was removed".
 */
export default function ListingDetailError({
  error,
  retry,
}: {
  error: unknown;
  retry: () => void;
}) {
  return (
    <RouteError
      error={error}
      retry={retry}
      title="We couldn't load this listing"
      description="Something went wrong while fetching the item — usually a temporary database problem. Try again, and if it keeps happening, head back to the marketplace."
    />
  );
}
