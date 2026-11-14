"use client";

import Link from "next/link";
import { useSyncExternalStore } from "react";
import { readCartCount, subscribeToCart } from "@/lib/cart";
import { BagIcon } from "./icons";

/**
 * Header bag link with a live count. The count is read from a cookie in the
 * browser (0 during server render), so pages that include the header can stay
 * fully static.
 */
export function CartLink() {
  const count = useSyncExternalStore(subscribeToCart, readCartCount, () => 0);

  return (
    <Link
      href="/cart"
      className="btn-icon relative -mr-2"
      aria-label={`Shopping bag, ${count} ${count === 1 ? "item" : "items"}`}
    >
      <BagIcon />
      {count > 0 && (
        <span
          aria-hidden="true"
          className="absolute top-0.5 right-0 flex h-4 min-w-4 items-center justify-center rounded-full bg-ink px-1 text-[0.625rem] leading-none font-medium text-paper tabular-nums"
        >
          {count}
        </span>
      )}
    </Link>
  );
}
