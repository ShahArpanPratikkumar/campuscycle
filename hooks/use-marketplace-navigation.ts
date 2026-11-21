"use client";

import { useCallback, useTransition } from "react";
import { useRouter } from "next/navigation";
import { filtersToSearchParams } from "@/lib/marketplace";
import type { MarketplaceFilters } from "@/lib/types";

export interface NavigateOptions {
  /**
   * Replace instead of push. Used by the live search box so a request per
   * paused keystroke does not flood the browser history with one entry each.
   */
  replace?: boolean;
}

/**
 * Centralises marketplace URL navigation.
 *
 * The browse page is server-rendered from `searchParams`, so every filter
 * control simply pushes a new URL and lets the server re-render the grid. This
 * mirrors the API flow: the URL *is* the query state.
 *
 * Changing any filter resets pagination to page 1 (unless `page` is part of the
 * patch), which prevents the "page 4 of 1 result" class of bug. The navigation
 * runs inside a transition, so `isPending` is true from the click until the new
 * results have streamed in — that is what drives the loading indicator.
 */
export function useMarketplaceNavigation(filters: MarketplaceFilters) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const navigate = useCallback(
    (patch: Partial<MarketplaceFilters>, options: NavigateOptions = {}) => {
      const merged: MarketplaceFilters = { ...filters, ...patch };
      const page = patch.page !== undefined ? patch.page : 1;
      const params = filtersToSearchParams({ ...merged, page });
      const query = params.toString();
      const href = query ? `/marketplace?${query}` : "/marketplace";

      startTransition(() => {
        if (options.replace) router.replace(href);
        else router.push(href);
      });
    },
    [filters, router],
  );

  const clearAll = useCallback(() => {
    startTransition(() => router.push("/marketplace"));
  }, [router]);

  return { navigate, clearAll, isPending };
}
