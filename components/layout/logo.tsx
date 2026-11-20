import Link from "next/link";
import { Recycle } from "lucide-react";
import { APP_NAME } from "@/lib/constants";
import { cn } from "@/lib/utils";

export function Logo({
  className,
  showTagline = true,
}: {
  className?: string;
  showTagline?: boolean;
}) {
  return (
    <Link
      href="/"
      className={cn(
        "group inline-flex items-center gap-2.5 rounded-lg",
        className,
      )}
      aria-label={`${APP_NAME} home`}
    >
      <span className="flex size-9 items-center justify-center rounded-xl bg-brand-600 text-white shadow-sm transition-transform duration-200 group-hover:scale-105">
        <Recycle className="size-5" aria-hidden="true" />
      </span>
      <span className="flex flex-col leading-none">
        <span className="text-base font-semibold tracking-tight text-slate-900">
          {APP_NAME}
        </span>
        {showTagline ? (
          <span className="mt-1 text-[11px] font-medium text-slate-500">
            Campus marketplace
          </span>
        ) : null}
      </span>
    </Link>
  );
}
