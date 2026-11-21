"use client";

import { RouteError } from "@/components/common/route-error";

/**
 * Seller profile error boundary.
 *
 * Mirrors the listing boundary: a real "no such student" is a `404` produced by
 * `notFound()`, while a database failure lands here with a retry.
 */
export default function SellerError({
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
      title="We couldn't load this profile"
      description="Something went wrong while fetching this student — usually a temporary database problem. Try again, and if it keeps happening, browse the marketplace instead."
    />
  );
}
