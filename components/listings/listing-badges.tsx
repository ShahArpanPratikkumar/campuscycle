import { Badge, type BadgeProps } from "@/components/ui/badge";
import {
  conditionLabel,
  listingStatusMeta,
  listingTypeLabel,
} from "@/lib/constants";
import type { Condition, ListingStatus, ListingType } from "@/lib/types";
import { cn, formatPrice } from "@/lib/utils";

type Size = BadgeProps["size"];

/** Available / Reserved / Sold / Inactive (BR-13). */
export function StatusBadge({
  status,
  size,
}: {
  status: ListingStatus;
  size?: Size;
}) {
  const meta = listingStatusMeta(status);
  return (
    <Badge tone={meta.tone} size={size}>
      {meta.label}
    </Badge>
  );
}

/** New / Like new / Good / Fair / Well used. */
export function ConditionBadge({
  condition,
  size,
}: {
  condition: Condition;
  size?: Size;
}) {
  return (
    <Badge tone="neutral" size={size}>
      {conditionLabel(condition)}
    </Badge>
  );
}

/**
 * For Sale / Free / Exchange.
 * Only meaningful for `free` and `exchange` on cards — a "For Sale" badge on
 * every single card would just be noise.
 */
export function TypeBadge({
  type,
  size,
}: {
  type: ListingType;
  size?: Size;
}) {
  const tone = type === "free" ? "success" : type === "exchange" ? "warning" : "info";
  return (
    <Badge tone={tone} size={size}>
      {listingTypeLabel(type)}
    </Badge>
  );
}

/**
 * Price renderer. `free` and `exchange` listings store `price: 0`, so they must
 * never render "₹0" (BR-8 / BR-9).
 */
export function PriceTag({
  price,
  listingType,
  className,
}: {
  price: number;
  listingType: ListingType;
  className?: string;
}) {
  const isFree = listingType === "free";

  return (
    <span
      className={cn(
        "font-semibold tabular-nums",
        isFree ? "text-emerald-600" : "text-slate-900",
        className,
      )}
    >
      {formatPrice(price, listingType)}
    </span>
  );
}
