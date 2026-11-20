"use client";

import { useEffect, type ReactNode } from "react";
import { AlertTriangle, RotateCcw } from "lucide-react";
import { Container } from "@/components/layout/container";
import { Button, ButtonLink } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";

export interface RouteErrorProps {
  error: unknown;
  /** Next 16's re-fetch callback (`retry()`), not `reset()`. */
  retry: () => void;
  title: string;
  description: string;
  /** Overrides the default "Back to the marketplace" secondary link. */
  secondaryAction?: ReactNode;
}

/**
 * The single presentation for a route-level error boundary.
 *
 * Every `error.tsx` in the app renders this with its own copy, so the layout,
 * the "Try again" affordance and the console logging stay identical. `error`
 * is logged here rather than in each boundary.
 */
export function RouteError({
  error,
  retry,
  title,
  description,
  secondaryAction,
}: RouteErrorProps) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <Container className="py-16">
      <EmptyState
        icon={AlertTriangle}
        title={title}
        description={description}
        action={
          <div className="flex flex-wrap items-center justify-center gap-3">
            <Button
              onClick={() => retry()}
              icon={<RotateCcw className="size-4" aria-hidden="true" />}
            >
              Try again
            </Button>
            {secondaryAction ?? (
              <ButtonLink href="/marketplace" variant="outline">
                Back to the marketplace
              </ButtonLink>
            )}
          </div>
        }
      />
    </Container>
  );
}
