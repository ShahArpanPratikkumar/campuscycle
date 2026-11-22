import Link from "next/link";
import { CalendarDays, HandCoins, MessageSquare } from "lucide-react";
import {
  EnquiryActions,
  OfferActions,
  type ViewerRole,
} from "@/components/dashboard/request-actions";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button";
import { enquiryStatusMeta, offerStatusMeta } from "@/lib/constants";
import type { ApiEnquiry, ApiOffer } from "@/lib/types";
import { cn, formatDate, formatPrice } from "@/lib/utils";

/**
 * Presentational cards for the dashboard enquiry and offer inboxes.
 *
 * The interactive accept/decline/counter/withdraw controls live in
 * `request-actions.tsx` (a client component) so these stay server-rendered. Both
 * cards are rendered for the "received" (seller) and "sent" (buyer) views; the
 * `viewerRole` decides which controls appear.
 */

/* -------------------------------------------------------------------------- */
/*  Enquiry                                                                    */
/* -------------------------------------------------------------------------- */

export function EnquiryCard({
  enquiry,
  viewerRole,
  className,
}: {
  enquiry: ApiEnquiry;
  viewerRole: ViewerRole;
  className?: string;
}) {
  const meta = enquiryStatusMeta(enquiry.status);
  const buyer = enquiry.buyer;

  return (
    <article
      className={cn(
        "flex flex-col rounded-xl border border-slate-200 bg-white p-5 shadow-sm",
        className,
      )}
    >
      <header className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <Avatar name={buyer?.displayName ?? "Student"} src={buyer?.avatarUrl} />
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-slate-900">
              {buyer?.displayName ?? "Unknown student"}
            </p>
            <p className="truncate text-xs text-slate-500">
              @{buyer?.handle ?? "unknown"} · {buyer?.campus ?? "Campus"}
            </p>
          </div>
        </div>
        <Badge tone={meta.tone}>{meta.label}</Badge>
      </header>

      <p className="mt-4 rounded-lg bg-slate-50 p-3.5 text-sm text-slate-700">
        {enquiry.message}
      </p>

      <dl className="mt-4 flex flex-col gap-1.5 text-xs text-slate-500">
        <div className="flex items-center gap-1.5">
          <MessageSquare className="size-3.5 shrink-0" aria-hidden="true" />
          <span className="min-w-0 truncate">
            About{" "}
            <Link
              href={`/marketplace/${enquiry.productId}`}
              className="font-medium text-slate-700 hover:text-brand-700"
            >
              {enquiry.product?.title ?? "this listing"}
            </Link>
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <CalendarDays className="size-3.5 shrink-0" aria-hidden="true" />
          Sent {formatDate(enquiry.createdAt)}
        </div>
        {enquiry.offerPrice !== undefined ? (
          <div className="flex items-center gap-1.5">
            <HandCoins className="size-3.5 shrink-0" aria-hidden="true" />
            Buyer suggested {formatPrice(enquiry.offerPrice, "sale")}
          </div>
        ) : null}
      </dl>

      {enquiry.sellerResponse?.message ? (
        <div className="mt-4 rounded-lg border border-slate-200 bg-slate-50/70 p-3.5">
          <p className="text-xs font-semibold text-slate-700">Seller reply</p>
          <p className="mt-1 text-sm text-slate-600">
            {enquiry.sellerResponse.message}
          </p>
        </div>
      ) : null}

      <footer className="mt-4 flex flex-wrap items-center gap-2">
        <EnquiryActions enquiry={enquiry} viewerRole={viewerRole} />
        <ButtonLink
          href={`/marketplace/${enquiry.productId}`}
          size="sm"
          variant="ghost"
          className="ml-auto"
        >
          View listing
        </ButtonLink>
      </footer>
    </article>
  );
}

/* -------------------------------------------------------------------------- */
/*  Offer                                                                      */
/* -------------------------------------------------------------------------- */

export function OfferCard({
  offer,
  viewerRole,
  className,
}: {
  offer: ApiOffer;
  viewerRole: ViewerRole;
  className?: string;
}) {
  const meta = offerStatusMeta(offer.status);
  const buyer = offer.buyer;
  const agreedPrice =
    offer.status === "accepted" && offer.counterPrice !== undefined
      ? offer.counterPrice
      : undefined;

  return (
    <article
      className={cn(
        "flex flex-col rounded-xl border border-slate-200 bg-white p-5 shadow-sm",
        className,
      )}
    >
      <header className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <Avatar name={buyer?.displayName ?? "Student"} src={buyer?.avatarUrl} />
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-slate-900">
              {buyer?.displayName ?? "Unknown student"}
            </p>
            <p className="truncate text-xs text-slate-500">
              @{buyer?.handle ?? "unknown"} · {buyer?.campus ?? "Campus"}
            </p>
          </div>
        </div>
        <Badge tone={meta.tone}>{meta.label}</Badge>
      </header>

      <div className="mt-4 flex flex-wrap items-baseline gap-x-2 gap-y-1">
        <span className="text-xl font-semibold text-slate-900 tabular-nums">
          {formatPrice(agreedPrice ?? offer.offerPrice, "sale")}
        </span>
        <span className="text-xs text-slate-500">
          {agreedPrice !== undefined ? "agreed" : "offered"} · listed at{" "}
          {formatPrice(offer.originalPrice, "sale")}
        </span>
      </div>

      {offer.counterPrice !== undefined && agreedPrice === undefined ? (
        <p className="mt-2 rounded-lg bg-brand-50 px-3 py-2 text-xs text-brand-900">
          Seller countered with{" "}
          <span className="font-semibold tabular-nums">
            {formatPrice(offer.counterPrice, "sale")}
          </span>
          .
        </p>
      ) : null}

      {offer.message ? (
        <p className="mt-3 rounded-lg bg-slate-50 p-3.5 text-sm text-slate-700">
          {offer.message}
        </p>
      ) : null}

      <dl className="mt-4 flex flex-col gap-1.5 text-xs text-slate-500">
        <div className="flex items-center gap-1.5">
          <MessageSquare className="size-3.5 shrink-0" aria-hidden="true" />
          <span className="min-w-0 truncate">
            About{" "}
            <Link
              href={`/marketplace/${offer.productId}`}
              className="font-medium text-slate-700 hover:text-brand-700"
            >
              {offer.product?.title ?? "this listing"}
            </Link>
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <CalendarDays className="size-3.5 shrink-0" aria-hidden="true" />
          Sent {formatDate(offer.createdAt)}
        </div>
      </dl>

      {offer.responseNote ? (
        <div className="mt-4 rounded-lg border border-slate-200 bg-slate-50/70 p-3.5">
          <p className="text-xs font-semibold text-slate-700">
            {offer.autoRejected ? "Auto-declined" : "Response"}
          </p>
          <p className="mt-1 text-sm text-slate-600">{offer.responseNote}</p>
        </div>
      ) : null}

      <footer className="mt-4 flex flex-wrap items-center gap-2">
        <OfferActions offer={offer} viewerRole={viewerRole} />
        <ButtonLink
          href={`/marketplace/${offer.productId}`}
          size="sm"
          variant="ghost"
          className="ml-auto"
        >
          View listing
        </ButtonLink>
      </footer>
    </article>
  );
}
