import { revalidateTag } from "next/cache";

import { cancelOrderForSession, fulfillCheckoutSession } from "@/lib/orders";
import { PRODUCTS_TAG } from "@/lib/products";
import { getStripe } from "@/lib/stripe";

/**
 * Stripe webhook. Fulfils orders even if the customer closes the tab before
 * returning to the site, and cancels orders whose payment page expired.
 * Requests are trusted only if their signature matches STRIPE_WEBHOOK_SECRET.
 */
export async function POST(request: Request) {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  const signature = request.headers.get("stripe-signature");
  if (!secret) return new Response("Webhook secret is not configured.", { status: 500 });
  if (!signature) return new Response("Missing signature.", { status: 400 });

  let event;
  try {
    // Signature verification needs the exact bytes Stripe sent.
    event = await getStripe().webhooks.constructEventAsync(await request.text(), signature, secret);
  } catch {
    return new Response("Invalid signature.", { status: 400 });
  }

  switch (event.type) {
    case "checkout.session.completed":
    case "checkout.session.async_payment_succeeded":
      if (await fulfillCheckoutSession(event.data.object)) {
        // Stock must not be served stale, and updateTag isn't available here.
        revalidateTag(PRODUCTS_TAG, { expire: 0 });
      }
      break;
    case "checkout.session.expired":
    case "checkout.session.async_payment_failed":
      await cancelOrderForSession(event.data.object.id);
      break;
  }

  return new Response(null, { status: 200 });
}
