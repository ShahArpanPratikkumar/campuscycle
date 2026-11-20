import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/**
 * Page-width wrapper. `max-w-6xl` keeps line lengths comfortable on large
 * monitors; pass a `className` to widen it for specific screens.
 */
export function Container({
  className,
  children,
}: {
  className?: string;
  children: ReactNode;
}) {
  return (
    <div className={cn("mx-auto w-full max-w-6xl px-4 sm:px-6 lg:px-8", className)}>
      {children}
    </div>
  );
}
