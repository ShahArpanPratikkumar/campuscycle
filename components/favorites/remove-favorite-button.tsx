"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { HeartOff } from "lucide-react";
import { useFavorites } from "@/components/providers/favorites-provider";
import { Button } from "@/components/ui/button";

/**
 * "Remove from saved" action on a favourites card.
 *
 * The provider removes the id optimistically and calls
 * `DELETE /api/favorites`; this component then `router.refresh()`es so the
 * server-rendered list drops the card even before a full reload.
 */
export function RemoveFavoriteButton({
  productId,
  title,
  className,
}: {
  productId: string;
  title: string;
  className?: string;
}) {
  const router = useRouter();
  const { removeFavorite, isPending } = useFavorites();
  const [busy, setBusy] = useState(false);
  const pending = busy || isPending(productId);

  async function onClick() {
    setBusy(true);
    await removeFavorite(productId);
    setBusy(false);
    router.refresh();
  }

  return (
    <Button
      variant="outline"
      size="sm"
      loading={pending}
      disabled={pending}
      icon={<HeartOff className="size-4" aria-hidden="true" />}
      aria-label={`Remove ${title} from saved`}
      onClick={onClick}
      className={className}
    >
      Remove
    </Button>
  );
}
