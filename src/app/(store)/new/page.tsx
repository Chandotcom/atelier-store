import type { Metadata } from "next";
import { ProductListing } from "@/components/product-listing";
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
      <ProductListing
        eyebrow="Just in"
        title="New arrivals"
        lead="The latest pieces from the atelier, newest first."
        products={products}
        emptyMessage="New pieces are on their way. Please check back soon."
      />
    </main>
  );
}
