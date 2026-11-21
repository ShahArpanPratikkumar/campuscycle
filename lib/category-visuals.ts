import {
  Armchair,
  BedDouble,
  Bike,
  BookOpen,
  Calculator,
  Dumbbell,
  Laptop,
  Package,
  PencilRuler,
  Shirt,
  type LucideIcon,
} from "lucide-react";
import type { Category } from "@/lib/types";

interface CategoryVisual {
  Icon: LucideIcon;
  /** Solid tint block used behind the icon. */
  tile: string;
  /** Icon colour. */
  icon: string;
  /** Soft pill used on category cards. */
  chip: string;
}

/**
 * Single source of truth for how a category looks.
 *
 * Listing thumbnails have no images in Step 1, so every listing renders a
 * category tile instead. Keeping the icon + tint mapping here means the
 * marketplace grid, category cards, the filter panel and the detail gallery
 * all stay visually consistent.
 *
 * NOTE: the Tailwind class strings are written out in full (never composed at
 * runtime) so the Tailwind compiler can statically detect them.
 */
export const CATEGORY_VISUALS: Record<Category, CategoryVisual> = {
  books: {
    Icon: BookOpen,
    tile: "bg-amber-50",
    icon: "text-amber-600",
    chip: "bg-amber-50 text-amber-700",
  },
  electronics: {
    Icon: Laptop,
    tile: "bg-sky-50",
    icon: "text-sky-600",
    chip: "bg-sky-50 text-sky-700",
  },
  calculators: {
    Icon: Calculator,
    tile: "bg-violet-50",
    icon: "text-violet-600",
    chip: "bg-violet-50 text-violet-700",
  },
  furniture: {
    Icon: Armchair,
    tile: "bg-orange-50",
    icon: "text-orange-600",
    chip: "bg-orange-50 text-orange-700",
  },
  stationery: {
    Icon: PencilRuler,
    tile: "bg-rose-50",
    icon: "text-rose-600",
    chip: "bg-rose-50 text-rose-700",
  },
  cycles: {
    Icon: Bike,
    tile: "bg-emerald-50",
    icon: "text-emerald-600",
    chip: "bg-emerald-50 text-emerald-700",
  },
  hostel: {
    Icon: BedDouble,
    tile: "bg-teal-50",
    icon: "text-teal-600",
    chip: "bg-teal-50 text-teal-700",
  },
  clothing: {
    Icon: Shirt,
    tile: "bg-fuchsia-50",
    icon: "text-fuchsia-600",
    chip: "bg-fuchsia-50 text-fuchsia-700",
  },
  sports: {
    Icon: Dumbbell,
    tile: "bg-lime-50",
    icon: "text-lime-700",
    chip: "bg-lime-50 text-lime-700",
  },
  other: {
    Icon: Package,
    tile: "bg-slate-100",
    icon: "text-slate-500",
    chip: "bg-slate-100 text-slate-700",
  },
};

export function categoryVisual(category: Category): CategoryVisual {
  return CATEGORY_VISUALS[category] ?? CATEGORY_VISUALS.other;
}
