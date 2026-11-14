import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { ProductForm } from "@/components/admin/product-form";
import { AdminSkeleton, PageHeader } from "@/components/admin/ui";
import { ExternalIcon } from "@/components/icons";
import { getAdminCategories, getAdminProduct } from "@/lib/admin-data";
import { requireAdmin } from "@/lib/session";

export const metadata: Metadata = { title: "Edit product" };

export default function AdminProductPage({ params }: PageProps<"/admin/products/[id]">) {
  return (
    <Suspense fallback={<AdminSkeleton />}>
      <EditProduct params={params} />
    </Suspense>
  );
}

async function EditProduct({ params }: Pick<PageProps<"/admin/products/[id]">, "params">) {
  await requireAdmin();
  const id = Number((await params).id);
  if (!Number.isSafeInteger(id) || id <= 0) notFound();
  const [product, categories] = await Promise.all([getAdminProduct(id), getAdminCategories()]);
  if (!product) notFound();

  return (
    <>
      <PageHeader
        title={product.name}
        back={{ href: "/admin/products", label: "Products" }}
        actions={
          <Link href={`/products/${product.slug}`} target="_blank" className="admin-btn admin-btn-secondary">
            <ExternalIcon className="size-4" strokeWidth={1.5} />
            View in store
          </Link>
        }
      />
      {/* Keyed so the form's state resets if the admin moves to another product. */}
      <ProductForm key={product.id} product={product} categories={categories} />
    </>
  );
}
