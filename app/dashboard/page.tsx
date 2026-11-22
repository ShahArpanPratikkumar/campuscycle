import type { Metadata } from "next";
import { redirect } from "next/navigation";
import {
  Compass,
  HandCoins,
  Heart,
  MessageSquare,
  Package,
  Plus,
  Star,
  type LucideIcon,
} from "lucide-react";
import { StatCard } from "@/components/dashboard/stat-card";
import { ButtonLink } from "@/components/ui/button";
import { SectionHeading } from "@/components/ui/section-heading";
import { connectToDatabase } from "@/lib/db/connect";
import { getCurrentActor } from "@/lib/session";
import { listEnquiries } from "@/lib/services/enquiry.service";
import { listFavorites } from "@/lib/services/favorite.service";
import { listOffers } from "@/lib/services/offer.service";
import { listProducts } from "@/lib/services/product.service";
import type { DashboardStats } from "@/lib/types";
import { formatNumber } from "@/lib/utils";

export const metadata: Metadata = { title: "Dashboard" };
export const dynamic = "force-dynamic";

/**
 * Dashboard overview.
 *
 * Every counter is derived from real data through the same services the API
 * uses: listings come from `listProducts`, received requests from
 * `listEnquiries` / `listOffers` scoped to the acting student as seller, and the
 * saved-item count from `listFavorites`. "Pending" counts the requests that
 * still need a decision — a countered offer counts as live, since the buyer
 * still has to answer it.
 */
export default async function DashboardPage() {
  await connectToDatabase();

  const actor = await getCurrentActor();
  if (!actor) redirect("/login?next=/dashboard");

  const actorId = String(actor._id);

  const [products, enquiries, offers, favorites] = await Promise.all([
    listProducts({
      sellerId: actorId,
      status: ["available", "reserved", "sold", "deleted"],
      sort: "newest",
      page: 1,
      limit: 48,
    }),
    listEnquiries(
      { role: "seller", status: undefined, productId: undefined, page: 1, limit: 48 },
      actor,
    ),
    listOffers(
      { role: "seller", status: undefined, productId: undefined, page: 1, limit: 48 },
      actor,
    ),
    listFavorites(actor),
  ]);

  const items = products.items;
  const pendingOffers = offers.items.filter(
    (offer) => offer.status === "pending" || offer.status === "countered",
  ).length;

  const stats: DashboardStats = {
    listings: {
      active: items.filter((item) => item.status === "available").length,
      reserved: items.filter((item) => item.status === "reserved").length,
      sold: items.filter((item) => item.status === "sold").length,
      totalViews: items.reduce((sum, item) => sum + item.viewCount, 0),
    },
    enquiries: {
      received: enquiries.meta.total,
      pending: enquiries.items.filter((e) => e.status === "pending").length,
      accepted: enquiries.items.filter((e) => e.status === "accepted").length,
      rejected: enquiries.items.filter((e) => e.status === "rejected").length,
    },
    offers: {
      received: offers.meta.total,
      pending: offers.items.filter((o) => o.status === "pending").length,
      accepted: offers.items.filter((o) => o.status === "accepted").length,
      rejected: offers.items.filter((o) => o.status === "rejected").length,
    },
    favorites: favorites.length,
  };

  return (
    <div className="flex flex-col gap-10">
      <section aria-label="Your numbers" className="flex flex-col gap-5">
        <SectionHeading
          title="Your numbers"
          description="A snapshot of everything tied to your profile, updated live."
        />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <StatCard
            label="Active listings"
            value={stats.listings.active}
            icon={Package}
            hint={`${formatNumber(stats.listings.totalViews)} views across your listings`}
            href="/dashboard/listings"
          />
          <StatCard
            label="Reserved listings"
            value={stats.listings.reserved}
            icon={HandCoins}
            tone="amber"
            hint="Held for a buyer, hidden from browse"
            href="/dashboard/listings"
          />
          <StatCard
            label="Sold listings"
            value={stats.listings.sold}
            icon={Star}
            tone="emerald"
            hint="Completed sales you can relist"
            href="/dashboard/listings"
          />
          <StatCard
            label="Pending enquiries"
            value={stats.enquiries.pending}
            icon={MessageSquare}
            tone="sky"
            hint={`${stats.enquiries.received} received in total`}
            href="/dashboard/enquiries"
          />
          <StatCard
            label="Pending offers"
            value={pendingOffers}
            icon={HandCoins}
            tone="amber"
            hint={`${stats.offers.received} received in total`}
            href="/dashboard/offers"
          />
          <StatCard
            label="Saved items"
            value={stats.favorites}
            icon={Heart}
            hint="Listings you bookmarked"
            href="/favorites"
          />
        </div>
      </section>

      <section className="flex flex-col gap-5">
        <SectionHeading
          title="Quick actions"
          description="The things students do most often."
        />
        <div className="grid gap-4 sm:grid-cols-3">
          <QuickAction
            href="/sell"
            icon={Plus}
            title="List a new item"
            description="Turn something you no longer need into cash, or give it away."
          />
          <QuickAction
            href="/dashboard/listings"
            icon={Package}
            title="Manage your listings"
            description="Reserve, mark sold, relist or remove anything you have posted."
          />
          <QuickAction
            href="/dashboard/enquiries"
            icon={MessageSquare}
            title="Answer enquiries"
            description="Reply to the students asking about your items."
          />
          <QuickAction
            href="/dashboard/offers"
            icon={HandCoins}
            title="Review offers"
            description="Accept, decline or counter the prices students propose."
          />
          <QuickAction
            href="/favorites"
            icon={Heart}
            title="Saved items"
            description="Revisit the listings you bookmarked."
          />
          <QuickAction
            href="/marketplace"
            icon={Compass}
            title="Browse the marketplace"
            description="See what else students are selling right now."
          />
        </div>
      </section>
    </div>
  );
}

function QuickAction({
  href,
  icon: Icon,
  title,
  description,
}: {
  href: string;
  icon: LucideIcon;
  title: string;
  description: string;
}) {
  return (
    <ButtonLink
      href={href}
      variant="outline"
      className="h-auto flex-col items-start gap-2 p-5 text-left whitespace-normal"
    >
      <span className="flex size-9 items-center justify-center rounded-lg bg-brand-50 text-brand-600">
        <Icon className="size-4" aria-hidden="true" />
      </span>
      <span className="text-sm font-semibold text-slate-900">{title}</span>
      <span className="text-xs font-normal text-slate-500">{description}</span>
    </ButtonLink>
  );
}
