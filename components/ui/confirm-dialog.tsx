"use client";

import type { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";

export interface ConfirmDialogProps {
  open: boolean;
  onClose: () => void;
  /** Runs the destructive action. The dialog stays open (and busy) until it settles. */
  onConfirm: () => void;
  title: string;
  description?: string;
  /** Extra explanation rendered above the buttons. */
  children?: ReactNode;
  confirmLabel: string;
  cancelLabel?: string;
  /** `danger` (default) for destructive actions, `primary` otherwise. */
  tone?: "danger" | "primary";
  /** Disables the buttons and shows a spinner while the action is in flight. */
  pending?: boolean;
}

/**
 * Confirmation prompt for destructive actions.
 *
 * Wrapping `Modal` here means "are you sure?" has one implementation: the
 * cancel button and the overlay are inert while the action is running, and the
 * confirm button shows the standard loading state. Used by the "Clear all"
 * favourites action and the listing "Remove" flow.
 */
export function ConfirmDialog({
  open,
  onClose,
  onConfirm,
  title,
  description,
  children,
  confirmLabel,
  cancelLabel = "Cancel",
  tone = "danger",
  pending = false,
}: ConfirmDialogProps) {
  return (
    <Modal
      open={open}
      onClose={() => {
        if (!pending) onClose();
      }}
      title={title}
      description={description}
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={pending}>
            {cancelLabel}
          </Button>
          <Button
            variant={tone === "primary" ? "primary" : "danger"}
            onClick={onConfirm}
            loading={pending}
          >
            {confirmLabel}
          </Button>
        </>
      }
    >
      {children}
    </Modal>
  );
}
