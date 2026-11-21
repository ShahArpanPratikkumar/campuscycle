import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import {
  BadgeCheck,
  CalendarDays,
  Eye,
  HandCoins,
  MapPin,
  Repeat,
  ShieldCheck,
  Tag,
} from "lucide-react";
import { InfoBanner } from "@/components/common/info-banner";
import { Container } from "@/components/layout/container";
import { PageHeader } from "@/components/layout/page-header";
import { FavoriteButton } from "@/components/listings/favorite-button";
import {
  ConditionBadge,
  PriceTag,
  StatusBadge,
  TypeBadge,
} from "@/components/listings/listing-badges";
import { ContactActions } from "@/components/listings/contact-dialogs";
import { ListingDetailSkeleton } from "@/components/listings/listing-detail-skeleton";
import { ListingGallery } from "@/components/listings/listing-gallery";
import { SellerCard } from "@/components/listings/seller-card";
import { SimilarListings } from "@/components/listings/similar-listings";
import { Card } from "@/components/ui/card";
import { isNotFoundError } from "@/lib/api/errors";
import {
  categoryLabel,
  conditionLabel,
  listingStatusMeta,
  listingTypeLabel,
  MARKETPLACE_LIMITS,
} from "@/lib/constants";
import { connectToDatabase } from "@/lib/db/connect";
import { getCurrentStudentId } from "@/lib/session";
import { getProductById, listProducts } from "@/lib/services/product.service";
import { getUserById } from "@/lib/services/user.service";
import type { ApiProduct, ListingWithSeller, Student } from "@/lib/types";
import { formatDate, formatNumber } from "@/lib/utils";

interface ListingPageProps {
  params: Promise<{ id: string }>;
}

/**
 * Resolves the seller's full profile.
 *
 * The product service only populates a compact seller summary, but `SellerCard`
 * shows stats and a join date, so the full profile is fetched separately. A
 * missing profile (deleted account) degrades to a placeholder rather than a 500.
 */
async function resolveSeller(
  sellerId: string,
  fallbackDate: string,
): Promise<Student> {
  try {
    return await getUserById(sellerId);
  } catch {
    return {
      id: sellerId,
      handle: "unknown",
      displayName: "Unknown student",
      campus: "Campus",
      joinedAt: fallbackDate,
      stats: { activeListings: 0, soldCount: 0 },
    };
  }
}

export async function generateMetadata({
  params,
}: ListingPageProps): Promise<Metadata> {
  await connectToDatabase();
  const { id } = await params;

  try {
    const product = await getProductById(id);
    return {
      title: product.title,
      description: product.description.slice(0, 160),
    };
  } catch (error) {
    return { title: isNotFoundError(error) ? "Listing not found" : "Listing" };
  }
}

/**
 * Listing detail.
 *
 * The listing itself is resolved *before* the `<Suspense>` boundary. That is
 * deliberate: a fallback rendering starts the HTTP response at `200 OK`, and a
 * `notFound()` fired after that point can no longer change the status code —
 * it only swaps the streamed UI. By resolving the product first, an unknown or
 * removed listing is a genuine `404`. See `node_modules/next/dist/docs/01-app/`
 * `02-guides/streaming.md` §"Status codes".
 *
 * The slower, secondary reads (seller profile, viewer identity, similar
 * listings) sit behind the boundary so the page still streams.
 */
export default async function ListingDetailPage({ params }: ListingPageProps) {
  await connectToDatabase();
  const { id } = await params;

  let product: ApiProduct;
  try {
    product = await getProductById(id);
  } catch (error) {
    // A missing/removed listing is a real 404; anything else (a database
    // outage, a malformed document) must surface to `error.tsx` instead of
    // being misreported as "this listing was removed".
    if (isNotFoundError(error)) notFound();
    throw error;
  }

  return (
    <Container className="py-8 sm:py-10">
      <PageHeader
        title={product.title}
        breadcrumbs={[
          { label: "Home", href: "/" },
          { label: "Marketplace", href: "/marketplace" },
          { label: product.title },
        ]}
      />

      <ListingStatusNotice status={product.status} />

      <Suspense fallback={<ListingDetailSkeleton />}>
        <ListingDetailContent product={product} />
      </Suspense>
    </Container>
  );
}

/**
 * A sold or reserved listing stays reachable by link (BR-6 only hides it from
 * browse), so the page explains its state up front rather than letting a student
 * discover it from a disabled button.
 */
function ListingStatusNotice({ status }: { status: ApiProduct["status"] }) {
  if (status === "sold") {
    return (
      <InfoBanner tone="warning" title="This item has been sold" className="mt-6">
        It is no longer available, but similar listings are shown below.
      </InfoBanner>
    );
  }

  if (status === "reserved") {
    return (
      <InfoBanner tone="info" title="This item is reserved" className="mt-6">
        Someone has reserved it. Enquiries and offers are paused for now.
      </InfoBanner>
    );
  }

  return null;
}

