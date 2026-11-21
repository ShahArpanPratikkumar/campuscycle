import { Container } from "@/components/layout/container";
import { Skeleton } from "@/components/ui/skeleton";

/** Form-shaped skeleton so the create page does not jump when it hydrates. */
export default function Loading() {
  return (
    <Container className="py-8 sm:py-10">
      <Skeleton className="h-8 w-48" />
      <Skeleton className="mt-3 h-4 w-full max-w-lg" />

      <div className="mt-8 grid gap-8 lg:grid-cols-[minmax(0,1fr)_22rem] lg:items-start">
        <div className="flex flex-col gap-6">
          {[0, 1, 2, 3].map((section) => (
            <Skeleton key={section} className="h-56 w-full rounded-xl" />
          ))}
        </div>
        <Skeleton className="h-96 w-full rounded-xl" />
      </div>
    </Container>
  );
}
