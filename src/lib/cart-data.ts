import { and, asc, eq, sql } from "drizzle-orm";
import { cookies } from "next/headers";

import { db } from "@/db";
import { cartItems, productStock, products } from "@/db/schema";
import type { Cart, CartLine } from "./cart";

/*
 * Shopping bag reads. Server-only: client components import types and browser
 * helpers from `./cart` instead.
 *
 * Nothing here is cached. Every read depends on the visitor's cart cookie, so
 * a component that calls `getCart()` must render inside <Suspense>, and must
 * not be used on the routes that set `ensureStatic`.
 */

/** httpOnly cookie holding the visitor's cart id. */
export const CART_COOKIE = "altiere_cart";

export const CART_COOKIE_MAX_AGE = 60 * 60 * 24 * 60; // 60 days

export async function getCartId(): Promise<string | null> {
  return (await cookies()).get(CART_COOKIE)?.value ?? null;
}

/** Stock rows use NULL for one-size products, so sizes are compared null-safely. */
export function sameSize(column: typeof productStock.size | typeof cartItems.size, size: string | null) {
  return sql`${column} is not distinct from ${size}`;
}

export async function getCartLines(cartId: string): Promise<CartLine[]> {
  const rows = await db
    .select({
      id: cartItems.id,
      productId: cartItems.productId,
      size: cartItems.size,
      quantity: cartItems.quantity,
      slug: products.slug,
      name: products.name,
      color: products.color,
      price: products.priceCents,
      images: products.images,
      available: productStock.quantity,
    })
    .from(cartItems)
    .innerJoin(products, eq(products.id, cartItems.productId))
    .leftJoin(
      productStock,
      and(
        eq(productStock.productId, cartItems.productId),
        sql`${productStock.size} is not distinct from ${cartItems.size}`,
      ),
    )
    .where(eq(cartItems.cartId, cartId))
    .orderBy(asc(cartItems.createdAt), asc(cartItems.id));

  return rows.map(({ images, available, ...row }) => ({
    ...row,
    image: images[0]?.src ?? "",
    alt: images[0]?.alt ?? row.name,
    available: available ?? 0,
  }));
}

/** Total pieces in the bag, for the count the header shows. */
export async function getCartCount(cartId: string): Promise<number> {
  const [row] = await db
    .select({ count: sql<number>`coalesce(sum(${cartItems.quantity}), 0)::int` })
    .from(cartItems)
    .where(eq(cartItems.cartId, cartId));
  return row?.count ?? 0;
}

export function toCart(lines: CartLine[]): Cart {
  return {
    lines,
    count: lines.reduce((n, l) => n + l.quantity, 0),
    subtotal: lines.reduce((n, l) => n + l.quantity * l.price, 0),
  };
}

/** The current visitor's bag; empty when they have no cart cookie. */
export async function getCart(): Promise<Cart> {
  const cartId = await getCartId();
  return toCart(cartId ? await getCartLines(cartId) : []);
}
