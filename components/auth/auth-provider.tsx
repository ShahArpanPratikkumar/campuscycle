"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useSyncExternalStore,
  type ReactNode,
} from "react";
import { useRouter } from "next/navigation";
import {
  currentUserRequest,
  loginRequest,
  logoutRequest,
  registerRequest,
} from "@/lib/auth/client";
import type { AuthUser } from "@/lib/auth/types";

/**
 * Frontend authentication state.
 *
 * The HTTP-only cookie remains the source of truth: the provider asks
 * `/api/auth/me` who the user is on mount. The JWT is never read or stored in
 * JavaScript. An external store (rather than effect-driven setState) keeps the
 * initial hydration snapshot stable across the whole app.
 */

export interface LoginValues {
  email: string;
  password: string;
  remember: boolean;
  next?: string;
}

export interface RegisterValues {
  name: string;
  email: string;
  phone?: string;
  password: string;
  confirmPassword: string;
  avatar?: string;
}

interface AuthContextValue {
  user: AuthUser | null;
  loading: boolean;
  isAuthenticated: boolean;
  login: (values: LoginValues) => Promise<AuthUser>;
  register: (values: RegisterValues) => Promise<void>;
  logout: () => Promise<void>;
  refresh: () => Promise<AuthUser | null>;
}

interface AuthSnapshot {
  user: AuthUser | null;
  loading: boolean;
}

const AuthContext = createContext<AuthContextValue | null>(null);

const SERVER_SNAPSHOT: AuthSnapshot = { user: null, loading: true };
let snapshot: AuthSnapshot = SERVER_SNAPSHOT;
const listeners = new Set<() => void>();

let initialLoad: Promise<AuthUser | null> | null = null;

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

function getSnapshot(): AuthSnapshot {
  return snapshot;
}

function getServerSnapshot(): AuthSnapshot {
  return SERVER_SNAPSHOT;
}

function commit(next: AuthSnapshot): void {
  snapshot = next;
  for (const listener of listeners) listener();
}

/** Starts the first /me request exactly once per page load. */
function ensureInitialLoad(): Promise<AuthUser | null> {
  if (!initialLoad) {
    initialLoad = currentUserRequest()
      .then(({ data }) => {
        commit({ user: data.user, loading: false });
        return data.user;
      })
      .catch(() => {
        commit({ user: null, loading: false });
        return null;
      });
  }
  return initialLoad;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const { user, loading } = useSyncExternalStore(
    subscribe,
    getSnapshot,
    getServerSnapshot,
  );

  useEffect(() => {
    void ensureInitialLoad();
  }, []);

  const refresh = useCallback(async () => {
    commit({ ...snapshot, loading: true });
    try {
      const { data } = await currentUserRequest();
      commit({ user: data.user, loading: false });
      return data.user;
    } catch {
      // 401 (missing/expired cookie) and network failures both mean "no user"
      // from the UI's point of view. The server still enforces every route.
      commit({ user: null, loading: false });
      return null;
    }
  }, []);

  const login = useCallback(
    async (values: LoginValues) => {
      const { data } = await loginRequest({
        email: values.email,
        password: values.password,
        remember: values.remember,
      });
      commit({ user: data.user, loading: false });
      initialLoad = Promise.resolve(data.user);
      router.push(
        values.next && values.next.startsWith("/") ? values.next : "/dashboard",
      );
      router.refresh();
      return data.user;
    },
    [router],
  );

  const register = useCallback(async (values: RegisterValues) => {
    await registerRequest(values);
  }, []);

  const logout = useCallback(async () => {
    try {
      await logoutRequest();
    } finally {
      commit({ user: null, loading: false });
      initialLoad = Promise.resolve(null);
      router.push("/login");
      router.refresh();
    }
  }, [router]);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      loading,
      isAuthenticated: user !== null,
      login,
      register,
      logout,
      refresh,
    }),
    [user, loading, login, register, logout, refresh],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used inside <AuthProvider>");
  }
  return context;
}
