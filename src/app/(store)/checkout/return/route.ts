import { revalidateTag } from "next/cache";
import { NextResponse, type NextRequest } from "next/server";

import { CART_COUNT_COOKIE } from "@/lib/cart";
import { CART_COOKIE, getCartCount } from "@/lib/cart-data";
import { fulfillCheckoutSession } from "@/lib/orders";
import { PRODUCTS_TAG } from "@/lib/products";
import { getStripe } from "@/lib/stripe";

/**
 * Where Stripe sends the customer after paying. Confirms the payment with
 * Stripe (the URL alone proves nothing), fulfils the order, then shows the
 * confirmation page. The webhook does the same fulfilment in case the
 * customer never makes it back here.
 */
export async function GET(request: NextRequest) {
  const sessionId = request.nextUrl.searchParams.get("session_id");
  const to = (path: string) => NextResponse.redirect(new URL(path, request.nextUrl.origin));

  if (!sessionId) return to("/cart");

  let paid = false;
  let processing = false;
  try {
    const session = await getStripe().checkout.sessions.retrieve(sessionId);
    paid = await fulfillCheckoutSession(session);
    // Delayed methods (e.g. bank debits) complete checkout before the money
    // arrives. The webhook fulfils the order once it does.
    processing = !paid && session.status === "complete";
  } catch (error) {
    // The customer may well have paid. Sending them to the bag would show the
    // paid pieces with a Checkout button, so explain and offer a retry instead.
    console.error("[checkout] Could not confirm Stripe session", error);
    return to(`/checkout/processing?session_id=${encodeURIComponent(sessionId)}&state=unconfirmed`);
  }
  // The session id goes along so the page can show the order once it is paid.
  if (processing) return to(`/checkout/processing?session_id=${encodeURIComponent(sessionId)}`);
  if (!paid) return to("/cart");

  // Stock changed, so the cached catalog is out of date. Expire it at once
  // rather than serving one more stale page; updateTag isn't available here.
  revalidateTag(PRODUCTS_TAG, { expire: 0 });

  const response = to(`/checkout/success?session_id=${encodeURIComponent(sessionId)}`);
  // What was bought has left the bag, but pieces added after checkout started
  // are still in it, so recount for the header instead of assuming zero.
  const cartId = request.cookies.get(CART_COOKIE)?.value;
  const count = cartId ? await getCartCount(cartId) : 0;
  response.cookies.set(CART_COUNT_COOKIE, String(count), { path: "/", sameSite: "lax" });
  return response;
}
