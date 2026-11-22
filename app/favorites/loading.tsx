import { Container } from "@/components/layout/container";
import { ListingGridSkeleton } from "@/components/listings/listing-grid-skeleton";
import { Skeleton } from "@/components/ui/skeleton";

/** Grid-shaped skeleton so the saved-items page does not jump when it loads. */
export default function Loading() {
  return (
    <Container className="py-8 sm:py-10">
      <Skeleton className="h-8 w-40" />
      <Skeleton className="mt-3 h-4 w-full max-w-xl" />
      <Skeleton className="mt-6 h-4 w-32" />

      <div className="mt-6">
        <ListingGridSkeleton count={3} />
      </div>
    </Container>
  );
}
