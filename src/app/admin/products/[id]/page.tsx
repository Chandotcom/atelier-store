import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { ProductForm } from "@/components/admin/product-form";
import { AdminSkeleton } from "@/components/admin/ui";
import { getAdminCategories, getAdminProduct } from "@/lib/admin-data";
import { requireAdmin } from "@/lib/session";

export const metadata: Metadata = { title: "Edit product" };

export default function AdminProductPage({ params }: PageProps<"/admin/products/[id]">) {
  return (
    <>
      <Link href="/admin/products" className="link text-caption text-muted">
        &larr; All products
      </Link>
      <Suspense fallback={<AdminSkeleton />}>
        <EditProduct params={params} />
      </Suspense>
    </>
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
      <div className="mt-4 flex flex-wrap items-baseline justify-between gap-4">
        <h1 className="heading-headline">{product.name}</h1>
        <Link href={`/products/${product.slug}`} className="link text-caption">
          View in store
        </Link>
      </div>
      {/* Keyed so the form's state resets if the admin moves to another product. */}
      <ProductForm key={product.id} product={product} categories={categories} />
    </>
  );
}
