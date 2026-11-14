import type { Metadata } from "next";
import { Suspense } from "react";
import { adminDate, AdminSkeleton, cell, PageTitle, StatusPill, Table } from "@/components/admin/ui";
import { getAdminCustomers } from "@/lib/admin-data";
import { formatPrice } from "@/lib/catalog";
import { ADMIN_ROLE, requireAdmin } from "@/lib/session";

export const metadata: Metadata = { title: "Customers" };

export default function AdminCustomersPage() {
  return (
    <Suspense fallback={<AdminSkeleton />}>
      <Customers />
    </Suspense>
  );
}

async function Customers() {
  await requireAdmin();
  const customers = await getAdminCustomers();

  return (
    <>
      <PageTitle title="Customers" />
      <p className="text-muted mt-4">
        Registered accounts. Guest checkouts have no account and appear only under Orders.
      </p>
      <Table
        head={[
          { label: "Name" },
          { label: "Email" },
          { label: "Joined" },
          { label: "Orders", right: true },
          { label: "Spent", right: true },
          { label: "Role", right: true },
        ]}
      >
        {customers.map((customer) => (
          <tr key={customer.id}>
            <td className={cell}>{customer.name}</td>
            <td className={`${cell} break-all`}>{customer.email}</td>
            <td className={`${cell} text-muted whitespace-nowrap`}>{adminDate.format(customer.createdAt)}</td>
            <td className={`${cell} text-right tabular-nums`}>{customer.orders}</td>
            <td className={`${cell} text-right tabular-nums`}>{formatPrice(customer.spentCents)}</td>
            <td className={`${cell} text-right`}>
              {(customer.role ?? "").split(",").includes(ADMIN_ROLE) ? (
                <StatusPill tone="todo">Admin</StatusPill>
              ) : (
                <span className="text-eyebrow text-muted">Customer</span>
              )}
            </td>
          </tr>
        ))}
      </Table>
    </>
  );
}
