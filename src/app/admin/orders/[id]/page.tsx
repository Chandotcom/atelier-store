import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense, type ReactNode } from "react";
import { Section } from "@/components/admin/fields";
import { ShipOrderForm } from "@/components/admin/ship-order-form";
import { adminDate, AdminSkeleton, PageHeader, ShippedBadge } from "@/components/admin/ui";
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

  return (
    <>
      <PageHeader
        title={`Order ${formatOrderNumber(order.id)}`}
        back={{ href: "/admin/orders", label: "Orders" }}
        actions={<ShippedBadge shipped={Boolean(order.shippedAt)} />}
      />

      <div className="mt-6 grid items-start gap-4 lg:grid-cols-5">
        <div className="lg:col-span-3">
          <Section title="Items">
            <OrderItems order={order} />
          </Section>
        </div>

        <div className="space-y-4 lg:col-span-2">
          <Section
            title="Shipping"
            description={order.shippedAt ? undefined : "Mark the order as shipped once it has left."}
          >
            {order.shippedAt ? (
              <dl className="-my-2">
                <Row label="Shipped">{adminDate.format(order.shippedAt)}</Row>
                <Row label="Tracking number">{order.trackingNumber ?? "None given"}</Row>
              </dl>
            ) : (
              <ShipOrderForm orderId={order.id} hasEmail={Boolean(order.email)} />
            )}
          </Section>

          <Section title="Delivery address">
            <address className="text-muted not-italic">
              {address.length === 0
                ? "No address was collected."
                : address.map((line, i) => (
                    // Lines can repeat (same text in two fields), so key by position.
                    <span key={i} className="block">
                      {line}
                    </span>
                  ))}
            </address>
          </Section>

          <Section title="Details">
            <dl className="-my-2">
              <Row label="Customer">{order.email ?? "—"}</Row>
              <Row label="Account">{order.userId ? "Registered customer" : "Guest checkout"}</Row>
              <Row label="Paid">{order.paidAt ? adminDate.format(order.paidAt) : "—"}</Row>
              <Row label="Payment reference">{order.stripePaymentIntentId ?? "—"}</Row>
            </dl>
          </Section>
        </div>
      </div>
    </>
  );
}

function Row({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex items-baseline justify-between gap-6 border-b py-2.5 last:border-b-0">
      <dt className="shrink-0 text-muted">{label}</dt>
      <dd className="min-w-0 text-right break-all">{children}</dd>
    </div>
  );
}
