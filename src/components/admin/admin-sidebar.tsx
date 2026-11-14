"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ComponentType, ReactNode, SVGProps } from "react";
import { BoxIcon, GridIcon, StoreIcon, TagIcon, UserIcon, UsersIcon } from "@/components/icons";

type Item = { label: string; href: string; icon: ComponentType<SVGProps<SVGSVGElement>> };

/** Groups are separated by a divider, most-used first. */
const groups: Item[][] = [
  [{ label: "Overview", href: "/admin", icon: GridIcon }],
  [
    { label: "Orders", href: "/admin/orders", icon: BoxIcon },
    { label: "Products", href: "/admin/products", icon: TagIcon },
    { label: "Customers", href: "/admin/customers", icon: UsersIcon },
  ],
  [
    { label: "View store", href: "/", icon: StoreIcon },
    { label: "My account", href: "/account", icon: UserIcon },
  ],
];

const isAdminLink = (href: string) => href.startsWith("/admin");

/**
 * The admin area's only navigation: a sidebar from `lg`, and a top bar with a
 * scrolling row of the same links below that. `footer` is the signed-in user,
 * rendered on the server.
 */
export function AdminSidebar({ footer }: { footer?: ReactNode }) {
  const pathname = usePathname();
  const isActive = (href: string) =>
    href === "/admin" ? pathname === "/admin" : isAdminLink(href) && pathname.startsWith(href);

  const link = (item: Item, compact: boolean) => {
    const active = isActive(item.href);
    return (
      <Link
        href={item.href}
        aria-current={active ? "page" : undefined}
        className={`flex items-center gap-2.5 rounded-[0.5rem] px-2.5 text-[0.875rem] whitespace-nowrap transition-colors ${
          compact ? "h-8" : "h-9"
        } ${active ? "bg-surface-strong font-medium text-ink" : "text-muted hover:bg-surface hover:text-ink"}`}
      >
        <item.icon className="size-4 shrink-0" strokeWidth={1.5} />
        {item.label}
      </Link>
    );
  };

  const brand = (
    <Link href="/admin" className="flex items-center gap-2.5 px-2.5">
      <span className="flex size-7 items-center justify-center rounded-[0.5rem] bg-ink font-display text-[1rem] text-paper">
        A
      </span>
      <span className="text-[0.9375rem] font-semibold">Altiere</span>
      <span className="text-[0.75rem] text-muted">Admin</span>
    </Link>
  );

  return (
    <>
      {/* Below lg: brand bar plus one scrolling row of links. */}
      <header className="sticky top-0 z-30 border-b bg-paper lg:hidden">
        <div className="flex h-14 items-center px-3">{brand}</div>
        <nav aria-label="Admin" className="overflow-x-auto border-t px-3 py-2">
          <ul className="flex gap-1">
            {groups.flat().map((item) => (
              <li key={item.href}>{link(item, true)}</li>
            ))}
          </ul>
        </nav>
      </header>

      {/* From lg: fixed-height sidebar. */}
      <aside className="sticky top-0 hidden h-screen w-60 shrink-0 flex-col border-r bg-paper lg:flex">
        <div className="flex h-16 items-center px-3">{brand}</div>
        <nav aria-label="Admin" className="flex-1 overflow-y-auto px-3 pb-4">
          {groups.map((group, i) => (
            <ul key={i} className={`space-y-0.5 ${i > 0 ? "mt-3 border-t pt-3" : ""}`}>
              {group.map((item) => (
                <li key={item.href}>{link(item, false)}</li>
              ))}
            </ul>
          ))}
        </nav>
        {footer && <div className="border-t p-3">{footer}</div>}
      </aside>
    </>
  );
}
