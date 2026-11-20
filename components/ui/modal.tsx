"use client";

import { useId, type ReactNode } from "react";
import { X } from "lucide-react";
import { useDialog } from "@/hooks/use-dialog";
import { cn } from "@/lib/utils";

export interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: ReactNode;
  footer?: ReactNode;
  className?: string;
}

/**
 * Centred dialog. Bottom-sheet on mobile, card on desktop.
 *
 * Used for the enquiry/offer forms, the counter-offer form and confirmation
 * prompts. Focus handling, Escape and the scroll lock come from `useDialog`.
 */
export function Modal({
  open,
  onClose,
  title,
  description,
  children,
  footer,
  className,
}: ModalProps) {
  const titleId = useId();
  const panelRef = useDialog(open, onClose);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center sm:items-center sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
    >
      <button
        type="button"
        aria-label="Close dialog"
        onClick={onClose}
        className="absolute inset-0 animate-fade-in cursor-default bg-slate-900/40 backdrop-blur-[2px]"
      />

      <div
        ref={panelRef}
        tabIndex={-1}
        className={cn(
          "relative z-10 max-h-[90vh] w-full animate-fade-up overflow-y-auto rounded-t-2xl bg-white shadow-2xl outline-none sm:max-w-lg sm:rounded-2xl",
          className,
        )}
      >
        <header className="flex items-start justify-between gap-4 border-b border-slate-200 px-5 py-4">
          <div>
            <h2 id={titleId} className="text-base font-semibold text-slate-900">
              {title}
            </h2>
            {description ? (
              <p className="mt-0.5 text-sm text-slate-500">{description}</p>
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

        <div className="px-5 py-5">{children}</div>

        {footer ? (
          <footer className="flex items-center justify-end gap-3 border-t border-slate-200 bg-slate-50/70 px-5 py-4">
            {footer}
          </footer>
        ) : null}
      </div>
    </div>
  );
}
