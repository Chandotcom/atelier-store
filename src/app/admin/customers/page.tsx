import type { Metadata } from "next";
import { Suspense } from "react";
import { RoleControl } from "@/components/admin/role-control";
import { FilterSelect, SearchInput } from "@/components/admin/toolbar";
import { adminDate, AdminSkeleton, Badge, cell, EmptyState, PageHeader, Table, Toolbar } from "@/components/admin/ui";
import { UsersIcon } from "@/components/icons";
import { getAdminCustomers } from "@/lib/admin-data";
import { formatPrice } from "@/lib/catalog";
import { ADMIN_ROLE, requireAdmin } from "@/lib/session";

export const metadata: Metadata = { title: "Customers" };

export default function AdminCustomersPage({ searchParams }: PageProps<"/admin/customers">) {
  return (
    <Suspense fallback={<AdminSkeleton />}>
      <Customers searchParams={searchParams} />
    </Suspense>
  );
}

async function Customers({ searchParams }: Pick<PageProps<"/admin/customers">, "searchParams">) {
  const me = await requireAdmin();
  const params = await searchParams;
  const q = typeof params.q === "string" ? params.q : undefined;
  const role = params.role === "admin" || params.role === "customer" ? params.role : undefined;
  const customers = await getAdminCustomers({ q, role });

  return (
    <>
      <PageHeader
        title="Customers"
        description="Registered accounts. Guest checkouts have no account and appear only under Orders."
      />
      <Toolbar>
        <SearchInput placeholder="Search by name or email…" />
        <FilterSelect
          param="role"
          label="Role"
          options={[
            { value: "", label: "All roles" },
            { value: "customer", label: "Customers" },
            { value: "admin", label: "Admins" },
          ]}
        />
      </Toolbar>

      {customers.length === 0 ? (
        <EmptyState icon={UsersIcon} title="No accounts match these filters" hint="Try a different search or role." />
      ) : (
        <Table
          head={[
            { label: "Customer" },
            { label: "Role" },
            { label: "Orders", right: true },
            { label: "Spent", right: true },
            { label: "Joined", right: true },
            { label: "Access", right: true },
          ]}
        >
          {customers.map((customer) => {
            const isAdmin = (customer.role ?? "").split(",").includes(ADMIN_ROLE);
            return (
              <tr key={customer.id} className="hover:bg-surface/60">
                <td className={cell}>
                  <span className="flex items-center gap-3">
                    <span
                      aria-hidden="true"
                      className="flex size-8 shrink-0 items-center justify-center rounded-full bg-surface-strong text-[0.8125rem] font-medium"
                    >
                      {customer.name.trim().charAt(0).toUpperCase() || "?"}
                    </span>
                    <span className="min-w-0">
                      <span className="block truncate font-medium">{customer.name}</span>
                      <span className="block text-[0.8125rem] break-all text-muted">{customer.email}</span>
                    </span>
                  </span>
                </td>
                <td className={cell}>
                  {isAdmin ? <Badge tone="success">Admin</Badge> : <Badge tone="neutral">Customer</Badge>}
                </td>
                <td className={`${cell} text-right tabular-nums`}>{customer.orders}</td>
                <td className={`${cell} text-right tabular-nums`}>{formatPrice(customer.spentCents)}</td>
                <td className={`${cell} text-right whitespace-nowrap text-muted`}>
                  {adminDate.format(customer.createdAt)}
                </td>
                <td className={`${cell} text-right`}>
                  {customer.id === me.id ? (
                    // Your own role can't be changed here, so there is always an admin left.
                    <span className="text-[0.8125rem] text-muted">You</span>
                  ) : (
                    <RoleControl userId={customer.id} name={customer.name} isAdmin={isAdmin} />
                  )}
                </td>
              </tr>
            );
          })}
        </Table>
      )}
    </>
  );
}
