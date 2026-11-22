import Link from "next/link";
import { ArrowUpRight, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

type Tone = "brand" | "emerald" | "amber" | "sky" | "slate";

const TONES: Record<Tone, string> = {
  brand: "bg-brand-50 text-brand-600",
  emerald: "bg-emerald-50 text-emerald-600",
  amber: "bg-amber-50 text-amber-600",
  sky: "bg-sky-50 text-sky-600",
  slate: "bg-slate-100 text-slate-600",
};

export interface StatCardProps {
  label: string;
  value: number | string;
  icon: LucideIcon;
  hint?: string;
  tone?: Tone;
  /** When set the whole card becomes a link. */
  href?: string;
  className?: string;
}

/** Dashboard counter tile. Renders as a link when `href` is provided. */
export function StatCard({
  label,
  value,
  icon: Icon,
  hint,
  tone = "brand",
  href,
  className,
}: StatCardProps) {
  const body = (
    <>
      <div className="flex items-start justify-between gap-3">
        <span
          className={cn(
            "flex size-10 items-center justify-center rounded-lg",
            TONES[tone],
          )}
        >
          <Icon className="size-5" aria-hidden="true" />
        </span>
        {href ? (
          <ArrowUpRight
            className="size-4 text-slate-300 transition-colors group-hover:text-brand-600"
            aria-hidden="true"
          />
        ) : null}
      </div>

      <div className="mt-4">
        <p className="text-2xl font-semibold text-slate-900 tabular-nums">
          {value}
        </p>
        <p className="mt-0.5 text-sm text-slate-500">{label}</p>
        {hint ? <p className="mt-1 text-xs text-slate-400">{hint}</p> : null}
      </div>
    </>
  );

  if (href) {
    return (
      <Link
        href={href}
        className={cn(
          "group rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-brand-200 hover:shadow-md",
          className,
        )}
      >
        {body}
      </Link>
    );
  }

  return (
    <div
      className={cn(
        "rounded-xl border border-slate-200 bg-white p-5 shadow-sm",
        className,
      )}
    >
      {body}
    </div>
  );
}
