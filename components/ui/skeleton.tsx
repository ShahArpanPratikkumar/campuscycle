import { cn } from "@/lib/utils";

/**
 * Loading placeholder.
 *
 * `animate-pulse` is a built-in Tailwind utility and is automatically disabled
 * by the `prefers-reduced-motion` block in `globals.css`.
 */
export function Skeleton({
  className,
  ...rest
}: React.ComponentProps<"div">) {
  return (
    <div
      aria-hidden="true"
      className={cn("animate-pulse rounded-md bg-slate-200/80", className)}
      {...rest}
    />
  );
}
