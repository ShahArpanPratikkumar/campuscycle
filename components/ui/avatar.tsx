"use client";

import { useState } from "react";
import { cn, initials } from "@/lib/utils";

export interface AvatarProps {
  name: string;
  src?: string;
  size?: "sm" | "md" | "lg";
  className?: string;
}

const SIZES = {
  sm: "size-8 text-xs",
  md: "size-10 text-sm",
  lg: "size-14 text-lg",
} as const;

/**
 * Student avatar.
 *
 * Renders the profile image when there is one, and deterministic initials on a
 * stable tint otherwise. If the image fails to load (a dead external URL) it
 * falls back to the initials rather than a broken-image icon.
 */
export function Avatar({ name, src, size = "md", className }: AvatarProps) {
  const [failed, setFailed] = useState(false);

  if (src && !failed) {
    return (
      // eslint-disable-next-line @next/next/no-img-element -- avatars are external, unoptimised URLs
      <img
        src={src}
        alt={name}
        onError={() => setFailed(true)}
        className={cn("rounded-full object-cover", SIZES[size], className)}
      />
    );
  }

  return (
    <span
      aria-hidden="true"
      className={cn(
        "inline-flex items-center justify-center rounded-full bg-brand-100 font-semibold text-brand-700 select-none",
        SIZES[size],
        className,
      )}
    >
      {initials(name)}
    </span>
  );
}
