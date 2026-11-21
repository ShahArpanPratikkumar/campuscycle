"use client";

import { RotateCcw } from "lucide-react";
import { useState, type ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  CATEGORIES,
  CONDITIONS,
  LISTING_TYPES,
  MARKETPLACE_LIMITS,
} from "@/lib/constants";
import { countActiveFilters, toggleValue } from "@/lib/marketplace";
import { useMarketplaceNavigation } from "@/hooks/use-marketplace-navigation";
import type {
  Category,
  Condition,
  ListingType,
  MarketplaceFilters,
} from "@/lib/types";
import { cn } from "@/lib/utils";

export interface FilterPanelProps {
  filters: MarketplaceFilters;
  onChange: (patch: Partial<MarketplaceFilters>) => void;
  onClearAll: () => void;
  className?: string;
}

/**
 * The full filter form.
 *
 * Purely controlled: it never touches the URL itself, which lets the desktop
 * sidebar, the mobile sheet and (later) any other surface reuse it by passing
 * their own `onChange`.
 */
export function FilterPanel({
  filters,
  onChange,
  onClearAll,
  className,
}: FilterPanelProps) {
  const activeCount = countActiveFilters(filters);

  return (
    <div className={cn("flex flex-col gap-7", className)}>
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <h2 className="text-sm font-semibold text-slate-900">Filters</h2>
          {activeCount > 0 ? (
            <span className="inline-flex min-w-5 items-center justify-center rounded-full bg-brand-600 px-1.5 text-[11px] font-semibold text-white">
              {activeCount}
            </span>
          ) : null}
        </div>

        {activeCount > 0 ? (
          <Button
            variant="ghost"
            size="sm"
            onClick={onClearAll}
            icon={<RotateCcw className="size-3.5" aria-hidden="true" />}
          >
            Reset
          </Button>
        ) : null}
      </div>

      <FilterSection title="Category">
        {CATEGORIES.map((category) => (
          <CheckRow
            key={category.value}
            label={category.label}
            checked={filters.categories.includes(category.value)}
            onChange={() =>
              onChange({
                categories: toggleValue<Category>(
                  filters.categories,
                  category.value,
                ),
              })
            }
          />
        ))}
      </FilterSection>

      <FilterSection title="Listing type">
        {LISTING_TYPES.map((type) => (
          <CheckRow
            key={type.value}
            label={type.label}
            hint={type.description}
            checked={filters.types.includes(type.value)}
            onChange={() =>
              onChange({
                types: toggleValue<ListingType>(filters.types, type.value),
              })
            }
          />
        ))}
      </FilterSection>

      <FilterSection title="Condition">
        {CONDITIONS.map((condition) => (
          <CheckRow
            key={condition.value}
            label={condition.label}
            checked={filters.conditions.includes(condition.value)}
            onChange={() =>
              onChange({
                conditions: toggleValue<Condition>(
                  filters.conditions,
                  condition.value,
                ),
              })
            }
          />
        ))}
      </FilterSection>

      <FilterSection title="Price range">
        <PriceRange
          minPrice={filters.minPrice}
          maxPrice={filters.maxPrice}
          onApply={(minPrice, maxPrice) => onChange({ minPrice, maxPrice })}
        />
      </FilterSection>
    </div>
  );
}

/**
 * Self-contained sidebar wrapper.
 *
 * This is the only place that needs the navigation hook on desktop, so the
 * server-rendered marketplace page can just drop `<FilterSidebar />` in.
 */
