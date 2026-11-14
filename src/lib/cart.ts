/*
 * Shopping bag types and browser helpers. Safe to import from client
 * components. The database side lives in `./cart-data`, and the mutations in
 * `src/app/cart/actions.ts`.
 */

export type CartLine = {
  id: number;
  productId: number;
  slug: string;
  name: string;
  color: string;
  image: string;
  alt: string;
  /** NULL for one-size products. */
  size: string | null;
  quantity: number;
  /** Unit price in minor units (cents). */
  price: number;
  /** Stock on hand for this product and size right now. */
  available: number;
};

export type Cart = {
  lines: CartLine[];
  /** Total number of pieces across all lines. */
  count: number;
  /** Sum of line totals in minor units (cents). */
  subtotal: number;
};

export type CartActionResult = { ok: true; count: number } | { ok: false; message: string };

/*
 * The header shows the bag count on every page, including the fully static
 * product and category pages, so it can't be rendered from the request on the
 * server. Instead the cart actions mirror the count into this readable cookie
 * and the header reads it in the browser. Only the server writes it, always
 * from a fresh database count.
 */
export const CART_COUNT_COOKIE = "altiere_cart_count";

const CART_CHANGE_EVENT = "altiere:cart-change";

/** Browser only. */
export function readCartCount(): number {
  const match = document.cookie.match(new RegExp(`(?:^|; )${CART_COUNT_COOKIE}=(\\d+)`));
  return match ? Number(match[1]) : 0;
}

/** Other tabs share the count cookie but not this tab's events. */
function openCartChannel(): BroadcastChannel | null {
  return typeof BroadcastChannel === "undefined" ? null : new BroadcastChannel(CART_CHANGE_EVENT);
}

/** Browser only. Call after a cart action resolves so the header count updates. */
export function notifyCartChanged(): void {
  window.dispatchEvent(new Event(CART_CHANGE_EVENT));
  const channel = openCartChannel();
  channel?.postMessage(null);
  channel?.close();
}

/**
 * Browser only. `useSyncExternalStore`-style subscription to cart changes:
 * from this tab, from other tabs, and whenever the tab comes back into view
 * (the server may have changed the cookie meanwhile, e.g. after a payment).
 */
export function subscribeToCart(onChange: () => void): () => void {
  const channel = openCartChannel();
  channel?.addEventListener("message", onChange);
  window.addEventListener(CART_CHANGE_EVENT, onChange);
  window.addEventListener("focus", onChange);
  document.addEventListener("visibilitychange", onChange);
  return () => {
    channel?.close();
    window.removeEventListener(CART_CHANGE_EVENT, onChange);
    window.removeEventListener("focus", onChange);
    document.removeEventListener("visibilitychange", onChange);
  };
}
