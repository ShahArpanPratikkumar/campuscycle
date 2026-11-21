"use client";

import { Heart } from "lucide-react";
import { useFavorites } from "@/components/providers/favorites-provider";
import { buttonClasses } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export interface FavoriteButtonProps {
  listingId: string;
  /** Listing title, used to build a meaningful accessible label. */
  title: string;
  variant?: "icon" | "button";
  className?: string;
}

/**
 * Toggle for saved products.
 *
 * From Step 7 the save is real: `FavoritesProvider` optimistically updates the
 * id set and calls `POST`/`DELETE /api/favorites` (with rollback + a toast on
 * failure). This component only renders the current state and disables itself
 * while a request for the same product is in flight.
 */
export function FavoriteButton({
  listingId,
  title,
  variant = "icon",
  className,
}: FavoriteButtonProps) {
  const { isFavorite, isPending, toggleFavorite } = useFavorites();
  const active = isFavorite(listingId);
  const pending = isPending(listingId);
  const label = active
    ? `Remove ${title} from favourites`
    : `Save ${title} to favourites`;

  if (variant === "button") {
    return (
      <button
        type="button"
        aria-pressed={active}
        aria-label={label}
        aria-busy={pending || undefined}
        disabled={pending}
        onClick={() => toggleFavorite(listingId)}
        className={cn(
          buttonClasses({ variant: active ? "primary" : "outline", size: "md" }),
          className,
        )}
      >
        <Heart
          className={cn("size-4", active && "fill-current")}
          aria-hidden="true"
        />
        {active ? "Saved" : "Save"}
      </button>
    );
  }

  return (
    <button
      type="button"
      aria-pressed={active}
      aria-label={label}
      aria-busy={pending || undefined}
      disabled={pending}
      onClick={() => toggleFavorite(listingId)}
      className={cn(
        "inline-flex size-9 items-center justify-center rounded-full border border-slate-200/80 bg-white/95 text-slate-500 shadow-sm backdrop-blur transition-colors hover:text-rose-600 disabled:opacity-70",
        active && "text-rose-600",
        className,
      )}
    >
      <Heart
        className={cn("size-4", active && "fill-current")}
        aria-hidden="true"
      />
    </button>
  );
}
