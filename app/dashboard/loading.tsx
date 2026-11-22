import { Skeleton } from "@/components/ui/skeleton";

/** Overview skeleton: four stat tiles plus the enquiries/offers panel. */
export default function Loading() {
  return (
    <div className="flex flex-col gap-10">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[0, 1, 2, 3].map((tile) => (
          <Skeleton key={tile} className="h-36 w-full rounded-xl" />
        ))}
      </div>

      <div className="flex flex-col gap-4">
        <Skeleton className="h-5 w-44" />
        <Skeleton className="h-16 w-full rounded-xl" />
        <div className="grid gap-4 sm:grid-cols-2">
          <Skeleton className="h-24 w-full rounded-xl" />
          <Skeleton className="h-24 w-full rounded-xl" />
        </div>
      </div>
    </div>
  );
}
