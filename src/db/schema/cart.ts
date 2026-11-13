import { relations, sql } from "drizzle-orm";
import { check, integer, pgTable, text, timestamp, unique } from "drizzle-orm/pg-core";

import { products } from "./catalog";

/**
 * A shopping bag. The id is a random token held in the visitor's httpOnly
 * cart cookie, so a bag belongs to a browser, not (yet) to an account.
 */
export const carts = pgTable("carts", {
  id: text("id").primaryKey(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

/**
 * One line per product and size. `size` is NULL for one-size products,
 * matching `product_stock`. Adding to the bag does not reserve stock.
 */
export const cartItems = pgTable(
  "cart_items",
  {
    id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
    cartId: text("cart_id")
      .notNull()
      .references(() => carts.id, { onDelete: "cascade" }),
    productId: integer("product_id")
      .notNull()
      .references(() => products.id, { onDelete: "cascade" }),
    size: text("size"),
    quantity: integer("quantity").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    unique("cart_items_cart_product_size_unique")
      .on(t.cartId, t.productId, t.size)
      .nullsNotDistinct(),
    check("cart_items_quantity_positive", sql`${t.quantity} > 0`),
  ],
);

export const cartsRelations = relations(carts, ({ many }) => ({
  items: many(cartItems),
}));

export const cartItemsRelations = relations(cartItems, ({ one }) => ({
  cart: one(carts, { fields: [cartItems.cartId], references: [carts.id] }),
  product: one(products, { fields: [cartItems.productId], references: [products.id] }),
}));
