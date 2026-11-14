"use server";

import { and, eq, like, ne } from "drizzle-orm";
import { refresh, updateTag } from "next/cache";

import { db } from "@/db";
import { categories, productStock, products, user, type ProductImageRow } from "@/db/schema";
import type { AdminResult, ProductInput, SaveProductResult } from "@/lib/admin";
import { shipOrder } from "@/lib/orders";
import { PRODUCTS_TAG } from "@/lib/products";
import { ADMIN_ROLE, getCurrentUser, isAdminRequest } from "@/lib/session";
import { normalizeProductImage } from "@/lib/images";

/*
 * Admin mutations. Server Actions are public endpoints, so each one checks
 * the caller's role itself (the page's check does not protect it) and
 * validates every argument. Product writes expire the cached catalog.
 */

const DENIED = { ok: false, message: "You don't have access to do that." } as const;

const isId = (value: unknown): value is number =>
  typeof value === "number" && Number.isSafeInteger(value) && value > 0;

/** A trimmed string of 1..max characters, or null. */
function text(value: unknown, max: number): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed.length > 0 && trimmed.length <= max ? trimmed : null;
}

function slugify(name: string): string {
  return name
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

/** `base`, or `base-2`, `base-3`… if another product already uses it. */
async function uniqueSlug(base: string): Promise<string> {
  const taken = new Set(
    (
      await db
        .select({ slug: products.slug })
        .from(products)
        .where(like(products.slug, `${base}%`))
    ).map((r) => r.slug),
  );
  if (!taken.has(base)) return base;
  for (let n = 2; ; n++) {
    if (!taken.has(`${base}-${n}`)) return `${base}-${n}`;
  }
}

type ValidProduct = {
  name: string;
  categoryId: number;
  priceCents: number;
  styleCode: string;
  color: string;
  description: string;
  details: string[];
  badge: string | null;
  images: ProductImageRow[];
  stock: { size: string | null; quantity: number; position: number }[];
};

function validate(input: ProductInput): ValidProduct | string {
  if (typeof input !== "object" || input === null) return "The product details are invalid.";

  const name = text(input.name, 120);
  if (!name) return "Enter a name (up to 120 characters).";
  if (!isId(input.categoryId)) return "Choose a category.";
  if (!Number.isSafeInteger(input.priceCents) || input.priceCents <= 0 || input.priceCents > 100_000_000) {
    return "Enter a price above zero.";
  }
  const styleCode = text(input.styleCode, 40);
  if (!styleCode) return "Enter a style code (up to 40 characters).";
  const color = text(input.color, 60);
  if (!color) return "Enter a color.";
  const description = text(input.description, 2000);
  if (!description) return "Enter a description (up to 2,000 characters).";

  if (!Array.isArray(input.details) || input.details.length > 12) return "Use up to 12 detail lines.";
  const details: string[] = [];
  for (const line of input.details) {
    const detail = text(line, 200);
    if (!detail) return "Each detail line must be 1 to 200 characters.";
    details.push(detail);
  }

  const badge = input.badge === null ? null : text(input.badge, 24);
  if (input.badge !== null && !badge) return "Keep the badge to 24 characters, or leave it empty.";

  if (!Array.isArray(input.images) || input.images.length < 1 || input.images.length > 8) {
    return "Add between 1 and 8 images.";
  }
  const images: ProductImageRow[] = [];
  for (const [i, image] of input.images.entries()) {
    const src = typeof image?.src === "string" ? normalizeProductImage(image.src) : null;
    if (!src) {
      return `Image ${i + 1} can't be used. Upload a photo, or use an Unsplash link that starts with https://images.unsplash.com/photo-`;
    }
    // The gallery keys its slides by URL, and a repeat adds nothing.
    if (images.some((other) => other.src === src)) return `Image ${i + 1} is already in the gallery.`;
    const alt = text(image.alt, 200);
    if (!alt) return `Describe image ${i + 1} (alt text, up to 200 characters).`;
    images.push({ src, alt });
  }

  if (!Array.isArray(input.stock) || input.stock.length < 1 || input.stock.length > 16) {
    return "Add the stock for this product.";
  }
  const stock: ValidProduct["stock"] = [];
  const seen = new Set<string>();
  for (const [position, row] of input.stock.entries()) {
    if (!Number.isSafeInteger(row?.quantity) || row.quantity < 0 || row.quantity > 99_999) {
      return "Stock quantities must be whole numbers from 0 to 99,999.";
    }
    if (row.size === null) {
      if (input.stock.length > 1) return "A one-size product can only have one stock row.";
      stock.push({ size: null, quantity: row.quantity, position });
      continue;
    }
    const size = text(row.size, 12);
    if (!size) return "Each size needs a label (up to 12 characters).";
    if (seen.has(size.toLowerCase())) return `Size ${size} is listed twice.`;
    seen.add(size.toLowerCase());
    stock.push({ size, quantity: row.quantity, position });
  }

  return { name, categoryId: input.categoryId, priceCents: input.priceCents, styleCode, color, description, details, badge, images, stock };
}

/** Creates the product when `input.id` is null, otherwise updates it. */
export async function saveProduct(input: ProductInput): Promise<SaveProductResult> {
  if (!(await isAdminRequest())) return DENIED;

  const valid = validate(input);
  if (typeof valid === "string") return { ok: false, message: valid };
  const { stock, ...fields } = valid;
  const id = input.id;
  if (id !== null && !isId(id)) return { ok: false, message: "The product details are invalid." };

  const [category] = await db
    .select({ id: categories.id })
    .from(categories)
    .where(eq(categories.id, fields.categoryId));
  if (!category) return { ok: false, message: "Choose a category." };

  // The style code is unique; say so plainly rather than failing on the constraint.
  const [clash] = await db
    .select({ id: products.id })
    .from(products)
    .where(
      id === null
        ? eq(products.styleCode, fields.styleCode)
        : and(eq(products.styleCode, fields.styleCode), ne(products.id, id)),
    );
  if (clash) return { ok: false, message: `Style code ${fields.styleCode} is already used by another product.` };

  if (id === null) {
    const slug = await uniqueSlug(slugify(fields.name) || "product");
    const [created] = await db.insert(products).values({ ...fields, slug }).returning({ id: products.id });
    try {
      await db.insert(productStock).values(stock.map((s) => ({ ...s, productId: created.id })));
    } catch (error) {
      // neon-http has no interactive transactions: undo the half-made product.
      await db.delete(products).where(eq(products.id, created.id));
      throw error;
    }
    updateTag(PRODUCTS_TAG);
    return { ok: true, id: created.id };
  }

  // One batch is one transaction, so the product is never seen without stock.
  // The slug stays as it is: it is the product's public URL. Bag lines refer
  // to product and size, not to stock rows, so replacing the rows is safe.
  const [updated] = await db.batch([
    db.update(products).set(fields).where(eq(products.id, id)).returning({ id: products.id }),
    db.delete(productStock).where(eq(productStock.productId, id)),
    db.insert(productStock).values(stock.map((s) => ({ ...s, productId: id }))),
  ]);
  if (updated.length === 0) {
    // The insert above would have failed on the foreign key, so this is unreachable
    // in practice; it keeps the result honest if the product was just deleted.
    return { ok: false, message: "This product no longer exists." };
  }
  updateTag(PRODUCTS_TAG);
  return { ok: true, id };
}

/**
 * Deletes a product with its stock, and takes it out of every bag and
 * wishlist. Past orders keep their own copy of the line.
 */
export async function deleteProduct(id: number): Promise<AdminResult> {
  if (!(await isAdminRequest())) return DENIED;
  if (!isId(id)) return { ok: false, message: "The product is invalid." };

  const deleted = await db.delete(products).where(eq(products.id, id)).returning({ id: products.id });
  if (deleted.length === 0) return { ok: false, message: "This product no longer exists." };
  updateTag(PRODUCTS_TAG);
  return { ok: true };
}

/**
 * Gives an account the admin role, or takes it away. Admins can't change their
 * own role: that keeps at least one admin (whoever is doing the removing), and
 * stops someone locking themselves out by accident.
 */
export async function setCustomerAdmin(userId: string, makeAdmin: boolean): Promise<AdminResult> {
  const current = await getCurrentUser();
  if (!current?.isAdmin) return DENIED;
  if (typeof userId !== "string" || userId.length === 0 || userId.length > 64 || typeof makeAdmin !== "boolean") {
    return { ok: false, message: "The account is invalid." };
  }
  if (userId === current.id) return { ok: false, message: "You can't change your own role." };

  const updated = await db
    .update(user)
    .set({ role: makeAdmin ? ADMIN_ROLE : "user" })
    .where(eq(user.id, userId))
    .returning({ id: user.id });
  if (updated.length === 0) return { ok: false, message: "This account no longer exists." };

  refresh();
  return { ok: true };
}

/** Marks a paid order shipped and emails the customer. The tracking number is optional. */
export async function markOrderShipped(id: number, trackingNumber: string): Promise<AdminResult> {
  if (!(await isAdminRequest())) return DENIED;
  if (!isId(id) || typeof trackingNumber !== "string" || trackingNumber.trim().length > 80) {
    return { ok: false, message: "Keep the tracking number to 80 characters." };
  }

  const shipped = await shipOrder(id, trackingNumber.trim() || null);
  // Re-render the page either way, so it shows the order's real state.
  refresh();
  return shipped
    ? { ok: true }
    : { ok: false, message: "This order has already been shipped, or isn't paid." };
}
