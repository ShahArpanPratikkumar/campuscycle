"use client";

import { LogOut } from "lucide-react";
import Link from "next/link";
import { useAuth } from "@/components/auth/auth-provider";
import { Avatar } from "@/components/ui/avatar";
import { Button, ButtonLink } from "@/components/ui/button";

/**
 * Header identity area.
 *
 * Logged out: Login / Register.
 * Logged in: avatar + name linking to the dashboard, plus Logout.
 *
 * The previous version resolved a plain, editable student-id cookie; it now
 * reads the session from AuthProvider, which is backed by /api/auth/me.
 */
export function IdentityChip() {
  const { user, loading, logout } = useAuth();

  if (loading) {
    return (
      <span
        aria-hidden="true"
        className="hidden size-8 animate-pulse rounded-full bg-slate-100 sm:inline-block"
      />
    );
  }

  if (!user) {
    return (
      <div className="hidden items-center gap-1.5 sm:flex">
        <ButtonLink href="/login" variant="ghost" size="sm">
          Log in
        </ButtonLink>
        <ButtonLink href="/register" variant="outline" size="sm">
          Register
        </ButtonLink>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-1">
      <Link
        href="/dashboard"
        title={`${user.name} — dashboard`}
        className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white py-1 pr-3 pl-1 text-sm font-medium text-slate-700 transition-colors hover:border-brand-200 hover:text-brand-700"
      >
        <Avatar name={user.name} src={user.avatar ?? undefined} size="sm" />
        <span className="hidden max-w-28 truncate sm:inline">{user.name}</span>
      </Link>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        onClick={() => void logout()}
        aria-label="Log out"
        title="Log out"
      >
        <LogOut className="size-4" aria-hidden="true" />
      </Button>
    </div>
  );
}
