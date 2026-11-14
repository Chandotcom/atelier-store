import Link from "next/link";
import type { ReactNode } from "react";
import { formatPrice } from "@/lib/catalog";
import type { getAdminOrders } from "@/lib/admin-data";
import { formatOrderNumber } from "@/lib/orders";

/* Small server-rendered pieces shared by the admin pages. */

export const adminDate = new Intl.DateTimeFormat("en", { dateStyle: "medium" });

/** Shown while a page's data streams in behind its <Suspense> boundary. */
export function AdminSkeleton() {
  return <div className="h-96 animate-pulse bg-surface" aria-busy="true" aria-label="Loading" />;
}

export function PageTitle({ title, action }: { title: string; action?: ReactNode }) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-4">
      <h1 className="heading-headline">{title}</h1>
      {action}
    </div>
  );
}

export function StatusPill({ tone, children }: { tone: "done" | "todo" | "warn"; children: ReactNode }) {
  const color = { done: "text-success", todo: "text-ink", warn: "text-sale" }[tone];
  return <span className={`text-eyebrow whitespace-nowrap ${color}`}>{children}</span>;
}

/** Horizontally scrollable on small screens, so wide tables never squash. */
export function Table({ head, children }: { head: { label: string; right?: boolean }[]; children: ReactNode }) {
  return (
    <div className="mt-8 overflow-x-auto">
      <table className="w-full min-w-[40rem] border-collapse text-left">
        <thead>
          <tr className="border-b">
            {head.map((h) => (
              <th
                key={h.label}
                scope="col"
                className={`text-eyebrow text-muted py-3 pr-6 font-medium last:pr-0 ${h.right ? "text-right" : ""}`}
              >
                {h.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>{children}</tbody>
      </table>
    </div>
  );
}

export const cell = "border-b py-4 pr-6 align-middle last:pr-0";

type OrderRow = Awaited<ReturnType<typeof getAdminOrders>>[number];

export function OrdersTable({ orders }: { orders: OrderRow[] }) {
  return (
    <Table
      head={[
        { label: "Order" },
        { label: "Date" },
        { label: "Customer" },
        { label: "Items", right: true },
        { label: "Total", right: true },
        { label: "Status", right: true },
      ]}
    >
      {orders.map((order) => (
        <tr key={order.id}>
          <td className={cell}>
            <Link href={`/admin/orders/${order.id}`} className="link whitespace-nowrap">
              {formatOrderNumber(order.id)}
            </Link>
          </td>
          <td className={`${cell} text-muted whitespace-nowrap`}>
            {order.paidAt ? adminDate.format(order.paidAt) : "—"}
          </td>
          <td className={`${cell} break-all`}>{order.email ?? "—"}</td>
          <td className={`${cell} text-right tabular-nums`}>
            {order.items.reduce((n, i) => n + i.quantity, 0)}
          </td>
          <td className={`${cell} text-right tabular-nums`}>{formatPrice(order.totalCents)}</td>
          <td className={`${cell} text-right`}>
            {order.shippedAt ? <StatusPill tone="done">Shipped</StatusPill> : <StatusPill tone="todo">To ship</StatusPill>}
          </td>
        </tr>
      ))}
    </Table>
  );
}
