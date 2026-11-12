import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { GiftIcon, ReturnIcon, TruckIcon } from "@/components/icons";
import { ProductCard } from "@/components/product-card";
import { ProductGallery } from "@/components/product-gallery";
import { ProductPurchase } from "@/components/product-purchase";
import { SectionHeader } from "@/components/section-header";
import { formatPrice, stockStatus, type Product } from "@/lib/catalog";
import { getProduct, getProductSlugs, getRelated } from "@/lib/products";

// Product pages are fully static. This also makes the first request for an
// unknown slug wait for the full render, so it returns a real 404 status
// instead of streaming a 200 shell before notFound() runs.
export const ensureStatic = "navigation";

export async function generateStaticParams() {
  const slugs = await getProductSlugs();
  return slugs.map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: PageProps<"/products/[slug]">): Promise<Metadata> {
  const product = await getProduct((await params).slug);
  if (!product) return {};
  return {
    title: product.name,
    description: product.description,
    openGraph: { images: [{ url: product.image, alt: product.alt }] },
  };
}

/*
 * The App Shell is shared by every link to this route, so it can't depend on
 * `params`. The page itself stays synchronous and the URL-specific content
 * renders inside <Suspense>. Product cards link with prefetch={true}, so the
 * real content is usually prefetched and the skeleton is rarely seen.
 */
export default function ProductPage({ params }: PageProps<"/products/[slug]">) {
  return (
    <main id="main" className="flex-1">
      <Suspense fallback={<ProductSkeleton />}>
        <ProductView params={params} />
      </Suspense>
    </main>
  );
}

