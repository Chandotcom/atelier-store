import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { Suspense } from "react";
import { AdminSkeleton, cell, PageTitle, StatusPill, Table } from "@/components/admin/ui";
import { getAdminProducts } from "@/lib/admin-data";
import { formatPrice, stockStatus } from "@/lib/catalog";
import { requireAdmin } from "@/lib/session";

export const metadata: Metadata = { title: "Products" };

export default function AdminProductsPage() {
  return (
    <Suspense fallback={<AdminSkeleton />}>
      <Products />
    </Suspense>
  );
}

async function Products() {
  await requireAdmin();
  const products = await getAdminProducts();

  return (
    <>
      <PageTitle
        title="Products"
        action={
          <Link href="/admin/products/new" className="btn btn-primary btn-sm">
            New product
          </Link>
        }
      />
      {products.length === 0 ? (
        <p className="text-muted mt-8">There are no products yet.</p>
      ) : (
        <Table
          head={[
            { label: "Product" },
            { label: "Style" },
            { label: "Category" },
            { label: "Price", right: true },
            { label: "Stock", right: true },
            { label: "Status", right: true },
          ]}
        >
          {products.map((product) => {
            const stock = product.stock.reduce((n, s) => n + s.quantity, 0);
            const status = stockStatus(stock);
            const image = product.images[0];
            return (
              <tr key={product.id}>
                <td className={cell}>
                  <Link href={`/admin/products/${product.id}`} className="group flex items-center gap-4">
                    <span className="media-product w-12 shrink-0">
                      {image && <Image src={image.src} alt="" fill sizes="3rem" />}
                    </span>
                    <span className="link min-w-0">{product.name}</span>
                  </Link>
                </td>
                <td className={`${cell} text-muted whitespace-nowrap tabular-nums`}>{product.styleCode}</td>
                <td className={`${cell} text-muted whitespace-nowrap`}>{product.category.name}</td>
                <td className={`${cell} text-right tabular-nums`}>{formatPrice(product.priceCents)}</td>
                <td className={`${cell} text-right tabular-nums`}>{stock}</td>
                <td className={`${cell} text-right`}>
                  {status === "out_of_stock" ? (
                    <StatusPill tone="warn">Sold out</StatusPill>
                  ) : status === "low_stock" ? (
                    <StatusPill tone="warn">Low stock</StatusPill>
                  ) : (
                    <StatusPill tone="done">In stock</StatusPill>
                  )}
                </td>
              </tr>
            );
          })}
        </Table>
      )}
    </>
  );
}
