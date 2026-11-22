import type { Metadata } from "next";
import { Heart, Search } from "lucide-react";
import { InfoBanner } from "@/components/common/info-banner";
import { ClearFavoritesButton } from "@/components/favorites/clear-favorites-button";
import { FavoriteCard } from "@/components/favorites/favorite-card";
import { Container } from "@/components/layout/container";
import { PageHeader } from "@/components/layout/page-header";
import { ButtonLink } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { connectToDatabase } from "@/lib/db/connect";
import { getCurrentActor } from "@/lib/session";
import { listFavorites } from "@/lib/services/favorite.service";
import { pluralize } from "@/lib/utils";

export const metadata: Metadata = { title: "Saved items" };
export const dynamic = "force-dynamic";

/**
 * Saved items (Step 7).
 *
 * Server-rendered from `listFavorites(actor)`, so the page is authoritative: a
 * saved product that has since been reserved, sold or removed still appears,
 * labelled with its current availability (BR-17), instead of silently
 * vanishing. Remove / clear are client islands that call the provider (and the
 * favourites API) and then refresh this server component.
 */
export default async function FavoritesPage() {
  await connectToDatabase();

  const actor = await getCurrentActor();

  if (!actor) {
    return (
      <Container className="py-8 sm:py-10">
        <PageHeader
          title="Saved items"
          description="Listings you have bookmarked, so you can compare a few options before you decide."
          breadcrumbs={[{ label: "Home", href: "/" }, { label: "Favorites" }]}
        />

        <div className="mt-8">
          <EmptyState
            icon={Heart}
            title="Log in to save items"
            description="Saved items belong to your account. Log in and the heart on any listing will keep it here."
            action={
              <ButtonLink href="/login?next=/favorites">Log in</ButtonLink>
            }
          />
        </div>
      </Container>
    );
  }

  const favorites = await listFavorites(actor);
  const productIds = favorites.map((favorite) => favorite.productId);

  return (
    <Container className="py-8 sm:py-10">
      <PageHeader
        title="Saved items"
        description="Listings you have bookmarked. Saved items stay here even after they are reserved, sold or removed, so you can keep an eye on them."
        breadcrumbs={[{ label: "Home", href: "/" }, { label: "Favorites" }]}
        actions={
          favorites.length > 0 ? (
            <ClearFavoritesButton productIds={productIds} />
          ) : null
        }
      />

      <p className="mt-6 text-sm text-slate-500">
        {favorites.length === 0
          ? "Nothing saved yet"
          : `${favorites.length} ${pluralize(favorites.length, "item")} saved`}
      </p>

      <div className="mt-6 flex flex-col gap-6">
        {favorites.length === 0 ? (
          <EmptyState
            icon={Search}
            title="No saved items yet"
            description="Tap the heart on any listing and it will appear here — handy for comparing a few options before you decide."
            action={
              <ButtonLink href="/marketplace">Browse the marketplace</ButtonLink>
            }
          />
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {favorites.map((favorite) => (
              <FavoriteCard key={favorite.id} favorite={favorite} />
            ))}
          </div>
        )}

        <InfoBanner title="Saved to your profile">
          Favourites are stored against your student profile, so they follow you
          between visits. A saved listing is never removed automatically — even
          when it is reserved, sold or taken down, it stays here with a status
          label until you remove it.
        </InfoBanner>
      </div>
    </Container>
  );
}
