"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { getCartId, getCartLines } from "@/lib/cart-data";
import { attachStripeSession, createPendingOrder } from "@/lib/orders";
import { getCurrentUser } from "@/lib/session";
import { getStripe, isStripeConfigured, SHIPPING_COUNTRIES } from "@/lib/stripe";

/** The public site origin Stripe sends the customer back to. */
async function siteUrl(): Promise<string> {
  const configured = process.env.BETTER_AUTH_URL;
  if (configured) return configured.replace(/\/$/, "");
  const origin = (await headers()).get("origin");
  if (!origin) throw new Error("Cannot determine the site URL for checkout.");
  return origin;
}

/**
 * Turns the current bag into a pending order and sends the customer to
 * Stripe's hosted payment page. Prices and stock are read from the database
 * here, never taken from the browser. Only returns on failure; on success it
 * redirects.
 */
export async function startCheckout(): Promise<{ message: string }> {
  const cartId = await getCartId();
  const lines = cartId ? await getCartLines(cartId) : [];
  if (!cartId || lines.length === 0) {
    return { message: "Your bag is empty." };
  }
  if (lines.some((l) => l.quantity > l.available)) {
    return { message: "Some items are no longer available in the quantity selected." };
  }
  if (!isStripeConfigured()) {
    return { message: "Checkout isn't available right now. Please try again later." };
  }

  const user = await getCurrentUser();
  const orderId = await createPendingOrder({ cartId, userId: user?.id ?? null, lines });
  const base = await siteUrl();

  const session = await getStripe().checkout.sessions.create({
    mode: "payment",
    line_items: lines.map((l) => ({
      quantity: l.quantity,
      price_data: {
        currency: "usd",
        unit_amount: l.price,
        product_data: {
          name: l.name,
          description: l.size ? `${l.color}, size ${l.size}` : l.color,
          images: l.image ? [l.image] : undefined,
        },
      },
    })),
    shipping_address_collection: { allowed_countries: [...SHIPPING_COUNTRIES] },
    customer_email: user?.email,
    client_reference_id: String(orderId),
    metadata: { orderId: String(orderId) },
    // Stripe replaces {CHECKOUT_SESSION_ID} itself.
    success_url: `${base}/checkout/return?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${base}/cart`,
    expires_at: Math.floor(Date.now() / 1000) + 60 * 60,
  });

  if (!session.url) {
    return { message: "We couldn't start checkout. Please try again." };
  }
  await attachStripeSession(orderId, session.id);
  redirect(session.url);
}
