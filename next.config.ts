import type { NextConfig } from "next";
import { UNSPLASH_QUERY } from "./src/lib/unsplash";

const nextConfig: NextConfig = {
  /* config options here */
  cacheComponents: true,
  partialPrefetching: true,
  images: {
    // Sample imagery only. Restrict to Unsplash photo paths and the exact
    // crop presets in src/lib/unsplash.ts so the optimizer can't be abused.
    remotePatterns: Object.values(UNSPLASH_QUERY).map((search) => ({
      protocol: "https" as const,
      hostname: "images.unsplash.com",
      pathname: "/photo-*",
      search,
    })),
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
