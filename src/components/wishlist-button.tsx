"use client";

import { useRouter } from "next/navigation";
import { useSyncExternalStore, useTransition } from "react";
import { setWishlisted } from "@/app/(store)/wishlist/actions";
import {
  getServerWishlistSnapshot,
  getWishlistSnapshot,
  markWishlisted,
  subscribeToWishlist,
} from "@/lib/wishlist";
import { HeartIcon } from "./icons";

function useWishlistToggle(productId: number) {
  const router = useRouter();
  const wishlist = useSyncExternalStore(
    subscribeToWishlist,
    getWishlistSnapshot,
    getServerWishlistSnapshot,
  );
  const [pending, startTransition] = useTransition();
  const saved = wishlist.ids.has(productId);

  function set(next: boolean, onDone?: () => void) {
    startTransition(async () => {
      // A request that never completes leaves the button as it was, to try again.
      const result = await setWishlisted(productId, next).catch(() => null);
      if (!result) return;
      if (result.ok) {
        markWishlisted(productId, result.saved);
        onDone?.();
      } else if (result.reason === "signed_out") {
        // Wishlists belong to an account.
        router.push("/sign-in");
      }
    });
  }

  return { saved, pending, set };
}

/** Full-width "Save to wishlist" button for the product page. */
export function WishlistButton({ productId }: { productId: number }) {
  const { saved, pending, set } = useWishlistToggle(productId);

  return (
    <button
      type="button"
      className="btn btn-secondary btn-lg btn-block"
      aria-pressed={saved}
      disabled={pending}
      onClick={() => set(!saved)}
    >
      <HeartIcon className={`size-4 ${saved ? "fill-current" : ""}`} />
      {saved ? "Saved to wishlist" : "Save to wishlist"}
    </button>
  );
}

/** Text "Remove" control under a card on the wishlist page. */
export function WishlistRemoveButton({ productId, name }: { productId: number; name: string }) {
  const router = useRouter();
  const { pending, set } = useWishlistToggle(productId);

  return (
    <button
      type="button"
      className="text-caption link text-muted mt-2 cursor-pointer px-1 md:px-0"
      disabled={pending}
      // The page's list is rendered on the server, so re-render it once removed.
      onClick={() => set(false, () => router.refresh())}
    >
      {pending ? "Removing…" : "Remove"}
      <span className="sr-only"> {name} from wishlist</span>
    </button>
  );
}
