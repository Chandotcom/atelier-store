import { desc, eq } from "drizzle-orm";

import { db } from "@/db";
import { wishlistItems } from "@/db/schema";

/*
 * Wishlist reads. Server-only and uncached: they are per customer. Client
 * components use the browser store in `./wishlist` instead.
 */

/** Product ids the customer has saved, most recently saved first. */
export async function getWishlistProductIds(userId: string): Promise<number[]> {
  const rows = await db
    .select({ productId: wishlistItems.productId })
    .from(wishlistItems)
    .where(eq(wishlistItems.userId, userId))
    .orderBy(desc(wishlistItems.createdAt));
  return rows.map((r) => r.productId);
}
