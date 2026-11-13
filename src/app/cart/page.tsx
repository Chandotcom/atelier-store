import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { CartCountSync } from "@/components/cart-count-sync";
import { CartLineItem } from "@/components/cart-line";
import { getCart } from "@/lib/cart-data";
import { formatPrice } from "@/lib/catalog";

export const metadata: Metadata = { title: "Shopping bag", robots: { index: false } };

export default function CartPage() {
  return (
    <main id="main" className="content-container section flex-1">
      <h1 className="heading-headline">Shopping bag</h1>
      {/* The bag is read from the visitor's cookie, so it streams in behind the boundary. */}
      <Suspense fallback={<CartSkeleton />}>
        <CartView />
      </Suspense>
    </main>
  );
}

async function CartView() {
  const cart = await getCart();

  if (cart.lines.length === 0) {
    return (
      <div className="mt-8">
        <CartCountSync count={0} />
        <p className="text-muted">Your bag is empty.</p>
        <Link href="/new" className="btn btn-primary mt-8">
          Discover new arrivals
        </Link>
      </div>
    );
  }

  const blocked = cart.lines.some((l) => l.quantity > l.available);

  return (
    <div className="mt-8 lg:grid lg:grid-cols-12 lg:gap-x-16">
      <CartCountSync count={cart.count} />

      <section aria-label="Items in your bag" className="lg:col-span-8">
        <p className="text-eyebrow text-muted">
          {cart.count} {cart.count === 1 ? "item" : "items"}
        </p>
        <ul className="divider mt-4">
          {cart.lines.map((line) => (
            <CartLineItem key={line.id} line={line} />
          ))}
        </ul>
      </section>

      <section
        aria-label="Order summary"
        className="mt-10 bg-surface p-6 lg:sticky lg:top-[calc(var(--header-h)+2rem)] lg:col-span-4 lg:mt-0 lg:self-start"
      >
        <h2 className="text-label">Order summary</h2>
        <dl className="mt-6 space-y-3">
          <div className="flex justify-between gap-4">
            <dt className="text-muted">Subtotal</dt>
            <dd className="tabular-nums">{formatPrice(cart.subtotal)}</dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-muted">Shipping</dt>
            <dd>Complimentary</dd>
          </div>
          <div className="divider-strong flex justify-between gap-4 pt-4">
            <dt className="text-label">Total</dt>
            <dd className="text-lead tabular-nums">{formatPrice(cart.subtotal)}</dd>
          </div>
        </dl>

        {/* Checkout isn't built yet. */}
        <button type="button" className="btn btn-primary btn-lg btn-block mt-8" disabled>
          Checkout
        </button>
        <p className="text-caption text-muted mt-3">
          {blocked
            ? "Some items are no longer available in the quantity selected."
            : "Checkout is coming soon."}
        </p>
      </section>
    </div>
  );
}

function CartSkeleton() {
  const bar = "animate-pulse bg-surface";
  return (
    <div className="mt-8 lg:grid lg:grid-cols-12 lg:gap-x-16" aria-busy="true" aria-label="Loading your bag">
      <div className="space-y-6 lg:col-span-8">
        <div className={`h-3 w-16 ${bar}`} />
        <div className={`h-36 ${bar}`} />
        <div className={`h-36 ${bar}`} />
      </div>
      <div className={`mt-10 h-64 lg:col-span-4 lg:mt-0 ${bar}`} />
    </div>
  );
}
