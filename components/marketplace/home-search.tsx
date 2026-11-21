"use client";

import { useRouter } from "next/navigation";
import { SearchInput } from "@/components/marketplace/search-input";

/**
 * Hero search field.
 *
 * Sends students straight to the browse page with the query in the URL, which
 * is exactly where the marketplace search lives — one search implementation,
 * not two.
 */
export function HomeSearch() {
  const router = useRouter();

  return (
    <SearchInput
      size="lg"
      label="Search the marketplace"
      placeholder="Try “calculator”, “cycle” or “textbook”"
      onSubmit={(value) => {
        const query = value.trim();
        router.push(
          query ? `/marketplace?q=${encodeURIComponent(query)}` : "/marketplace",
        );
      }}
    />
  );
}
