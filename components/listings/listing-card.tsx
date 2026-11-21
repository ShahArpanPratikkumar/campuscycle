import Link from "next/link";
import { Eye, MapPin } from "lucide-react";
import { FavoriteButton } from "@/components/listings/favorite-button";
import {
  ConditionBadge,
  PriceTag,
  StatusBadge,
  TypeBadge,
} from "@/components/listings/listing-badges";
import { ListingThumb } from "@/components/listings/listing-thumb";
import { categoryLabel } from "@/lib/constants";
import { categoryVisual } from "@/lib/category-visuals";
import type { Listing } from "@/lib/types";
import { cn, formatDate } from "@/lib/utils";

export interface ListingCardProps {
  listing: Listing;
  className?: string;
  /** Set on the first few cards of a page so the LCP image loads eagerly. */
  priority?: boolean;
}

/**
 * The single card used by the marketplace grid, the home page rails, the
 * favourites page, the seller profile and the dashboard.
 *
 * Accessibility note: the card uses the "stretched link" pattern — the title is
 * a real `<Link>` whose `::after` covers the card. That means one keyboard stop
 * per card instead of two, and the favourite button sits above it at `z-10`.
 */
export function ListingCard({
  listing,
  className,
  priority = false,
}: ListingCardProps) {
  const isUnavailable = listing.status !== "available";
  const { chip } = categoryVisual(listing.category);

  return (
    <article
      className={cn(
        "group relative flex flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-md",
        className,
      )}
    >
      <div className="relative aspect-[4/3] overflow-hidden">
        <ListingThumb listing={listing} priority={priority} />

        <div className="absolute top-3 left-3 flex flex-wrap items-center gap-1.5">
          {listing.listingType !== "sale" ? (
            <TypeBadge type={listing.listingType} />
          ) : null}
          {isUnavailable ? <StatusBadge status={listing.status} /> : null}
        </div>

        <div className="absolute top-3 right-3 z-10">
          <FavoriteButton listingId={listing.id} title={listing.title} />
        </div>
      </div>

      <div className="flex flex-1 flex-col gap-3 p-4">
        <div className="flex items-center justify-between gap-2">
          <span
            className={cn(
              "truncate rounded-full px-2 py-0.5 text-[11px] font-medium",
              chip,
            )}
          >
            {categoryLabel(listing.category)}
          </span>
          <ConditionBadge condition={listing.condition} size="sm" />
        </div>

        <h3 className="text-sm leading-snug font-semibold text-slate-900">
          <Link
            href={`/marketplace/${listing.id}`}
            className="line-clamp-2 rounded-sm"
          >
            {listing.title}
          </Link>
        </h3>

        <p className="line-clamp-2 text-xs text-slate-500">{listing.description}</p>

        <div className="mt-auto flex items-end justify-between gap-3 pt-1">
          <PriceTag
            price={listing.price}
            listingType={listing.listingType}
            className="text-lg"
          />
          <span className="text-[11px] text-slate-400">
            {formatDate(listing.createdAt)}
          </span>
        </div>

        <div className="flex items-center justify-between gap-2 border-t border-slate-100 pt-3 text-[11px] text-slate-500">
          <span className="inline-flex min-w-0 items-center gap-1">
            <MapPin className="size-3.5 shrink-0" aria-hidden="true" />
            <span className="truncate">{listing.location}</span>
          </span>
          <span className="inline-flex shrink-0 items-center gap-1">
            <Eye className="size-3.5" aria-hidden="true" />
            {listing.viewCount}
          </span>
        </div>
      </div>
    </article>
  );
}
