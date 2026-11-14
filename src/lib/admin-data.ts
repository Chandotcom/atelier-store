import { and, asc, desc, eq, isNotNull, isNull, lte, sql } from "drizzle-orm";

import { db } from "@/db";
import { categories, orders, productStock, products, user } from "@/db/schema";
import { LOW_STOCK_THRESHOLD } from "./catalog";

/*
 * Reads for the admin area. Server-only and never cached: staff must see the
 * live rows, not the storefront's cached catalog in `./products`.
 *
 * Nothing here checks who is asking. Every caller must `await requireAdmin()`
 * (pages) or `isAdminRequest()` (actions) from `./session` first.
 *
 * Only `paid` orders count as orders here. `pending` and `cancelled` rows are
 * checkouts that were started and never paid.
 */

export type OrderFilter = "all" | "to-ship" | "shipped";

const paid = eq(orders.status, "paid");

export async function getDashboardStats() {
  const [[sales], [customers], lowStock, recentOrders] = await Promise.all([
    db
      .select({
        orders: sql<number>`count(*)::int`,
        revenueCents: sql<number>`coalesce(sum(${orders.totalCents}), 0)::int`,
        toShip: sql<number>`(count(*) filter (where ${orders.shippedAt} is null))::int`,
      })
      .from(orders)
      .where(paid),
    db.select({ count: sql<number>`count(*)::int` }).from(user),
    db
      .select({
        productId: products.id,
        name: products.name,
        size: productStock.size,
        quantity: productStock.quantity,
      })
      .from(productStock)
      .innerJoin(products, eq(productStock.productId, products.id))
      .where(lte(productStock.quantity, LOW_STOCK_THRESHOLD))
      .orderBy(asc(productStock.quantity), asc(products.name), asc(productStock.position)),
    getAdminOrders("all", 5),
  ]);

  return { ...sales, customers: customers.count, lowStock, recentOrders };
}

export async function getAdminOrders(filter: OrderFilter, limit?: number) {
  const shipped =
    filter === "to-ship"
      ? isNull(orders.shippedAt)
      : filter === "shipped"
        ? isNotNull(orders.shippedAt)
        : undefined;

  return db.query.orders.findMany({
    where: and(paid, shipped),
    orderBy: [desc(orders.paidAt), desc(orders.id)],
    limit,
    with: { items: { columns: { quantity: true } } },
  });
}

export async function getAdminOrder(id: number) {
  return db.query.orders.findFirst({
    where: and(eq(orders.id, id), paid),
    with: { items: { orderBy: (i, { asc }) => [asc(i.id)] } },
  });
}

export async function getAdminProducts() {
  return db.query.products.findMany({
    orderBy: [desc(products.createdAt), desc(products.id)],
    with: { category: true, stock: { orderBy: (s, { asc }) => [asc(s.position)] } },
  });
}

export async function getAdminProduct(id: number) {
  return db.query.products.findFirst({
    where: eq(products.id, id),
    with: { stock: { orderBy: (s, { asc }) => [asc(s.position)] } },
  });
}

export type AdminProduct = NonNullable<Awaited<ReturnType<typeof getAdminProduct>>>;

export async function getAdminCategories() {
  return db
    .select({ id: categories.id, name: categories.name })
    .from(categories)
    .orderBy(asc(categories.id));
}

/** Every account, newest first, with what they have spent on paid orders. */
export async function getAdminCustomers() {
  return db
    .select({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      createdAt: user.createdAt,
      orders: sql<number>`count(${orders.id})::int`,
      spentCents: sql<number>`coalesce(sum(${orders.totalCents}), 0)::int`,
    })
    .from(user)
    .leftJoin(orders, and(eq(orders.userId, user.id), paid))
    .groupBy(user.id)
    .orderBy(desc(user.createdAt));
}
