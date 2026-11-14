import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { ProductForm } from "@/components/admin/product-form";
import { AdminSkeleton } from "@/components/admin/ui";
import { getAdminCategories } from "@/lib/admin-data";
import { requireAdmin } from "@/lib/session";

export const metadata: Metadata = { title: "New product" };

export default function AdminNewProductPage() {
  return (
    <>
      <Link href="/admin/products" className="link text-caption text-muted">
        &larr; All products
      </Link>
      <h1 className="heading-headline mt-4">New product</h1>
      <Suspense fallback={<AdminSkeleton />}>
        <NewProduct />
      </Suspense>
    </>
  );
}

async function NewProduct() {
  await requireAdmin();
  return <ProductForm categories={await getAdminCategories()} />;
}
