import { isStoreImageUrl } from "@/lib/blob";
import { UNSPLASH_QUERY, unsplash } from "@/lib/unsplash";

/*
 * Server-side check for product image URLs. The image optimizer only serves
 * hosts allow-listed in next.config.ts, so anything saved here must match it:
 * an image uploaded to our Blob store, or an Unsplash photo with one of the
 * presets in `src/lib/unsplash.ts`.
 */

/**
 * Returns the URL to store for an admin-entered image, or null if it can't be
 * served. Uploaded images are kept as they are. An Unsplash link with an
 * allowed preset is kept too (seeded galleries use close-up crops); any other
 * Unsplash link, or a bare photo ID, gets the standard product crop.
 */
export function normalizeProductImage(src: string): string | null {
  const value = src.trim();
  let url: URL;
  try {
    url = new URL(value);
  } catch {
    // Not a URL: accept a bare Unsplash photo ID such as "1591047139829-d91aecb6caea".
    const id = /^(?:photo-)?(\d{10,}-[\w-]+)$/.exec(value)?.[1];
    return id ? unsplash(id, "product") : null;
  }

  if (isStoreImageUrl(url)) return url.toString();
  if (url.hostname !== "images.unsplash.com") return null;
  const id = /^\/photo-([\w-]+)$/.exec(url.pathname)?.[1];
  if (!id) return null;
  const allowed = (Object.values(UNSPLASH_QUERY) as string[]).includes(url.search);
  return allowed ? url.toString() : unsplash(id, "product");
}
