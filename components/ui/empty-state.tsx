import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
  /** `sm` is used inside dashboard cards, `md` for full-page empty states. */
  size?: "sm" | "md";
}

/**
 * The single empty-state component used by the marketplace, favourites,
 * dashboard tabs and error surfaces. Centralising it keeps the "nothing here
 * yet" experience consistent instead of every page inventing its own.
 */
export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  className,
  size = "md",
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-300 bg-white/60 text-center",
        size === "md" ? "px-6 py-16" : "px-5 py-10",
        className,
      )}
    >
      <span
        className={cn(
          "flex items-center justify-center rounded-full bg-slate-100 text-slate-400",
          size === "md" ? "size-14" : "size-11",
        )}
      >
        <Icon className={size === "md" ? "size-7" : "size-5"} aria-hidden="true" />
      </span>

      <h3
        className={cn(
          "mt-4 font-semibold text-slate-900",
          size === "md" ? "text-lg" : "text-base",
        )}
      >
        {title}
      </h3>

      {description ? (
        <p className="mt-1.5 max-w-sm text-sm text-slate-500">{description}</p>
      ) : null}

      {action ? <div className="mt-5">{action}</div> : null}
    </div>
  );
}
