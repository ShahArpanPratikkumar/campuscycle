import type { LucideIcon } from "lucide-react";
import { Container } from "@/components/layout/container";
import { ButtonLink } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";

export interface RouteNotFoundProps {
  icon: LucideIcon;
  title: string;
  description: string;
  primaryHref: string;
  primaryLabel: string;
  secondaryHref?: string;
  secondaryLabel?: string;
}

/**
 * The single presentation for a `not-found.tsx` page.
 *
 * The global 404 and the listing/seller 404s differ only in their wording and
 * icons, so they share this shell instead of repeating the `Container` +
 * `EmptyState` + action-buttons layout three times.
 */
export function RouteNotFound({
  icon,
  title,
  description,
  primaryHref,
  primaryLabel,
  secondaryHref,
  secondaryLabel,
}: RouteNotFoundProps) {
  return (
    <Container className="py-16">
      <EmptyState
        icon={icon}
        title={title}
        description={description}
        action={
          <div className="flex flex-wrap items-center justify-center gap-3">
            <ButtonLink href={primaryHref}>{primaryLabel}</ButtonLink>
            {secondaryHref && secondaryLabel ? (
              <ButtonLink href={secondaryHref} variant="outline">
                {secondaryLabel}
              </ButtonLink>
            ) : null}
          </div>
        }
      />
    </Container>
  );
}
