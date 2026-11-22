"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { HeartOff } from "lucide-react";
import { useFavorites } from "@/components/providers/favorites-provider";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";

/**
 * "Clear all" action on the favourites page.
 *
 * Clearing every saved item is destructive-ish (it cannot be undone), so it
 * asks for confirmation first. The server-rendered page passes the ids it
 * rendered, so the clear works even before the provider has finished its first
 * `GET /api/favorites`.
 */
export function ClearFavoritesButton({
  productIds,
  className,
}: {
  productIds: string[];
  className?: string;
}) {
  const router = useRouter();
  const { clearFavorites } = useFavorites();
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState(false);

  async function confirm() {
    setPending(true);
    await clearFavorites(productIds);
    setPending(false);
    setOpen(false);
    router.refresh();
  }

  const count = productIds.length;

  return (
    <>
      <Button
        variant="outline"
        icon={<HeartOff className="size-4" aria-hidden="true" />}
        onClick={() => setOpen(true)}
        className={className}
      >
        Clear all
      </Button>

      <ConfirmDialog
        open={open}
        onClose={() => setOpen(false)}
        onConfirm={confirm}
        pending={pending}
        title="Clear all saved items?"
        description={`This removes all ${count} saved ${count === 1 ? "item" : "items"} from your profile.`}
        confirmLabel="Clear all"
      >
        <p className="text-sm text-slate-600">
          Saved items live on your profile. Clearing them only affects this list —
          the listings themselves stay in the marketplace, and you can save them
          again at any time.
        </p>
      </ConfirmDialog>
    </>
  );
}
