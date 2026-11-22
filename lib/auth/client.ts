"use client";

import { ApiClientError, type ApiErrorDetail } from "@/lib/api/client";
import type { AuthUser } from "@/lib/auth/types";

/**
 * Browser-side auth requests.
 *
 * All calls are same-origin and rely on the browser sending the HTTP-only
 * session cookie automatically. The token is never read, stored or returned to
 * JavaScript — only safe user data comes back in `data`.
 */

interface AuthEnvelope<T> {
  success: boolean;
  data?: T;
  error?: string;
  code?: string;
  details?: ApiErrorDetail[];
  message?: string;
}

export interface AuthResult<T> {
  data: T;
  message?: string;
}

async function request<T>(
  path: string,
  init: RequestInit = {},
): Promise<AuthResult<T>> {
  const headers = new Headers(init.headers);
  headers.set("accept", "application/json");
  if (init.body && !headers.has("content-type")) {
    headers.set("content-type", "application/json");
  }

  let response: Response;
  try {
    response = await fetch(path, {
      ...init,
      headers,
      credentials: "same-origin",
      cache: "no-store",
    });
  } catch {
    throw new ApiClientError(
      0,
      "NETWORK_ERROR",
      "Could not reach the server. Check your connection and try again.",
    );
  }

  const text = await response.text();
  let payload: AuthEnvelope<T> | null = null;
  if (text.length > 0) {
    try {
      payload = JSON.parse(text) as AuthEnvelope<T>;
    } catch {
      payload = null;
    }
  }

  if (!response.ok || !payload || payload.success !== true) {
    throw new ApiClientError(
      response.status,
      payload?.code ?? "INTERNAL_ERROR",
      payload?.error ?? `The request failed (HTTP ${response.status}).`,
      payload?.details,
    );
  }

  return { data: payload.data as T, message: payload.message };
}

export function loginRequest(input: {
  email: string;
  password: string;
  remember: boolean;
}): Promise<AuthResult<{ user: AuthUser }>> {
  return request("/api/auth/login", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export function registerRequest(input: {
  name: string;
  email: string;
  phone?: string;
  password: string;
  confirmPassword: string;
  avatar?: string;
}): Promise<AuthResult<{ user: AuthUser }>> {
  return request("/api/auth/register", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export function currentUserRequest(): Promise<AuthResult<{ user: AuthUser }>> {
  return request("/api/auth/me");
}

export function logoutRequest(): Promise<AuthResult<null>> {
  return request("/api/auth/logout", { method: "POST" });
}
