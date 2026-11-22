"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import {
  CalendarDays,
  Check,
  Eye,
  Pencil,
  RotateCcw,
  Trash2,
} from "lucide-react";
import { Button, ButtonLink } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import {
  PriceTag,
  StatusBadge,
  TypeBadge,
} from "@/components/listings/listing-badges";
import { ListingThumb } from "@/components/listings/listing-thumb";
import { useToast } from "@/hooks/use-toast";
import { ApiClientError, fetchJson } from "@/lib/api/client";
import type { ApiProduct, Listing, ListingStatus } from "@/lib/types";
import { cn, formatDate, formatNumber } from "@/lib/utils";

/**
 * One row in "My listings".
 *
 * Every control is live: the status buttons call `PATCH /api/products/[id]`
 * with a BR-13 transition, "Remove" is a soft delete (BR-16), and both
 * `router.refresh()` the list so the groups update immediately.
 */
export function ListingManageRow({
  listing,
  className,
}: {
  listing: Listing;
  className?: string;
}) {
  const router = useRouter();
  const { toast } = useToast();
  const [pending, setPending] = useState<ListingStatus | "delete" | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);

  const canMarkSold = listing.status === "available" || listing.status === "reserved";
  const canReserve = listing.status === "available";
  const canRelist = listing.status === "reserved" || listing.status === "sold";
  const canRemove = listing.status !== "deleted";

  async function run(
    key: ListingStatus | "delete",
    request: () => Promise<ApiProduct>,
    success: { title: string; description: string },
  ) {
    setPending(key);
    try {
      await request();
      toast(success);
      setConfirmOpen(false);
      router.refresh();
    } catch (error) {
      toast({
        title: "Could not update listing",
        description:
          error instanceof ApiClientError
            ? error.message
            : "Something went wrong. Please try again.",
        tone: "error",
      });
    } finally {
      setPending(null);
    }
  }

  const changeStatus = (next: ListingStatus, success: { title: string; description: string }) =>
    run(
      next,
      () =>
        fetchJson<ApiProduct>(`/api/products/${listing.id}`, {
          method: "PATCH",
          body: JSON.stringify({ status: next }),
        }),
      success,
    );

  const remove = () =>
    run(
      "delete",
      () =>
        fetchJson<ApiProduct>(`/api/products/${listing.id}`, {
          method: "DELETE",
        }),
      {
        title: "Listing removed",
        description: `“${listing.title}” is now inactive and hidden from the marketplace.`,
      },
    );

  const busy = pending !== null;

  return (
    <article
      className={cn(
        "flex flex-col gap-4 rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:flex-row sm:items-center",
        className,
      )}
    >
      <div className="relative size-20 shrink-0 overflow-hidden rounded-lg">
        <ListingThumb listing={listing} sizes="80px" />
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <StatusBadge status={listing.status} size="sm" />
          {listing.listingType !== "sale" ? (
            <TypeBadge type={listing.listingType} size="sm" />
          ) : null}
        </div>

        <h3 className="mt-1.5 text-sm font-semibold text-slate-900">
          <Link
            href={`/marketplace/${listing.id}`}
            className="hover:text-brand-700"
          >
            {listing.title}
          </Link>
        </h3>

        <div className="mt-1.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500">
          <PriceTag
            price={listing.price}
            listingType={listing.listingType}
            className="text-sm"
          />
          <span className="inline-flex items-center gap-1">
            <Eye className="size-3.5" aria-hidden="true" />
            {formatNumber(listing.viewCount)} views
          </span>
          <span className="inline-flex items-center gap-1">
            <CalendarDays className="size-3.5" aria-hidden="true" />
            Listed {formatDate(listing.createdAt)}
          </span>
        </div>
      </div>

      <div className="flex shrink-0 flex-wrap items-center gap-2">
        <ButtonLink
          href={`/marketplace/${listing.id}`}
          variant="outline"
          size="sm"
        >
          View
        </ButtonLink>

        <ButtonLink
          href={`/marketplace/${listing.id}/edit`}
          variant="outline"
          size="sm"
          icon={<Pencil className="size-4" aria-hidden="true" />}
        >
          Edit
        </ButtonLink>

        {canReserve ? (
          <Button
            variant="ghost"
            size="sm"
            disabled={busy}
            loading={pending === "reserved"}
            onClick={() =>
              changeStatus("reserved", {
                title: "Listing reserved",
                description: `“${listing.title}” is now held and hidden from browse.`,
              })
            }
          >
            Reserve
          </Button>
        ) : null}

        {canMarkSold ? (
          <Button
            variant="ghost"
            size="sm"
            disabled={busy}
            loading={pending === "sold"}
            icon={<Check className="size-4" aria-hidden="true" />}
            onClick={() =>
              changeStatus("sold", {
                title: "Marked as sold",
                description: `“${listing.title}” has left the marketplace.`,
              })
            }
          >
            Mark sold
          </Button>
        ) : null}

        {canRelist ? (
          <Button
            variant="ghost"
            size="sm"
            disabled={busy}
            loading={pending === "available"}
            icon={<RotateCcw className="size-4" aria-hidden="true" />}
            onClick={() =>
              changeStatus("available", {
                title: "Listing relisted",
                description: `“${listing.title}” is live in the marketplace again.`,
              })
            }
          >
            Relist
          </Button>
        ) : null}

        {canRemove ? (
          <Button
            variant="ghost"
            size="sm"
            disabled={busy}
            icon={<Trash2 className="size-4" aria-hidden="true" />}
            className="text-rose-600 hover:bg-rose-50 hover:text-rose-700"
            onClick={() => setConfirmOpen(true)}
          >
            Remove
          </Button>
        ) : null}
      </div>

      <ConfirmDialog
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        onConfirm={remove}
        pending={pending === "delete"}
        title="Remove this listing?"
        description={`“${listing.title}” will be marked inactive and hidden from the marketplace. You can relist it later.`}
        confirmLabel="Remove listing"
      >
        <p className="text-sm text-slate-600">
          This is a soft delete: the listing stops appearing in browse and search,
          but your history is kept.
        </p>
      </ConfirmDialog>
    </article>
  );
}
