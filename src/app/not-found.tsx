import Link from "next/link";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";

/*
 * The one not-found page for the whole site. It replaces whichever layout the
 * missing page was in (storefront or admin), so it brings the store's header
 * and footer itself.
 */
export default function NotFound() {
  return (
    <>
      <SiteHeader />
      <main id="main" className="prose-container section flex flex-1 flex-col items-center justify-center text-center">
        <p className="text-eyebrow text-muted">Page not found</p>
        <h1 className="heading-headline mt-4">This page isn&rsquo;t available</h1>
        <p className="text-muted mt-4 max-w-sm">
          The link may be out of date, or the page may have moved.
        </p>
        <Link href="/" className="btn btn-primary mt-10">
          Return to the homepage
        </Link>
      </main>
      <SiteFooter />
    </>
  );
}
