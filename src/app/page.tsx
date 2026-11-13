import Image from "next/image";
import Link from "next/link";
import { ChatIcon, GiftIcon, ReturnIcon, TruckIcon } from "@/components/icons";
import { ProductCard } from "@/components/product-card";
import { SectionHeader } from "@/components/section-header";
import {
  featuredCollections,
  heroImages,
  knitwearImage,
  tailoringImage,
} from "@/lib/catalog";
import { getAccessories, getNewArrivals } from "@/lib/products";

export default function Home() {
  return (
    <main id="main" className="flex-1">
      <Hero />
      <Intro />
      <CollectionTiles />
      <NewArrivals />
      <Feature
        eyebrow="The Knitwear Edit"
        title="Softness, made to last"
        body="Cashmere, alpaca and brushed cotton, knitted in small runs and finished by hand. Layering pieces built for the long season ahead."
        cta={{ label: "Shop knitwear", href: "/knitwear" }}
        image={knitwearImage}
      />
      <AccessoriesRow />
      <Feature
        reverse
        eyebrow="Tailoring"
        title="The considered suit"
        body="Half-canvassed jackets and trousers cut from Italian wool, with fittings available by appointment in every boutique."
        cta={{ label: "Shop ready-to-wear", href: "/ready-to-wear" }}
        image={tailoringImage}
      />
      <Services />
    </main>
  );
}

/* ── Sections ─────────────────────────────────────────────────────────── */

function Hero() {
  return (
    <section aria-labelledby="hero-title" className="relative">
      <div className="grid md:grid-cols-2">
        {heroImages.map((img, i) => (
          <div key={img.src} className={`media-hero ${i > 0 ? "hidden md:block" : ""}`}>
            <Image
              src={img.src}
              alt={img.alt}
              fill
              preload={i === 0}
              sizes="(min-width: 48rem) 50vw, 100vw"
              className="object-top"
            />
          </div>
        ))}
      </div>

      <div className="pointer-events-none absolute inset-0 bg-linear-to-t from-black/55 via-black/10 to-transparent" />

      <div className="absolute inset-x-0 bottom-0 pb-10 text-center text-paper md:pb-16">
        <div className="page-container flex flex-col items-center gap-4 md:gap-6">
          <p className="text-eyebrow">Autumn–Winter 2026</p>
          <h1 id="hero-title" className="heading-display max-w-4xl">
            The Quiet Season
          </h1>
          <div className="mt-1 flex w-full max-w-sm gap-2 sm:mt-2 sm:w-auto sm:max-w-none sm:gap-3">
            <Link href="/new" className="btn btn-inverse btn-sm flex-1 sm:btn-md sm:flex-none">
              New arrivals
            </Link>
            <Link href="/ready-to-wear" className="btn btn-inverse btn-sm flex-1 sm:btn-md sm:flex-none">
              Ready-to-wear
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}

function Intro() {
  return (
    <section className="prose-container section text-center">
      <p className="text-eyebrow text-muted">The collection</p>
      <h2 className="heading-headline mt-4">
        Wardrobe pieces in muted tones, cut generously and made to be worn for
        years.
      </h2>
      <Link href="/ready-to-wear" className="link-cta mt-8 inline-block">
        Discover the collection
      </Link>
    </section>
  );
}

function CollectionTiles() {
  return (
    <section aria-label="Shop by collection" className="editorial-grid">
      {featuredCollections.map((c) => (
        <Link
          key={c.slug}
          href={`/${c.slug}`}
          className="group relative block aspect-3/4 overflow-hidden bg-surface md:aspect-4/5"
        >
          <Image
            src={c.image}
            alt={c.alt}
            fill
            sizes="(min-width: 48rem) 50vw, 100vw"
            className="object-cover transition-transform duration-slow ease-luxe group-hover:scale-[1.03]"
          />
          <div className="absolute inset-0 bg-linear-to-t from-black/45 to-transparent to-50%" />
          <div className="absolute inset-x-0 bottom-0 flex flex-col items-center gap-3 p-8 text-center text-paper md:p-12">
            <p className="text-eyebrow">{c.eyebrow}</p>
            <h2 className="heading-headline">{c.title}</h2>
            <span className="link-cta">Explore</span>
          </div>
        </Link>
      ))}
    </section>
  );
}

async function NewArrivals() {
  const newArrivals = await getNewArrivals();
  return (
    <section aria-label="New arrivals" className="page-container section">
      <SectionHeader
        eyebrow="Just in"
        title="New arrivals"
        link={{ label: "View all", href: "/new" }}
      />
      {/* 8 items fill 2- and 4-col rows; trim to 6 at the 3-col breakpoint so no row is ragged */}
      <div className="product-grid md:max-lg:[&>*:nth-child(n+7)]:hidden">
        {newArrivals.map((p) => (
          <ProductCard key={p.id} product={p} />
        ))}
      </div>
    </section>
  );
}

function Feature({
  eyebrow,
  title,
  body,
  cta,
  image,
  reverse = false,
}: {
  eyebrow: string;
  title: string;
  body: string;
  cta: { label: string; href: string };
  image: { src: string; alt: string };
  reverse?: boolean;
}) {
  return (
    <section className="bg-surface">
      <div className="split gap-0!">
        <div className={`relative aspect-4/5 ${reverse ? "md:order-last" : ""}`}>
          <Image
            src={image.src}
            alt={image.alt}
            fill
            sizes="(min-width: 48rem) 50vw, 100vw"
            className="object-cover"
          />
        </div>
        <div className="px-gutter py-section md:px-[12%]">
          <p className="text-eyebrow text-muted">{eyebrow}</p>
          <h2 className="heading-headline mt-4">{title}</h2>
          <p className="text-lead text-muted mt-6 max-w-md">{body}</p>
          <Link href={cta.href} className="btn btn-secondary mt-10">
            {cta.label}
          </Link>
        </div>
      </div>
    </section>
  );
}

async function AccessoriesRow() {
  const accessories = await getAccessories();
  return (
    <section aria-label="Jewelry and accessories" className="page-container section">
      <SectionHeader
        eyebrow="Finishing touches"
        title="Jewelry & accessories"
        link={{ label: "Shop jewelry", href: "/fine-jewelry" }}
      />
      <div className="scroll-row -mx-gutter px-gutter md:mx-0 md:px-0">
        {accessories.map((p) => (
          <ProductCard
            key={p.id}
            product={p}
            sizes="(min-width: 64rem) 25vw, (min-width: 48rem) 33vw, 70vw"
          />
        ))}
      </div>
    </section>
  );
}

const services = [
  { icon: TruckIcon, title: "Complimentary shipping", body: "Delivered in signature packaging, on every order." },
  { icon: ReturnIcon, title: "Easy returns", body: "Return or exchange within 30 days, free of charge." },
  { icon: GiftIcon, title: "Gift wrapping", body: "Add a handwritten note and our gift box at checkout." },
  { icon: ChatIcon, title: "Client advisors", body: "Styling advice by chat, phone or appointment." },
];

function Services() {
  return (
    <section aria-label="Services" className="page-container section">
      <ul className="grid grid-cols-1 gap-10 sm:grid-cols-2 lg:grid-cols-4 lg:gap-8">
        {services.map(({ icon: Icon, title, body }) => (
          <li key={title} className="flex flex-col items-center text-center">
            <Icon className="size-7" />
            <h3 className="text-label mt-5">{title}</h3>
            <p className="text-muted mt-2 max-w-60">{body}</p>
          </li>
        ))}
      </ul>
    </section>
  );
}
