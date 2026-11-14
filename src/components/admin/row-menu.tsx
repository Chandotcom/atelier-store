"use client";

import Link from "next/link";
import { useEffect, useId, useRef, useState } from "react";
import { DotsIcon } from "@/components/icons";

type Item = { label: string; href: string; newTab?: boolean };

/**
 * The "…" button at the end of a table row. The menu is positioned with
 * `fixed`, because the table scrolls sideways and would otherwise clip it.
 */
export function RowMenu({ label, items }: { label: string; items: Item[] }) {
  const [position, setPosition] = useState<{ top: number; right: number } | null>(null);
  const button = useRef<HTMLButtonElement>(null);
  const menuId = useId();
  const open = position !== null;

  useEffect(() => {
    if (!open) return;
    const close = () => setPosition(null);
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        close();
        button.current?.focus();
      }
    };
    const onPointer = (e: PointerEvent) => {
      const target = e.target as Node;
      if (!button.current?.contains(target) && !document.getElementById(menuId)?.contains(target)) close();
    };
    document.addEventListener("keydown", onKey);
    document.addEventListener("pointerdown", onPointer);
    // The menu doesn't follow the row, so close it rather than leave it behind.
    window.addEventListener("scroll", close, true);
    window.addEventListener("resize", close);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("pointerdown", onPointer);
      window.removeEventListener("scroll", close, true);
      window.removeEventListener("resize", close);
    };
  }, [open, menuId]);

  function toggle() {
    if (open || !button.current) return setPosition(null);
    const rect = button.current.getBoundingClientRect();
    setPosition({ top: rect.bottom + 4, right: window.innerWidth - rect.right });
  }

  return (
    <>
      <button
        ref={button}
        type="button"
        aria-label={label}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={open ? menuId : undefined}
        onClick={toggle}
        className="inline-flex size-8 cursor-pointer items-center justify-center rounded-[0.5rem] text-muted hover:bg-surface-strong hover:text-ink"
      >
        <DotsIcon className="size-4" />
      </button>
      {open && (
        <ul
          id={menuId}
          role="menu"
          style={position ?? undefined}
          className="admin-card fixed z-50 min-w-44 p-1 text-left shadow-[0_8px_24px_rgb(0_0_0/0.08)]"
        >
          {items.map((item) => (
            <li key={item.label} role="none">
              <Link
                role="menuitem"
                href={item.href}
                target={item.newTab ? "_blank" : undefined}
                onClick={() => setPosition(null)}
                className="flex h-8 items-center rounded-[0.375rem] px-2.5 text-[0.8125rem] whitespace-nowrap hover:bg-surface"
              >
                {item.label}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
