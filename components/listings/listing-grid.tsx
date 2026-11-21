import { ListingCard } from "@/components/listings/listing-card";
import type { Listing } from "@/lib/types";
import { cn } from "@/lib/utils";

export interface ListingGridProps {
  listings: Listing[];
  className?: string;
  /** How many leading cards should load their image eagerly. */
  priorityCount?: number;
}

/** Responsive 1 / 2 / 3 column grid shared by every listing surface. */
export function ListingGrid({
  listings,
  className,
  priorityCount = 0,
}: ListingGridProps) {
  return (
    <div className={cn("grid gap-5 sm:grid-cols-2 lg:grid-cols-3", className)}>
      {listings.map((listing, index) => (
        <ListingCard
          key={listing.id}
          listing={listing}
          priority={index < priorityCount}
        />
      ))}
    </div>
  );
}
