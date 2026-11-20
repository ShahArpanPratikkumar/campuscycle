import type { LucideIcon } from "lucide-react";
import { Info } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export interface InfoBannerProps {
  icon?: LucideIcon;
  title?: string;
  children: ReactNode;
  className?: string;
  tone?: "info" | "warning";
}

/**
 * Inline explanatory banner.
 *
 * Step 1 uses it to make the "sample data, API not wired yet" state explicit
 * instead of silently faking behaviour. It is a general-purpose component and
 * stays useful later for things like "this listing is reserved".
 */
export function InfoBanner({
  icon: Icon = Info,
  title,
  children,
  className,
  tone = "info",
}: InfoBannerProps) {
  return (
    <div
      className={cn(
        "flex items-start gap-3 rounded-xl border px-4 py-3.5",
        tone === "info"
          ? "border-brand-100 bg-brand-50/70 text-brand-900"
          : "border-amber-200 bg-amber-50 text-amber-900",
        className,
      )}
    >
      <Icon
        className={cn(
          "mt-0.5 size-4 shrink-0",
          tone === "info" ? "text-brand-600" : "text-amber-600",
        )}
        aria-hidden="true"
      />
      <div className="text-sm">
        {title ? <p className="font-semibold">{title}</p> : null}
        <div className={cn(title && "mt-0.5", "text-[13px] opacity-90")}>
          {children}
        </div>
      </div>
    </div>
  );
}
