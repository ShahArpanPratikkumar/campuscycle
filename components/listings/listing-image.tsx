"use client";

import Image from "next/image";
import { useState, type ReactNode } from "react";

export interface ListingImageProps {
  src: string;
  alt: string;
  sizes?: string;
  priority?: boolean;
  className?: string;
  /** Rendered in place of the image when it fails to load. */
  fallback: ReactNode;
}

/**
 * A `next/image` that degrades gracefully.
 *
 * Listing images are seller-supplied URLs, so any of them can 404 or point at a
 * host that is down. Rather than showing the browser's broken-image icon, this
 * swaps in the caller's fallback (the category tile) the first time loading
 * fails. The `failed` state is per-mount, so a working image is never replaced.
 */
export function ListingImage({
  src,
  alt,
  sizes,
  priority = false,
  className,
  fallback,
}: ListingImageProps) {
  const [failed, setFailed] = useState(false);

  if (failed) return <>{fallback}</>;

  return (
    <Image
      src={src}
      alt={alt}
      fill
      sizes={sizes}
      priority={priority}
      className={className}
      onError={() => setFailed(true)}
    />
  );
}
