import type { Metadata } from "next";
import { Suspense } from "react";
import { AdminSidebar } from "@/components/admin/admin-sidebar";
import { getCurrentUser } from "@/lib/session";

export const metadata: Metadata = {
  // A layout's own title drops the root template for the pages below it, so restate one.
  title: { default: "Admin", template: "%s | Altiere Admin" },
  robots: { index: false },
};

/*
 * The admin shell: its own sidebar, and none of the storefront's header or
 * footer (those belong to the (store) route group).
 *
 * The layout itself reads nothing from the request: with `cacheComponents`, a
 * session read at its top level would break the build. The signed-in user in
 * the sidebar streams in behind <Suspense>, and each page calls
 * `requireAdmin()` inside its own boundary before reading any data.
 */
export default function AdminLayout({ children }: LayoutProps<"/admin">) {
  return (
    <div className="flex min-h-screen flex-1 flex-col bg-paper lg:flex-row">
      {/* The sidebar reads the pathname to mark the current section, which isn't
          known while the shell of a dynamic route (orders/[id]) is prerendered. */}
      <Suspense fallback={<div className="h-14 border-b lg:h-screen lg:w-60 lg:border-r lg:border-b-0" />}>
        <AdminSidebar
          footer={
            <Suspense fallback={<div className="h-10" />}>
              <SignedInUser />
            </Suspense>
          }
        />
      </Suspense>
      <main id="main" className="min-w-0 flex-1">
        <div className="mx-auto w-full max-w-[76rem] px-4 py-8 md:px-10 md:py-10">{children}</div>
      </main>
    </div>
  );
}

/** Who is signed in. Shows nothing to visitors the pages are about to turn away. */
async function SignedInUser() {
  const user = await getCurrentUser();
  if (!user?.isAdmin) return null;
  return (
    <div className="flex items-center gap-2.5 px-1">
      <span
        aria-hidden="true"
        className="flex size-8 shrink-0 items-center justify-center rounded-full bg-surface-strong text-[0.8125rem] font-medium"
      >
        {user.name.trim().charAt(0).toUpperCase() || "?"}
      </span>
      <span className="min-w-0">
        <span className="block truncate text-[0.8125rem] font-medium">{user.name}</span>
        <span className="block truncate text-[0.75rem] text-muted">{user.email}</span>
      </span>
    </div>
  );
}
