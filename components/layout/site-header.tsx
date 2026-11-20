"use client";

import { Heart, Menu, Plus, Search } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { Container } from "@/components/layout/container";
import { IdentityChip } from "@/components/layout/identity-chip";
import { Logo } from "@/components/layout/logo";
import { MobileNav } from "@/components/layout/mobile-nav";
import { NavLinks } from "@/components/layout/nav-links";
import { ButtonLink } from "@/components/ui/button";
import { useAuth } from "@/components/auth/auth-provider";
import { useFavorites } from "@/components/providers/favorites-provider";
import { PRIMARY_NAV } from "@/lib/navigation";

export function SiteHeader() {
  const [menuOpen, setMenuOpen] = useState(false);
  const { count } = useFavorites();
  const { isAuthenticated } = useAuth();

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/85 backdrop-blur-md">
      <Container className="flex h-16 items-center justify-between gap-4">
        <Logo />

        <NavLinks items={PRIMARY_NAV} className="hidden lg:flex" />

        <div className="flex items-center gap-1.5 sm:gap-2">
          <Link
            href="/marketplace"
            aria-label="Search the marketplace"
            className="hidden size-10 items-center justify-center rounded-lg text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-900 sm:inline-flex"
          >
            <Search className="size-5" aria-hidden="true" />
          </Link>

          <Link
            href="/favorites"
            aria-label={`Saved items (${count})`}
            className="relative inline-flex size-10 items-center justify-center rounded-lg text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-900"
          >
            <Heart className="size-5" aria-hidden="true" />
            {count > 0 ? (
              <span className="absolute top-1.5 right-1.5 inline-flex min-w-4 items-center justify-center rounded-full bg-brand-600 px-1 text-[10px] leading-4 font-semibold text-white">
                {count > 9 ? "9+" : count}
              </span>
            ) : null}
          </Link>

          {isAuthenticated ? (
            <ButtonLink
              href="/sell"
              size="sm"
              icon={<Plus className="size-4" aria-hidden="true" />}
              className="hidden sm:inline-flex"
            >
              Sell an item
            </ButtonLink>
          ) : null}

          <IdentityChip />

          <button
            type="button"
            onClick={() => setMenuOpen(true)}
            aria-label="Open navigation menu"
            aria-expanded={menuOpen}
            className="inline-flex size-10 items-center justify-center rounded-lg text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-900 lg:hidden"
          >
            <Menu className="size-5" aria-hidden="true" />
          </button>
        </div>
      </Container>

      <MobileNav open={menuOpen} onClose={() => setMenuOpen(false)} />
    </header>
  );
}
