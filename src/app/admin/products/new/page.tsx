import type { Metadata } from "next";
import { Suspense } from "react";
import { ProductForm } from "@/components/admin/product-form";
import { AdminSkeleton, PageHeader } from "@/components/admin/ui";
import { getAdminCategories } from "@/lib/admin-data";
import { requireAdmin } from "@/lib/session";

export const metadata: Metadata = { title: "New product" };

export default function AdminNewProductPage() {
  return (
    <Suspense fallback={<AdminSkeleton />}>
      <NewProduct />
    </Suspense>
  );
}

async function NewProduct() {
  await requireAdmin();
  return (
    <>
      <PageHeader title="New product" back={{ href: "/admin/products", label: "Products" }} />
      <ProductForm categories={await getAdminCategories()} />
    </>
  );
}
