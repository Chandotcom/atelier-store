import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { getOrderBySessionId } from "@/lib/orders";

export const metadata: Metadata = { title: "Payment processing", robots: { index: false } };

/**
 * Where /checkout/return sends a customer whose order isn't confirmed yet:
 * either the payment method settles later, or confirming it with Stripe failed
 * (`?state=unconfirmed`). The order is `pending` until the webhook or a retry
 * of the return route marks it paid, and this page moves on once it is.
 */
export default function CheckoutProcessingPage({ searchParams }: PageProps<"/checkout/processing">) {
  return (
    <main id="main" className="prose-container section flex-1">
      {/* The order is looked up from the URL, so it streams in behind the boundary. */}
      <Suspense fallback={<div className="h-72 animate-pulse bg-surface" aria-busy="true" />}>
        <Processing searchParams={searchParams} />
      </Suspense>
    </main>
  );
}

async function Processing({ searchParams }: Pick<PageProps<"/checkout/processing">, "searchParams">) {
  const { session_id: sessionId, state } = await searchParams;
  if (typeof sessionId !== "string") redirect("/cart");

  // Read-only, like the confirmation page. An unknown session has no order to wait for.
  const order = await getOrderBySessionId(sessionId);
  if (!order) redirect("/cart");
  const id = encodeURIComponent(sessionId);
  if (order.status === "paid") redirect(`/checkout/success?session_id=${id}`);

  if (order.status === "cancelled") {
    return (
      <>
        <p className="text-eyebrow text-muted">Payment not completed</p>
        <h1 className="heading-headline mt-4">This payment didn&rsquo;t go through</h1>
        <p className="text-muted mt-4">
          You haven&rsquo;t been charged, and your bag is as you left it.
        </p>
        <Link href="/cart" className="btn btn-primary mt-10">
          Return to bag
        </Link>
      </>
    );
  }

  const unconfirmed = state === "unconfirmed";
  return (
    <>
      <p className="text-eyebrow text-muted">Order received</p>
      <h1 className="heading-headline mt-4">
        {unconfirmed ? "We’re confirming your payment" : "Your payment is processing"}
      </h1>
      <p className="text-muted mt-4">
        {unconfirmed
          ? "We couldn’t confirm your payment just now. If it went through, your order will be confirmed shortly."
          : "Your payment method can take a few days to complete. We’ll confirm your order as soon as the payment arrives."}{" "}
        Please don&rsquo;t pay again: your bag stays as it is until the payment is confirmed.
      </p>
      <div className="mt-10 flex flex-wrap gap-3">
        {/* A plain link: the return route is a handler that re-checks with Stripe. */}
        <a href={`/checkout/return?session_id=${id}`} className="btn btn-primary">
          Check again
        </a>
        <Link href="/new" className="btn btn-secondary">
          Continue shopping
        </Link>
      </div>
    </>
  );
}
