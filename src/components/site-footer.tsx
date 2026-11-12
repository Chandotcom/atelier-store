import Link from "next/link";
import { NewsletterForm } from "./newsletter-form";

const columns = [
  {
    title: "Client services",
    links: [
      { label: "Contact us", href: "/services/contact" },
      { label: "Shipping", href: "/services/shipping" },
      { label: "Returns & exchanges", href: "/services/returns" },
      { label: "Order tracking", href: "/services/orders" },
      { label: "Care guide", href: "/services/care" },
    ],
  },
  {
    title: "The house",
    links: [
      { label: "Our story", href: "/about" },
      { label: "Craftsmanship", href: "/about/craft" },
      { label: "Sustainability", href: "/about/sustainability" },
      { label: "Careers", href: "/careers" },
    ],
  },
  {
    title: "Legal",
    links: [
      { label: "Privacy policy", href: "/legal/privacy" },
      { label: "Terms of sale", href: "/legal/terms" },
      { label: "Cookie settings", href: "/legal/cookies" },
      { label: "Accessibility", href: "/legal/accessibility" },
    ],
  },
];

export function SiteFooter() {
  return (
    <footer className="bg-ink text-paper">
      <div className="page-container section">
        <div className="grid gap-12 lg:grid-cols-12">
          <div className="lg:col-span-5">
            <h2 className="heading-title">Join the Altiere list</h2>
            <p className="mt-3 max-w-sm text-white/70">
              New collections, private appointments and early access, delivered
              occasionally.
            </p>
            <div className="mt-6 max-w-md">
              <NewsletterForm />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-10 sm:grid-cols-3 lg:col-span-6 lg:col-start-7">
            {columns.map((col) => (
              <nav key={col.title} aria-label={col.title}>
                <h3 className="text-eyebrow text-white/60">{col.title}</h3>
                <ul className="mt-5 space-y-3">
                  {col.links.map((l) => (
                    <li key={l.href}>
                      <Link href={l.href} className="link-quiet text-body">
                        {l.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </nav>
            ))}
          </div>
        </div>

        <div className="mt-16 flex flex-col gap-6 border-t border-white/20 pt-8 md:flex-row md:items-center md:justify-between">
          <span className="wordmark text-paper">Altiere</span>
          <p className="text-eyebrow text-white/60">
            United States · English · USD
          </p>
          <p className="text-eyebrow text-white/60">© Altiere. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
