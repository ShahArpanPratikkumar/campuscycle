import type { ComponentProps } from "react";
import type { BadgeTone } from "@/lib/constants";
import { cn } from "@/lib/utils";

const TONES: Record<BadgeTone, string> = {
  neutral: "bg-slate-100 text-slate-700 ring-slate-200",
  brand: "bg-brand-50 text-brand-700 ring-brand-100",
  success: "bg-emerald-50 text-emerald-700 ring-emerald-100",
  warning: "bg-amber-50 text-amber-700 ring-amber-100",
  danger: "bg-rose-50 text-rose-700 ring-rose-100",
  info: "bg-sky-50 text-sky-700 ring-sky-100",
};

const SIZES = {
  sm: "px-2 py-0.5 text-[11px]",
  md: "px-2.5 py-1 text-xs",
} as const;

export interface BadgeProps extends ComponentProps<"span"> {
  tone?: BadgeTone;
  size?: keyof typeof SIZES;
}

export function Badge({
  tone = "neutral",
  size = "md",
  className,
  ...rest
}: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full font-medium ring-1 ring-inset",
        TONES[tone],
        SIZES[size],
        className,
      )}
      {...rest}
    />
  );
}
