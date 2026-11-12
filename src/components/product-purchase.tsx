"use client";

import { useState } from "react";
import { stockLabel, stockStatus, type Product, type StockStatus } from "@/lib/catalog";
import { HeartIcon } from "./icons";

const dot: Record<StockStatus, string> = {
  in_stock: "bg-success",
  low_stock: "bg-sale",
  out_of_stock: "bg-subtle",
};

function StockIndicator({ quantity, prefix }: { quantity: number; prefix?: string }) {
  const status = stockStatus(quantity);
  return (
    <p className="flex items-center gap-2 text-caption" role="status">
      <span className={`size-1.5 rounded-full ${dot[status]}`} aria-hidden="true" />
      <span className={status === "low_stock" ? "text-sale" : "text-muted"}>
        {prefix}
        {stockLabel(quantity)}
      </span>
    </p>
  );
}

/**
 * Size selection, stock state and purchase actions. There is no cart or
 * wishlist backend yet, so the actions only acknowledge locally.
 */
export function ProductPurchase({ product }: { product: Product }) {
  const { sizes } = product;
  const [size, setSize] = useState<string | null>(null);
  const [needsSize, setNeedsSize] = useState(false);
  const [added, setAdded] = useState(false);
  const [saved, setSaved] = useState(false);
  const [notify, setNotify] = useState<"idle" | "form" | "done">("idle");

  const soldOut = stockStatus(product.stock) === "out_of_stock";
  const selected = sizes?.find((s) => s.label === size);
  // Stock shown: the selected size if sized, otherwise the product total.
  const shownStock = selected ? selected.stock : product.stock;

  function addToBag() {
    if (sizes && !selected) {
      setNeedsSize(true);
      return;
    }
    setAdded(true);
  }

  return (
    <div className="space-y-6">
      {sizes && !soldOut && (
        <fieldset>
          <legend className="text-label">
            Size{size && <span className="text-muted ml-2 normal-case tracking-normal">{size}</span>}
          </legend>
          <div className="mt-3 grid grid-cols-4 gap-1 sm:grid-cols-5 lg:grid-cols-4 xl:grid-cols-5">
            {sizes.map((s) => {
              const out = s.stock === 0;
              const active = s.label === size;
              return (
                <button
                  key={s.label}
                  type="button"
                  disabled={out}
                  aria-pressed={active}
                  aria-label={out ? `${s.label}, sold out` : s.label}
                  onClick={() => {
                    setSize(s.label);
                    setNeedsSize(false);
                    setAdded(false);
                  }}
                  className={`h-11 border text-caption transition-colors ${
                    active
                      ? "border-ink bg-ink text-paper"
                      : out
                        ? "cursor-not-allowed border-line text-subtle line-through"
                        : "border-line hover:border-ink"
                  }`}
                >
                  {s.label}
                </button>
              );
            })}
          </div>
          {needsSize && (
            <p className="mt-3 text-caption text-sale" role="alert">
              Please select a size.
            </p>
          )}
        </fieldset>
      )}

      <StockIndicator quantity={shownStock} prefix={selected ? `Size ${selected.label}: ` : undefined} />

      <div className="space-y-2">
        {soldOut ? (
          <>
            <button type="button" className="btn btn-primary btn-lg btn-block" disabled>
              Sold out
            </button>
            {notify === "idle" && (
              <button type="button" className="btn btn-secondary btn-lg btn-block" onClick={() => setNotify("form")}>
                Notify me when available
              </button>
            )}
            {notify === "form" && (
              <form
                className="flex items-end gap-3 pt-2"
                onSubmit={(e) => {
                  e.preventDefault();
                  setNotify("done");
                }}
              >
                <label className="flex-1">
                  <span className="sr-only">Email address</span>
                  <input type="email" required autoComplete="email" placeholder="Email address" className="field" />
                </label>
                <button type="submit" className="btn btn-secondary btn-sm">
                  Notify me
                </button>
              </form>
            )}
            {notify === "done" && (
              <p className="text-caption text-muted" role="status">
                We&rsquo;ll email you as soon as it&rsquo;s back.
              </p>
            )}
          </>
        ) : (
          <>
            <button type="button" className="btn btn-primary btn-lg btn-block" onClick={addToBag}>
              {added ? "Added to bag" : "Add to bag"}
            </button>
            <button
              type="button"
              className="btn btn-secondary btn-lg btn-block"
              aria-pressed={saved}
              onClick={() => setSaved((v) => !v)}
            >
              <HeartIcon className={`size-4 ${saved ? "fill-current" : ""}`} />
              {saved ? "Saved to wishlist" : "Save to wishlist"}
            </button>
          </>
        )}
      </div>
    </div>
  );
}
