import Link from "next/link";
import { Suspense } from "react";
import {
  ArrowRight,
  HandCoins,
  MessageSquare,
  Package,
  PackageOpen,
  Search,
  Sparkles,
  TrendingUp,
  Users,
  type LucideIcon,
} from "lucide-react";
import { Container } from "@/components/layout/container";
import { CategoryGrid } from "@/components/listings/category-grid";
import { ListingGrid } from "@/components/listings/listing-grid";
import { ListingGridSkeleton } from "@/components/listings/listing-grid-skeleton";
import { HomeSearch } from "@/components/marketplace/home-search";
import { ButtonLink } from "@/components/ui/button";
import { SectionHeading } from "@/components/ui/section-heading";
import { Skeleton } from "@/components/ui/skeleton";
import { MARKETPLACE_LIMITS } from "@/lib/constants";
import { connectToDatabase } from "@/lib/db/connect";
import { listProducts } from "@/lib/services/product.service";
import {
  getCategoryCounts,
  getPlatformStats,
} from "@/lib/services/stats.service";
import { formatNumber, pluralize } from "@/lib/utils";

export const dynamic = "force-dynamic";

const POPULAR_SEARCHES = ["textbook", "calculator", "cycle", "laptop"];

const STEPS: { icon: LucideIcon; title: string; body: string }[] = [
  {
    icon: Search,
    title: "Find something useful",
    body: "Filter by category, condition, price or listing type and see exactly what is available on your campus right now.",
  },
  {
    icon: MessageSquare,
    title: "Ask or make an offer",
    body: "Send the seller a question, or skip ahead and offer a price. Every conversation stays attached to the listing.",
  },
  {
    icon: HandCoins,
    title: "Meet, pay and collect",
    body: "Agree on a campus spot, check the item in person, then mark it sold so it leaves the browse grid.",
  },
];

/**
 * Home page shell.
 *
 * The data-driven sections live in `<HomeContent>`, which is wrapped in an
 * explicit `<Suspense>` boundary here. Keeping the boundary *inside* the page
 * (rather than a route-level `loading.tsx`) matters: a `loading.tsx` at the
 * root wraps every nested route, so any `redirect()`/`notFound()` firing below
 * it could only be applied client-side, never as a real HTTP status. See
 * `node_modules/next/dist/docs/01-app/02-guides/streaming.md` §"Status codes".
 */
export default function HomePage() {
  return (
    <Suspense fallback={<HomeSkeleton />}>
      <HomeContent />
    </Suspense>
  );
}

