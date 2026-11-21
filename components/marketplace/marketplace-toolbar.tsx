"use client";

import { SlidersHorizontal } from "lucide-react";
import { useState } from "react";
import { ActiveFilters } from "@/components/marketplace/active-filters";
import { FilterSheet } from "@/components/marketplace/filter-sheet";
import { SearchInput } from "@/components/marketplace/search-input";
import { SortSelect } from "@/components/marketplace/sort-select";
import { Button } from "@/components/ui/button";
import { useMarketplaceNavigation } from "@/hooks/use-marketplace-navigation";
import { countActiveFilters } from "@/lib/marketplace";
import type { MarketplaceFilters } from "@/lib/types";

/**
 * Search + sort + mobile filter trigger + active chips.
 *
 * The single client island on the marketplace page. It owns the URL navigation
 * so the server can keep rendering the grid from `searchParams`.
 */
export function MarketplaceToolbar({ filters }: { filters: MarketplaceFilters }) {
  const { navigate, clearAll, isPending } = useMarketplaceNavigation(filters);
  const [sheetOpen, setSheetOpen] = useState(false);
  const activeCount = countActiveFilters(filters);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <SearchInput
          defaultValue={filters.q}
          onSubmit={(q) => navigate({ q }, { replace: true })}
          liveDebounceMs={350}
          pending={isPending}
          className="sm:flex-1"
        />

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={() => setSheetOpen(true)}
            icon={
              <SlidersHorizontal className="size-4" aria-hidden="true" />
            }
            className="lg:hidden"
          >
            Filters
            {activeCount > 0 ? (
              <span className="inline-flex min-w-5 items-center justify-center rounded-full bg-brand-600 px-1.5 text-[11px] font-semibold text-white">
                {activeCount}
              </span>
            ) : null}
          </Button>

          <SortSelect
            value={filters.sort}
            onChange={(sort) => navigate({ sort })}
          />
        </div>
      </div>

      <ActiveFilters
        filters={filters}
        onChange={navigate}
        onClearAll={clearAll}
      />

      <FilterSheet
        filters={filters}
        open={sheetOpen}
        onClose={() => setSheetOpen(false)}
      />
    </div>
  );
}
