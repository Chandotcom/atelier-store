"use server";

import { and, eq, sql } from "drizzle-orm";
import { refresh } from "next/cache";
import { cookies } from "next/headers";

import { db } from "@/db";
import { cartItems, carts, productStock } from "@/db/schema";
import { CART_COUNT_COOKIE, type CartActionResult } from "@/lib/cart";
import { CART_COOKIE, CART_COOKIE_MAX_AGE, getCartId, sameSize } from "@/lib/cart-data";

/*
 * Shopping bag mutations. These are public endpoints: every argument is
 * validated, and a line can only be changed through the cart cookie that
 * owns it. Stock is checked against the database, not the cached catalog.
 */

const cookieOptions = {
  path: "/",
  maxAge: CART_COOKIE_MAX_AGE,
  sameSite: "lax",
  secure: process.env.NODE_ENV === "production",
} as const;

const isId = (value: unknown): value is number =>
  typeof value === "number" && Number.isSafeInteger(value) && value > 0;

/** Recounts the bag and mirrors the total into the cookie the header reads. */
async function syncCount(cartId: string): Promise<number> {
  const [row] = await db
    .select({ count: sql<number>`coalesce(sum(${cartItems.quantity}), 0)::int` })
    .from(cartItems)
    .where(eq(cartItems.cartId, cartId));
  const count = row?.count ?? 0;

  const jar = await cookies();
  jar.set(CART_COOKIE, cartId, { ...cookieOptions, httpOnly: true });
  jar.set(CART_COUNT_COOKIE, String(count), cookieOptions);
  return count;
}

/**
 * Re-reads the bag's count from the database and resets the header cookie.
 * For when the cookie may have drifted, e.g. an order was paid in another tab.
 */
export async function refreshCartCount(): Promise<number> {
  const cartId = await getCartId();
  if (!cartId) {
    (await cookies()).set(CART_COUNT_COOKIE, "0", cookieOptions);
    return 0;
  }
  const count = await syncCount(cartId);
  refresh();
  return count;
}

async function stockFor(productId: number, size: string | null): Promise<number | null> {
  const [row] = await db
    .select({ quantity: productStock.quantity })
    .from(productStock)
    .where(and(eq(productStock.productId, productId), sameSize(productStock.size, size)));
  return row?.quantity ?? null;
}

/** Adds one piece of a product (in a size, or `null` for one-size) to the bag. */
export async function addToCart(productId: number, size: string | null): Promise<CartActionResult> {
  if (!isId(productId) || (size !== null && (typeof size !== "string" || size.length > 32))) {
    return { ok: false, message: "This item can't be added to your bag." };
  }

  const stock = await stockFor(productId, size);
  if (stock === null) return { ok: false, message: "This item is no longer available." };
  if (stock <= 0) return { ok: false, message: "Sorry, this item has just sold out." };

  const cartId = (await getCartId()) ?? crypto.randomUUID();
  // Also covers a cookie that points at a cart which no longer exists.
  await db.insert(carts).values({ id: cartId }).onConflictDoNothing();

  const [existing] = await db
    .select({ quantity: cartItems.quantity })
    .from(cartItems)
    .where(
      and(
        eq(cartItems.cartId, cartId),
        eq(cartItems.productId, productId),
        sameSize(cartItems.size, size),
      ),
    );
  if (existing && existing.quantity >= stock) {
    return {
      ok: false,
      message:
        stock === 1
          ? "The last one is already in your bag."
          : `All ${stock} available are already in your bag.`,
    };
  }

  await db
    .insert(cartItems)
    .values({ cartId, productId, size, quantity: 1 })
    .onConflictDoUpdate({
      target: [cartItems.cartId, cartItems.productId, cartItems.size],
      set: { quantity: sql`least(${cartItems.quantity} + 1, ${stock})` },
    });

  return { ok: true, count: await syncCount(cartId) };
}

/** Sets a line's quantity, capped at the stock on hand. Zero removes the line. */
export async function setCartItemQuantity(
  itemId: number,
  quantity: number,
): Promise<CartActionResult> {
  const cartId = await getCartId();
  if (!cartId || !isId(itemId) || !Number.isSafeInteger(quantity) || quantity < 0) {
    return { ok: false, message: "Your bag couldn't be updated." };
  }
  if (quantity === 0) return removeCartItem(itemId);

  const owned = and(eq(cartItems.id, itemId), eq(cartItems.cartId, cartId));
  const [line] = await db
    .select({ productId: cartItems.productId, size: cartItems.size })
    .from(cartItems)
    .where(owned);
  if (!line) {
    refresh();
    return { ok: false, message: "This item is no longer in your bag." };
  }

  const stock = (await stockFor(line.productId, line.size)) ?? 0;
  if (stock <= 0) {
    return { ok: false, message: "This item has sold out. Please remove it from your bag." };
  }

  await db
    .update(cartItems)
    .set({ quantity: Math.min(quantity, stock) })
    .where(owned);

  const count = await syncCount(cartId);
  refresh();
  if (quantity > stock) {
    return { ok: false, message: stock === 1 ? "Only 1 is available." : `Only ${stock} are available.` };
  }
  return { ok: true, count };
}

export async function removeCartItem(itemId: number): Promise<CartActionResult> {
  const cartId = await getCartId();
  if (!cartId || !isId(itemId)) {
    return { ok: false, message: "Your bag couldn't be updated." };
  }

  await db.delete(cartItems).where(and(eq(cartItems.id, itemId), eq(cartItems.cartId, cartId)));

  const count = await syncCount(cartId);
  refresh();
  return { ok: true, count };
}
