import { UserX } from "lucide-react";
import { RouteNotFound } from "@/components/common/route-not-found";

export default function SellerNotFound() {
  return (
    <RouteNotFound
      icon={UserX}
      title="Student not found"
      description="This profile does not exist, or the link could be wrong."
      primaryHref="/marketplace"
      primaryLabel="Back to the marketplace"
    />
  );
}
