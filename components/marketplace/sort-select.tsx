"use client";

import { Select } from "@/components/ui/input";
import { SORT_OPTIONS } from "@/lib/constants";
import type { SortOption } from "@/lib/types";
import { cn } from "@/lib/utils";

export interface SortSelectProps {
  value: SortOption;
  onChange: (value: SortOption) => void;
  className?: string;
}

/** Sort control. Options come from `SORT_OPTIONS` so labels stay in one place. */
export function SortSelect({ value, onChange, className }: SortSelectProps) {
  return (
    <Select
      aria-label="Sort listings"
      value={value}
      onChange={(event) => onChange(event.target.value as SortOption)}
      className={cn("w-full sm:w-52", className)}
    >
      {SORT_OPTIONS.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </Select>
  );
}
