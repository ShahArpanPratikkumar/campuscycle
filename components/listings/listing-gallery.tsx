"use client";

import { useState } from "react";
import { ListingImage } from "@/components/listings/listing-image";
import { categoryVisual } from "@/lib/category-visuals";
import type { Listing } from "@/lib/types";
import { cn } from "@/lib/utils";

export interface ListingGalleryProps {
  listing: Listing;
  className?: string;
}

/**
 * Listing imagery.
 *
 * The primary slot shows the selected photo, or the category tile when the
 * listing has none. A photo that fails to load also falls back to the tile
 * (see `ListingImage`), so a dead URL never becomes a broken-image icon.
 */
export function ListingGallery({ listing, className }: ListingGalleryProps) {
  const { Icon, tile, icon } = categoryVisual(listing.category);
  const [active, setActive] = useState(0);
  const current = listing.images[active];

  const tileFallback = (
    <div className="flex h-full w-full flex-col items-center justify-center gap-3 px-6 text-center">
      <Icon
        className={cn("size-20", icon)}
        strokeWidth={1.25}
        aria-hidden="true"
      />
      <p className="text-xs font-medium text-slate-500">
        Category preview — the seller has not added photos.
      </p>
    </div>
  );

  return (
    <div className={cn("flex flex-col gap-3", className)}>
      <div
        className={cn(
          "relative aspect-[4/3] overflow-hidden rounded-xl border border-slate-200",
          tile,
        )}
      >
        {current ? (
          <ListingImage
            src={current}
            alt={listing.title}
            sizes="(min-width: 1024px) 60vw, 100vw"
            priority
            className="object-cover"
            fallback={tileFallback}
          />
        ) : (
          tileFallback
        )}
      </div>

      {listing.images.length > 1 ? (
        <ul className="no-scrollbar flex gap-2 overflow-x-auto">
          {listing.images.map((src, index) => (
            <li key={src}>
              <button
                type="button"
                onClick={() => setActive(index)}
                aria-label={`Show image ${index + 1} of ${listing.images.length}`}
                aria-current={index === active}
                className={cn(
                  "relative size-16 overflow-hidden rounded-lg border-2 transition-colors",
                  index === active
                    ? "border-brand-500"
                    : "border-transparent hover:border-slate-300",
                )}
              >
                <ListingImage
                  src={src}
                  alt=""
                  sizes="64px"
                  className="object-cover"
                  fallback={
                    <div className="flex h-full w-full items-center justify-center bg-slate-100 text-slate-400">
                      <Icon className="size-5" aria-hidden="true" />
                    </div>
                  }
                />
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
