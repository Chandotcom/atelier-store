import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { Suspense } from "react";
import { RowMenu } from "@/components/admin/row-menu";
import { FilterSelect, SearchInput } from "@/components/admin/toolbar";
import { AdminSkeleton, Badge, cell, EmptyState, PageHeader, Table, Toolbar } from "@/components/admin/ui";
import { PlusIcon, TagIcon } from "@/components/icons";
import { getAdminCategories, getAdminProducts } from "@/lib/admin-data";
import { formatPrice, type StockStatus } from "@/lib/catalog";
import { requireAdmin } from "@/lib/session";

export const metadata: Metadata = { title: "Products" };

const stockOptions: { value: StockStatus; label: string }[] = [
  { value: "in_stock", label: "In stock" },
  { value: "low_stock", label: "Low stock" },
  { value: "out_of_stock", label: "Sold out" },
];

export default function AdminProductsPage({ searchParams }: PageProps<"/admin/products">) {
  return (
    <Suspense fallback={<AdminSkeleton />}>
      <Products searchParams={searchParams} />
    </Suspense>
  );
}

async function Products({ searchParams }: Pick<PageProps<"/admin/products">, "searchParams">) {
  await requireAdmin();
  const params = await searchParams;
  const q = typeof params.q === "string" ? params.q : undefined;
  const categories = await getAdminCategories();
  const categoryId = categories.find((c) => String(c.id) === params.category)?.id;
  const stock = stockOptions.find((o) => o.value === params.stock)?.value;
  const products = await getAdminProducts({ q, categoryId, stock });
  const filtered = Boolean(q || categoryId || stock);

  return (
    <>
      <PageHeader
        title="Products"
        description="Everything in the catalog. Changes show in the store straight away."
        actions={
          <Link href="/admin/products/new" className="admin-btn admin-btn-primary">
            <PlusIcon className="size-4" strokeWidth={1.5} />
            New product
          </Link>
        }
      />
      <Toolbar>
        <SearchInput placeholder="Search by name, style code or color…" />
        <FilterSelect
          param="category"
          label="Category"
          options={[{ value: "", label: "All categories" }, ...categories.map((c) => ({ value: String(c.id), label: c.name }))]}
        />
        <FilterSelect param="stock" label="Stock" options={[{ value: "", label: "All stock levels" }, ...stockOptions]} />
      </Toolbar>

      {products.length === 0 ? (
        <EmptyState
          icon={TagIcon}
          title={filtered ? "No products match these filters" : "There are no products yet"}
          hint={filtered ? "Try a different search or clear a filter." : "Add the first one with New product."}
        />
      ) : (
        <Table
          head={[
            { label: "Product" },
            { label: "Category" },
            { label: "Status" },
            { label: "Stock", right: true },
            { label: "Price", right: true },
            { label: "Actions", hidden: true },
          ]}
        >
          {products.map((product) => {
            const image = product.images[0];
            return (
              <tr key={product.id} className="hover:bg-surface/60">
                <td className={cell}>
                  <Link href={`/admin/products/${product.id}`} className="flex items-center gap-3">
                    <span className="relative size-10 shrink-0 overflow-hidden rounded-[0.5rem] border bg-surface">
                      {image && <Image src={image.src} alt="" fill sizes="2.5rem" className="object-cover" />}
                    </span>
                    <span className="min-w-0">
                      <span className="block truncate font-medium">{product.name}</span>
                      <span className="block text-[0.8125rem] text-muted tabular-nums">{product.styleCode}</span>
                    </span>
                  </Link>
                </td>
                <td className={`${cell} whitespace-nowrap text-muted`}>{product.category.name}</td>
                <td className={cell}>
                  {product.stockStatus === "out_of_stock" ? (
                    <Badge tone="danger">Sold out</Badge>
                  ) : product.stockStatus === "low_stock" ? (
                    <Badge tone="neutral">Low stock</Badge>
                  ) : (
                    <Badge tone="success">In stock</Badge>
                  )}
                </td>
                <td className={`${cell} text-right tabular-nums`}>{product.totalStock}</td>
                <td className={`${cell} text-right tabular-nums`}>{formatPrice(product.priceCents)}</td>
                <td className={`${cell} w-10 text-right`}>
                  <RowMenu
                    label={`Actions for ${product.name}`}
                    items={[
                      { label: "Edit product", href: `/admin/products/${product.id}` },
                      { label: "View in store", href: `/products/${product.slug}`, newTab: true },
                    ]}
                  />
                </td>
              </tr>
            );
          })}
        </Table>
      )}
    </>
  );
}
