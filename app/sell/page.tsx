import type { Metadata } from "next";
import { Container } from "@/components/layout/container";
import { PageHeader } from "@/components/layout/page-header";
import { ListingForm } from "@/components/listings/listing-form";

export const metadata: Metadata = {
  title: "Sell an item",
  description:
    "Create a listing for something you no longer need — sell it, give it away or swap it.",
};

/**
 * Create-listing page.
 *
 * The identity gate lives in `app/sell/layout.tsx` (so the redirect is a real
 * HTTP status rather than a streamed one); this page only renders the form.
 */
export default function SellPage() {
  return (
    <Container className="py-8 sm:py-10">
      <PageHeader
        title="List an item"
        description="Fill in the details below. The preview on the right updates as you type, so you can see exactly how your card will look in the marketplace."
        breadcrumbs={[{ label: "Home", href: "/" }, { label: "Sell" }]}
      />

      <div className="mt-8">
        <ListingForm mode="create" />
      </div>
    </Container>
  );
}
