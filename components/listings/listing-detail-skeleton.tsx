import { Skeleton } from "@/components/ui/skeleton";

/**
 * Fallback for the listing detail page's `<Suspense>` boundary.
 *
 * It mirrors the two-column detail layout (gallery + description on the left,
 * the price/seller cards on the right) so nothing shifts when the seller,
 * viewer and "similar listings" reads resolve. It deliberately renders no
 * `Container` or page title — the page already renders those above the
 * boundary, before any streaming starts.
 */
export function ListingDetailSkeleton() {
  return (
    <div className="mt-8 grid gap-8 lg:grid-cols-[minmax(0,1fr)_22rem] lg:items-start">
      <div className="flex flex-col gap-6">
        <Skeleton className="aspect-[4/3] w-full rounded-xl" />
        <Skeleton className="h-6 w-40" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-5/6" />
        <Skeleton className="h-40 w-full rounded-xl" />
      </div>

      <div className="flex flex-col gap-5">
        <Skeleton className="h-56 w-full rounded-xl" />
        <Skeleton className="h-48 w-full rounded-xl" />
      </div>
    </div>
  );
}
