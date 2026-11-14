/**
 * Where uploaded product images live: a public Vercel Blob store. The store's
 * host is derived from its read-write token (`vercel_blob_rw_<storeId>_<secret>`),
 * the same way `@vercel/blob` builds its URLs, so no extra env var is needed.
 * Set `BLOB_STORE_ID` only if the token doesn't follow that format.
 *
 * Pure functions of the env passed in: next.config.ts imports this file, and
 * nothing here reads env at module top level.
 */

/** Every upload goes under this folder; validation and the optimizer allow nothing else. */
export const PRODUCT_IMAGE_PREFIX = "products/";

type Env = Record<string, string | undefined>;

/** The public store's host, such as `abc123.public.blob.vercel-storage.com`, or null when Blob isn't set up. */
export function blobHost(env: Env = process.env): string | null {
  const explicit = env.BLOB_STORE_ID?.trim().replace(/^store_/, "");
  const fromToken = env.BLOB_READ_WRITE_TOKEN?.split("_")[3];
  const storeId = (explicit || fromToken || "").toLowerCase();
  return /^[a-z0-9]+$/.test(storeId) ? `${storeId}.public.blob.vercel-storage.com` : null;
}

/** True for a product image URL in our store: https, our host, under `products/`, no query or hash. */
export function isStoreImageUrl(url: URL, env: Env = process.env): boolean {
  const host = blobHost(env);
  return (
    host !== null &&
    url.protocol === "https:" &&
    url.hostname === host &&
    url.port === "" &&
    url.pathname.startsWith(`/${PRODUCT_IMAGE_PREFIX}`) &&
    url.search === "" &&
    url.hash === ""
  );
}
