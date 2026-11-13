import type { Metadata } from "next";
import Form from "next/form";
import Link from "next/link";
import { Suspense } from "react";
import { SearchIcon } from "@/components/icons";
import { ProductCard } from "@/components/product-card";
import { getCategories, normalizeSearchQuery, searchProducts } from "@/lib/products";

export const metadata: Metadata = { title: "Search", robots: { index: false } };

export default function SearchPage({ searchParams }: PageProps<"/search">) {
  return (
    <main id="main" className="page-container section flex-1">
      <h1 className="heading-headline">Search</h1>
      {/* The query comes from the URL, so the form's value and the results stream in. */}
      <Suspense fallback={<SearchSkeleton />}>
        <SearchView searchParams={searchParams} />
      </Suspense>
    </main>
  );
}

async function SearchView({ searchParams }: Pick<PageProps<"/search">, "searchParams">) {
  const { q } = await searchParams;
  const raw = typeof q === "string" ? q : "";
  const query = normalizeSearchQuery(raw);
  const results = query ? await searchProducts(query) : [];

  return (
    <>
      <SearchForm defaultValue={raw.trim()} />

      {!query ? (
        <BrowseInstead message="Search by product name, color or category." />
      ) : results.length === 0 ? (
        <BrowseInstead message={<>No results for &ldquo;{raw.trim()}&rdquo;. Try a different word, or browse a category.</>} />
      ) : (
        <section aria-label="Search results" className="mt-10 md:mt-12">
          <p className="text-eyebrow text-muted mb-6" role="status">
            {results.length} {results.length === 1 ? "result" : "results"} for &ldquo;{raw.trim()}&rdquo;
          </p>
          <div className="product-grid">
            {results.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </section>
      )}
    </>
  );
}

/** GET form: submitting navigates to /search?q=… on the client. */
function SearchForm({ defaultValue }: { defaultValue?: string }) {
  return (
    <Form action="/search" role="search" className="mt-8 flex max-w-xl items-end gap-4">
      <label className="flex-1">
        <span className="sr-only">Search products</span>
        <input
          // Remount when the URL's query changes (back/forward) so the value follows it.
          key={defaultValue}
          type="search"
          name="q"
          defaultValue={defaultValue}
          placeholder="What are you looking for?"
          autoComplete="off"
          maxLength={64}
          className="field"
        />
      </label>
      <button type="submit" className="btn btn-primary btn-sm">
        <SearchIcon className="size-4" />
        Search
      </button>
    </Form>
  );
}

async function BrowseInstead({ message }: { message: React.ReactNode }) {
  const categories = await getCategories();
  return (
    <div className="mt-10">
      <p className="text-muted">{message}</p>
      <ul className="mt-6 flex flex-wrap gap-2">
        <li>
          <Link href="/new" className="btn btn-secondary btn-sm">
            New in
          </Link>
        </li>
        {categories.map((c) => (
          <li key={c.slug}>
            <Link href={`/${c.slug}`} className="btn btn-secondary btn-sm">
              {c.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

function SearchSkeleton() {
  return (
    <>
      <SearchForm />
      <div className="mt-10 h-3 w-40 animate-pulse bg-surface" aria-busy="true" aria-label="Searching" />
    </>
  );
}
