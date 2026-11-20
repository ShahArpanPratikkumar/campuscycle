"use client";

import { useId, type ReactNode } from "react";
import { X } from "lucide-react";
import { useDialog } from "@/hooks/use-dialog";
import { cn } from "@/lib/utils";

export interface SheetProps {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  side?: "left" | "right";
  children: ReactNode;
  footer?: ReactNode;
}

/**
 * Slide-over panel.
 *
 * Used by the mobile navigation drawer and the mobile filter panel. The
 * overlay, Escape handling, scroll lock and focus trap all come from
 * `useDialog`, so they behave identically to `Modal`.
 */
export function Sheet({
  open,
  onClose,
  title,
  description,
  side = "right",
  children,
  footer,
}: SheetProps) {
  const titleId = useId();
  const panelRef = useDialog(open, onClose);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50"
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
    >
      <button
        type="button"
        aria-label="Close panel"
        onClick={onClose}
        className="absolute inset-0 animate-fade-in cursor-default bg-slate-900/40 backdrop-blur-[2px]"
      />

      <div
        ref={panelRef}
        tabIndex={-1}
        className={cn(
          "absolute inset-y-0 flex w-[min(20rem,88vw)] flex-col bg-white shadow-2xl outline-none",
          side === "right"
            ? "right-0 animate-slide-in-right"
            : "left-0 animate-slide-in-left",
        )}
      >
        <header className="flex items-start justify-between gap-4 border-b border-slate-200 px-5 py-4">
          <div>
            <h2 id={titleId} className="text-base font-semibold text-slate-900">
              {title}
            </h2>
            {description ? (
              <p className="mt-0.5 text-xs text-slate-500">{description}</p>
            ) : null}
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="-mr-1 rounded-lg p-1.5 text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900"
          >
            <X className="size-5" aria-hidden="true" />
          </button>
        </header>

        <div className="flex-1 overflow-y-auto px-5 py-5">{children}</div>

        {footer ? (
          <footer className="border-t border-slate-200 px-5 py-4">{footer}</footer>
        ) : null}
      </div>
    </div>
  );
}
