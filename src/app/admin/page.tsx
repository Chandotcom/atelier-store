import Link from "next/link";
import { Suspense } from "react";
import { AdminSkeleton, OrdersTable, PageTitle } from "@/components/admin/ui";
import { getDashboardStats } from "@/lib/admin-data";
import { formatPrice } from "@/lib/catalog";
import { requireAdmin } from "@/lib/session";

export default function AdminOverviewPage() {
  return (
    <Suspense fallback={<AdminSkeleton />}>
      <Overview />
    </Suspense>
  );
}

async function Overview() {
  await requireAdmin();
  const stats = await getDashboardStats();

  const tiles = [
    { label: "Revenue", value: formatPrice(stats.revenueCents), href: "/admin/orders" },
    { label: "Paid orders", value: String(stats.orders), href: "/admin/orders" },
    { label: "To ship", value: String(stats.toShip), href: "/admin/orders?filter=to-ship" },
    { label: "Customers", value: String(stats.customers), href: "/admin/customers" },
  ];

  return (
    <>
      <PageTitle title="Overview" />

      <ul className="mt-8 grid grid-cols-2 gap-px bg-line hairline lg:grid-cols-4">
        {tiles.map((tile) => (
          <li key={tile.label} className="bg-paper">
            <Link href={tile.href} className="block p-5 transition-colors hover:bg-surface md:p-6">
              <span className="text-eyebrow text-muted">{tile.label}</span>
              <span className="heading-headline mt-3 block tabular-nums">{tile.value}</span>
            </Link>
          </li>
        ))}
      </ul>

      <div className="mt-section grid gap-12 lg:grid-cols-3">
        <section aria-label="Recent orders" className="lg:col-span-2">
          <div className="flex items-baseline justify-between gap-4">
            <h2 className="heading-title">Recent orders</h2>
            <Link href="/admin/orders" className="link text-caption">
              View all
            </Link>
          </div>
          {stats.recentOrders.length === 0 ? (
            <p className="text-muted mt-4">No orders have been paid yet.</p>
          ) : (
            <OrdersTable orders={stats.recentOrders} />
          )}
        </section>

        <section aria-label="Low stock">
          <h2 className="heading-title">Low stock</h2>
          {stats.lowStock.length === 0 ? (
            <p className="text-muted mt-4">Everything is well stocked.</p>
          ) : (
            <ul className="divider mt-8">
              {stats.lowStock.map((row) => (
                <li key={`${row.productId}-${row.size}`} className="border-b">
                  <Link
                    href={`/admin/products/${row.productId}`}
                    className="flex items-baseline justify-between gap-4 py-3 hover:bg-surface"
                  >
                    <span className="min-w-0">
                      {row.name}
                      {row.size && <span className="text-muted"> &middot; Size {row.size}</span>}
                    </span>
                    <span className={`text-eyebrow shrink-0 ${row.quantity === 0 ? "text-sale" : "text-ink"}`}>
                      {row.quantity === 0 ? "Sold out" : `${row.quantity} left`}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </>
  );
}
