import type { Metadata } from "next";
import { Suspense } from "react";
import { FilterTabs, SearchInput } from "@/components/admin/toolbar";
import { AdminSkeleton, EmptyState, OrdersTable, PageHeader, Toolbar } from "@/components/admin/ui";
import { BoxIcon } from "@/components/icons";
import { getAdminOrders, type OrderFilter } from "@/lib/admin-data";
import { requireAdmin } from "@/lib/session";

export const metadata: Metadata = { title: "Orders" };

const filters: { value: OrderFilter; label: string }[] = [
  { value: "all", label: "All" },
  { value: "to-ship", label: "To ship" },
  { value: "shipped", label: "Shipped" },
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
  const params = await searchParams;
  const filter = filters.find((f) => f.value === params.filter)?.value ?? "all";
  const q = typeof params.q === "string" ? params.q : undefined;
  const orders = await getAdminOrders({ filter, q });

  return (
    <>
      <PageHeader title="Orders" description="Paid orders, newest first. Open one to see its items and mark it as shipped." />
      <FilterTabs
        param="filter"
        label="Shipping status"
        // "all" is the default view, so it clears the parameter.
        options={filters.map((f) => ({ value: f.value === "all" ? "" : f.value, label: f.label }))}
      />
      <Toolbar>
        <SearchInput placeholder="Search by order number or customer email…" />
      </Toolbar>
      {orders.length === 0 ? (
        <EmptyState
          icon={BoxIcon}
          title={q ? "No orders match your search" : "No orders here yet"}
          hint={q ? "Try a different order number or email." : undefined}
        />
      ) : (
        <OrdersTable orders={orders} />
      )}
    </>
  );
}
