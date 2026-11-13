"use client";

import { useEffect } from "react";
import { CART_COUNT_COOKIE, notifyCartChanged, readCartCount } from "@/lib/cart";

/**
 * Rendered by the bag page with the count it just read from the database.
 * If the header's count cookie has drifted (an item was removed from the
 * catalog, say), this corrects it.
 */
export function CartCountSync({ count }: { count: number }) {
  useEffect(() => {
    if (readCartCount() === count) return;
    document.cookie = `${CART_COUNT_COOKIE}=${count}; path=/; max-age=${60 * 60 * 24 * 60}; samesite=lax`;
    notifyCartChanged();
  }, [count]);

  return null;
}
