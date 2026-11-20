"use client";

import { useAuth } from "@/components/auth/auth-provider";

/**
 * Backwards-compatible identity hook.
 *
 * It used to read a plain, editable `campuscycle_student_id` cookie. Identity
 * now comes from the authenticated session resolved by `AuthProvider`, so every
 * existing consumer (favourites, the header chip, setup flow) sees the signed-in
 * user rather than a spoofable id. The JWT itself is never exposed here.
 */
export function useIdentity() {
  const { user, loading } = useAuth();

  return {
    studentId: user?.id ?? null,
    ready: !loading,
    // Legacy setters are intentionally inert: identity can only be changed by
    // logging in as that account, never by writing a client-side cookie.
    setStudentId: (id?: string) => {
      void id;
    },
    clearStudentId: () => {},
  };
}
