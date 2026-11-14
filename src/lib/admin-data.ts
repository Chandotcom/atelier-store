import { and, asc, desc, eq, ilike, isNotNull, isNull, lte, not, or, sql } from "drizzle-orm";

import { db } from "@/db";
import { categories, orders, productStock, products, user } from "@/db/schema";
import { LOW_STOCK_THRESHOLD, stockStatus, type StockStatus } from "./catalog";

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

/** A `%term%` pattern for ILIKE, with the wildcard characters in the term escaped. */
function contains(term: string): string {
  return `%${term.replace(/[\\%_]/g, "\\$&")}%`;
}

/** Search boxes send whatever was typed; keep it short and trimmed. */
function searchTerm(q: string | undefined): string {
  return (q ?? "").trim().slice(0, 80);
}

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
    getAdminOrders({ limit: 5 }),
  ]);

  return { ...sales, customers: customers.count, lowStock, recentOrders };
}

/** Paid orders, newest first. `q` matches the customer's email or an order number (AL-000008, 8). */
export async function getAdminOrders({
  filter = "all",
  q,
  limit,
}: { filter?: OrderFilter; q?: string; limit?: number } = {}) {
  const term = searchTerm(q);
  const orderNumber = /^(?:al-?)?0*(\d{1,9})$/i.exec(term)?.[1];
  const search = term
    ? or(ilike(orders.email, contains(term)), orderNumber ? eq(orders.id, Number(orderNumber)) : undefined)
    : undefined;
  const shipped =
    filter === "to-ship"
      ? isNull(orders.shippedAt)
      : filter === "shipped"
        ? isNotNull(orders.shippedAt)
        : undefined;

  return db.query.orders.findMany({
    where: and(paid, shipped, search),
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

/** Products, newest first. `q` matches name, style code or color. */
export async function getAdminProducts({
  q,
  categoryId,
  stock,
}: { q?: string; categoryId?: number; stock?: StockStatus } = {}) {
  const term = searchTerm(q);
  const rows = await db.query.products.findMany({
    where: and(
      term
        ? or(
            ilike(products.name, contains(term)),
            ilike(products.styleCode, contains(term)),
            ilike(products.color, contains(term)),
          )
        : undefined,
      categoryId ? eq(products.categoryId, categoryId) : undefined,
    ),
    orderBy: [desc(products.createdAt), desc(products.id)],
    with: { category: true, stock: { orderBy: (s, { asc }) => [asc(s.position)] } },
  });

  // A product's total stock is summed from its size rows, so filter on it here.
  const withTotals = rows.map((row) => {
    const total = row.stock.reduce((n, s) => n + s.quantity, 0);
    return { ...row, totalStock: total, stockStatus: stockStatus(total) };
  });
  return stock ? withTotals.filter((row) => row.stockStatus === stock) : withTotals;
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

/** Accounts, newest first, with what they have spent on paid orders. `q` matches name or email. */
export async function getAdminCustomers({ q, role }: { q?: string; role?: "admin" | "customer" } = {}) {
  const term = searchTerm(q);
  // A user can hold several comma-separated roles; "admin" anywhere in the list counts.
  const isAdmin = sql`coalesce(${user.role}, '') ~ '(^|,)admin(,|$)'`;
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
    .where(
      and(
        term ? or(ilike(user.name, contains(term)), ilike(user.email, contains(term))) : undefined,
        role === "admin" ? isAdmin : role === "customer" ? not(isAdmin) : undefined,
      ),
    )
    .groupBy(user.id)
    .orderBy(desc(user.createdAt));
}
