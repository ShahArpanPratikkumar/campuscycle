import { ShieldCheck, Sparkles, Tag } from "lucide-react";
import type { ReactNode } from "react";
import { Logo } from "@/components/layout/logo";
import { Card } from "@/components/ui/card";

/**
 * Shared auth page shell. It reuses the marketplace's cards, brand colour and
 * typography so /login and /register feel like the same application rather than
 * a separate product.
 */
export function AuthShell({
  title,
  description,
  children,
  footer,
}: {
  title: string;
  description: string;
  children: ReactNode;
  footer: ReactNode;
}) {
  return (
    <div className="mx-auto grid w-full max-w-5xl gap-8 py-8 sm:py-12 lg:grid-cols-[minmax(0,1fr)_20rem] lg:items-start lg:py-16">
      <Card className="overflow-hidden">
        <div className="border-b border-slate-100 bg-slate-50/60 px-6 py-6 sm:px-8">
          <Logo />
          <h1 className="mt-6 text-2xl font-semibold tracking-tight text-slate-900">
            {title}
          </h1>
          <p className="mt-1.5 text-sm text-slate-600">{description}</p>
        </div>

        <div className="px-6 py-6 sm:px-8 sm:py-8">{children}</div>

        <div className="border-t border-slate-100 bg-slate-50/60 px-6 py-4 text-sm text-slate-600 sm:px-8">
          {footer}
        </div>
      </Card>

      <aside className="rounded-xl border border-brand-100 bg-brand-50/60 p-6 lg:sticky lg:top-24">
        <h2 className="text-sm font-semibold text-slate-900">
          Your campus marketplace
        </h2>
        <ul className="mt-4 flex flex-col gap-4 text-sm text-slate-600">
          <li className="flex gap-3">
            <Tag className="mt-0.5 size-4 shrink-0 text-brand-600" aria-hidden="true" />
            <span>List books, gadgets and hostel essentials in a few clicks.</span>
          </li>
          <li className="flex gap-3">
            <ShieldCheck className="mt-0.5 size-4 shrink-0 text-brand-600" aria-hidden="true" />
            <span>Your listings are tied to your account, not a guessable id.</span>
          </li>
          <li className="flex gap-3">
            <Sparkles className="mt-0.5 size-4 shrink-0 text-brand-600" aria-hidden="true" />
            <span>Save favourites and pick up where you left off on any device.</span>
          </li>
        </ul>
      </aside>
    </div>
  );
}
