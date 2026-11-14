"use client";

import Image from "next/image";
import Link from "next/link";
import { useState, useTransition } from "react";
import { removeCartItem, setCartItemQuantity } from "@/app/cart/actions";
import { notifyCartChanged, type CartActionResult, type CartLine } from "@/lib/cart";
import { formatPrice } from "@/lib/catalog";

/** One bag row: image, name, options, quantity stepper, remove and line total. */
export function CartLineItem({ line }: { line: CartLine }) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const soldOut = line.available <= 0;
  const overStock = !soldOut && line.quantity > line.available;
  const href = `/products/${line.slug}`;

  function run(action: () => Promise<CartActionResult>) {
    setError(null);
    startTransition(async () => {
      try {
        const result = await action();
        if (!result.ok) setError(result.message);
      } catch {
        // The request never completed (connection or server failure).
        setError("We couldn't update your bag. Please try again.");
      }
      notifyCartChanged();
    });
  }

  const stepper = "flex size-10 items-center justify-center disabled:cursor-not-allowed disabled:text-subtle";

  return (
    <li className="flex gap-4 border-b py-6 md:gap-6" aria-busy={pending}>
      <Link href={href} className="media-product w-24 shrink-0 self-start md:w-32">
        <Image src={line.image} alt={line.alt} fill sizes="8rem" />
      </Link>

      <div className={`flex min-w-0 flex-1 flex-col ${pending ? "opacity-60" : ""}`}>
        <div className="flex items-start justify-between gap-4">
          <h2 className="text-body font-sans font-normal tracking-normal">
            <Link href={href} className="link-quiet">
              {line.name}
            </Link>
          </h2>
          <p className="shrink-0 tabular-nums">{formatPrice(line.price * line.quantity)}</p>
        </div>

        <dl className="text-caption text-muted mt-1 grid grid-cols-[auto_1fr] gap-x-3">
          <dt>Color</dt>
          <dd>{line.color}</dd>
          {line.size && (
            <>
              <dt>Size</dt>
              <dd>{line.size}</dd>
            </>
          )}
        </dl>

        {(soldOut || overStock) && (
          <p className="text-caption text-sale mt-2">
            {soldOut
              ? "Sold out. Please remove this item."
              : `Only ${line.available} available. Please reduce the quantity.`}
          </p>
        )}

        <div className="mt-auto flex items-center justify-between gap-4 pt-4">
          <div className="hairline flex items-center" role="group" aria-label={`Quantity for ${line.name}`}>
            <button
              type="button"
              className={stepper}
              aria-label="Decrease quantity"
              disabled={pending || line.quantity <= 1}
              onClick={() => run(() => setCartItemQuantity(line.id, line.quantity - 1))}
            >
              &minus;
            </button>
            <span className="w-8 text-center tabular-nums" aria-live="polite">
              {line.quantity}
            </span>
            <button
              type="button"
              className={stepper}
              aria-label="Increase quantity"
              disabled={pending || line.quantity >= line.available}
              onClick={() => run(() => setCartItemQuantity(line.id, line.quantity + 1))}
            >
              +
            </button>
          </div>

          <button
            type="button"
            className="text-caption link text-muted cursor-pointer"
            disabled={pending}
            onClick={() => run(() => removeCartItem(line.id))}
          >
            Remove<span className="sr-only"> {line.name}</span>
          </button>
        </div>

        {error && (
          <p className="text-caption text-sale mt-2" role="alert">
            {error}
          </p>
        )}
      </div>
    </li>
  );
}
