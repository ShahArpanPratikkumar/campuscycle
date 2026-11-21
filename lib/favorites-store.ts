import { fetchJson } from "@/lib/api/client";
import type { ApiFavorite } from "@/lib/types";

/**
 * Favourites API client (Step 7).
 *
 * The favourite set lives in MongoDB and is scoped to the authenticated user
 * resolved from the HTTP-only session cookie. This module is the single place
 * the browser talks to `/api/favorites`, so the provider only has to manage
 * React state and the optimistic update — never the HTTP shape.
 *
 * Every call goes through `fetchJson`, which sends same-origin credentials and
 * throws a typed `ApiClientError` with the server's own message on failure.
 */

/** Lists the acting student's saved products, newest first (BR-17 availability). */
export async function fetchFavorites(): Promise<ApiFavorite[]> {
  return fetchJson<ApiFavorite[]>("/api/favorites");
}

/** Saves a product. Rejects with 403 (own product) or 409 (already saved). */
export async function saveFavorite(productId: string): Promise<ApiFavorite> {
  return fetchJson<ApiFavorite>("/api/favorites", {
    method: "POST",
    body: JSON.stringify({ productId }),
  });
}

/** Removes a saved product by its product id. */
export async function unsaveFavorite(productId: string): Promise<void> {
  await fetchJson<{ productId: string; removed: true }>(
    `/api/favorites?productId=${encodeURIComponent(productId)}`,
    { method: "DELETE" },
  );
}
