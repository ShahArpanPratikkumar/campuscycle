"use client";

import { RouteError } from "@/components/common/route-error";

/**
 * Root error boundary.
 *
 * Next 16 hands the boundary `{ error, retry }` — `retry()` re-fetches and
 * re-renders the segment, which is what we want here (unlike `reset()`). The
 * presentation is shared with the other boundaries via `RouteError`.
 */
export default function Error({
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
      title="Something went wrong"
      description="This page could not be rendered. Trying again usually fixes it — if it keeps happening, head back to the marketplace."
    />
  );
}
