import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { ListingGrid } from "@/components/listings/listing-grid";
import { SectionHeading } from "@/components/ui/section-heading";
import type { Listing } from "@/lib/types";
import { cn } from "@/lib/utils";

export interface SimilarListingsProps {
  listings: Listing[];
  /** Where "Browse all" should point — usually the same category. */
  browseHref?: string;
  className?: string;
}

/** Same-category recommendations for the listing detail page. */
export function SimilarListings({
  listings,
  browseHref = "/marketplace",
  className,
}: SimilarListingsProps) {
  if (listings.length === 0) return null;

  return (
    <section className={cn(className)}>
      <SectionHeading
        eyebrow="More like this"
        title="Similar listings"
        description="Other available items in the same category."
        action={
          <Link
            href={browseHref}
            className="inline-flex items-center gap-1 text-sm font-medium text-brand-700 hover:underline"
          >
            Browse all
            <ArrowRight className="size-3.5" aria-hidden="true" />
          </Link>
        }
      />
      <ListingGrid listings={listings} className="mt-6" />
    </section>
  );
}
