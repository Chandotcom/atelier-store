import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { AdminSkeleton, OrdersTable, PageTitle } from "@/components/admin/ui";
import { getAdminOrders, type OrderFilter } from "@/lib/admin-data";
import { requireAdmin } from "@/lib/session";

export const metadata: Metadata = { title: "Orders" };

const filters: { value: OrderFilter; label: string; empty: string }[] = [
  { value: "all", label: "All", empty: "No orders have been paid yet." },
  { value: "to-ship", label: "To ship", empty: "Nothing is waiting to be shipped." },
  { value: "shipped", label: "Shipped", empty: "No orders have been shipped yet." },
];

export default function AdminOrdersPage({ searchParams }: PageProps<"/admin/orders">) {
  return (
    <Suspense fallback={<AdminSkeleton />}>
      <Orders searchParams={searchParams} />
    </Suspense>
  );
}

async function Orders({ searchParams }: Pick<PageProps<"/admin/orders">, "searchParams">) {
  await requireAdmin();
  const { filter: raw } = await searchParams;
  const current = filters.find((f) => f.value === raw) ?? filters[0];
  const orders = await getAdminOrders(current.value);

  return (
    <>
      <PageTitle title="Orders" />
      <ul className="mt-6 flex flex-wrap gap-2">
        {filters.map((f) => (
          <li key={f.value}>
            <Link
              href={f.value === "all" ? "/admin/orders" : `/admin/orders?filter=${f.value}`}
              aria-current={f === current ? "page" : undefined}
              className={`btn btn-sm ${f === current ? "btn-primary" : "btn-secondary"}`}
            >
              {f.label}
            </Link>
          </li>
        ))}
      </ul>
      {orders.length === 0 ? (
        <p className="text-muted mt-8">{current.empty}</p>
      ) : (
        <OrdersTable orders={orders} />
      )}
    </>
  );
}
