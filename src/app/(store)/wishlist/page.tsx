import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { ProductCard } from "@/components/product-card";
import { WishlistRemoveButton } from "@/components/wishlist-button";
import { getProductsByIds } from "@/lib/products";
import { getCurrentUser } from "@/lib/session";
import { getWishlistProductIds } from "@/lib/wishlist-data";

export const metadata: Metadata = { title: "Wishlist", robots: { index: false } };

export default function WishlistPage() {
  return (
    <main id="main" className="page-container section flex-1">
      <h1 className="heading-headline">Wishlist</h1>
      {/* The list belongs to the signed-in customer, so it streams in behind the boundary. */}
      <Suspense fallback={<WishlistSkeleton />}>
        <WishlistView />
      </Suspense>
    </main>
  );
}

async function WishlistView() {
  const user = await getCurrentUser();
  if (!user) {
    return (
      <div className="mt-8">
        <p className="text-muted">Sign in to save pieces and find them here on any device.</p>
        <div className="mt-8 flex flex-wrap gap-2">
          <Link href="/sign-in" className="btn btn-primary">
            Sign in
          </Link>
          <Link href="/sign-up" className="btn btn-secondary">
            Create an account
          </Link>
        </div>
      </div>
    );
  }

  const products = await getProductsByIds(await getWishlistProductIds(user.id));
  if (products.length === 0) {
    return (
      <div className="mt-8">
        <p className="text-muted">
          You haven&rsquo;t saved anything yet. Use &ldquo;Save to wishlist&rdquo; on any product.
        </p>
        <Link href="/new" className="btn btn-primary mt-8">
          Discover new arrivals
        </Link>
      </div>
    );
  }

  return (
    <>
      <p className="text-eyebrow text-muted mt-8 mb-6">
        {products.length} {products.length === 1 ? "piece" : "pieces"}
      </p>
      <ul className="product-grid">
        {products.map((p) => (
          <li key={p.id}>
            <ProductCard product={p} />
            <WishlistRemoveButton productId={p.id} name={p.name} />
          </li>
        ))}
      </ul>
    </>
  );
}

function WishlistSkeleton() {
  return (
    <div className="product-grid mt-8" aria-busy="true" aria-label="Loading your wishlist">
      {Array.from({ length: 4 }, (_, i) => (
        <div key={i} className="aspect-3/4 animate-pulse bg-surface" />
      ))}
    </div>
  );
}
