import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Package, Plus } from "lucide-react";
import { ListingManageRow } from "@/components/dashboard/listing-manage-row";
import { ButtonLink } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { SectionHeading } from "@/components/ui/section-heading";
import { connectToDatabase } from "@/lib/db/connect";
import { getCurrentStudentId } from "@/lib/session";
import { listProducts } from "@/lib/services/product.service";
import type { Listing, ListingStatus } from "@/lib/types";
import { pluralize } from "@/lib/utils";

export const metadata: Metadata = { title: "My listings" };
export const dynamic = "force-dynamic";

const GROUPS: {
  status: ListingStatus;
  title: string;
  description: string;
}[] = [
  {
    status: "available",
    title: "Available",
    description: "Live in the marketplace right now.",
  },
  {
    status: "reserved",
    title: "Reserved",
    description: "Held for a buyer, so they are hidden from browse.",
  },
  {
    status: "sold",
    title: "Sold",
    description: "Completed sales you can relist if you have another one.",
  },
  {
    status: "deleted",
    title: "Inactive",
    description: "Removed from the marketplace. Relist one to put it back.",
  },
];

/**
 * "My listings" — every item the current student has posted, grouped by status.
 *
 * The status buttons on each row are live (see `ListingManageRow`): they call
 * `PATCH`/`DELETE /api/products/[id]` and then `router.refresh()` this page, so
 * the groups always reflect what is actually stored.
 */
export default async function DashboardListingsPage() {
  await connectToDatabase();

  const studentId = await getCurrentStudentId();
  if (!studentId) redirect("/login?next=/dashboard/listings");

  const { items } = await listProducts({
    sellerId: studentId,
    // Include every status — the owner sees their inactive items too.
    status: ["available", "reserved", "sold", "deleted"],
    sort: "newest",
    page: 1,
    limit: 48,
  });

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-slate-500">
          {items.length} {pluralize(items.length, "listing")} in total
        </p>
        <ButtonLink
          href="/sell"
          icon={<Plus className="size-4" aria-hidden="true" />}
        >
          List a new item
        </ButtonLink>
      </div>

      {GROUPS.map((group) => {
        const groupItems: Listing[] = items.filter(
          (listing) => listing.status === group.status,
        );

        return (
          <section key={group.status} className="flex flex-col gap-4">
            <SectionHeading
              title={`${group.title} (${groupItems.length})`}
              description={group.description}
            />

            {groupItems.length > 0 ? (
              <div className="flex flex-col gap-3">
                {groupItems.map((listing) => (
                  <ListingManageRow key={listing.id} listing={listing} />
                ))}
              </div>
            ) : (
              <EmptyState
                size="sm"
                icon={Package}
                title={`Nothing ${group.title.toLowerCase()}`}
                description="Listings will appear in this group as their status changes."
              />
            )}
          </section>
        );
      })}
    </div>
  );
}
