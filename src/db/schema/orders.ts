import { relations } from "drizzle-orm";
import { index, integer, jsonb, pgTable, text, timestamp } from "drizzle-orm/pg-core";

import { user } from "./auth";
import { products } from "./catalog";

export type ShippingAddressRow = {
  name: string | null;
  line1: string | null;
  line2: string | null;
  city: string | null;
  state: string | null;
  postalCode: string | null;
  country: string | null;
};

/**
 * An order starts `pending` when the customer is sent to Stripe, becomes
 * `paid` once Stripe confirms payment, or `cancelled` if the payment page
 * expires. Email, address and payment ids are filled in when it is paid.
 */
export const orders = pgTable(
  "orders",
  {
    id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
    status: text("status", { enum: ["pending", "paid", "cancelled"] })
      .notNull()
      .default("pending"),
    /** NULL for guest orders. */
    userId: text("user_id").references(() => user.id, { onDelete: "set null" }),
    /** The bag to empty once the order is paid. Not a foreign key: bags are disposable. */
    cartId: text("cart_id"),
    email: text("email"),
    /** Amount in minor units (cents); replaced by the amount Stripe charged once paid. */
    totalCents: integer("total_cents").notNull(),
    stripeSessionId: text("stripe_session_id").unique(),
    stripePaymentIntentId: text("stripe_payment_intent_id"),
    shippingAddress: jsonb("shipping_address").$type<ShippingAddressRow>(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    paidAt: timestamp("paid_at", { withTimezone: true }),
  },
  (t) => [index("orders_user_id_idx").on(t.userId)],
);

/** A snapshot of each line at purchase time, so later catalog edits don't change past orders. */
export const orderItems = pgTable(
  "order_items",
  {
    id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
    orderId: integer("order_id")
      .notNull()
      .references(() => orders.id, { onDelete: "cascade" }),
    productId: integer("product_id").references(() => products.id, { onDelete: "set null" }),
    name: text("name").notNull(),
    color: text("color").notNull(),
    /** NULL for one-size products, matching `product_stock`. */
    size: text("size"),
    image: text("image").notNull(),
    unitPriceCents: integer("unit_price_cents").notNull(),
    quantity: integer("quantity").notNull(),
  },
  (t) => [index("order_items_order_id_idx").on(t.orderId)],
);

export const ordersRelations = relations(orders, ({ many }) => ({
  items: many(orderItems),
}));

export const orderItemsRelations = relations(orderItems, ({ one }) => ({
  order: one(orders, { fields: [orderItems.orderId], references: [orders.id] }),
}));