async function ListingDetailContent({ product }: { product: ApiProduct }) {
  const [seller, viewerId, similarResult] = await Promise.all([
    resolveSeller(product.sellerId, product.createdAt),
    getCurrentStudentId(),
    listProducts({
      category: [product.category],
      status: ["available"],
      sort: "newest",
      page: 1,
      limit: MARKETPLACE_LIMITS.similarListings + 1,
    }),
  ]);

  const listing: ListingWithSeller = { ...product, seller };
  const similar = similarResult.items
    .filter((item) => item.id !== product.id)
    .slice(0, MARKETPLACE_LIMITS.similarListings);

  const details: { icon: typeof Tag; label: string; value: string }[] = [
    { icon: Tag, label: "Category", value: categoryLabel(listing.category) },
    { icon: ShieldCheck, label: "Condition", value: conditionLabel(listing.condition) },
    { icon: HandCoins, label: "Listing type", value: listingTypeLabel(listing.listingType) },
    { icon: BadgeCheck, label: "Status", value: listingStatusMeta(listing.status).label },
    { icon: MapPin, label: "Pickup", value: listing.location },
    { icon: CalendarDays, label: "Listed on", value: formatDate(listing.createdAt) },
    { icon: Eye, label: "Views", value: formatNumber(listing.viewCount) },
  ];

  if (listing.exchangeFor) {
    details.push({ icon: Repeat, label: "Looking for", value: listing.exchangeFor });
  }

  return (
    <>
      <div className="mt-8 grid gap-8 lg:grid-cols-[minmax(0,1fr)_22rem] lg:items-start">
        {/* Main column */}
        <div className="flex min-w-0 flex-col gap-6">
          <ListingGallery listing={listing} />

          <div className="flex flex-col gap-4">
            <div className="flex flex-wrap items-center gap-2">
              <TypeBadge type={listing.listingType} />
              <ConditionBadge condition={listing.condition} />
              {listing.status !== "available" ? (
                <StatusBadge status={listing.status} />
              ) : null}
            </div>

            <p className="text-2xl font-semibold text-slate-900">
              <PriceTag
                price={listing.price}
                listingType={listing.listingType}
                className="text-2xl"
              />
            </p>

            <div className="prose-sm max-w-none">
              <h2 className="text-sm font-semibold text-slate-900">
                Description
              </h2>
              <p className="mt-2 text-sm leading-relaxed whitespace-pre-line text-slate-600">
                {listing.description}
              </p>
            </div>
          </div>

          <Card className="p-5">
            <h2 className="text-sm font-semibold text-slate-900">Details</h2>
            <dl className="mt-4 grid gap-4 sm:grid-cols-2">
              {details.map((detail) => (
                <div key={detail.label} className="flex items-start gap-2.5">
                  <detail.icon
                    className="mt-0.5 size-4 shrink-0 text-slate-400"
                    aria-hidden="true"
                  />
                  <div className="min-w-0">
                    <dt className="text-xs text-slate-400">{detail.label}</dt>
                    <dd className="text-sm text-slate-700">{detail.value}</dd>
                  </div>
                </div>
              ))}
            </dl>

            {listing.tags.length > 0 ? (
              <div className="mt-5 flex flex-wrap gap-2 border-t border-slate-100 pt-4">
                {listing.tags.map((tag) => (
                  <span
                    key={tag}
                    className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600"
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            ) : null}
          </Card>
        </div>

        {/* Sidebar */}
        <div className="flex flex-col gap-5 lg:sticky lg:top-24">
          <Card className="flex flex-col gap-4 p-5">
            <div className="flex items-center justify-between gap-3">
              <PriceTag
                price={listing.price}
                listingType={listing.listingType}
                className="text-2xl"
              />
              <StatusBadge status={listing.status} />
            </div>

            <FavoriteButton
              listingId={listing.id}
              title={listing.title}
              variant="button"
              className="w-full"
            />

            <ContactActions listing={listing} viewerId={viewerId} />
          </Card>

          <SellerCard seller={listing.seller} />

          <Card className="p-5">
            <h2 className="flex items-center gap-2 text-sm font-semibold text-slate-900">
              <ShieldCheck className="size-4 text-emerald-600" aria-hidden="true" />
              Stay safe on campus
            </h2>
            <ul className="mt-3 flex flex-col gap-2 text-xs text-slate-600">
              <li>Meet in a busy, public campus spot during the day.</li>
              <li>Check the item works before you pay for it.</li>
              <li>Pay in person — CampusCycle never holds your money.</li>
              <li>Keep the conversation inside the listing.</li>
            </ul>
          </Card>
        </div>
      </div>

      <SimilarListings
        listings={similar}
        browseHref={`/marketplace?category=${listing.category}`}
        className="mt-16"
      />
    </>
  );
}
