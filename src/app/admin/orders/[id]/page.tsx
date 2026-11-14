import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { ShipOrderForm } from "@/components/admin/ship-order-form";
import { adminDate, AdminSkeleton, StatusPill } from "@/components/admin/ui";
import { OrderItems } from "@/components/order-items";
import { getAdminOrder } from "@/lib/admin-data";
import { addressLines, formatOrderNumber } from "@/lib/orders";
import { requireAdmin } from "@/lib/session";

export const metadata: Metadata = { title: "Order" };

export default function AdminOrderPage({ params }: PageProps<"/admin/orders/[id]">) {
  return (
    <Suspense fallback={<AdminSkeleton />}>
      <Order params={params} />
    </Suspense>
  );
}

async function Order({ params }: Pick<PageProps<"/admin/orders/[id]">, "params">) {
  await requireAdmin();
  const id = Number((await params).id);
  if (!Number.isSafeInteger(id) || id <= 0) notFound();
  const order = await getAdminOrder(id);
  if (!order) notFound();

  const address = addressLines(order.shippingAddress);
  const facts: [string, React.ReactNode][] = [
    ["Customer", order.email ?? "—"],
    ["Account", order.userId ? "Registered customer" : "Guest checkout"],
    ["Paid", order.paidAt ? adminDate.format(order.paidAt) : "—"],
    ["Payment reference", order.stripePaymentIntentId ?? "—"],
  ];

  return (
    <>
      <Link href="/admin/orders" className="link text-caption text-muted">
        &larr; All orders
      </Link>
      <div className="mt-4 flex flex-wrap items-baseline justify-between gap-4">
        <h1 className="heading-headline">Order {formatOrderNumber(order.id)}</h1>
        {order.shippedAt ? <StatusPill tone="done">Shipped</StatusPill> : <StatusPill tone="todo">To ship</StatusPill>}
      </div>

      <div className="mt-10 grid gap-12 lg:grid-cols-5">
        <section aria-label="Items ordered" className="lg:col-span-3">
          <OrderItems order={order} />
        </section>

        <div className="space-y-10 lg:col-span-2">
          <section aria-label="Shipping">
            <h2 className="text-label">Shipping</h2>
            {order.shippedAt ? (
              <dl className="divider mt-4">
                <Row label="Shipped">{adminDate.format(order.shippedAt)}</Row>
                <Row label="Tracking number">{order.trackingNumber ?? "None given"}</Row>
              </dl>
            ) : (
              <ShipOrderForm orderId={order.id} hasEmail={Boolean(order.email)} />
            )}
          </section>

          <section aria-label="Delivery address">
            <h2 className="text-label">Delivering to</h2>
            <address className="text-muted mt-4 not-italic">
              {address.length === 0
                ? "No address was collected."
                : address.map((line, i) => (
                    // Lines can repeat (same text in two fields), so key by position.
                    <span key={i} className="block">
                      {line}
                    </span>
                  ))}
            </address>
          </section>

          <section aria-label="Order details">
            <h2 className="text-label">Details</h2>
            <dl className="divider mt-4">
              {facts.map(([label, value]) => (
                <Row key={label} label={label}>
                  {value}
                </Row>
              ))}
            </dl>
          </section>
        </div>
      </div>
    </>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-baseline justify-between gap-6 border-b py-3">
      <dt className="text-muted shrink-0">{label}</dt>
      <dd className="min-w-0 text-right break-all">{children}</dd>
    </div>
  );
}
