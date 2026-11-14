"use server";

import { and, eq } from "drizzle-orm";

import { db } from "@/db";
import { products, wishlistItems } from "@/db/schema";
import { getCurrentUser } from "@/lib/session";
import type { WishlistResult } from "@/lib/wishlist";

/**
 * Saves a product to, or removes it from, the signed-in customer's wishlist.
 * Takes the wanted state rather than toggling, so a repeated call is harmless.
 */
export async function setWishlisted(productId: number, saved: boolean): Promise<WishlistResult> {
  if (!Number.isSafeInteger(productId) || productId <= 0 || typeof saved !== "boolean") {
    return { ok: false, reason: "invalid" };
  }

  const user = await getCurrentUser();
  if (!user) return { ok: false, reason: "signed_out" };

  if (!saved) {
    await db
      .delete(wishlistItems)
      .where(and(eq(wishlistItems.userId, user.id), eq(wishlistItems.productId, productId)));
    return { ok: true, saved: false };
  }

  const [product] = await db.select({ id: products.id }).from(products).where(eq(products.id, productId));
  if (!product) return { ok: false, reason: "invalid" };

  await db.insert(wishlistItems).values({ userId: user.id, productId }).onConflictDoNothing();
  return { ok: true, saved: true };
}
