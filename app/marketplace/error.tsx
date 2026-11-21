"use client";

import { RouteError } from "@/components/common/route-error";

/**
 * Marketplace error boundary.
 *
 * Catches a failed database read (connection down, timeout, malformed data)
 * thrown while the results stream in, and offers a retry without a full reload.
 */
export default function MarketplaceError({
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
      title="We couldn't load the marketplace"
      description="Something went wrong while fetching listings — usually a temporary database problem. Try again, and if it keeps happening, come back in a moment."
    />
  );
}
