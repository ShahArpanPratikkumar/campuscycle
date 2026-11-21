import { PackageX } from "lucide-react";
import { RouteNotFound } from "@/components/common/route-not-found";

export default function ListingNotFound() {
  return (
    <RouteNotFound
      icon={PackageX}
      title="Listing not found"
      description="This item may have been removed by the seller, or the link could be wrong."
      primaryHref="/marketplace"
      primaryLabel="Back to the marketplace"
    />
  );
}
