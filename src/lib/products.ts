import { and, asc, desc, eq, ilike, inArray, ne, or, sql } from "drizzle-orm";
import { cacheLife, cacheTag } from "next/cache";

import { db } from "@/db";
import { categories, products } from "@/db/schema";
import type { Category, Product } from "./catalog";

/*
 * Product queries. Server-only: client components import types and pure
 * helpers from `./catalog` instead, so the DB client never reaches the browser.
 *
 * Every query is cached and tagged `products`. Code that changes products or
 * stock should call `updateTag(PRODUCTS_TAG)` afterwards.
 */

export const PRODUCTS_TAG = "products";

/** Categories shown in the home page "Jewelry & accessories" row. */
const ACCESSORY_CATEGORY_SLUGS = ["fine-jewelry", "watches", "eyewear"];

const withRelations = {
  category: true,
  stock: { orderBy: (s, { asc }) => [asc(s.position)] },
} satisfies NonNullable<Parameters<typeof db.query.products.findMany>[0]>["with"];

type ProductRow = NonNullable<
  Awaited<ReturnType<typeof db.query.products.findFirst<{ with: typeof withRelations }>>>
>;

function toProduct(row: ProductRow): Product {
  // Sized products have a row per size; one-size products have one row with size NULL.
  const sizes = row.stock.flatMap((s) =>
    s.size === null ? [] : [{ label: s.size, stock: s.quantity }],
  );
  const [primary] = row.images;

  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    category: { slug: row.category.slug, label: row.category.name },
    price: row.priceCents,
    styleCode: row.styleCode,
    color: row.color,
    description: row.description,
    details: row.details,
    image: primary?.src ?? "",
    alt: primary?.alt ?? row.name,
    gallery: row.images,
    sizes: sizes.length > 0 ? sizes : undefined,
    stock: row.stock.reduce((n, s) => n + s.quantity, 0),
    badge: row.badge ?? undefined,
  };
}

export async function getProduct(slug: string): Promise<Product | null> {
  "use cache";
  cacheTag(PRODUCTS_TAG);
  cacheLife("hours");

  const row = await db.query.products.findFirst({
    where: eq(products.slug, slug),
    with: withRelations,
  });
  return row ? toProduct(row) : null;
}

export async function getProductSlugs(): Promise<string[]> {
  "use cache";
  cacheTag(PRODUCTS_TAG);
  cacheLife("hours");

  const rows = await db.select({ slug: products.slug }).from(products);
  return rows.map((r) => r.slug);
}

export async function getCategories(): Promise<Category[]> {
  "use cache";
  cacheTag(PRODUCTS_TAG);
  cacheLife("hours");

  const rows = await db
    .select({ slug: categories.slug, label: categories.name })
    .from(categories)
    .orderBy(asc(categories.id));
  return rows;
}

/** Every product in a category, newest first. Empty for an unknown slug. */
export async function getProductsByCategory(slug: string): Promise<Product[]> {
  "use cache";
  cacheTag(PRODUCTS_TAG);
  cacheLife("hours");

  const categoryIds = db
    .select({ id: categories.id })
    .from(categories)
    .where(eq(categories.slug, slug));

  const rows = await db.query.products.findMany({
    where: inArray(products.categoryId, categoryIds),
    orderBy: [desc(products.createdAt), desc(products.id)],
    with: withRelations,
  });
  return rows.map(toProduct);
}

/** Newest products first. */
export async function getNewArrivals(limit = 8): Promise<Product[]> {
  "use cache";
  cacheTag(PRODUCTS_TAG);
  cacheLife("hours");

  const rows = await db.query.products.findMany({
    orderBy: [desc(products.createdAt), desc(products.id)],
    limit,
    with: withRelations,
  });
  return rows.map(toProduct);
}

export async function getAccessories(): Promise<Product[]> {
  "use cache";
  cacheTag(PRODUCTS_TAG);
  cacheLife("hours");

  const accessoryCategoryIds = db
    .select({ id: categories.id })
    .from(categories)
    .where(inArray(categories.slug, ACCESSORY_CATEGORY_SLUGS));

  const rows = await db.query.products.findMany({
    where: inArray(products.categoryId, accessoryCategoryIds),
    orderBy: [desc(products.createdAt), desc(products.id)],
    with: withRelations,
  });
  return rows.map(toProduct);
}

/** The given products, in the order of `ids`. Unknown ids are skipped. */
export async function getProductsByIds(ids: number[]): Promise<Product[]> {
  "use cache";
  cacheTag(PRODUCTS_TAG);
  cacheLife("hours");

  if (ids.length === 0) return [];
  const rows = await db.query.products.findMany({
    where: inArray(products.id, ids),
    with: withRelations,
  });
  const byId = new Map(rows.map((row) => [row.id, toProduct(row)]));
  return ids.flatMap((id) => byId.get(id) ?? []);
}

const SEARCH_QUERY_MAX_LENGTH = 64;
const SEARCH_MAX_TERMS = 6;

/**
 * Lowercases, collapses whitespace and caps the length of a search query.
 * Callers must pass the normalized form to `searchProducts`, so equivalent
 * queries share one cache entry.
 */
export function normalizeSearchQuery(raw: string): string {
  return raw.trim().toLowerCase().replace(/\s+/g, " ").slice(0, SEARCH_QUERY_MAX_LENGTH);
}

/**
 * Products where every word of the query appears in the name, color,
 * description, style code or category. Name matches come first, then newest.
 */
export async function searchProducts(query: string): Promise<Product[]> {
  "use cache";
  cacheTag(PRODUCTS_TAG);
  cacheLife("hours");

  const patterns = query
    .split(" ")
    .filter(Boolean)
    .slice(0, SEARCH_MAX_TERMS)
    // Drop a plural "s" so "jackets" finds "jacket"; escape LIKE wildcards.
    .map((term) => (term.length > 3 ? term.replace(/s$/, "") : term))
    .map((term) => `%${term.replace(/[\\%_]/g, "\\$&")}%`);
  if (patterns.length === 0) return [];

  const rows = await db.query.products.findMany({
    where: and(
      ...patterns.map((pattern) =>
        or(
          ilike(products.name, pattern),
          ilike(products.color, pattern),
          ilike(products.description, pattern),
          ilike(products.styleCode, pattern),
          inArray(
            products.categoryId,
            db.select({ id: categories.id }).from(categories).where(ilike(categories.name, pattern)),
          ),
        ),
      ),
    ),
    orderBy: [
      desc(
        sql.join(
          patterns.map((pattern) => sql`${products.name} ilike ${pattern}`),
          sql` and `,
        ),
      ),
      desc(products.createdAt),
      desc(products.id),
    ],
    with: withRelations,
  });
  return rows.map(toProduct);
}

/** Same category first, then the rest of the catalog, excluding the product itself. */
export async function getRelated(
  product: Pick<Product, "id" | "category">,
  limit = 4,
): Promise<Product[]> {
  "use cache";
  cacheTag(PRODUCTS_TAG);
  cacheLife("hours");

  // Plain identifiers in the subquery: the relational query builder re-aliases
  // any interpolated column to the outer "products" table.
  const sameCategory = sql`${products.categoryId} = (
    select id from categories where slug = ${product.category.slug}
  )`;

  const rows = await db.query.products.findMany({
    where: ne(products.id, product.id),
    orderBy: [desc(sameCategory), desc(products.createdAt), desc(products.id)],
    limit,
    with: withRelations,
  });
  return rows.map(toProduct);
}
