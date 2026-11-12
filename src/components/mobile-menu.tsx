"use client";

import Link from "next/link";
import { useRef } from "react";
import type { NavItem } from "@/lib/catalog";
import { CloseIcon, MenuIcon } from "./icons";

const secondary: NavItem[] = [
  { label: "My account", href: "/account" },
  { label: "Wishlist", href: "/wishlist" },
  { label: "Client services", href: "/services" },
  { label: "Store locator", href: "/stores" },
];

/** Hamburger + left drawer. Native <dialog> gives focus trapping and Esc. */
export function MobileMenu({ items }: { items: NavItem[] }) {
  const ref = useRef<HTMLDialogElement>(null);
  const close = () => ref.current?.close();

  return (
    <>
      <button
        type="button"
        className="btn-icon -ml-2"
        aria-label="Open menu"
        aria-haspopup="dialog"
        onClick={() => ref.current?.showModal()}
      >
        <MenuIcon />
      </button>

      <dialog
        ref={ref}
        aria-label="Menu"
        className="menu-drawer"
        onClick={(e) => {
          // A click on the backdrop targets the dialog element itself.
          if (e.target === e.currentTarget) close();
        }}
      >
        <div className="flex h-full flex-col">
          <div className="flex h-header items-center justify-between border-b px-gutter">
            <span className="text-eyebrow">Menu</span>
            <button
              type="button"
              className="btn-icon -mr-2"
              aria-label="Close menu"
              onClick={close}
            >
              <CloseIcon />
            </button>
          </div>

          <nav aria-label="Primary" className="flex-1 overflow-y-auto px-gutter py-8">
            <ul className="space-y-5">
              {items.map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    onClick={close}
                    className="heading-title link-quiet"
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>

            <ul className="divider mt-10 space-y-4 pt-8">
              {secondary.map((item) => (
                <li key={item.href}>
                  <Link href={item.href} onClick={close} className="text-label link-quiet">
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </div>
      </dialog>
    </>
  );
}
