import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { ProductListing } from "@/components/product-listing";
import { getCategories, getProductsByCategory } from "@/lib/products";

// Fully static, like the product pages: an unknown slug waits for the full
// render and returns a real 404 status instead of a streamed 200 shell.
export const ensureStatic = "navigation";

export async function generateStaticParams() {
  const categories = await getCategories();
  return categories.map((c) => ({ category: c.slug }));
}

async function findCategory(slug: string) {
  const categories = await getCategories();
  return categories.find((c) => c.slug === slug) ?? null;
}

export async function generateMetadata({
  params,
}: PageProps<"/[category]">): Promise<Metadata> {
  const category = await findCategory((await params).category);
  if (!category) return {};
  return {
    title: category.label,
    description: `Shop ${category.label.toLowerCase()} at Altiere.`,
  };
}

/*
 * The App Shell is shared by every link to this route, so it can't depend on
 * `params`: the page stays synchronous and the listing renders inside <Suspense>.
 */
export default function CategoryPage({ params }: PageProps<"/[category]">) {
  return (
    <main id="main" className="flex-1">
      <Suspense fallback={<ListingSkeleton />}>
        <CategoryView params={params} />
      </Suspense>
    </main>
  );
}

async function CategoryView({ params }: Pick<PageProps<"/[category]">, "params">) {
  const category = await findCategory((await params).category);
  if (!category) notFound();

  const products = await getProductsByCategory(category.slug);

  return (
    <ProductListing
      eyebrow="Shop"
      title={category.label}
      products={products}
      emptyMessage="New pieces are on their way. Please check back soon."
    />
  );
}

/** Mirrors the listing layout (breadcrumb, heading, grid) so nothing shifts when content arrives. */
function ListingSkeleton() {
  const bar = "animate-pulse bg-surface";
  return (
    <div className="page-container section" aria-busy="true" aria-label="Loading products">
      <div className={`mb-8 h-3 w-40 ${bar}`} />
      <div className={`h-3 w-16 ${bar}`} />
      <div className={`mt-4 mb-8 h-10 w-64 max-w-full md:mb-12 ${bar}`} />
      <div className="product-grid">
        {Array.from({ length: 4 }, (_, i) => (
          <div key={i} className={`aspect-3/4 ${bar}`} />
        ))}
      </div>
    </div>
  );
}
