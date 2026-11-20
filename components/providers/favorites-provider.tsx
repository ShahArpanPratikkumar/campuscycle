"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { useToast } from "@/hooks/use-toast";
import { useIdentity } from "@/hooks/use-identity";
import { ApiClientError } from "@/lib/api/client";
import {
  fetchFavorites,
  saveFavorite,
  unsaveFavorite,
} from "@/lib/favorites-store";

interface FavoritesContextValue {
  /** Product ids the acting student has saved. */
  favorites: string[];
  count: number;
  /** `false` until the first list has been loaded for the current student. */
  ready: boolean;
  isFavorite: (productId: string) => boolean;
  /** `true` while a save/remove for this product is in flight. */
  isPending: (productId: string) => boolean;
  toggleFavorite: (productId: string) => Promise<void>;
  removeFavorite: (productId: string) => Promise<void>;
  /** Clears every saved product, or just the ids passed in. */
  clearFavorites: (productIds?: string[]) => Promise<void>;
}

const FavoritesContext = createContext<FavoritesContextValue | null>(null);

interface FavoritesState {
  /** The student the cached ids belong to, so a profile switch cannot leak. */
  for: string | null;
  ids: string[];
  loaded: boolean;
}

const EMPTY: FavoritesState = { for: null, ids: [], loaded: false };

function messageFor(error: unknown): string {
  return error instanceof ApiClientError
    ? error.message
    : "Something went wrong. Please try again.";
}

function errorCode(error: unknown): string | undefined {
  return error instanceof ApiClientError ? error.code : undefined;
}

/**
 * Favourites provider (Step 7).
 *
 * Saved products now live in MongoDB behind `/api/favorites`. The provider is
 * the single client-side seam:
 *
 *   - it **hydrates** the id set from `GET /api/favorites` for the acting
 *     student (re-fetching whenever the profile changes),
 *   - it applies every save/remove **optimistically** and rolls back on error,
 *     so the heart reacts instantly while the request is in flight, and
 *   - it surfaces the server's own message through the toast system.
 *
 * The `useFavorites()` API is unchanged from Step 1, so `FavoriteButton`,
 * `SiteHeader` and the favourites page consume it without knowing about HTTP.
 */
export function FavoritesProvider({ children }: { children: ReactNode }) {
  const { studentId, ready: identityReady } = useIdentity();
  const { toast } = useToast();

  const [state, setState] = useState<FavoritesState>(EMPTY);
  const [pending, setPending] = useState<string[]>([]);

  // Derive the visible set from the current student: a switch immediately
  // hides the previous student's ids until their own list arrives.
  const favorites = useMemo(
    () => (state.for === studentId ? state.ids : []),
    [state.for, state.ids, studentId],
  );
  const ready =
    !identityReady || studentId === null
      ? identityReady
      : state.for === studentId && state.loaded;

  useEffect(() => {
    if (!identityReady || !studentId) return;

    let cancelled = false;
    fetchFavorites()
      .then((items) => {
        if (cancelled) return;
        setState({
          for: studentId,
          ids: items.map((item) => item.productId),
          loaded: true,
        });
      })
      .catch(() => {
        if (cancelled) return;
        setState({ for: studentId, ids: [], loaded: true });
      });

    return () => {
      cancelled = true;
    };
  }, [identityReady, studentId]);

  const markPending = useCallback((productId: string) => {
    setPending((current) =>
      current.includes(productId) ? current : [...current, productId],
    );
  }, []);

  const clearPending = useCallback((productId: string) => {
    setPending((current) => current.filter((id) => id !== productId));
  }, []);

  const commit = useCallback((ids: string[]) => {
    setState((current) => ({ ...current, ids, loaded: true }));
  }, []);

  const toggleFavorite = useCallback(
    async (productId: string) => {
      if (!studentId) {
        toast({
          title: "Choose a profile first",
          description:
            "Saved items belong to a student profile. Set one up, then tap the heart again.",
          tone: "error",
        });
        return;
      }

      const previous = favorites;
      const saved = previous.includes(productId);
      commit(
        saved
          ? previous.filter((id) => id !== productId)
          : [productId, ...previous],
      );
      markPending(productId);

      try {
        if (saved) {
          await unsaveFavorite(productId);
          toast({ title: "Removed from saved", tone: "success" });
        } else {
          await saveFavorite(productId);
          toast({
            title: "Saved",
            description: "Find it any time under Favorites.",
            tone: "success",
          });
        }
      } catch (error) {
        // A duplicate means it was already saved (e.g. the first list had not
        // arrived yet) — reflect that instead of rolling back to "not saved".
        if (!saved && errorCode(error) === "DUPLICATE") {
          commit([productId, ...previous]);
          return;
        }
        // A missing row means it was already gone — keep the optimistic removal.
        if (saved && errorCode(error) === "NOT_FOUND") return;

        commit(previous);
        toast({
          title: saved ? "Could not remove" : "Could not save",
          description: messageFor(error),
          tone: "error",
        });
      } finally {
        clearPending(productId);
      }
    },
    [studentId, favorites, commit, markPending, clearPending, toast],
  );

  const removeFavorite = useCallback(
    async (productId: string) => {
      if (!studentId) {
        toast({
          title: "Choose a profile first",
          description: "Saved items belong to a student profile.",
          tone: "error",
        });
        return;
      }

      const previous = favorites;
      commit(previous.filter((id) => id !== productId));
      markPending(productId);

      try {
        await unsaveFavorite(productId);
        toast({ title: "Removed from saved", tone: "success" });
      } catch (error) {
        // Already gone on the server — the optimistic removal was correct.
        if (errorCode(error) === "NOT_FOUND") return;
        commit(previous);
        toast({
          title: "Could not remove",
          description: messageFor(error),
          tone: "error",
        });
      } finally {
        clearPending(productId);
      }
    },
    [studentId, favorites, commit, markPending, clearPending, toast],
  );

  const clearFavorites = useCallback(
    async (productIds?: string[]) => {
      if (!studentId) return;

      const targets =
        productIds && productIds.length > 0 ? productIds : favorites;
      if (targets.length === 0) return;

      const previous = favorites;
      commit(previous.filter((id) => !targets.includes(id)));
      setPending((current) => [...new Set([...current, ...targets])]);

      const results = await Promise.allSettled(targets.map(unsaveFavorite));
      setPending((current) => current.filter((id) => !targets.includes(id)));

      const failed = results.filter((result) => result.status === "rejected")
        .length;
      if (failed > 0) {
        commit(previous);
        toast({
          title: "Could not clear every saved item",
          description: `${failed} item${failed === 1 ? "" : "s"} stayed saved. Please try again.`,
          tone: "error",
        });
        return;
      }

      toast({ title: "Cleared saved items", tone: "success" });
    },
    [studentId, favorites, commit, toast],
  );

  const value = useMemo<FavoritesContextValue>(
    () => ({
      favorites,
      count: favorites.length,
      ready,
      isFavorite: (productId: string) => favorites.includes(productId),
      isPending: (productId: string) => pending.includes(productId),
      toggleFavorite,
      removeFavorite,
      clearFavorites,
    }),
    [
      favorites,
      ready,
      pending,
      toggleFavorite,
      removeFavorite,
      clearFavorites,
    ],
  );

  return (
    <FavoritesContext.Provider value={value}>
      {children}
    </FavoritesContext.Provider>
  );
}

export function useFavorites(): FavoritesContextValue {
  const context = useContext(FavoritesContext);
  if (!context) {
    throw new Error("useFavorites must be used inside <FavoritesProvider>");
  }
  return context;
}
