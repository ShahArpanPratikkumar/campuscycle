import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { PackageOpen } from "lucide-react";
import { Container } from "@/components/layout/container";
import { PageHeader } from "@/components/layout/page-header";
import { ListingGrid } from "@/components/listings/listing-grid";
import { ListingGridSkeleton } from "@/components/listings/listing-grid-skeleton";
import { SellerCard } from "@/components/listings/seller-card";
import { ButtonLink } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { SectionHeading } from "@/components/ui/section-heading";
import { Skeleton } from "@/components/ui/skeleton";
import { isNotFoundError } from "@/lib/api/errors";
import { connectToDatabase } from "@/lib/db/connect";
import { listProducts } from "@/lib/services/product.service";
import { getUserById } from "@/lib/services/user.service";
import type { ApiProduct, ApiUser } from "@/lib/types";
import { pluralize } from "@/lib/utils";

export const dynamic = "force-dynamic";

interface SellerPageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({
  params,
}: SellerPageProps): Promise<Metadata> {
  await connectToDatabase();
  const { id } = await params;

  try {
    const seller = await getUserById(id);
    return { title: seller.displayName, description: seller.bio };
  } catch (error) {
    return { title: isNotFoundError(error) ? "Student not found" : "Profile" };
  }
}

/**
 * A student's public profile.
 *
 * Shows the seller's card (name, campus, contact preference, counters), their
 * currently `available` listings, and a short "sold" history. Reserved and
 * inactive rows are never exposed here (BR-6) — only the owner sees those, in
 * their dashboard.
 *
 * The profile is resolved before the `<Suspense>` boundary so an unknown id is a
 * real HTTP 404, and a database failure re-throws to `error.tsx` instead of
 * masquerading as a missing student. See `streaming.md` §Status codes.
 */
export default async function SellerPage({ params }: SellerPageProps) {
  await connectToDatabase();
  const { id } = await params;

  let seller: ApiUser;
  try {
    seller = await getUserById(id);
  } catch (error) {
    if (isNotFoundError(error)) notFound();
    throw error;
  }

  return (
    <Container className="py-8 sm:py-10">
      <PageHeader
        title={seller.displayName}
        description={seller.bio}
        breadcrumbs={[
          { label: "Home", href: "/" },
          { label: "Marketplace", href: "/marketplace" },
          { label: seller.displayName },
        ]}
      />

      <div className="mt-8 grid gap-8 lg:grid-cols-[20rem_1fr] lg:items-start">
        <SellerCard
          seller={seller}
          showProfileLink={false}
          className="lg:sticky lg:top-24"
        />

        <Suspense fallback={<SellerListingsSkeleton />}>
          <SellerListings seller={seller} />
        </Suspense>
      </div>
    </Container>
  );
}

async function SellerListings({ seller }: { seller: ApiUser }) {
  const [available, sold] = await Promise.all([
    listProducts({
      sellerId: seller.id,
      status: ["available"],
      sort: "newest",
      page: 1,
      limit: 48,
    }),
    listProducts({
      sellerId: seller.id,
      status: ["sold"],
      sort: "newest",
      page: 1,
      limit: 12,
    }),
  ]);

  return (
    <div className="flex min-w-0 flex-col gap-10">
      <section className="flex flex-col gap-6">
        <SectionHeading
          title={`Available listings (${available.meta.total})`}
          description={
            available.meta.total > 0
              ? `Everything ${seller.displayName} has up for grabs right now.`
              : undefined
          }
        />

        {available.items.length > 0 ? (
          <ListingGrid listings={available.items} priorityCount={3} />
        ) : (
          <EmptyState
            icon={PackageOpen}
            title="No available listings"
            description={`${seller.displayName} has nothing up for sale right now. Check back after their next clear-out.`}
            action={
              <ButtonLink href="/marketplace" variant="outline">
                Browse the marketplace
              </ButtonLink>
            }
          />
        )}
      </section>

      {sold.meta.total > 0 ? (
        <SoldHistory
          sellerName={seller.displayName}
          total={sold.meta.total}
          listings={sold.items}
        />
      ) : null}
    </div>
  );
}

/**
 * Listing history.
 *
 * Sold rows stay reachable by link (BR-6 only hides them from browse), so they
 * double as the seller's track record and as proof for a buyer that the profile
 * is active. Rendered as a plain grid — the cards already show a "Sold" badge.
 */
function SoldHistory({
  sellerName,
  total,
  listings,
}: {
  sellerName: string;
  total: number;
  listings: ApiProduct[];
}) {
  return (
    <section className="flex flex-col gap-6">
      <SectionHeading
        eyebrow="Track record"
        title={`Sold (${total})`}
        description={`${pluralize(total, "item")} ${sellerName} has already found a new home for.`}
      />
      <ListingGrid listings={listings} />
    </section>
  );
}

function SellerListingsSkeleton() {
  return (
    <div className="flex min-w-0 flex-col gap-10">
      <div className="flex flex-col gap-6">
        <Skeleton className="h-5 w-40" />
        <ListingGridSkeleton count={3} />
      </div>
      <div className="flex flex-col gap-6">
        <Skeleton className="h-5 w-32" />
        <ListingGridSkeleton count={3} />
      </div>
    </div>
  );
}
