import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { OrderItems } from "@/components/order-items";
import { formatOrderNumber, getOrderBySessionId } from "@/lib/orders";

export const metadata: Metadata = { title: "Checkout confirmation", robots: { index: false } };

export default function CheckoutSuccessPage({ searchParams }: PageProps<"/checkout/success">) {
  return (
    <main id="main" className="prose-container section flex-1">
      {/* The order is looked up from the URL, so it streams in behind the boundary. */}
      <Suspense fallback={<div className="h-96 animate-pulse bg-surface" aria-busy="true" />}>
        <Confirmation searchParams={searchParams} />
      </Suspense>
    </main>
  );
}

async function Confirmation({ searchParams }: Pick<PageProps<"/checkout/success">, "searchParams">) {
  const { session_id: sessionId } = await searchParams;
  if (typeof sessionId !== "string") notFound();

  // Read-only: delayed payments remain pending until the webhook confirms them.
  const order = await getOrderBySessionId(sessionId);
  if (!order || (order.status !== "paid" && order.status !== "pending")) notFound();
  const processing = order.status === "pending";

  const address = order.shippingAddress;
  const cityLine = [address?.city, address?.state, address?.postalCode].filter(Boolean).join(", ");

  return (
    <>
      <p className="text-eyebrow text-muted">Order {formatOrderNumber(order.id)}</p>
      <h1 className="heading-headline mt-4">
        {processing ? "Your payment is processing" : "Thank you for your order"}
      </h1>
      <p className="text-muted mt-4">
        {processing
          ? "We’re waiting for your payment to clear. Your order will be confirmed once payment is received."
          : "Your payment was received"}
        {!processing && order.email && (
          <>
            {" "}
            and a receipt will be sent to <span className="text-ink">{order.email}</span>
          </>
        )}
        {!processing && "."}
      </p>

      <section aria-label="Items ordered" className="mt-10">
        <OrderItems order={order} />
      </section>

      {!processing && address && (
        <section aria-label="Delivery address" className="mt-10">
          <h2 className="text-label font-sans">Delivering to</h2>
          <address className="text-muted mt-3 not-italic">
            {Object.entries({
              name: address.name,
              line1: address.line1,
              line2: address.line2,
              city: cityLine,
              country: address.country,
            })
              .filter(([, value]) => Boolean(value))
              .map(([field, line]) => (
                <span key={field} className="block">
                  {line}
                </span>
              ))}
          </address>
        </section>
      )}

      <Link href="/new" className="btn btn-primary mt-10">
        Continue shopping
      </Link>
    </>
  );
}
