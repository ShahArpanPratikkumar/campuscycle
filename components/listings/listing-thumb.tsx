import { ListingImage } from "@/components/listings/listing-image";
import { categoryVisual } from "@/lib/category-visuals";
import type { Listing } from "@/lib/types";
import { cn } from "@/lib/utils";

export interface ListingThumbProps {
  listing: Listing;
  /** `sizes` hint for `next/image`; the grid passes its own value. */
  sizes?: string;
  priority?: boolean;
  className?: string;
}

/**
 * The visual for a listing.
 *
 * Listings without an uploaded photo render a category tile (tinted background
 * + category icon). When a listing *does* have an `images[0]` URL the image
 * branch takes over — and if that URL fails to load, `ListingImage` falls back
 * to the same category tile rather than a broken image.
 *
 * Always renders absolutely, so the parent must be `relative` with an aspect
 * ratio. That keeps every usage (card, gallery) pixel-consistent.
 */
export function ListingThumb({
  listing,
  sizes = "(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw",
  priority = false,
  className,
}: ListingThumbProps) {
  const [src] = listing.images;
  const { Icon, tile, icon } = categoryVisual(listing.category);

  const fallback = (
    <div className="flex h-full w-full items-center justify-center">
      <Icon
        className={cn("size-12 sm:size-14", icon)}
        strokeWidth={1.5}
        aria-hidden="true"
      />
    </div>
  );

  return (
    <div className={cn("absolute inset-0", tile, className)}>
      {src ? (
        <ListingImage
          src={src}
          alt={listing.title}
          sizes={sizes}
          priority={priority}
          className="object-cover"
          fallback={fallback}
        />
      ) : (
        fallback
      )}
    </div>
  );
}
