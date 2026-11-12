import Link from "next/link";
import { primaryNav } from "@/lib/catalog";
import { BagIcon, SearchIcon, UserIcon } from "./icons";
import { MobileMenu } from "./mobile-menu";

export function SiteHeader() {
  return (
    <>
      <div className="bg-ink py-2 text-center text-paper">
        <p className="text-eyebrow px-gutter">
          Complimentary shipping &amp; returns
        </p>
      </div>

      <header className="site-header px-gutter">
        {/* Left: drawer below lg, inline nav from lg */}
        <div className="flex items-center">
          <div className="lg:hidden">
            <MobileMenu items={primaryNav} />
          </div>
          <nav aria-label="Primary" className="hidden lg:block">
            <ul className="flex items-center gap-6 xl:gap-8">
              {primaryNav.map((item) => (
                <li key={item.href}>
                  <Link href={item.href} className="text-eyebrow link-quiet">
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </div>

        <Link href="/" className="wordmark" aria-label="Altiere home">
          Altiere
        </Link>

        <div className="flex items-center justify-end gap-1 md:gap-2">
          <Link href="/search" className="btn-icon" aria-label="Search">
            <SearchIcon />
          </Link>
          <Link href="/account" className="btn-icon hidden sm:inline-flex" aria-label="Account">
            <UserIcon />
          </Link>
          <Link href="/cart" className="btn-icon -mr-2" aria-label="Shopping bag, 0 items">
            <BagIcon />
          </Link>
        </div>
      </header>
    </>
  );
}
