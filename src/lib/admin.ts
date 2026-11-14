/*
 * Types shared by the admin forms (client) and the admin Server Actions.
 * No server imports, so client components can use this file.
 */

export type ProductInput = {
  /** Null to create a product. */
  id: number | null;
  name: string;
  categoryId: number;
  /** Price in minor units (cents). */
  priceCents: number;
  styleCode: string;
  color: string;
  description: string;
  /** "Details & care" bullet points. */
  details: string[];
  /** Short label over the listing image, e.g. "New". Null for none. */
  badge: string | null;
  /** The first image is the listing image. `src` is an Unsplash photo link or ID. */
  images: { src: string; alt: string }[];
  /**
   * Either one row with `size` null (a one-size product) or one row per size,
   * in display order.
   */
  stock: { size: string | null; quantity: number }[];
};

export type AdminResult = { ok: true } | { ok: false; message: string };

export type SaveProductResult = { ok: true; id: number } | { ok: false; message: string };
