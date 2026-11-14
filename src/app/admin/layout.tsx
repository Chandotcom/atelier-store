import type { Metadata } from "next";
import { Suspense } from "react";
import { AdminNav } from "@/components/admin/admin-nav";

export const metadata: Metadata = {
  // A layout's own title drops the root template for the pages below it, so restate one.
  title: { default: "Admin", template: "%s | Altiere Admin" },
  robots: { index: false },
};

/*
 * Frame for the admin area. It deliberately reads nothing from the request:
 * with `cacheComponents`, a session read here would break the build. Each page
 * calls `requireAdmin()` inside its own <Suspense> before reading any data.
 */
export default function AdminLayout({ children }: LayoutProps<"/admin">) {
  return (
    <main id="main" className="content-container section flex-1">
      <p className="text-eyebrow text-muted">Admin</p>
      {/* The nav reads the pathname to mark the current section, which isn't
          known while the shell of a dynamic route (orders/[id]) is prerendered. */}
      <Suspense fallback={<div className="mt-4 h-[2.625rem] border-b" />}>
        <AdminNav />
      </Suspense>
      <div className="mt-10">{children}</div>
    </main>
  );
}
