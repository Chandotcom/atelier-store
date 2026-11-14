"use client";

import { useRouter } from "next/navigation";
import { useId, useState, useTransition, type FormEvent, type ReactNode } from "react";
import { deleteProduct, saveProduct } from "@/app/admin/actions";
import { FormError } from "@/components/auth/fields";
import type { ProductInput } from "@/lib/admin";
import type { AdminProduct } from "@/lib/admin-data";

type Props = {
  /** Omit to create a product. */
  product?: AdminProduct;
  categories: { id: number; name: string }[];
};

type ImageRow = { src: string; alt: string };
type SizeRow = { size: string; quantity: string };

const FAILED = "We couldn't reach the server. Please try again.";

/** Create and edit form for a product, its images and its stock. */
export function ProductForm({ product, categories }: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [confirmingDelete, setConfirmingDelete] = useState(false);

  const sizedStock = product?.stock.filter((s) => s.size !== null) ?? [];
  const [sized, setSized] = useState(sizedStock.length > 0);
  const [sizes, setSizes] = useState<SizeRow[]>(
    sizedStock.length > 0
      ? sizedStock.map((s) => ({ size: s.size ?? "", quantity: String(s.quantity) }))
      : [{ size: "", quantity: "0" }],
  );
  const [oneSizeQuantity, setOneSizeQuantity] = useState(
    String(product?.stock.find((s) => s.size === null)?.quantity ?? 0),
  );
  const [images, setImages] = useState<ImageRow[]>(
    product && product.images.length > 0 ? product.images : [{ src: "", alt: "" }],
  );

  function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const data = new FormData(e.currentTarget);
    const value = (name: string) => String(data.get(name) ?? "");

    const input: ProductInput = {
      id: product?.id ?? null,
      name: value("name"),
      categoryId: Number(value("categoryId")),
      // Whole cents; the server rejects anything that isn't a positive integer.
      priceCents: Math.round(Number(value("price")) * 100),
      styleCode: value("styleCode"),
      color: value("color"),
      description: value("description"),
      details: value("details")
        .split("\n")
        .map((line) => line.trim())
        .filter(Boolean),
      badge: value("badge").trim() || null,
      images,
      stock: sized
        ? sizes.map((s) => ({ size: s.size, quantity: Number(s.quantity) }))
        : [{ size: null, quantity: Number(oneSizeQuantity) }],
    };

    setError(null);
    startTransition(async () => {
      try {
        const result = await saveProduct(input);
        if (!result.ok) {
          setError(result.message);
          return;
        }
        router.push("/admin/products");
      } catch {
        setError(FAILED);
      }
    });
  }

  function remove() {
    if (!product) return;
    setError(null);
    startTransition(async () => {
      try {
        const result = await deleteProduct(product.id);
        if (!result.ok) {
          setError(result.message);
          return;
        }
        router.push("/admin/products");
      } catch {
        setError(FAILED);
      }
    });
  }

  const update = <T,>(rows: T[], index: number, patch: Partial<T>) =>
    rows.map((row, i) => (i === index ? { ...row, ...patch } : row));

  return (
    <form onSubmit={onSubmit} className="mt-10 grid gap-x-16 gap-y-12 lg:grid-cols-2">
      <div className="space-y-8">
        <Group title="Details">
          <Input label="Name" name="name" defaultValue={product?.name} maxLength={120} required />
          <div className="grid gap-6 sm:grid-cols-2">
            <Labelled label="Category">
              {(id) => (
                <select id={id} name="categoryId" defaultValue={product?.categoryId} className="field" required>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              )}
            </Labelled>
            <Input
              label="Price (USD)"
              name="price"
              type="number"
              inputMode="decimal"
              min="0.01"
              step="0.01"
              defaultValue={product ? product.priceCents / 100 : undefined}
              required
            />
          </div>
          <div className="grid gap-6 sm:grid-cols-2">
            <Input label="Style code" name="styleCode" defaultValue={product?.styleCode} maxLength={40} required />
            <Input label="Color" name="color" defaultValue={product?.color} maxLength={60} required />
          </div>
          <Input
            label="Badge"
            name="badge"
            defaultValue={product?.badge ?? ""}
            maxLength={24}
            hint="Optional. A short label over the listing image, such as New."
          />
          <Labelled label="Description">
            {(id) => (
              <textarea
                id={id}
                name="description"
                defaultValue={product?.description}
                maxLength={2000}
                rows={4}
                className="field h-auto py-3"
                required
              />
            )}
          </Labelled>
          <Labelled label="Details &amp; care" hint="One point per line.">
            {(id, hintId) => (
              <textarea
                id={id}
                name="details"
                defaultValue={product?.details.join("\n")}
                rows={4}
                aria-describedby={hintId}
                className="field h-auto py-3"
              />
            )}
          </Labelled>
        </Group>
      </div>

      <div className="space-y-12">
        <Group title="Stock">
          <label className="flex items-center gap-3">
            <input
              type="checkbox"
              checked={sized}
              onChange={(e) => setSized(e.target.checked)}
              className="size-4 accent-ink"
            />
            This product comes in sizes
          </label>

          {sized ? (
            <div className="space-y-4">
              {sizes.map((row, i) => (
                <div key={i} className="flex items-end gap-4">
                  <Input
                    label="Size"
                    value={row.size}
                    onChange={(e) => setSizes(update(sizes, i, { size: e.target.value }))}
                    maxLength={12}
                    required
                  />
                  <Input
                    label="In stock"
                    type="number"
                    inputMode="numeric"
                    min="0"
                    step="1"
                    value={row.quantity}
                    onChange={(e) => setSizes(update(sizes, i, { quantity: e.target.value }))}
                    required
                  />
                  <button
                    type="button"
                    className="link text-caption text-muted h-12 shrink-0 cursor-pointer"
                    disabled={sizes.length === 1}
                    onClick={() => setSizes(sizes.filter((_, n) => n !== i))}
                  >
                    Remove<span className="sr-only"> size {row.size}</span>
                  </button>
                </div>
              ))}
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                disabled={sizes.length >= 16}
                onClick={() => setSizes([...sizes, { size: "", quantity: "0" }])}
              >
                Add size
              </button>
            </div>
          ) : (
            <Input
              label="In stock"
              type="number"
              inputMode="numeric"
              min="0"
              step="1"
              value={oneSizeQuantity}
              onChange={(e) => setOneSizeQuantity(e.target.value)}
              required
            />
          )}
        </Group>

        <Group title="Images">
          <p className="text-caption text-muted">
            The first image is shown in listings. Only Unsplash photos can be used: paste a link that
            starts with https://images.unsplash.com/photo-
          </p>
          <div className="space-y-6">
            {images.map((row, i) => (
              <div key={i} className="hairline space-y-4 p-4">
                <Input
                  label={`Image ${i + 1} link`}
                  value={row.src}
                  onChange={(e) => setImages(update(images, i, { src: e.target.value }))}
                  required
                />
                <Input
                  label="Description (alt text)"
                  value={row.alt}
                  onChange={(e) => setImages(update(images, i, { alt: e.target.value }))}
                  maxLength={200}
                  required
                />
                <button
                  type="button"
                  className="link text-caption text-muted cursor-pointer"
                  disabled={images.length === 1}
                  onClick={() => setImages(images.filter((_, n) => n !== i))}
                >
                  Remove<span className="sr-only"> image {i + 1}</span>
                </button>
              </div>
            ))}
          </div>
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            disabled={images.length >= 8}
            onClick={() => setImages([...images, { src: "", alt: "" }])}
          >
            Add image
          </button>
        </Group>
      </div>

      <div className="divider space-y-4 pt-8 lg:col-span-2">
        <FormError message={error} />
        <div className="flex flex-wrap items-center justify-between gap-4">
          <button type="submit" className="btn btn-primary" disabled={pending}>
            {pending ? "Saving…" : product ? "Save changes" : "Create product"}
          </button>

          {product &&
            (confirmingDelete ? (
              <div className="flex flex-wrap items-center gap-3" role="group" aria-label="Confirm delete">
                <span className="text-caption text-sale">Delete this product for good?</span>
                <button type="button" className="btn btn-secondary btn-sm" disabled={pending} onClick={remove}>
                  Yes, delete
                </button>
                <button
                  type="button"
                  className="btn btn-ghost btn-sm"
                  disabled={pending}
                  onClick={() => setConfirmingDelete(false)}
                >
                  Cancel
                </button>
              </div>
            ) : (
              <button
                type="button"
                className="link text-caption text-sale cursor-pointer"
                disabled={pending}
                onClick={() => setConfirmingDelete(true)}
              >
                Delete product
              </button>
            ))}
        </div>
      </div>
    </form>
  );
}

function Group({ title, children }: { title: string; children: ReactNode }) {
  return (
    <fieldset className="space-y-6">
      <legend className="heading-title mb-6">{title}</legend>
      {children}
    </fieldset>
  );
}

/** A label, an optional hint, and whatever control `children` renders for the given id. */
function Labelled({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: (id: string, hintId: string | undefined) => ReactNode;
}) {
  const id = useId();
  const hintId = hint ? `${id}-hint` : undefined;
  return (
    <div className="min-w-0 flex-1">
      <label htmlFor={id} className="text-label">
        {label}
      </label>
      {children(id, hintId)}
      {hint && (
        <p id={hintId} className="text-caption text-muted mt-2">
          {hint}
        </p>
      )}
    </div>
  );
}

function Input({
  label,
  hint,
  ...props
}: { label: string; hint?: string } & Omit<React.ComponentProps<"input">, "id" | "className">) {
  return (
    <Labelled label={label} hint={hint}>
      {(id, hintId) => <input id={id} className="field" aria-describedby={hintId} {...props} />}
    </Labelled>
  );
}
