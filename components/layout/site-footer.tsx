import { Heart, Recycle } from "lucide-react";
import Link from "next/link";
import { Container } from "@/components/layout/container";
import { Logo } from "@/components/layout/logo";
import { APP_NAME, APP_TAGLINE } from "@/lib/constants";
import { FOOTER_GROUPS } from "@/lib/navigation";

export function SiteFooter() {
  return (
    <footer className="mt-20 border-t border-slate-200 bg-white">
      <Container className="py-12">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
          <div className="lg:col-span-2">
            <Logo />
            <p className="mt-4 max-w-xs text-sm text-slate-500">{APP_TAGLINE}</p>
            <p className="mt-3 max-w-sm text-xs text-slate-400">
              Built with Next.js App Router, TypeScript and Tailwind CSS. Backed by
              MongoDB with Mongoose in later steps.
            </p>
          </div>

          {FOOTER_GROUPS.map((group) => (
            <nav key={group.title} aria-label={group.title}>
              <h2 className="text-sm font-semibold text-slate-900">{group.title}</h2>
              <ul className="mt-4 flex flex-col gap-2.5">
                {group.items.map((item) => (
                  <li key={`${group.title}-${item.href}`}>
                    <Link
                      href={item.href}
                      className="text-sm text-slate-500 transition-colors hover:text-brand-700"
                    >
                      {item.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          ))}
        </div>

        <div className="mt-12 flex flex-col gap-4 border-t border-slate-100 pt-6 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs text-slate-400">
            © {new Date().getFullYear()} {APP_NAME}. A student project — not a commercial
            marketplace.
          </p>

          <div className="flex items-center gap-5 text-xs text-slate-400">
            <span className="inline-flex items-center gap-1.5">
              <Recycle className="size-3.5" aria-hidden="true" />
              Reuse over rebuy
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Heart className="size-3.5" aria-hidden="true" />
              Campus first
            </span>
          </div>
        </div>
      </Container>
    </footer>
  );
}
