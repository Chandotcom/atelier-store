import { relations, sql } from "drizzle-orm";
import {
  check,
  index,
  integer,
  jsonb,
  pgTable,
  text,
  timestamp,
  unique,
} from "drizzle-orm/pg-core";

export type ProductImageRow = { src: string; alt: string };

export const categories = pgTable("categories", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  slug: text("slug").notNull().unique(),
  name: text("name").notNull(),
});

export const products = pgTable(
  "products",
  {
    id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
    slug: text("slug").notNull().unique(),
    name: text("name").notNull(),
    categoryId: integer("category_id")
      .notNull()
      .references(() => categories.id, { onDelete: "restrict" }),
    /** Price in minor units (cents). */
    priceCents: integer("price_cents").notNull(),
    styleCode: text("style_code").notNull().unique(),
    color: text("color").notNull(),
    description: text("description").notNull(),
    details: text("details").array().notNull(),
    /** Gallery images; the first entry is the listing image. */
    images: jsonb("images").$type<ProductImageRow[]>().notNull(),
    badge: text("badge"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (t) => [index("products_category_id_idx").on(t.categoryId)],
);

/**
 * Stock on hand. Sized products have one row per size; one-size products
 * have a single row with `size` NULL. This is a quantity only, not a variant.
 */
export const productStock = pgTable(
  "product_stock",
  {
    id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
    productId: integer("product_id")
      .notNull()
      .references(() => products.id, { onDelete: "cascade" }),
    size: text("size"),
    quantity: integer("quantity").notNull().default(0),
    /** Display order of sizes (XS, S, M, ...). */
    position: integer("position").notNull().default(0),
  },
  (t) => [
    unique("product_stock_product_size_unique").on(t.productId, t.size).nullsNotDistinct(),
    check("product_stock_quantity_nonnegative", sql`${t.quantity} >= 0`),
  ],
);

export const categoriesRelations = relations(categories, ({ many }) => ({
  products: many(products),
}));

export const productsRelations = relations(products, ({ one, many }) => ({
  category: one(categories, {
    fields: [products.categoryId],
    references: [categories.id],
  }),
  stock: many(productStock),
}));

export const productStockRelations = relations(productStock, ({ one }) => ({
  product: one(products, {
    fields: [productStock.productId],
    references: [products.id],
  }),
}));
