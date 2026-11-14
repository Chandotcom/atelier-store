import { and, desc, eq, sql } from "drizzle-orm";
import type Stripe from "stripe";

import { db } from "@/db";
import { orderItems, orders, type ShippingAddressRow } from "@/db/schema";
import type { CartLine } from "./cart";
import { orderConfirmationEmail, sendEmail } from "./email";

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
 * Marks the session's order paid, takes its pieces out of stock and removes
 * them from the bag it came from. Anything added to the bag after checkout
 * started stays there. The call that marks the order paid also emails the
 * confirmation. Returns false if Stripe hasn't confirmed payment.
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

  const result = await db.execute<{ id: number }>(sql`
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
    bought as (
      select paid.cart_id, oi.product_id, oi.size, sum(oi.quantity)::int as quantity
      from order_items oi
      join paid on oi.order_id = paid.id
      group by paid.cart_id, oi.product_id, oi.size
    ),
    -- Only what was bought leaves the bag: the customer may have added pieces
    -- or raised a quantity in another tab while the payment page was open.
    emptied as (
      delete from cart_items ci
      using bought b
      where ci.cart_id = b.cart_id
        and ci.product_id = b.product_id
        and ci.size is not distinct from b.size
        and ci.quantity <= b.quantity
    ),
    reduced as (
      update cart_items ci
      set quantity = ci.quantity - b.quantity
      from bought b
      where ci.cart_id = b.cart_id
        and ci.product_id = b.product_id
        and ci.size is not distinct from b.size
        and ci.quantity > b.quantity
    ),
    stock as (
      update product_stock ps
      set quantity = greatest(ps.quantity - b.quantity, 0)
      from bought b
      where ps.product_id = b.product_id
        and ps.size is not distinct from b.size
    )
    -- A row comes back only from the call that flipped the order to paid.
    select id from paid
  `);

  // Only the call that marked the order paid sends the confirmation, so the
  // webhook and the return route can't both email the customer.
  if (result.rows.length > 0) await sendOrderConfirmation(session.id);
  return true;
}

/** Never throws: a failed email must not undo or block a paid order. */
async function sendOrderConfirmation(sessionId: string): Promise<void> {
  try {
    const order = await getOrderBySessionId(sessionId);
    if (!order?.email) return;

    const address = order.shippingAddress;
    await sendEmail({
      ...orderConfirmationEmail({
        to: order.email,
        orderNumber: formatOrderNumber(order.id),
        items: order.items,
        totalCents: order.totalCents,
        address: [
          address?.name,
          address?.line1,
          address?.line2,
          [address?.city, address?.state, address?.postalCode].filter(Boolean).join(", "),
          address?.country,
        ].filter((line): line is string => Boolean(line)),
      }),
      idempotencyKey: `order-confirmation/${order.id}`,
    });
  } catch (error) {
    console.error("[orders] Could not send the order confirmation email", error);
  }
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
