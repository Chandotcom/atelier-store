"use client";

import { useEffect } from "react";
import { refreshCartCount } from "@/app/cart/actions";
import { notifyCartChanged, readCartCount } from "@/lib/cart";

/**
 * Rendered by the bag page with the count it read from the database. If the
 * header's count cookie disagrees, the count is recomputed on the server.
 *
 * It never writes `count` itself: this page can be shown from the browser's
 * back/forward cache after the bag has changed (after paying, say), and a
 * stale count would then overwrite a correct cookie.
 */
export function CartCountSync({ count }: { count: number }) {
  useEffect(() => {
    if (readCartCount() === count) return;
    let cancelled = false;
    refreshCartCount().then(() => {
      if (!cancelled) notifyCartChanged();
    });
    return () => {
      cancelled = true;
    };
  }, [count]);

  return null;
}