async function ProductView({ params }: Pick<PageProps<"/products/[slug]">, "params">) {
  const product = await getProduct((await params).slug);
  if (!product) notFound();

  const related = await getRelated(product);

  return (
    <>
      <ProductJsonLd product={product} />

      <div className="lg:grid lg:grid-cols-12">
        <div className="lg:col-span-7">
          <ProductGallery images={product.gallery} />
        </div>

        <div className="lg:col-span-5">
          <div className="px-gutter pt-8 pb-section lg:sticky lg:top-header lg:px-[10%] lg:pt-12 xl:px-[14%]">
            <Breadcrumb product={product} />
            <ProductInfo product={product} />
            <div className="mt-8">
              <ProductPurchase product={product} />
            </div>
            <ServiceNotes />
            <ProductAccordions product={product} />
          </div>
        </div>
      </div>

      <section aria-label="You may also like" className="page-container section divider">
        <SectionHeader
          eyebrow="Discover more"
          title="You may also like"
          link={{ label: "View all", href: `/${product.category.slug}` }}
        />
        {/* 4 items fill the 2- and 4-col rows; show 3 at the 3-col breakpoint */}
        <div className="product-grid md:max-lg:[&>*:nth-child(n+4)]:hidden">
          {related.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      </section>
    </>
  );
}

/** Mirrors the loaded layout (gallery left, info right) so nothing shifts when content arrives. */
function ProductSkeleton() {
  const bar = "animate-pulse bg-surface";
  return (
    <div className="lg:grid lg:grid-cols-12" aria-busy="true" aria-label="Loading product">
      <div className="lg:col-span-7">
        <div className={`media-product ${bar}`} />
      </div>
      <div className="lg:col-span-5">
        <div className="px-gutter pt-8 pb-section lg:px-[10%] lg:pt-12 xl:px-[14%]">
          <div className={`mb-8 hidden h-3 w-2/3 lg:block ${bar}`} />
          <div className={`h-3 w-24 ${bar}`} />
          <div className={`mt-4 h-8 w-4/5 ${bar}`} />
          <div className={`mt-4 h-5 w-20 ${bar}`} />
          <div className={`mt-8 h-11 w-full ${bar}`} />
          <div className={`mt-8 h-14 w-full ${bar}`} />
          <div className={`mt-2 h-14 w-full ${bar}`} />
        </div>
      </div>
    </div>
  );
}

/* ── Pieces ───────────────────────────────────────────────────────────── */

function Breadcrumb({ product }: { product: Product }) {
  return (
    <nav aria-label="Breadcrumb" className="mb-8 hidden lg:block">
      <ol className="text-eyebrow text-muted flex flex-wrap items-center gap-2">
        <li>
          <Link href="/" className="link-quiet">
            Home
          </Link>
        </li>
        <li aria-hidden="true">/</li>
        <li>
          <Link href={`/${product.category.slug}`} className="link-quiet">
            {product.category.label}
          </Link>
        </li>
        <li aria-hidden="true">/</li>
        <li aria-current="page" className="text-ink">
          {product.name}
        </li>
      </ol>
    </nav>
  );
}

function ProductInfo({ product }: { product: Product }) {
  return (
    <div>
      <Link href={`/${product.category.slug}`} className="text-eyebrow text-muted link-quiet">
        {product.category.label}
      </Link>
      <h1 className="heading-title mt-3 md:text-[2rem] md:leading-tight">{product.name}</h1>
      <p className="text-lead mt-3 tabular-nums">{formatPrice(product.price)}</p>

      <dl className="text-caption text-muted mt-6 grid grid-cols-[auto_1fr] gap-x-4 gap-y-1">
        <dt>Color</dt>
        <dd className="text-ink">{product.color}</dd>
        <dt>Style</dt>
        <dd className="tabular-nums">{product.styleCode}</dd>
      </dl>
    </div>
  );
}

function ServiceNotes() {
  const notes = [
    { icon: TruckIcon, text: "Complimentary express shipping" },
    { icon: ReturnIcon, text: "Free returns within 30 days" },
    { icon: GiftIcon, text: "Signature gift packaging" },
  ];
  return (
    <ul className="text-caption text-muted mt-8 space-y-3">
      {notes.map(({ icon: Icon, text }) => (
        <li key={text} className="flex items-center gap-3">
          <Icon className="size-4 text-ink" />
          {text}
        </li>
      ))}
    </ul>
  );
}

function ProductAccordions({ product }: { product: Product }) {
  return (
    <div className="divider mt-10">
      <details className="accordion" open>
        <summary>Description</summary>
        <p className="text-muted">{product.description}</p>
      </details>
      <details className="accordion">
        <summary>Details &amp; care</summary>
        <ul className="text-muted list-disc space-y-1 pl-4 marker:text-subtle">
          {product.details.map((d) => (
            <li key={d}>{d}</li>
          ))}
        </ul>
      </details>
      <details className="accordion">
        <summary>Shipping &amp; returns</summary>
        <div className="text-muted space-y-3">
          <p>
            Orders placed before 2pm ship the same day with complimentary express delivery,
            usually arriving in 1–3 business days.
          </p>
          <p>
            Returns and exchanges are free within 30 days. Items must be unworn, with
            original tags and packaging.
          </p>
        </div>
      </details>
    </div>
  );
}

/** schema.org Product data so search engines can show price and availability. */
function ProductJsonLd({ product }: { product: Product }) {
  const availability = {
    in_stock: "https://schema.org/InStock",
    low_stock: "https://schema.org/LimitedAvailability",
    out_of_stock: "https://schema.org/OutOfStock",
  }[stockStatus(product.stock)];

  const data = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    description: product.description,
    sku: product.styleCode,
    color: product.color,
    category: product.category.label,
    image: product.gallery.map((g) => g.src),
    brand: { "@type": "Brand", name: "Altiere" },
    offers: {
      "@type": "Offer",
      priceCurrency: "USD",
      price: (product.price / 100).toFixed(2),
      availability,
    },
  };

  return (
    <script
      type="application/ld+json"
      // Values come from our own catalog; escape "<" so no string can close the tag.
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, "\\u003c") }}
    />
  );
}
