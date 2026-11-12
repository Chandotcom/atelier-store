import type { Metadata } from "next";
import Link from "next/link";
import { ProductCard } from "@/components/product-card";
import { getNewArrivals } from "@/lib/products";

export const metadata: Metadata = {
  title: "New arrivals",
  description: "The latest pieces to arrive at Altiere, newest first.",
};

// Rendered entirely from cached catalog queries, like the product pages.
export const ensureStatic = "navigation";

/** Divisible by 2, 3 and 4, so a full page leaves no ragged row at any breakpoint. */
const PAGE_SIZE = 24;

export default async function NewArrivalsPage() {
  const products = await getNewArrivals(PAGE_SIZE);

  return (
    <main id="main" className="flex-1">
      <div className="page-container section">
        <nav aria-label="Breadcrumb" className="mb-8">
          <ol className="text-eyebrow text-muted flex flex-wrap items-center gap-2">
            <li>
              <Link href="/" className="link-quiet">
                Home
              </Link>
            </li>
            <li aria-hidden="true">/</li>
            <li aria-current="page" className="text-ink">
              New arrivals
            </li>
          </ol>
        </nav>

        <header className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between sm:gap-6 md:mb-12">
          <div>
            <p className="text-eyebrow text-muted mb-3">Just in</p>
            <h1 className="heading-headline">New arrivals</h1>
            <p className="text-lead text-muted mt-4 max-w-md">
              The latest pieces from the atelier, newest first.
            </p>
          </div>
          {products.length > 0 && (
            <p className="text-eyebrow text-muted shrink-0">
              {products.length} {products.length === 1 ? "piece" : "pieces"}
            </p>
          )}
        </header>

        {products.length > 0 ? (
          <div className="product-grid">
            {products.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        ) : (
          <div className="divider py-section text-center">
            <p className="text-muted">New pieces are on their way. Please check back soon.</p>
            <Link href="/" className="btn btn-secondary mt-8">
              Return to the homepage
            </Link>
          </div>
        )}
      </div>
    </main>
  );
}
