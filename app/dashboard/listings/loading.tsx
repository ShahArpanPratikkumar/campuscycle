import { Skeleton } from "@/components/ui/skeleton";

/** Mirrors the grouped "My listings" layout. */
export default function Loading() {
  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-10 w-40" />
      </div>

      {[0, 1].map((group) => (
        <div key={group} className="flex flex-col gap-4">
          <Skeleton className="h-5 w-44" />
          {[0, 1].map((row) => (
            <Skeleton key={row} className="h-24 w-full rounded-xl" />
          ))}
        </div>
      ))}
    </div>
  );
}
