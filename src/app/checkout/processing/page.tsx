import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = { title: "Payment processing", robots: { index: false } };

/**
 * Shown after checkout when the payment method settles later. Nothing here is
 * read from the order: it is still `pending` until the webhook marks it paid.
 */
export default function CheckoutProcessingPage() {
  return (
    <main id="main" className="prose-container section flex-1">
      <p className="text-eyebrow text-muted">Order received</p>
      <h1 className="heading-headline mt-4">Your payment is processing</h1>
      <p className="text-muted mt-4">
        Your payment method can take a few days to complete. We&rsquo;ll confirm your order as soon
        as the payment arrives, and nothing more is needed from you. Please don&rsquo;t pay again:
        your bag stays as it is until the payment is confirmed.
      </p>
      <Link href="/new" className="btn btn-primary mt-10">
        Continue shopping
      </Link>
    </main>
  );
}
