"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { NavItem } from "@/lib/navigation";
import { cn } from "@/lib/utils";

export interface NavLinksProps {
  items: NavItem[];
  variant?: "horizontal" | "vertical";
  className?: string;
  /** Called after a link is followed — used to close the mobile drawer. */
  onNavigate?: () => void;
}

/**
 * Renders the primary navigation with active-route highlighting.
 *
 * `usePathname` makes this a client component, which is why the whole header is
 * one — it keeps the active state and the mobile drawer in sync for free.
 */
export function NavLinks({
  items,
  variant = "horizontal",
  className,
  onNavigate,
}: NavLinksProps) {
  const pathname = usePathname();

  return (
    <ul
      className={cn(
        variant === "horizontal"
          ? "flex items-center gap-1"
          : "flex flex-col gap-1",
        className,
      )}
    >
      {items.map((item) => {
        const isActive =
          item.href === "/"
            ? pathname === "/"
            : pathname === item.href || pathname.startsWith(`${item.href}/`);

        return (
          <li key={item.href}>
            <Link
              href={item.href}
              onClick={onNavigate}
              aria-current={isActive ? "page" : undefined}
              className={cn(
                "block rounded-lg transition-colors",
                variant === "horizontal"
                  ? "px-3 py-2 text-sm font-medium"
                  : "px-3 py-2.5",
                isActive
                  ? "bg-brand-50 text-brand-700"
                  : "text-slate-600 hover:bg-slate-100 hover:text-slate-900",
              )}
            >
              <span
                className={cn(
                  variant === "horizontal" ? "text-sm font-medium" : "text-sm font-semibold",
                )}
              >
                {item.label}
              </span>
              {variant === "vertical" && item.description ? (
                <span className="mt-0.5 block text-xs text-slate-500">
                  {item.description}
                </span>
              ) : null}
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
