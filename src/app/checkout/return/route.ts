import { revalidateTag } from "next/cache";
import { NextResponse, type NextRequest } from "next/server";

import { CART_COUNT_COOKIE } from "@/lib/cart";
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
  try {
    const session = await getStripe().checkout.sessions.retrieve(sessionId);
    paid = await fulfillCheckoutSession(session);
  } catch (error) {
    console.error("[checkout] Could not confirm Stripe session", error);
    return to("/cart");
  }
  if (!paid) return to("/cart");

  // Stock changed, so the cached catalog is out of date.
  revalidateTag(PRODUCTS_TAG, "max");

  const response = to(`/checkout/success?session_id=${encodeURIComponent(sessionId)}`);
  // The bag was emptied; reset the count the header reads.
  response.cookies.set(CART_COUNT_COOKIE, "0", { path: "/", sameSite: "lax" });
  return response;
}
