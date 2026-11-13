import { and, desc, eq, sql } from "drizzle-orm";
import type Stripe from "stripe";

import { db } from "@/db";
import { orderItems, orders, type ShippingAddressRow } from "@/db/schema";
import type { CartLine } from "./cart";

/*
 * Order writes and reads. Server-only, and nothing here is cached.
 *
 * An order is created `pending` just before the customer is sent to Stripe.
 * `fulfillCheckoutSession` is the only place that marks it paid; it is called
 * from both the Stripe return route and the webhook, so it must stay
 * idempotent.
 */

export function formatOrderNumber(id: number): string {
  return `AL-${String(id).padStart(6, "0")}`;
}

export async function createPendingOrder(input: {
  cartId: string;
  userId: string | null;
  lines: CartLine[];
}): Promise<number> {
  const total = input.lines.reduce((n, l) => n + l.price * l.quantity, 0);
  const [order] = await db
    .insert(orders)
    .values({ cartId: input.cartId, userId: input.userId, totalCents: total })
    .returning({ id: orders.id });

  await db.insert(orderItems).values(
    input.lines.map((l) => ({
      orderId: order.id,
      productId: l.productId,
      name: l.name,
      color: l.color,
      size: l.size,
      image: l.image,
      unitPriceCents: l.price,
      quantity: l.quantity,
    })),
  );
  return order.id;
}

export async function attachStripeSession(orderId: number, sessionId: string): Promise<void> {
  await db.update(orders).set({ stripeSessionId: sessionId }).where(eq(orders.id, orderId));
}

/**
 * Marks the session's order paid, takes its pieces out of stock and empties
 * the bag it came from. Returns false if Stripe hasn't confirmed payment.
 *
 * This is one SQL statement on purpose: the `status = 'pending'` guard makes
 * a second call (webhook and return route both arrive) a no-op, and the
 * neon-http driver has no interactive transactions to do it in steps.
 */
export async function fulfillCheckoutSession(session: Stripe.Checkout.Session): Promise<boolean> {
  if (session.payment_status !== "paid" && session.payment_status !== "no_payment_required") {
    return false;
  }

  const shipping = session.collected_information?.shipping_details;
  const address: ShippingAddressRow | null = shipping
    ? {
        name: shipping.name,
        line1: shipping.address.line1,
        line2: shipping.address.line2,
        city: shipping.address.city,
        state: shipping.address.state,
        postalCode: shipping.address.postal_code,
        country: shipping.address.country,
      }
    : null;
  const paymentIntent =
    typeof session.payment_intent === "string"
      ? session.payment_intent
      : (session.payment_intent?.id ?? null);

  await db.execute(sql`
    with paid as (
      update orders
      set status = 'paid',
          paid_at = now(),
          email = ${session.customer_details?.email ?? null},
          shipping_address = ${address ? JSON.stringify(address) : null}::jsonb,
          stripe_payment_intent_id = ${paymentIntent},
          total_cents = coalesce(${session.amount_total}, total_cents)
      where stripe_session_id = ${session.id} and status = 'pending'
      returning id, cart_id
    ),
    emptied as (
      delete from cart_items using paid where cart_items.cart_id = paid.cart_id
    )
    update product_stock ps
    set quantity = greatest(ps.quantity - oi.quantity, 0)
    from order_items oi, paid
    where oi.order_id = paid.id
      and ps.product_id = oi.product_id
      and ps.size is not distinct from oi.size
  `);
  return true;
}

/** For a Stripe payment page that expired without payment. */
export async function cancelOrderForSession(sessionId: string): Promise<void> {
  await db
    .update(orders)
    .set({ status: "cancelled" })
    .where(and(eq(orders.stripeSessionId, sessionId), eq(orders.status, "pending")));
}

/**
 * The confirmation page's lookup. The Stripe session id is long and random,
 * so holding it is what lets a guest see their own order.
 */
export async function getOrderBySessionId(sessionId: string) {
  return db.query.orders.findFirst({
    where: eq(orders.stripeSessionId, sessionId),
    with: { items: { orderBy: (i, { asc }) => [asc(i.id)] } },
  });
}

export async function getPaidOrdersForUser(userId: string) {
  return db.query.orders.findMany({
    where: and(eq(orders.userId, userId), eq(orders.status, "paid")),
    orderBy: [desc(orders.paidAt)],
    with: { items: { orderBy: (i, { asc }) => [asc(i.id)] } },
  });
}

export type OrderWithItems = NonNullable<Awaited<ReturnType<typeof getOrderBySessionId>>>;
