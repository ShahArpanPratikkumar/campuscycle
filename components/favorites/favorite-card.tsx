import { PackageX } from "lucide-react";
import { RemoveFavoriteButton } from "@/components/favorites/remove-favorite-button";
import { ListingCard } from "@/components/listings/listing-card";
import { ListingThumb } from "@/components/listings/listing-thumb";
import { Badge } from "@/components/ui/badge";
import type { BadgeTone } from "@/lib/constants";
import type { ApiFavorite } from "@/lib/types";
import { formatDate } from "@/lib/utils";

type Availability = NonNullable<ApiFavorite["availability"]>;

const AVAILABILITY: Record<
  Availability,
  { label: string; tone: BadgeTone; note: string }
> = {
  available: {
    label: "Available",
    tone: "success",
    note: "Still listed in the marketplace.",
  },
  reserved: {
    label: "Reserved",
    tone: "warning",
    note: "Held for another buyer, so it is hidden from browse.",
  },
  sold: {
    label: "Sold",
    tone: "neutral",
    note: "This one has been sold.",
  },
  unavailable: {
    label: "No longer available",
    tone: "danger",
    note: "The seller removed this listing.",
  },
};

/**
 * One saved product on the favourites page.
 *
 * The product's **current** status drives the presentation (BR-17): an
 * available item renders the normal `ListingCard`; a reserved or sold item
 * renders the card plus an explanatory strip; a removed (or hard-deleted) item
 * renders a greyed placeholder instead of a link that would 404. Every variant
 * keeps a remove action, because a favourite is never auto-deleted.
 */
export function FavoriteCard({ favorite }: { favorite: ApiFavorite }) {
  const product = favorite.product;
  const availability: Availability = favorite.availability ?? "available";

  if (!product || availability === "unavailable") {
    return <UnavailableFavorite favorite={favorite} />;
  }

  const meta = AVAILABILITY[availability];

  return (
    <div className="flex flex-col gap-3">
      <ListingCard listing={product} />

      {availability !== "available" ? (
        <p className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-600">
          {meta.note}
        </p>
      ) : null}

      <div className="flex items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2">
          <Badge tone={meta.tone}>{meta.label}</Badge>
          <span className="truncate text-xs text-slate-500">
            Saved {formatDate(favorite.savedAt)}
          </span>
        </div>
        <RemoveFavoriteButton
          productId={favorite.productId}
          title={product.title}
        />
      </div>
    </div>
  );
}

/** A favourite whose listing was removed (soft-deleted or hard-deleted). */
function UnavailableFavorite({ favorite }: { favorite: ApiFavorite }) {
  const product = favorite.product;

  return (
    <article className="flex flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
      <div className="relative aspect-[4/3] overflow-hidden">
        {product ? (
          <div className="absolute inset-0 opacity-60 grayscale">
            <ListingThumb listing={product} />
          </div>
        ) : (
          <div className="absolute inset-0 flex items-center justify-center bg-slate-100 text-slate-400">
            <PackageX className="size-12" strokeWidth={1.5} aria-hidden="true" />
          </div>
        )}

        <div className="absolute top-3 left-3">
          <Badge tone={AVAILABILITY.unavailable.tone}>
            {AVAILABILITY.unavailable.label}
          </Badge>
        </div>
      </div>

      <div className="flex flex-1 flex-col gap-3 p-4">
        <h3 className="line-clamp-2 text-sm font-semibold text-slate-700">
          {product?.title ?? "This listing has been removed"}
        </h3>
        <p className="text-xs text-slate-500">
          {product
            ? "The seller removed this listing, so it can no longer be opened."
            : "This listing no longer exists in the marketplace."}
        </p>

        <div className="mt-auto flex items-center justify-between gap-3 border-t border-slate-100 pt-3">
          <span className="text-xs text-slate-400">
            Saved {formatDate(favorite.savedAt)}
          </span>
          <RemoveFavoriteButton
            productId={favorite.productId}
            title={product?.title ?? "this listing"}
          />
        </div>
      </div>
    </article>
  );
}
