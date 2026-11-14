import type { NextConfig } from "next";
import type { RemotePattern } from "next/dist/shared/lib/image-config";
import { PRODUCT_IMAGE_PREFIX, blobHost } from "./src/lib/blob";
import { UNSPLASH_QUERY } from "./src/lib/unsplash";

// Uploaded product images: only our own Blob store's `products/` folder, with
// no query string. The host comes from BLOB_READ_WRITE_TOKEN; without it,
// uploads are off and only Unsplash is allowed. Changing the token needs a
// dev server restart (and a redeploy), since this config is read once.
const uploadedHost = blobHost();
const uploadedImages: RemotePattern[] = uploadedHost
  ? [{ protocol: "https", hostname: uploadedHost, pathname: `/${PRODUCT_IMAGE_PREFIX}**`, search: "" }]
  : [];

const nextConfig: NextConfig = {
  /* config options here */
  cacheComponents: true,
  partialPrefetching: true,
  images: {
    remotePatterns: [
      ...uploadedImages,
      // Sample imagery. Restrict to Unsplash photo paths and the exact crop
      // presets in src/lib/unsplash.ts so the optimizer can't be abused.
      ...Object.values(UNSPLASH_QUERY).map((search) => ({
        protocol: "https" as const,
        hostname: "images.unsplash.com",
        pathname: "/photo-*",
        search,
      })),
    ],
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
