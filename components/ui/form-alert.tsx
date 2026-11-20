import { cn } from "@/lib/utils";

export interface FormAlertProps {
  /** The message to show; when empty the alert renders nothing. */
  message: string | null | undefined;
  className?: string;
}

/**
 * Form-level error banner.
 *
 * Field errors are shown inline next to their control, but some failures belong
 * to the whole form — a rejected request, a business-rule violation, a failed
 * login. This is the single component for that, so the styling and the
 * `role="alert"` announcement stay consistent across every form and dialog.
 */
export function FormAlert({ message, className }: FormAlertProps) {
  if (!message) return null;

  return (
    <div
      role="alert"
      className={cn(
        "rounded-lg border border-rose-200 bg-rose-50 px-3.5 py-2.5 text-sm text-rose-800",
        className,
      )}
    >
      {message}
    </div>
  );
}
