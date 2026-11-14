import Link from "next/link";
import { Suspense, type ComponentType, type SVGProps } from "react";
import { AdminSkeleton, Badge, EmptyState, OrdersTable, PageHeader } from "@/components/admin/ui";
import { AlertIcon, ArrowRightIcon, BoxIcon, CoinsIcon, TruckIcon, UsersIcon } from "@/components/icons";
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

type Tile = {
  label: string;
  value: string;
  hint: string;
  href: string;
  icon: ComponentType<SVGProps<SVGSVGElement>>;
};

async function Overview() {
  const user = await requireAdmin();
  const stats = await getDashboardStats();

  const tiles: Tile[] = [
    { label: "Revenue", value: formatPrice(stats.revenueCents), hint: "From paid orders", href: "/admin/orders", icon: CoinsIcon },
    { label: "Paid orders", value: String(stats.orders), hint: "All time", href: "/admin/orders", icon: BoxIcon },
    {
      label: "To ship",
      value: String(stats.toShip),
      hint: stats.toShip === 0 ? "Nothing waiting" : "Waiting to be sent",
      href: "/admin/orders?filter=to-ship",
      icon: TruckIcon,
    },
    { label: "Customers", value: String(stats.customers), hint: "Registered accounts", href: "/admin/customers", icon: UsersIcon },
  ];

  return (
    <>
      <PageHeader title="Overview" description={`Welcome back, ${user.name.split(" ")[0]}. Here is how the store is doing.`} />

      <ul className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {tiles.map((tile) => (
          <li key={tile.label}>
            <Link href={tile.href} className="admin-card block p-5 transition-colors hover:border-subtle">
              <span className="flex items-center justify-between gap-3 text-[0.8125rem] font-medium text-muted">
                {tile.label}
                <tile.icon className="size-4" strokeWidth={1.5} />
              </span>
              <span className="mt-3 block text-[1.75rem] leading-none font-semibold tracking-tight tabular-nums">
                {tile.value}
              </span>
              <span className="mt-2 block text-[0.8125rem] text-muted">{tile.hint}</span>
            </Link>
          </li>
        ))}
      </ul>

      <div className="mt-10 grid gap-10 xl:grid-cols-3">
        <section aria-label="Recent orders" className="min-w-0 xl:col-span-2">
          <div className="flex items-center justify-between gap-4">
            <h2 className="admin-heading">Recent orders</h2>
            <Link href="/admin/orders" className="inline-flex items-center gap-1.5 text-[0.8125rem] text-muted hover:text-ink">
              View all
              <ArrowRightIcon className="size-3.5" strokeWidth={1.5} />
            </Link>
          </div>
          {stats.recentOrders.length === 0 ? (
            <EmptyState icon={BoxIcon} title="No orders yet" hint="Paid orders will appear here." />
          ) : (
            <OrdersTable orders={stats.recentOrders} />
          )}
        </section>

        <section aria-label="Low stock" className="min-w-0">
          <div className="flex items-center justify-between gap-4">
            <h2 className="admin-heading">Low stock</h2>
            <Link
              href="/admin/products?stock=low_stock"
              className="inline-flex items-center gap-1.5 text-[0.8125rem] text-muted hover:text-ink"
            >
              View products
              <ArrowRightIcon className="size-3.5" strokeWidth={1.5} />
            </Link>
          </div>
          {stats.lowStock.length === 0 ? (
            <EmptyState icon={AlertIcon} title="Everything is well stocked" />
          ) : (
            <ul className="admin-card mt-4 divide-y">
              {/* The most urgent few; "View products" lists the rest. */}
              {stats.lowStock.slice(0, 6).map((row) => (
                <li key={`${row.productId}-${row.size}`}>
                  <Link
                    href={`/admin/products/${row.productId}`}
                    className="flex items-center justify-between gap-4 px-4 py-3 hover:bg-surface/60"
                  >
                    <span className="min-w-0">
                      <span className="block truncate text-[0.875rem] font-medium">{row.name}</span>
                      <span className="block text-[0.8125rem] text-muted">{row.size ? `Size ${row.size}` : "One size"}</span>
                    </span>
                    <Badge tone={row.quantity === 0 ? "danger" : "neutral"}>
                      {row.quantity === 0 ? "Sold out" : `${row.quantity} left`}
                    </Badge>
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
