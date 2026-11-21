import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { CATEGORIES } from "@/lib/constants";
import { categoryVisual } from "@/lib/category-visuals";
import type { Category } from "@/lib/types";
import { cn } from "@/lib/utils";

export interface CategoryCardProps {
  category: (typeof CATEGORIES)[number];
  /** Optional number of available listings — shown when provided. */
  count?: number;
  className?: string;
}

export function CategoryCard({ category, count, className }: CategoryCardProps) {
  const { Icon, tile, icon } = categoryVisual(category.value);

  return (
    <Link
      href={`/marketplace?category=${category.value}`}
      className={cn(
        "group flex flex-col gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-brand-200 hover:shadow-md",
        className,
      )}
    >
      <span
        className={cn(
          "flex size-11 items-center justify-center rounded-lg transition-transform duration-200 group-hover:scale-105",
          tile,
        )}
      >
        <Icon className={cn("size-5", icon)} aria-hidden="true" />
      </span>

      <span className="flex flex-col gap-0.5">
        <span className="text-sm font-semibold text-slate-900">
          {category.label}
        </span>
        <span className="text-xs text-slate-500">{category.blurb}</span>
      </span>

      <span className="mt-auto inline-flex items-center gap-1 text-xs font-medium text-brand-700">
        {typeof count === "number"
          ? `${count} available`
          : "Browse listings"}
        <ArrowRight
          className="size-3.5 transition-transform duration-200 group-hover:translate-x-0.5"
          aria-hidden="true"
        />
      </span>
    </Link>
  );
}

export interface CategoryGridProps {
  categories?: typeof CATEGORIES;
  counts?: Partial<Record<Category, number>>;
  className?: string;
}

export function CategoryGrid({
  categories = CATEGORIES,
  counts,
  className,
}: CategoryGridProps) {
  return (
    <div
      className={cn(
        "grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5",
        className,
      )}
    >
      {categories.map((category) => (
        <CategoryCard
          key={category.value}
          category={category}
          count={counts?.[category.value]}
        />
      ))}
    </div>
  );
}
