import { Container } from "@/components/layout/container";
import { Skeleton } from "@/components/ui/skeleton";

/** Two-panel skeleton matching the profile picker / create form. */
export default function Loading() {
  return (
    <Container className="py-8 sm:py-10">
      <Skeleton className="h-8 w-72" />
      <Skeleton className="mt-3 h-4 w-full max-w-xl" />

      <div className="mt-8 grid gap-8 lg:grid-cols-2 lg:items-start">
        <Skeleton className="h-96 w-full rounded-xl" />
        <Skeleton className="h-96 w-full rounded-xl" />
      </div>
    </Container>
  );
}
