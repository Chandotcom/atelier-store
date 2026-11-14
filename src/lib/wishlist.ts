/*
 * Browser-side wishlist store. Safe to import from client components.
 *
 * Product pages are fully static, so which products a customer has saved
 * can't be rendered on the server. Instead the first component that
 * subscribes loads the ids once from /api/wishlist, and every wishlist button
 * on the page shares them through `useSyncExternalStore`.
 */

export type WishlistState = {
  /** False until the first load finishes. */
  ready: boolean;
  signedIn: boolean;
  ids: ReadonlySet<number>;
};

export type WishlistResult =
  | { ok: true; saved: boolean }
  | { ok: false; reason: "signed_out" | "invalid" };

const EMPTY: WishlistState = { ready: false, signedIn: false, ids: new Set() };

let state: WishlistState = EMPTY;
let loading = false;
const listeners = new Set<() => void>();

function publish(next: WishlistState) {
  state = next;
  for (const listener of listeners) listener();
}

async function load() {
  if (loading) return;
  loading = true;
  try {
    const response = await fetch("/api/wishlist", { cache: "no-store" });
    const data: { signedIn: boolean; ids: number[] } = await response.json();
    publish({ ready: true, signedIn: data.signedIn, ids: new Set(data.ids) });
  } catch {
    publish({ ready: true, signedIn: false, ids: new Set() });
  } finally {
    loading = false;
  }
}

export function subscribeToWishlist(onChange: () => void): () => void {
  listeners.add(onChange);
  if (!state.ready) void load();
  return () => listeners.delete(onChange);
}

export function getWishlistSnapshot(): WishlistState {
  return state;
}

export function getServerWishlistSnapshot(): WishlistState {
  return EMPTY;
}

/** Call after a wishlist action succeeds. */
export function markWishlisted(productId: number, saved: boolean): void {
  const ids = new Set(state.ids);
  if (saved) ids.add(productId);
  else ids.delete(productId);
  publish({ ready: true, signedIn: true, ids });
}

/** Call after signing in or out: the saved ids belong to a different visitor now. */
export function resetWishlist(): void {
  publish(EMPTY);
  if (listeners.size > 0) void load();
}
