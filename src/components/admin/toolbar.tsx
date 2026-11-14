"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState, useTransition } from "react";
import { ChevronDownIcon, SearchIcon } from "@/components/icons";

/*
 * Table controls. Each one keeps its value in the URL's query string
 * (`?q=…&filter=…`), so the server renders the filtered table, the state
 * survives a reload, and a filtered view can be shared as a link.
 */

type Option = { value: string; label: string };

/** The current URL with one query parameter set, or removed when `value` is empty. */
function hrefWith(pathname: string, search: string, param: string, value: string): string {
  const params = new URLSearchParams(search);
  if (value) params.set(param, value);
  else params.delete(param);
  const query = params.toString();
  return query ? `${pathname}?${query}` : pathname;
}

/** Search box bound to `?q=`. Updates the table shortly after typing stops. */
export function SearchInput({ placeholder }: { placeholder: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const [value, setValue] = useState(params.get("q") ?? "");
  const [pending, startTransition] = useTransition();
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);

  useEffect(() => () => clearTimeout(timer.current), []);

  function onChange(next: string) {
    setValue(next);
    clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      // Read the live query string: other filters may have changed since render.
      const href = hrefWith(pathname, window.location.search, "q", next.trim());
      startTransition(() => router.replace(href, { scroll: false }));
    }, 250);
  }

  return (
    <label className="relative min-w-48 flex-1">
      <span className="sr-only">{placeholder}</span>
      <SearchIcon
        className={`pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted ${pending ? "animate-pulse" : ""}`}
        strokeWidth={1.5}
      />
      <input
        type="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        autoComplete="off"
        maxLength={80}
        className="admin-field bg-surface pl-9 [&::-webkit-search-cancel-button]:hidden"
      />
    </label>
  );
}

/** Dropdown bound to one query parameter. The option with value "" clears it. */
export function FilterSelect({ param, label, options }: { param: string; label: string; options: Option[] }) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const [, startTransition] = useTransition();
  const current = options.some((o) => o.value === params.get(param)) ? (params.get(param) ?? "") : "";

  return (
    <label className="relative">
      <span className="sr-only">{label}</span>
      <select
        value={current}
        onChange={(e) => {
          const href = hrefWith(pathname, window.location.search, param, e.target.value);
          startTransition(() => router.replace(href, { scroll: false }));
        }}
        className="admin-field w-auto min-w-40 cursor-pointer appearance-none bg-surface pr-9"
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
      <ChevronDownIcon
        className="pointer-events-none absolute top-1/2 right-3 size-4 -translate-y-1/2 text-muted"
        strokeWidth={1.5}
      />
    </label>
  );
}

/** Pill tabs bound to one query parameter. The option with value "" clears it. */
export function FilterTabs({ param, label, options }: { param: string; label: string; options: Option[] }) {
  const pathname = usePathname();
  const params = useSearchParams();
  const current = options.some((o) => o.value === params.get(param)) ? (params.get(param) ?? "") : "";

  return (
    <nav aria-label={label} className="mt-6">
      <ul className="flex flex-wrap gap-1">
        {options.map((o) => {
          const active = o.value === current;
          return (
            <li key={o.value}>
              <Link
                href={hrefWith(pathname, params.toString(), param, o.value)}
                aria-current={active ? "page" : undefined}
                scroll={false}
                className={`inline-flex h-8 items-center rounded-[0.5rem] px-3 text-[0.875rem] font-medium transition-colors ${
                  active ? "bg-surface-strong text-ink" : "text-muted hover:text-ink"
                }`}
              >
                {o.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
