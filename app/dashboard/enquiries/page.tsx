import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { CheckCircle2, MessageSquare } from "lucide-react";
import { InfoBanner } from "@/components/common/info-banner";
import { InboxTabs } from "@/components/dashboard/inbox-tabs";
import { EnquiryCard } from "@/components/dashboard/request-cards";
import { EmptyState } from "@/components/ui/empty-state";
import { SectionHeading } from "@/components/ui/section-heading";
import { connectToDatabase } from "@/lib/db/connect";
import { getCurrentActor } from "@/lib/session";
import { listEnquiries } from "@/lib/services/enquiry.service";

export const metadata: Metadata = { title: "Enquiries" };
export const dynamic = "force-dynamic";

interface DashboardEnquiriesPageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

/**
 * Seller enquiry inbox (Step 6).
 *
 * Reads real `enquiries` through the same service the API uses. `?view=sent`
 * flips it to the buyer's outbox. Accept/decline/cancel are live — each card's
 * controls POST to `/api/enquiries/[id]` and refresh the list.
 */
export default async function DashboardEnquiriesPage({
  searchParams,
}: DashboardEnquiriesPageProps) {
  await connectToDatabase();

  const actor = await getCurrentActor();
  if (!actor) redirect("/login?next=/dashboard/enquiries");

  const params = await searchParams;
  const scope = params.view === "sent" ? "sent" : "received";

  const { items } = await listEnquiries(
    {
      role: scope === "received" ? "seller" : "buyer",
      status: undefined,
      productId: undefined,
      page: 1,
      limit: 48,
    },
    actor,
  );

  const pending = items.filter((enquiry) => enquiry.status === "pending");
  const answered = items.filter((enquiry) => enquiry.status !== "pending");
  const viewerRole = scope === "received" ? "seller" : "buyer";

  return (
    <div className="flex flex-col gap-8">
      <InfoBanner tone="info" title="Enquiries are conversations">
        Accepting an enquiry lets the buyer know you can help — it does not
        reserve the item. Only an accepted offer reserves it.
      </InfoBanner>

      <InboxTabs
        basePath="/dashboard/enquiries"
        scope={scope}
        receivedLabel="Received"
        sentLabel="Sent"
      />

      <section className="flex flex-col gap-4">
        <SectionHeading
          title={`${scope === "received" ? "Waiting for your reply" : "Awaiting a reply"} (${pending.length})`}
          description={
            scope === "received"
              ? "Answering quickly is the difference between a sale and a no."
              : "Enquiries you have sent to other students."
          }
        />
        {pending.length > 0 ? (
          <div className="grid gap-5 lg:grid-cols-2">
            {pending.map((enquiry) => (
              <EnquiryCard
                key={enquiry.id}
                enquiry={enquiry}
                viewerRole={viewerRole}
              />
            ))}
          </div>
        ) : (
          <EmptyState
            size="sm"
            icon={MessageSquare}
            title="No open enquiries"
            description={
              scope === "received"
                ? "You are all caught up. New questions will land here."
                : "Enquiries you send will appear here while they wait."
            }
          />
        )}
      </section>

      <section className="flex flex-col gap-4">
        <SectionHeading
          title={`Answered (${answered.length})`}
          description="A record of enquiries that have been accepted, declined or cancelled."
        />
        {answered.length > 0 ? (
          <div className="grid gap-5 lg:grid-cols-2">
            {answered.map((enquiry) => (
              <EnquiryCard
                key={enquiry.id}
                enquiry={enquiry}
                viewerRole={viewerRole}
              />
            ))}
          </div>
        ) : (
          <EmptyState
            size="sm"
            icon={CheckCircle2}
            title="Nothing answered yet"
            description="Once an enquiry is accepted, declined or cancelled it moves into this list."
          />
        )}
      </section>
    </div>
  );
}
