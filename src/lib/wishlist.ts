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
/** Bumped by every reset and save, so a load that started before one can tell it is out of date. */
let version = 0;
const listeners = new Set<() => void>();

function publish(next: WishlistState) {
  state = next;
  for (const listener of listeners) listener();
}

async function load() {
  if (loading) return;
  loading = true;
  const started = version;
  try {
    const response = await fetch("/api/wishlist", { cache: "no-store" });
    if (!response.ok) throw new Error(`Wishlist request failed with ${response.status}`);
    const data: { signedIn: boolean; ids: number[] } = await response.json();
    // A sign-in, sign-out or save since the request began makes this answer
    // stale: it may describe the previous visitor, or miss the save.
    if (started === version) {
      publish({ ready: true, signedIn: data.signedIn, ids: new Set(data.ids) });
    }
  } catch {
    // Leave `ready` false, so the next component to subscribe tries again
    // instead of treating a failed request as an empty wishlist.
  } finally {
    loading = false;
    if (started !== version && listeners.size > 0) void load();
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
  version++;
  const ids = new Set(state.ids);
  if (saved) ids.add(productId);
  else ids.delete(productId);
  publish({ ready: true, signedIn: true, ids });
}

/** Call after signing in or out: the saved ids belong to a different visitor now. */
export function resetWishlist(): void {
  version++;
  publish(EMPTY);
  // If a load is already running, it reloads by itself once it sees the new version.
  if (listeners.size > 0) void load();
}
