import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export interface SectionHeadingProps {
  /** Small uppercase label above the title. */
  eyebrow?: string;
  title: string;
  description?: string;
  /** Right-aligned slot, usually a "View all" link. */
  action?: ReactNode;
  className?: string;
  as?: "h1" | "h2" | "h3";
}

export function SectionHeading({
  eyebrow,
  title,
  description,
  action,
  className,
  as: Heading = "h2",
}: SectionHeadingProps) {
  return (
    <div
      className={cn(
        "flex flex-wrap items-end justify-between gap-x-6 gap-y-3",
        className,
      )}
    >
      <div className="max-w-2xl">
        {eyebrow ? (
          <p className="text-xs font-semibold tracking-wider text-brand-600 uppercase">
            {eyebrow}
          </p>
        ) : null}
        <Heading
          className={cn(
            "font-semibold text-slate-900",
            Heading === "h1" ? "text-3xl sm:text-4xl" : "text-xl sm:text-2xl",
            eyebrow && "mt-1.5",
          )}
        >
          {title}
        </Heading>
        {description ? (
          <p className="mt-2 text-sm text-slate-500 sm:text-base">{description}</p>
        ) : null}
      </div>

      {action ? <div className="shrink-0">{action}</div> : null}
    </div>
  );
}
