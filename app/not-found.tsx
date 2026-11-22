import { Compass } from "lucide-react";
import { RouteNotFound } from "@/components/common/route-not-found";

export default function NotFound() {
  return (
    <RouteNotFound
      icon={Compass}
      title="Page not found"
      description="That page does not exist. It may have been moved, or the link might have a typo in it."
      primaryHref="/marketplace"
      primaryLabel="Browse the marketplace"
      secondaryHref="/"
      secondaryLabel="Go home"
    />
  );
}
