"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { DASHBOARD_NAV } from "@/lib/navigation";
import { cn } from "@/lib/utils";

/**
 * Responsive dashboard navigation.
 *
 * Small screens get a horizontally scrollable tab strip (fits any phone);
 * `lg` and up turn the same list into a sticky vertical sidebar with each
 * section's description. Active state comes from `usePathname` — an exact match
 * keeps "Overview" from also lighting up on `/dashboard/listings`.
 */
export function DashboardNav() {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Dashboard sections"
      className="lg:sticky lg:top-24 lg:self-start"
    >
      <ul className="no-scrollbar flex gap-1 overflow-x-auto rounded-xl border border-slate-200 bg-white p-1 shadow-sm lg:flex-col lg:gap-0.5 lg:p-2">
        {DASHBOARD_NAV.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;

          return (
            <li key={item.href} className="shrink-0 lg:shrink">
              <Link
                href={item.href}
                aria-current={isActive ? "page" : undefined}
                className={cn(
                  "flex items-center gap-2 rounded-lg px-3.5 py-2 text-sm font-medium transition-colors",
                  "lg:w-full lg:items-start lg:gap-3 lg:px-3 lg:py-2.5",
                  isActive
                    ? "bg-brand-600 text-white"
                    : "text-slate-600 hover:bg-slate-100 hover:text-slate-900",
                )}
              >
                {Icon ? (
                  <Icon
                    className="size-4 shrink-0 lg:mt-0.5"
                    aria-hidden="true"
                  />
                ) : null}
                <span className="flex flex-col">
                  <span>{item.label}</span>
                  {item.description ? (
                    <span
                      className={cn(
                        "hidden text-xs font-normal lg:block",
                        isActive ? "text-brand-50" : "text-slate-400",
                      )}
                    >
                      {item.description}
                    </span>
                  ) : null}
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