async function HomeContent() {
  await connectToDatabase();

  // Four independent reads, issued together. `listProducts` is the same
  // function the `/api/products` route uses, so the rails and the marketplace
  // can never disagree about what "available" means.
  const [stats, categoryCounts, newest, freeOrExchange] = await Promise.all([
    getPlatformStats(),
    getCategoryCounts(),
    listProducts({
      status: ["available"],
      sort: "newest",
      page: 1,
      limit: MARKETPLACE_LIMITS.homePreviewSize,
    }),
    listProducts({
      status: ["available"],
      type: ["free", "exchange"],
      sort: "newest",
      page: 1,
      limit: 3,
    }),
  ]);

  const newestListings = newest.items;
  const sharedListings = freeOrExchange.items;

  return (
    <>
      {/* ---------------------------------------------------------------- */}
      {/*  Hero                                                            */}
      {/* ---------------------------------------------------------------- */}
      <section className="relative overflow-hidden border-b border-slate-200 bg-white">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -top-40 -right-32 size-[28rem] rounded-full bg-brand-50 blur-3xl"
        />

        <Container className="relative py-16 sm:py-24">
          <div className="mx-auto max-w-3xl text-center">
            <span className="inline-flex items-center gap-2 rounded-full border border-brand-100 bg-brand-50 px-3 py-1 text-xs font-medium text-brand-700">
              <Sparkles className="size-3.5" aria-hidden="true" />
              Built for your campus, by students
            </span>

            <h1 className="mt-5 text-4xl font-semibold tracking-tight text-balance text-slate-900 sm:text-5xl">
              Buy, sell and swap <span className="text-brand-600">on campus</span>
            </h1>

            <p className="mx-auto mt-4 max-w-xl text-base text-pretty text-slate-600 sm:text-lg">
              Textbooks, calculators, laptops, cycles and hostel essentials —
              from students in your own campus, at prices that actually make
              sense.
            </p>

            <div className="mx-auto mt-8 max-w-xl">
              <HomeSearch />
            </div>

            <div className="mt-4 flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-xs text-slate-500">
              <span className="font-medium">Popular:</span>
              {POPULAR_SEARCHES.map((term) => (
                <Link
                  key={term}
                  href={`/marketplace?q=${term}`}
                  className="rounded-full border border-slate-200 bg-white px-2.5 py-1 font-medium text-slate-600 transition-colors hover:border-brand-200 hover:text-brand-700"
                >
                  {term}
                </Link>
              ))}
            </div>
          </div>

          <dl className="mx-auto mt-14 grid max-w-3xl grid-cols-2 gap-4 sm:grid-cols-4">
            <HeroStat
              icon={Package}
              value={stats.liveListings}
              label="Live listings"
            />
            <HeroStat icon={Users} value={stats.students} label="Students" />
            <HeroStat
              icon={PackageOpen}
              value={stats.freeItems}
              label="Free items"
            />
            <HeroStat
              icon={TrendingUp}
              value={stats.soldItems}
              label="Items sold"
            />
          </dl>
        </Container>
      </section>

      {/* ---------------------------------------------------------------- */}
      {/*  Categories                                                      */}
      {/* ---------------------------------------------------------------- */}
      <Container className="py-14 sm:py-16">
        <SectionHeading
          eyebrow="Browse"
          title="Shop by category"
          description="Ten categories cover almost everything a student needs — and everything they are trying to get rid of."
          action={
            <ButtonLink
              href="/marketplace"
              variant="outline"
              icon={<ArrowRight className="size-4" aria-hidden="true" />}
            >
              All listings
            </ButtonLink>
          }
        />
        <CategoryGrid counts={categoryCounts} className="mt-8" />
      </Container>

      {/* ---------------------------------------------------------------- */}
      {/*  Newest listings                                                 */}
      {/* ---------------------------------------------------------------- */}
      <div className="border-y border-slate-200 bg-white">
        <Container className="py-14 sm:py-16">
          <SectionHeading
            eyebrow="Fresh on campus"
            title="Newest listings"
            description="The most recently posted items from students around you."
            action={
              <ButtonLink
                href="/marketplace?sort=newest"
                variant="ghost"
                icon={<ArrowRight className="size-4" aria-hidden="true" />}
              >
                See more
              </ButtonLink>
            }
          />
          <ListingGrid listings={newestListings} className="mt-8" priorityCount={3} />
        </Container>
      </div>

      {/* ---------------------------------------------------------------- */}
      {/*  Free & exchange                                                 */}
      {/* ---------------------------------------------------------------- */}
      {sharedListings.length > 0 ? (
        <Container className="py-14 sm:py-16">
          <SectionHeading
            eyebrow="Give and take"
            title="Free and exchange"
            description="Not everything has to cost money. Some students would rather swap or simply pass it on."
            action={
              <ButtonLink
                href="/marketplace?type=free"
                variant="ghost"
                icon={<ArrowRight className="size-4" aria-hidden="true" />}
              >
                Free items
              </ButtonLink>
            }
          />
          <ListingGrid listings={sharedListings} className="mt-8" />
        </Container>
      ) : null}

      {/* ---------------------------------------------------------------- */}
      {/*  How it works                                                    */}
      {/* ---------------------------------------------------------------- */}
      <div className="border-y border-slate-200 bg-white">
        <Container className="py-14 sm:py-16">
          <SectionHeading
            eyebrow="How it works"
            title="Three steps, no middleman"
            description="CampusCycle is deliberately simple — no payments in the app, no shipping, no fees."
          />

          <ol className="mt-10 grid gap-6 sm:grid-cols-3">
            {STEPS.map((step, index) => (
              <li
                key={step.title}
                className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-slate-50/60 p-5"
              >
                <span className="flex size-10 items-center justify-center rounded-lg bg-brand-600 text-white">
                  <step.icon className="size-5" aria-hidden="true" />
                </span>
                <h3 className="text-sm font-semibold text-slate-900">
                  <span className="text-slate-400">{index + 1}. </span>
                  {step.title}
                </h3>
                <p className="text-sm text-slate-600">{step.body}</p>
              </li>
            ))}
          </ol>
        </Container>
      </div>

      {/* ---------------------------------------------------------------- */}
      {/*  Closing call to action                                          */}
      {/* ---------------------------------------------------------------- */}
      <Container className="py-14 sm:py-16">
        <div className="flex flex-col items-center gap-6 rounded-2xl border border-brand-100 bg-brand-50/70 px-6 py-12 text-center sm:px-12">
          <h2 className="max-w-xl text-2xl font-semibold tracking-tight text-balance text-slate-900 sm:text-3xl">
            Clearing out your hostel room?
          </h2>
          <p className="max-w-lg text-sm text-slate-600 sm:text-base">
            List it in a couple of minutes. {formatNumber(stats.liveListings)}{" "}
            {pluralize(stats.liveListings, "item")} are already up for grabs on
            campus.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3">
            <ButtonLink href="/sell" size="lg">
              Sell an item
            </ButtonLink>
            <ButtonLink href="/marketplace" size="lg" variant="outline">
              Browse the marketplace
            </ButtonLink>
          </div>
        </div>
      </Container>
    </>
  );
}

function HeroStat({
  icon: Icon,
  value,
  label,
}: {
  icon: LucideIcon;
  value: number;
  label: string;
}) {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-brand-50 text-brand-600">
        <Icon className="size-4" aria-hidden="true" />
      </span>
      <div className="min-w-0 text-left">
        <dd className="text-lg font-semibold text-slate-900 tabular-nums">
          {formatNumber(value)}
        </dd>
        <dt className="truncate text-xs text-slate-500">{label}</dt>
      </div>
    </div>
  );
}

/** Full-page skeleton shown while the home page's data resolves. */
function HomeSkeleton() {
  return (
    <div>
      <section className="border-b border-slate-200 bg-white">
        <Container className="py-16 sm:py-24">
          <div className="mx-auto flex max-w-3xl flex-col items-center gap-5">
            <Skeleton className="h-7 w-52 rounded-full" />
            <Skeleton className="h-10 w-full max-w-lg" />
            <Skeleton className="h-5 w-full max-w-md" />
            <Skeleton className="h-12 w-full max-w-xl" />
            <div className="mt-8 grid w-full max-w-3xl grid-cols-2 gap-4 sm:grid-cols-4">
              {Array.from({ length: 4 }).map((_, index) => (
                <Skeleton key={index} className="h-16 rounded-xl" />
              ))}
            </div>
          </div>
        </Container>
      </section>

      <Container className="py-14">
        <Skeleton className="h-7 w-52" />
        <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
          {Array.from({ length: 10 }).map((_, index) => (
            <Skeleton key={index} className="h-32 rounded-xl" />
          ))}
        </div>
        <Skeleton className="mt-16 h-7 w-48" />
        <ListingGridSkeleton count={6} className="mt-8" />
      </Container>
    </div>
  );
}