export function FilterSidebar({
  filters,
  className,
}: {
  filters: MarketplaceFilters;
  className?: string;
}) {
  const { navigate, clearAll } = useMarketplaceNavigation(filters);

  return (
    <div
      className={cn(
        "rounded-xl border border-slate-200 bg-white p-5 shadow-sm",
        className,
      )}
    >
      <FilterPanel filters={filters} onChange={navigate} onClearAll={clearAll} />
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  Internals                                                                  */
/* -------------------------------------------------------------------------- */

function FilterSection({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <section className="flex flex-col gap-1.5">
      <h3 className="text-xs font-semibold tracking-wider text-slate-400 uppercase">
        {title}
      </h3>
      <div className="flex flex-col gap-0.5">{children}</div>
    </section>
  );
}

function CheckRow({
  label,
  hint,
  checked,
  onChange,
}: {
  label: string;
  hint?: string;
  checked: boolean;
  onChange: () => void;
}) {
  return (
    <label className="flex cursor-pointer items-start gap-2.5 rounded-lg px-2 py-1.5 transition-colors hover:bg-slate-50">
      <input
        type="checkbox"
        checked={checked}
        onChange={onChange}
        className="mt-0.5 size-4 shrink-0 rounded border-slate-300 accent-brand-600"
      />
      <span className="flex flex-col">
        <span
          className={cn(
            "text-sm text-slate-600",
            checked && "font-medium text-slate-900",
          )}
        >
          {label}
        </span>
        {hint ? <span className="text-xs text-slate-400">{hint}</span> : null}
      </span>
    </label>
  );
}

function PriceRange({
  minPrice,
  maxPrice,
  onApply,
}: {
  minPrice?: number;
  maxPrice?: number;
  onApply: (minPrice?: number, maxPrice?: number) => void;
}) {
  const [error, setError] = useState<string | null>(null);

  /** Parses one field, returning either a value or a human-readable error. */
  function parse(raw: FormDataEntryValue | null): {
    value?: number;
    error?: string;
  } {
    const trimmed = String(raw ?? "").trim();
    if (!trimmed) return {};

    const value = Number(trimmed);
    if (!Number.isFinite(value) || value < 0) {
      return { error: "Enter a valid amount (0 or more)." };
    }
    if (value > MARKETPLACE_LIMITS.maxPrice) {
      return { error: `Amounts are capped at ${MARKETPLACE_LIMITS.maxPrice}.` };
    }
    return { value: Math.round(value) };
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const min = parse(data.get("minPrice"));
    const max = parse(data.get("maxPrice"));

    if (min.error || max.error) {
      setError(min.error ?? max.error ?? null);
      return;
    }
    if (
      min.value !== undefined &&
      max.value !== undefined &&
      min.value > max.value
    ) {
      setError("The maximum price must be at least the minimum.");
      return;
    }

    setError(null);
    onApply(min.value, max.value);
  }

  return (
    <form className="flex flex-col gap-3 pt-1" onSubmit={handleSubmit} noValidate>
      {/*
        Uncontrolled inputs with `defaultValue`. The `key` is derived from the
        URL-backed value, so the fields reset themselves when the query changes
        (reset button, back button, chip removal) without an effect.
      */}
      <div className="flex items-center gap-2">
        <Input
          key={`min-${minPrice ?? ""}`}
          name="minPrice"
          inputMode="numeric"
          aria-label="Minimum price"
          placeholder="Min"
          defaultValue={minPrice?.toString() ?? ""}
          aria-invalid={error ? true : undefined}
          onChange={() => setError(null)}
          className="h-9"
        />
        <span className="text-slate-400" aria-hidden="true">
          –
        </span>
        <Input
          key={`max-${maxPrice ?? ""}`}
          name="maxPrice"
          inputMode="numeric"
          aria-label="Maximum price"
          placeholder="Max"
          defaultValue={maxPrice?.toString() ?? ""}
          aria-invalid={error ? true : undefined}
          onChange={() => setError(null)}
          className="h-9"
        />
      </div>

      {error ? (
        <p className="text-xs font-medium text-rose-600" role="alert">
          {error}
        </p>
      ) : null}

      <Button type="submit" variant="outline" size="sm" className="self-start">
        Apply price
      </Button>
    </form>
  );
}
