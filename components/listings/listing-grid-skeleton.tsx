import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

/**
 * Loading placeholder that mirrors `ListingCard`'s exact geometry, so the
 * layout does not jump when real data arrives.
 */
export function ListingCardSkeleton() {
  return (
    <div className="flex flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
      <Skeleton className="aspect-[4/3] w-full rounded-none" />
      <div className="flex flex-col gap-3 p-4">
        <div className="flex items-center justify-between">
          <Skeleton className="h-5 w-24 rounded-full" />
          <Skeleton className="h-5 w-16 rounded-full" />
        </div>
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-3 w-full" />
        <div className="flex items-end justify-between pt-1">
          <Skeleton className="h-6 w-20" />
          <Skeleton className="h-3 w-16" />
        </div>
        <div className="flex items-center justify-between border-t border-slate-100 pt-3">
          <Skeleton className="h-3 w-24" />
          <Skeleton className="h-3 w-10" />
        </div>
      </div>
    </div>
  );
}

export function ListingGridSkeleton({
  count = 6,
  className,
}: {
  count?: number;
  className?: string;
}) {
  return (
    <div
      className={cn("grid gap-5 sm:grid-cols-2 lg:grid-cols-3", className)}
      aria-hidden="true"
    >
      {Array.from({ length: count }).map((_, index) => (
        <ListingCardSkeleton key={index} />
      ))}
    </div>
  );
}
