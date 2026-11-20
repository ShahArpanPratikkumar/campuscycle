"use client";

import { useEffect, useRef } from "react";

/**
 * Shared behaviour for the `Modal` and `Sheet` overlays.
 *
 * Both dialogs need exactly the same things, and duplicating them led to subtle
 * drift, so they live here:
 *
 *   - **Escape** closes the dialog.
 *   - **Scroll lock**: the page behind cannot scroll while a dialog is open, and
 *     the previous value is restored on close.
 *   - **Initial focus**: focus moves into the dialog (the panel itself, so the
 *     `aria-labelledby` title is announced).
 *   - **Focus trap**: Tab / Shift+Tab cycle within the dialog instead of
 *     escaping to the page behind it.
 *   - **Focus restore**: when the dialog closes, focus returns to the element
 *     that opened it.
 *
 * `onClose` is read through a ref so the effect only depends on `open`. That
 * matters: a parent that re-renders while typing (and passes a fresh inline
 * `onClose`) must not re-run the effect and steal focus back to the top.
 *
 * The returned ref must be attached to the dialog panel, which should also
 * carry `tabIndex={-1}` so it can receive focus.
 */
const FOCUSABLE_SELECTOR = [
  "a[href]",
  "button:not([disabled])",
  "textarea:not([disabled])",
  "input:not([disabled])",
  "select:not([disabled])",
  '[tabindex]:not([tabindex="-1"])',
].join(",");

export function useDialog(open: boolean, onClose: () => void) {
  const panelRef = useRef<HTMLDivElement>(null);
  const restoreRef = useRef<HTMLElement | null>(null);
  const onCloseRef = useRef(onClose);

  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    if (!open) return;

    restoreRef.current =
      document.activeElement instanceof HTMLElement
        ? document.activeElement
        : null;

    const panel = panelRef.current;
    panel?.focus();

    function focusable(): HTMLElement[] {
      if (!panel) return [];
      return Array.from(
        panel.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR),
      );
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        event.preventDefault();
        onCloseRef.current();
        return;
      }

      if (event.key !== "Tab" || !panel) return;

      const items = focusable();
      if (items.length === 0) {
        event.preventDefault();
        return;
      }

      const first = items[0];
      const last = items[items.length - 1];
      const active = document.activeElement;

      if (event.shiftKey) {
        if (active === first || active === panel || !panel.contains(active)) {
          event.preventDefault();
          last.focus();
        }
      } else if (active === last || !panel.contains(active)) {
        event.preventDefault();
        first.focus();
      }
    }

    document.addEventListener("keydown", handleKeyDown);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = previousOverflow;
      restoreRef.current?.focus();
    };
  }, [open]);

  return panelRef;
}
