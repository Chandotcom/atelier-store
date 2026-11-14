import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";

/*
 * Storefront chrome. Every customer-facing page lives in this route group so
 * the admin area (src/app/admin) can have its own shell without the store's
 * header and footer. The group name is not part of any URL.
 */
export default function StoreLayout({ children }: LayoutProps<"/">) {
  return (
    <>
      <SiteHeader />
      {children}
      <SiteFooter />
    </>
  );
}
