import { unsplash } from "./unsplash";

/*
 * Storefront types, pure helpers and editorial content. Safe to import from
 * client components. Product data comes from the database: see `./products`.
 */

export type ProductImage = { src: string; alt: string };

export type SizeOption = { label: string; stock: number };

export type StockStatus = "in_stock" | "low_stock" | "out_of_stock";

export type Category = { slug: string; label: string };

export type Product = {
  id: number;
  slug: string;
  name: string;
  category: Category;
  /** Price in minor units (cents). */
  price: number;
  styleCode: string;
  color: string;
  description: string;
  details: string[];
  /** Primary (listing) image. */
  image: string;
  alt: string;
  /** All images for the detail page; the first is `image`. */
  gallery: ProductImage[];
  /** Sized products track stock per size; one-size products use `stock`. */
  sizes?: SizeOption[];
  stock: number;
  badge?: string;
};

export type Collection = {
  slug: string;
  title: string;
  eyebrow: string;
  image: string;
  alt: string;
};

export type NavItem = { label: string; href: string };

export const primaryNav: NavItem[] = [
  { label: "New In", href: "/new" },
  { label: "Ready-to-wear", href: "/ready-to-wear" },
  { label: "Bags", href: "/bags" },
  { label: "Shoes", href: "/shoes" },
  { label: "Jewelry", href: "/fine-jewelry" },
  { label: "Knitwear", href: "/knitwear" },
  { label: "Watches", href: "/watches" },
];

/**
 * How many `primaryNav` items fit beside the wordmark in the desktop header
 * below the 2xl breakpoint. The rest show from 2xl, and always in the drawer.
 */
export const PRIMARY_NAV_INLINE_COUNT = 5;

/* ── Stock ────────────────────────────────────────────────────────────── */

export const LOW_STOCK_THRESHOLD = 3;

export function stockStatus(quantity: number): StockStatus {
  if (quantity <= 0) return "out_of_stock";
  if (quantity <= LOW_STOCK_THRESHOLD) return "low_stock";
  return "in_stock";
}

export function stockLabel(quantity: number): string {
  switch (stockStatus(quantity)) {
    case "out_of_stock":
      return "Sold out";
    case "low_stock":
      return `Only ${quantity} left`;
    default:
      return "In stock";
  }
}

/* ── Editorial ────────────────────────────────────────────────────────── */

export const featuredCollections: Collection[] = [
  {
    slug: "ready-to-wear",
    title: "Ready-to-wear",
    eyebrow: "Autumn–Winter",
    image: unsplash("1485968579580-b6d095142e6e", "portrait"),
    alt: "Woman in a tartan coat walking down a city street",
  },
  {
    slug: "new",
    title: "New arrivals",
    eyebrow: "Just in",
    image: unsplash("1617137968427-85924c800a22", "portrait"),
    alt: "Man in a navy suit walking past a glass facade",
  },
];

export const heroImages = [
  {
    src: unsplash("1483985988355-763728e1935b", "portrait"),
    alt: "Woman in a burgundy coat and sunglasses carrying shopping bags",
  },
  {
    src: unsplash("1539109136881-3be0616acf4b", "portrait"),
    alt: "Woman in a pale blue coat standing in a cathedral square",
  },
];

export const knitwearImage = {
  src: unsplash("1558769132-cb1aea458c5e", "portrait"),
  alt: "Rail of neutral knitwear beside dried pampas grass",
};

export const tailoringImage = {
  src: unsplash("1507679799987-c73779587ccf", "portrait"),
  alt: "Close-up of a man buttoning a navy suit jacket",
};

const currency = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
});

export function formatPrice(cents: number): string {
  return currency.format(cents / 100);
}
