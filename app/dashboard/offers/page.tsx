import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { CheckCircle2, HandCoins } from "lucide-react";
import { InfoBanner } from "@/components/common/info-banner";
import { InboxTabs } from "@/components/dashboard/inbox-tabs";
import { OfferCard } from "@/components/dashboard/request-cards";
import { EmptyState } from "@/components/ui/empty-state";
import { SectionHeading } from "@/components/ui/section-heading";
import { connectToDatabase } from "@/lib/db/connect";
import { getCurrentActor } from "@/lib/session";
import { listOffers } from "@/lib/services/offer.service";

export const metadata: Metadata = { title: "Offers" };
export const dynamic = "force-dynamic";

interface DashboardOffersPageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

/**
 * Seller offer management (Step 6).
 *
 * Accepting an offer reserves the item for the buyer and auto-declines the other
 * live offers on it (BR-14); the seller can also decline or send a counter, which
 * hands the decision back to the buyer. `?view=sent` shows the buyer's offers.
 */
export default async function DashboardOffersPage({
  searchParams,
}: DashboardOffersPageProps) {
  await connectToDatabase();

  const actor = await getCurrentActor();
  if (!actor) redirect("/login?next=/dashboard/offers");

  const params = await searchParams;
  const scope = params.view === "sent" ? "sent" : "received";

  const { items } = await listOffers(
    {
      role: scope === "received" ? "seller" : "buyer",
      status: undefined,
      productId: undefined,
      page: 1,
      limit: 48,
    },
    actor,
  );

  const live = items.filter(
    (offer) => offer.status === "pending" || offer.status === "countered",
  );
  const decided = items.filter(
    (offer) => offer.status !== "pending" && offer.status !== "countered",
  );
  const viewerRole = scope === "received" ? "seller" : "buyer";

  return (
    <div className="flex flex-col gap-8">
      <InfoBanner tone="info" title="Accepting an offer reserves the item">
        The buyer&apos;s offer is only a proposal until you accept. On accept the
        listing becomes reserved for that buyer and the other offers are
        auto-declined.
      </InfoBanner>

      <InboxTabs
        basePath="/dashboard/offers"
        scope={scope}
        receivedLabel="Received"
        sentLabel="Sent"
      />

      <section className="flex flex-col gap-4">
        <SectionHeading
          title={`${scope === "received" ? "Offers to review" : "Offers you sent"} (${live.length})`}
          description={
            scope === "received"
              ? "Students waiting to hear whether their price works."
              : "Offers still in play. You can withdraw one at any time."
          }
        />
        {live.length > 0 ? (
          <div className="grid gap-5 lg:grid-cols-2">
            {live.map((offer) => (
              <OfferCard key={offer.id} offer={offer} viewerRole={viewerRole} />
            ))}
          </div>
        ) : (
          <EmptyState
            size="sm"
            icon={HandCoins}
            title="No offers in play"
            description={
              scope === "received"
                ? "When a student names a price it will appear here for review."
                : "Offers you make will appear here while they are pending."
            }
          />
        )}
      </section>

      <section className="flex flex-col gap-4">
        <SectionHeading
          title={`Decided (${decided.length})`}
          description="Accepted, declined, withdrawn and auto-declined offers."
        />
        {decided.length > 0 ? (
          <div className="grid gap-5 lg:grid-cols-2">
            {decided.map((offer) => (
              <OfferCard key={offer.id} offer={offer} viewerRole={viewerRole} />
            ))}
          </div>
        ) : (
          <EmptyState
            size="sm"
            icon={CheckCircle2}
            title="No decisions yet"
            description="Offers that are accepted, declined or withdrawn will be listed here."
          />
        )}
      </section>
    </div>
  );
}
