import Link from "next/link";
import type { Product } from "@/lib/catalog";
import { FilterableProductGrid } from "./product-filters";

type Props = {
  /** Page title; also the current breadcrumb entry. */
  title: string;
  eyebrow: string;
  lead?: string;
  products: Product[];
  /** Shown instead of the grid when there are no products. */
  emptyMessage: string;
};

/** Full-page product listing: breadcrumb, heading with piece count, grid or empty state. */
export function ProductListing({ title, eyebrow, lead, products, emptyMessage }: Props) {
  return (
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
            {title}
          </li>
        </ol>
      </nav>

      <header className="mb-8">
        <p className="text-eyebrow text-muted mb-3">{eyebrow}</p>
        <h1 className="heading-headline">{title}</h1>
        {lead && <p className="text-lead text-muted mt-4 max-w-md">{lead}</p>}
      </header>

      {products.length > 0 ? (
        // Sort, filters and the piece count live in the grid's toolbar.
        <FilterableProductGrid products={products} />
      ) : (
        <div className="divider py-section text-center">
          <p className="text-muted">{emptyMessage}</p>
          <Link href="/" className="btn btn-secondary mt-8">
            Return to the homepage
          </Link>
        </div>
      )}
    </div>
  );
}
