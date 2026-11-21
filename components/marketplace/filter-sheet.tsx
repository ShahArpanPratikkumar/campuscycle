"use client";

import { FilterPanel } from "@/components/marketplace/filter-panel";
import { Button } from "@/components/ui/button";
import { Sheet } from "@/components/ui/sheet";
import { useMarketplaceNavigation } from "@/hooks/use-marketplace-navigation";
import type { MarketplaceFilters } from "@/lib/types";

export interface FilterSheetProps {
  filters: MarketplaceFilters;
  open: boolean;
  onClose: () => void;
}

/**
 * Mobile filter drawer.
 *
 * Applying a filter pushes a new URL and the sheet intentionally stays open, so
 * students can tick several boxes in a row. "Show results" closes it.
 */
export function FilterSheet({ filters, open, onClose }: FilterSheetProps) {
  const { navigate, clearAll } = useMarketplaceNavigation(filters);

  return (
    <Sheet
      open={open}
      onClose={onClose}
      title="Filters"
      description="Narrow down the marketplace"
      footer={
        <div className="flex gap-2">
          <Button
            variant="outline"
            className="flex-1"
            onClick={() => {
              clearAll();
              onClose();
            }}
          >
            Clear all
          </Button>
          <Button className="flex-1" onClick={onClose}>
            Show results
          </Button>
        </div>
      }
    >
      <FilterPanel filters={filters} onChange={navigate} onClearAll={clearAll} />
    </Sheet>
  );
}
