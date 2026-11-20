import type { ComponentProps } from "react";
import { cn } from "@/lib/utils";

export function Card({ className, ...rest }: ComponentProps<"div">) {
  return (
    <div
      className={cn(
        "rounded-xl border border-slate-200 bg-white shadow-sm",
        className,
      )}
      {...rest}
    />
  );
}

export function CardHeader({ className, ...rest }: ComponentProps<"div">) {
  return <div className={cn("flex flex-col gap-1 p-5", className)} {...rest} />;
}

export function CardTitle({ className, ...rest }: ComponentProps<"h3">) {
  return (
    <h3
      className={cn("text-base font-semibold text-slate-900", className)}
      {...rest}
    />
  );
}

export function CardDescription({ className, ...rest }: ComponentProps<"p">) {
  return (
    <p className={cn("text-sm text-slate-500", className)} {...rest} />
  );
}

export function CardContent({ className, ...rest }: ComponentProps<"div">) {
  return <div className={cn("px-5 pb-5", className)} {...rest} />;
}

export function CardFooter({ className, ...rest }: ComponentProps<"div">) {
  return (
    <div
      className={cn(
        "flex items-center gap-3 border-t border-slate-100 px-5 py-4",
        className,
      )}
      {...rest}
    />
  );
}
