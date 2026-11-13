"use client";

import { useId, useMemo, useState } from "react";
import { stockStatus, type Product } from "@/lib/catalog";
import { ProductCard } from "./product-card";

type Sort = "default" | "price-asc" | "price-desc";

const sortOptions: { value: Sort; label: string }[] = [
  { value: "default", label: "Recommended" },
  { value: "price-asc", label: "Price: low to high" },
  { value: "price-desc", label: "Price: high to low" },
];

const selectClass =
  "h-10 cursor-pointer border-0 border-b bg-transparent pr-6 text-caption focus:border-line-strong focus:outline-none";

/**
 * Product grid with sort and filter controls. Everything happens in the
 * browser on the products it was given, so the listing pages that use it can
 * stay fully static (they can't read the URL's search params on the server).
 */
export function FilterableProductGrid({ products }: { products: Product[] }) {
  const [sort, setSort] = useState<Sort>("default");
  const [size, setSize] = useState("");
  const [color, setColor] = useState("");
  const [inStockOnly, setInStockOnly] = useState(false);
  const id = useId();

  // Options come from the listing itself, in first-seen order.
  const sizes = useMemo(
    () => [...new Set(products.flatMap((p) => p.sizes?.map((s) => s.label) ?? []))],
    [products],
  );
  const colors = useMemo(
    () => [...new Set(products.map((p) => p.color))].sort((a, b) => a.localeCompare(b)),
    [products],
  );

  const visible = useMemo(() => {
    const filtered = products.filter((p) => {
      if (color && p.color !== color) return false;
      // A size counts only if it can actually be bought.
      if (size && !p.sizes?.some((s) => s.label === size && s.stock > 0)) return false;
      if (inStockOnly && stockStatus(p.stock) === "out_of_stock") return false;
      return true;
    });
    if (sort === "default") return filtered;
    return filtered.toSorted((a, b) => (sort === "price-asc" ? a.price - b.price : b.price - a.price));
  }, [products, sort, size, color, inStockOnly]);

  const filtering = Boolean(size || color || inStockOnly);
  const clear = () => {
    setSize("");
    setColor("");
    setInStockOnly(false);
  };

  return (
    <>
      <div className="divider mb-8 flex flex-wrap items-center gap-x-8 gap-y-2 border-b py-3">
        <div className="flex items-center gap-3">
          <label htmlFor={`${id}-sort`} className="text-eyebrow text-muted">
            Sort
          </label>
          <select
            id={`${id}-sort`}
            className={selectClass}
            value={sort}
            onChange={(e) => setSort(e.target.value as Sort)}
          >
            {sortOptions.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </div>

        {sizes.length > 0 && (
          <div className="flex items-center gap-3">
            <label htmlFor={`${id}-size`} className="text-eyebrow text-muted">
              Size
            </label>
            <select
              id={`${id}-size`}
              className={selectClass}
              value={size}
              onChange={(e) => setSize(e.target.value)}
            >
              <option value="">All</option>
              {sizes.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>
        )}

        {colors.length > 1 && (
          <div className="flex items-center gap-3">
            <label htmlFor={`${id}-color`} className="text-eyebrow text-muted">
              Color
            </label>
            <select
              id={`${id}-color`}
              className={selectClass}
              value={color}
              onChange={(e) => setColor(e.target.value)}
            >
              <option value="">All</option>
              {colors.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
        )}

        <label className="text-caption flex h-10 cursor-pointer items-center gap-2">
          <input
            type="checkbox"
            className="size-4 accent-ink"
            checked={inStockOnly}
            onChange={(e) => setInStockOnly(e.target.checked)}
          />
          In stock only
        </label>

        <p className="text-eyebrow text-muted ml-auto flex items-center gap-4" role="status">
          {filtering && (
            <button type="button" className="link cursor-pointer uppercase" onClick={clear}>
              Clear filters
            </button>
          )}
          <span>
            {filtering && `${visible.length} of `}
            {products.length} {products.length === 1 ? "piece" : "pieces"}
          </span>
        </p>
      </div>

      {visible.length > 0 ? (
        <div className="product-grid">
          {visible.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      ) : (
        <div className="py-section text-center">
          <p className="text-muted">No pieces match these filters.</p>
          <button type="button" className="btn btn-secondary mt-8" onClick={clear}>
            Clear filters
          </button>
        </div>
      )}
    </>
  );
}
