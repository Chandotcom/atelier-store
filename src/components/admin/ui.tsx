import Link from "next/link";
import type { ComponentType, ReactNode, SVGProps } from "react";
import { ArrowLeftIcon, BoxIcon } from "@/components/icons";
import type { getAdminOrders } from "@/lib/admin-data";
import { formatPrice } from "@/lib/catalog";
import { formatOrderNumber } from "@/lib/orders";
import { RowMenu } from "./row-menu";

/* Server-rendered pieces shared by the admin pages. */

type IconType = ComponentType<SVGProps<SVGSVGElement>>;

export const adminDate = new Intl.DateTimeFormat("en", { dateStyle: "medium" });

/** Shown while a page's data streams in behind its <Suspense> boundary. */
export function AdminSkeleton() {
  return (
    <div aria-busy="true" aria-label="Loading" className="space-y-4">
      <div className="h-8 w-48 animate-pulse rounded-[0.5rem] bg-surface" />
      <div className="h-10 animate-pulse rounded-[0.5rem] bg-surface" />
      <div className="h-72 animate-pulse rounded-[0.75rem] bg-surface" />
    </div>
  );
}

export function PageHeader({
  title,
  description,
  back,
  actions,
}: {
  title: string;
  description?: ReactNode;
  /** A "back to list" link above the title, for detail pages. */
  back?: { href: string; label: string };
  actions?: ReactNode;
}) {
  return (
    <div>
      {back && (
        <Link href={back.href} className="mb-3 inline-flex items-center gap-1.5 text-[0.8125rem] text-muted hover:text-ink">
          <ArrowLeftIcon className="size-3.5" strokeWidth={1.5} />
          {back.label}
        </Link>
      )}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="admin-title min-w-0">{title}</h1>
        {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
      </div>
      {description && <p className="mt-1.5 max-w-2xl text-muted">{description}</p>}
    </div>
  );
}

/** A row of controls above a table: tabs, search, filters. */
export function Toolbar({ children }: { children: ReactNode }) {
  return <div className="mt-6 flex flex-wrap items-center gap-2">{children}</div>;
}

export function Badge({ tone, children }: { tone: "success" | "danger" | "neutral"; children: ReactNode }) {
  const color = {
    success: "bg-success/10 text-success",
    danger: "bg-sale/10 text-sale",
    neutral: "bg-surface-strong text-ink",
  }[tone];
  return (
    <span className={`inline-flex h-6 items-center rounded-[0.375rem] px-2 text-[0.75rem] font-medium whitespace-nowrap ${color}`}>
      {children}
    </span>
  );
}

/** The small bordered square that starts a row, holding an icon. */
export function IconTile({ icon: Icon }: { icon: IconType }) {
  return (
    <span className="flex size-8 shrink-0 items-center justify-center rounded-[0.5rem] border bg-surface text-muted">
      <Icon className="size-4" strokeWidth={1.5} />
    </span>
  );
}

export function EmptyState({ icon, title, hint }: { icon: IconType; title: string; hint?: string }) {
  return (
    <div className="admin-card mt-4 flex flex-col items-center px-6 py-14 text-center">
      <IconTile icon={icon} />
      <p className="admin-heading mt-4">{title}</p>
      {hint && <p className="mt-1 text-muted">{hint}</p>}
    </div>
  );
}

/**
 * A table with a filled, rounded header row and hairline dividers between
 * rows. Scrolls sideways on small screens rather than squashing columns.
 */
export function Table({
  head,
  children,
}: {
  head: { label: string; right?: boolean; hidden?: boolean }[];
  children: ReactNode;
}) {
  return (
    <div className="mt-4 overflow-x-auto">
      <table className="w-full min-w-[44rem] border-separate border-spacing-0 text-left">
        <thead>
          <tr>
            {head.map((h) => (
              <th
                key={h.label}
                scope="col"
                className={`h-9 bg-surface px-3 text-[0.8125rem] font-medium text-muted first:rounded-l-[0.5rem] last:rounded-r-[0.5rem] ${
                  h.right ? "text-right" : ""
                }`}
              >
                {h.hidden ? <span className="sr-only">{h.label}</span> : h.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>{children}</tbody>
      </table>
    </div>
  );
}

export const cell = "border-b px-3 py-3 align-middle";

type OrderRow = Awaited<ReturnType<typeof getAdminOrders>>[number];

export function ShippedBadge({ shipped }: { shipped: boolean }) {
  return shipped ? <Badge tone="success">Shipped</Badge> : <Badge tone="neutral">To ship</Badge>;
}

export function OrdersTable({ orders }: { orders: OrderRow[] }) {
  return (
    <Table
      head={[
        { label: "Order" },
        { label: "Customer" },
        { label: "Status" },
        { label: "Items", right: true },
        { label: "Total", right: true },
        { label: "Paid", right: true },
        { label: "Actions", hidden: true },
      ]}
    >
      {orders.map((order) => (
        <tr key={order.id} className="hover:bg-surface/60">
          <td className={cell}>
            <Link href={`/admin/orders/${order.id}`} className="flex items-center gap-3 font-medium whitespace-nowrap">
              <IconTile icon={BoxIcon} />
              {formatOrderNumber(order.id)}
            </Link>
          </td>
          <td className={`${cell} break-all`}>{order.email ?? "—"}</td>
          <td className={cell}>
            <ShippedBadge shipped={Boolean(order.shippedAt)} />
          </td>
          <td className={`${cell} text-right tabular-nums`}>{order.items.reduce((n, i) => n + i.quantity, 0)}</td>
          <td className={`${cell} text-right tabular-nums`}>{formatPrice(order.totalCents)}</td>
          <td className={`${cell} text-right whitespace-nowrap text-muted`}>
            {order.paidAt ? adminDate.format(order.paidAt) : "—"}
          </td>
          <td className={`${cell} w-10 text-right`}>
            <RowMenu
              label={`Actions for order ${formatOrderNumber(order.id)}`}
              items={[{ label: order.shippedAt ? "View order" : "View and ship", href: `/admin/orders/${order.id}` }]}
            />
          </td>
        </tr>
      ))}
    </Table>
  );
}
