"use client";

import { X } from "lucide-react";
import {
  categoryLabel,
  conditionLabel,
  listingTypeLabel,
} from "@/lib/constants";
import type { MarketplaceFilters } from "@/lib/types";
import { cn, formatNumber } from "@/lib/utils";

export interface ActiveFiltersProps {
  filters: MarketplaceFilters;
  onChange: (patch: Partial<MarketplaceFilters>) => void;
  onClearAll: () => void;
  className?: string;
}

interface Chip {
  key: string;
  label: string;
  onRemove: () => void;
}

/**
 * Removable chips summarising the current query.
 *
 * Each chip removes exactly one filter, which is far less frustrating than a
 * single "clear everything" button when a student has five filters applied.
 */
export function ActiveFilters({
  filters,
  onChange,
  onClearAll,
  className,
}: ActiveFiltersProps) {
  const chips: Chip[] = [];

  if (filters.q) {
    chips.push({
      key: "q",
      label: `"${filters.q}"`,
      onRemove: () => onChange({ q: "" }),
    });
  }

  filters.categories.forEach((value) => {
    chips.push({
      key: `category-${value}`,
      label: categoryLabel(value),
      onRemove: () =>
        onChange({
          categories: filters.categories.filter((item) => item !== value),
        }),
    });
  });

  filters.types.forEach((value) => {
    chips.push({
      key: `type-${value}`,
      label: listingTypeLabel(value),
      onRemove: () =>
        onChange({ types: filters.types.filter((item) => item !== value) }),
    });
  });

  filters.conditions.forEach((value) => {
    chips.push({
      key: `condition-${value}`,
      label: conditionLabel(value),
      onRemove: () =>
        onChange({
          conditions: filters.conditions.filter((item) => item !== value),
        }),
    });
  });

  if (filters.minPrice !== undefined || filters.maxPrice !== undefined) {
    const label =
      filters.minPrice !== undefined && filters.maxPrice !== undefined
        ? `₹${formatNumber(filters.minPrice)} – ₹${formatNumber(filters.maxPrice)}`
        : filters.minPrice !== undefined
          ? `From ₹${formatNumber(filters.minPrice)}`
          : `Up to ₹${formatNumber(filters.maxPrice ?? 0)}`;

    chips.push({
      key: "price",
      label,
      onRemove: () => onChange({ minPrice: undefined, maxPrice: undefined }),
    });
  }

  if (chips.length === 0) return null;

  return (
    <div className={cn("flex flex-wrap items-center gap-2", className)}>
      <span className="text-xs font-medium text-slate-500">Active:</span>

      {chips.map((chip) => (
        <button
          key={chip.key}
          type="button"
          onClick={chip.onRemove}
          className="group inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white py-1 pr-2 pl-3 text-xs font-medium text-slate-700 shadow-sm transition-colors hover:border-slate-300 hover:bg-slate-50"
        >
          {chip.label}
          <X
            className="size-3.5 text-slate-400 transition-colors group-hover:text-slate-700"
            aria-hidden="true"
          />
          <span className="sr-only">Remove filter</span>
        </button>
      ))}

      <button
        type="button"
        onClick={onClearAll}
        className="text-xs font-medium text-brand-700 underline-offset-2 hover:underline"
      >
        Clear all
      </button>
    </div>
  );
}
