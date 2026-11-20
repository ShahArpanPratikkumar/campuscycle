"use client";

import { LogOut, Plus } from "lucide-react";
import { useAuth } from "@/components/auth/auth-provider";
import { NavLinks } from "@/components/layout/nav-links";
import { Button, ButtonLink } from "@/components/ui/button";
import { Sheet } from "@/components/ui/sheet";
import { DASHBOARD_NAV, PRIMARY_NAV } from "@/lib/navigation";

export function MobileNav({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const { isAuthenticated, logout } = useAuth();

  return (
    <Sheet
      open={open}
      onClose={onClose}
      title="Menu"
      description="Browse, save and manage your listings"
      footer={
        isAuthenticated ? (
          <ButtonLink
            href="/sell"
            size="md"
            icon={<Plus className="size-4" aria-hidden="true" />}
            className="w-full"
            onClick={onClose}
          >
            Sell an item
          </ButtonLink>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            <ButtonLink href="/login" variant="outline" className="w-full" onClick={onClose}>
              Log in
            </ButtonLink>
            <ButtonLink href="/register" className="w-full" onClick={onClose}>
              Register
            </ButtonLink>
          </div>
        )
      }
    >
      <div className="flex flex-col gap-6">
        <section>
          <h3 className="mb-2 px-3 text-xs font-semibold tracking-wider text-slate-400 uppercase">
            Browse
          </h3>
          <NavLinks
            items={PRIMARY_NAV}
            variant="vertical"
            onNavigate={onClose}
          />
        </section>

        {isAuthenticated ? (
          <>
            <section>
              <h3 className="mb-2 px-3 text-xs font-semibold tracking-wider text-slate-400 uppercase">
                Selling
              </h3>
              <NavLinks
                items={DASHBOARD_NAV}
                variant="vertical"
                onNavigate={onClose}
              />
            </section>

            <section>
              <h3 className="mb-2 px-3 text-xs font-semibold tracking-wider text-slate-400 uppercase">
                Account
              </h3>
              <Button
                type="button"
                variant="ghost"
                className="w-full justify-start"
                icon={<LogOut className="size-4" aria-hidden="true" />}
                onClick={() => {
                  onClose();
                  void logout();
                }}
              >
                Log out
              </Button>
            </section>
          </>
        ) : null}
      </div>
    </Sheet>
  );
}
