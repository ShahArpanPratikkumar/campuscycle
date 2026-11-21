import type { Metadata } from "next";
import { Suspense } from "react";
import { SearchX } from "lucide-react";
import { InfoBanner } from "@/components/common/info-banner";
import { Container } from "@/components/layout/container";
import { PageHeader } from "@/components/layout/page-header";
import { ListingGrid } from "@/components/listings/listing-grid";
import { ListingGridSkeleton } from "@/components/listings/listing-grid-skeleton";
import { FilterSidebar } from "@/components/marketplace/filter-panel";
import { MarketplaceToolbar } from "@/components/marketplace/marketplace-toolbar";
import { ButtonLink } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Pagination } from "@/components/ui/pagination";
import { Skeleton } from "@/components/ui/skeleton";
import { connectToDatabase } from "@/lib/db/connect";
import {
  collectFilterIssues,
  countActiveFilters,
  filtersToProductQuery,
  filtersToSearchParams,
  parseMarketplaceFilters,
} from "@/lib/marketplace";
import { listProducts } from "@/lib/services/product.service";
import { pluralize } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Marketplace",
  description:
    "Browse textbooks, electronics, calculators, cycles and hostel essentials listed by students on your campus.",
};

/**
 * The browse page.
 *
 * The URL is the query state: the server parses `searchParams`, asks the
 * product service for the matching page, and renders the grid. The only client
 * code is the toolbar, which pushes new URLs.
 *
 * Reads go straight through the service layer (not over HTTP) because this is a
 * Server Component — the same functions the `/api/products` route uses, so
 * filtering behaves identically whether it is browsed or fetched.
 *
 * The `searchParams` promise is handed to the inner component so the boundary
 * sits as close to the dynamic data as possible (see `streaming.md`).
 */
export default function MarketplacePage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  return (
    <Suspense fallback={<MarketplaceSkeleton />}>
      <MarketplaceResults searchParams={searchParams} />
    </Suspense>
  );
}

async function MarketplaceResults({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  await connectToDatabase();

  const params = await searchParams;
  const filters = parseMarketplaceFilters(params);
  const issues = collectFilterIssues(params);
  const { items, meta } = await listProducts(filtersToProductQuery(filters));
  const activeCount = countActiveFilters(filters);

  function buildHref(page: number): string {
    const params = filtersToSearchParams({ ...filters, page });
    const query = params.toString();
    return query ? `/marketplace?${query}` : "/marketplace";
  }

  return (
    <Container className="py-8 sm:py-10">
      <PageHeader
        title="Marketplace"
        description="Everything students on campus are selling, giving away or swapping."
        breadcrumbs={[{ label: "Home", href: "/" }, { label: "Marketplace" }]}
      />

      {issues.length > 0 ? (
        <InfoBanner
          tone="warning"
          title="Some filters in the link were ignored"
          className="mt-6"
        >
          <ul className="list-disc space-y-0.5 pl-4">
            {issues.map((issue) => (
              <li key={`${issue.field}-${issue.value}`}>{issue.message}</li>
            ))}
          </ul>
        </InfoBanner>
      ) : null}

      <div className="mt-8 grid gap-8 lg:grid-cols-[16rem_1fr]">
        <aside className="hidden lg:block">
          <div className="sticky top-24">
            <FilterSidebar filters={filters} />
          </div>
        </aside>

        <div className="flex min-w-0 flex-col gap-6">
          <MarketplaceToolbar filters={filters} />

          <p className="text-sm text-slate-500" aria-live="polite">
            {meta.total === 0 ? (
              "No listings found"
            ) : (
              <>
                <span className="font-medium text-slate-900">
                  {meta.total}
                </span>{" "}
                {pluralize(meta.total, "listing")} found
                {activeCount > 0
                  ? ` · ${activeCount} ${pluralize(activeCount, "filter")} applied`
                  : ""}
              </>
            )}
          </p>

          {items.length === 0 ? (
            <EmptyState
              icon={SearchX}
              title="No listings match those filters"
              description="Try removing a filter or two, widening the price range, or searching for something broader."
              action={
                <ButtonLink href="/marketplace" variant="outline">
                  Clear all filters
                </ButtonLink>
              }
            />
          ) : (
            <>
              <ListingGrid listings={items} priorityCount={3} />
              <Pagination
                page={meta.page}
                totalPages={meta.totalPages}
                buildHref={buildHref}
                className="pt-2"
              />
            </>
          )}
        </div>
      </div>
    </Container>
  );
}

/** Mirrors the marketplace layout so nothing shifts when data arrives. */
function MarketplaceSkeleton() {
  return (
    <Container className="py-8 sm:py-10">
      <Skeleton className="h-8 w-56" />
      <Skeleton className="mt-3 h-4 w-full max-w-lg" />

      <div className="mt-8 grid gap-8 lg:grid-cols-[16rem_1fr]">
        <div className="hidden lg:block">
          <Skeleton className="h-[30rem] rounded-xl" />
        </div>

        <div className="flex min-w-0 flex-col gap-6">
          <div className="flex flex-col gap-3 sm:flex-row">
            <Skeleton className="h-10 flex-1" />
            <Skeleton className="h-10 w-full sm:w-52" />
          </div>
          <Skeleton className="h-4 w-40" />
          <ListingGridSkeleton count={6} />
        </div>
      </div>
    </Container>
  );
}
