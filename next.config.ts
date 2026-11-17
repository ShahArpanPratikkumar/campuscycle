import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    /**
     * Step 1 listings have no photos (the grid falls back to a category tile),
     * but `ListingThumb` and `ListingGallery` already render `next/image` the
     * moment a listing has an image URL.
     *
     * Listing photos are stored as external URLs rather than uploads in v1, so
     * any HTTPS host is allowed here. Tighten this to your CDN/object-storage
     * hostnames once image uploads land in Step 7.
     */
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**",
      },
    ],
  },
  experimental: {
    cpus: 1,
  },
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
