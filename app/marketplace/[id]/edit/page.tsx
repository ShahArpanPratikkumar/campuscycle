import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { Container } from "@/components/layout/container";
import { PageHeader } from "@/components/layout/page-header";
import {
  ListingForm,
  type ListingFormValues,
} from "@/components/listings/listing-form";
import { connectToDatabase } from "@/lib/db/connect";
import { getCurrentStudentId } from "@/lib/session";
import { getProductById } from "@/lib/services/product.service";
import type { ApiProduct } from "@/lib/types";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "Edit listing" };

interface EditListingPageProps {
  params: Promise<{ id: string }>;
}

/**
 * Edit form for one of your own listings.
 *
 * The product is loaded and checked server-side: anyone without a session is
 * sent to `/login`, and a listing you do not own is a 404 (not a 403) so the
 * page never confirms that someone else's listing exists.
 */
export default async function EditListingPage({ params }: EditListingPageProps) {
  await connectToDatabase();
  const { id } = await params;

  const studentId = await getCurrentStudentId();
  if (!studentId) {
    redirect(`/login?next=${encodeURIComponent(`/marketplace/${id}/edit`)}`);
  }

  let product: ApiProduct;
  try {
    product = await getProductById(id);
  } catch {
    notFound();
  }

  if (product.sellerId !== studentId) {
    notFound();
  }

  const initial: ListingFormValues = {
    title: product.title,
    description: product.description,
    category: product.category,
    condition: product.condition,
    listingType: product.listingType,
    price: product.price > 0 ? String(product.price) : "",
    exchangeFor: product.exchangeFor ?? "",
    location: product.location,
    tags: product.tags.join(", "),
    images: product.images,
  };

  return (
    <Container className="py-8 sm:py-10">
      <PageHeader
        title="Edit listing"
        description="Update the details below. Your changes go live the moment you save."
        breadcrumbs={[
          { label: "Home", href: "/" },
          { label: "Marketplace", href: "/marketplace" },
          { label: product.title, href: `/marketplace/${product.id}` },
          { label: "Edit" },
        ]}
      />

      <div className="mt-8">
        <ListingForm mode="edit" productId={product.id} initial={initial} />
      </div>
    </Container>
  );
}
