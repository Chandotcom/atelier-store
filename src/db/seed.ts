/*
 * Development seed: the sample Altiere catalog.
 *
 *   npm run db:seed
 *
 * This DELETES every row in categories, products and product_stock, then
 * inserts the sample data. Run it only against a development database.
 */
import { loadEnvConfig } from "@next/env";

import { unsplash, type UnsplashPreset } from "@/lib/unsplash";
import { db } from "./index";
import { categories, productStock, products } from "./schema";

// Load .env / .env.local the same way Next.js does. `db` connects lazily, so
// this runs before the first query.
loadEnvConfig(process.cwd());

type DetailCrop = Extract<UnsplashPreset, `detail${string}`>;

const categorySeed = {
  rtw: { slug: "ready-to-wear", name: "Ready-to-wear" },
  knitwear: { slug: "knitwear", name: "Knitwear" },
  bags: { slug: "bags", name: "Bags" },
  shoes: { slug: "shoes", name: "Shoes" },
  jewelry: { slug: "fine-jewelry", name: "Fine jewelry" },
  watches: { slug: "watches", name: "Watches" },
  eyewear: { slug: "eyewear", name: "Eyewear" },
};

type ProductSeed = {
  slug: string;
  name: string;
  category: keyof typeof categorySeed;
  /** Price in minor units (cents). */
  price: number;
  styleCode: string;
  color: string;
  badge?: string;
  photo: string;
  /** Close-up crops of the same photo, chosen to avoid third-party labels. */
  crops: DetailCrop[];
  alt: string;
  description: string;
  details: string[];
  /** Stock per size, in display order. Omit for one-size products. */
  sizes?: [label: string, quantity: number][];
  /** Stock for one-size products. */
  stock?: number;
};

const RTW_CARE = "Dry clean only. Store on a padded hanger away from direct light.";

// Listed newest first: `created_at` is staggered in this order.
const productSeed: ProductSeed[] = [
  {
    slug: "silk-bomber-jacket",
    name: "Washed silk bomber jacket",
    category: "rtw",
    price: 189000,
    styleCode: "AL-2611-RTW",
    color: "Terracotta",
    badge: "New",
    photo: "1591047139829-d91aecb6caea",
    crops: ["detailCenter", "detailLower"],
    alt: "Terracotta bomber jacket on a hanger",
    description:
      "A relaxed bomber cut from washed silk twill with a soft, lived-in hand. Ribbed collar, cuffs and hem keep the shape clean; the lining is lightweight cupro for easy layering.",
    details: ["100% silk, cupro lining", "Two-way front zip", "Ribbed collar, cuffs and hem", "Relaxed fit", RTW_CARE, "Made in Italy"],
    sizes: [["XS", 4], ["S", 6], ["M", 5], ["L", 3], ["XL", 0]],
  },
  {
    slug: "nappa-biker-jacket",
    name: "Nappa leather biker jacket",
    category: "rtw",
    price: 420000,
    styleCode: "AL-2604-RTW",
    color: "Black",
    badge: "New",
    photo: "1521223890158-f9f7c3d5d504",
    crops: ["detailCenter", "detailLower"],
    alt: "Close-up of a black leather biker jacket worn over a black tee",
    description:
      "Our signature biker in supple lambskin nappa, cut close through the body with an asymmetric zip and snap-down lapels. Lined in silk for a smooth glide over knitwear.",
    details: ["100% lambskin leather, silk lining", "Asymmetric front zip", "Zipped cuffs and pockets", "Slim fit; size up for layering", "Specialist leather clean only", "Made in Italy"],
    sizes: [["XS", 0], ["S", 1], ["M", 2], ["L", 0], ["XL", 0]],
  },
  {
    slug: "fringed-knit-cape",
    name: "Fringed cotton knit cape",
    category: "knitwear",
    price: 112000,
    styleCode: "AL-2618-KNT",
    color: "Ivory",
    photo: "1434389677669-e08b4cac3105",
    crops: ["detailUpper", "detailLower"],
    alt: "Ivory knit cape with fringed hem on a hanger",
    description:
      "An open-stitch cape in organic cotton, finished with a hand-knotted fringe. Drapes from the shoulder with a soft V-neck and works over everything from tailoring to a slip dress.",
    details: ["100% organic cotton", "Hand-knotted fringe", "One size", "Hand wash cold, dry flat", "Made in Portugal"],
    stock: 9,
  },
  {
    slug: "cady-jogger-trouser",
    name: "Cady jogger trouser",
    category: "rtw",
    price: 98000,
    styleCode: "AL-2622-RTW",
    color: "Blush",
    photo: "1594633312681-425c7b97ccd1",
    crops: ["detailUpper", "detailLower"],
    alt: "Model wearing blush pink tapered trousers",
    description:
      "Tailored joggers in fluid triacetate cady, with pressed creases, slant pockets and gathered cuffs. Elegant enough for the evening, comfortable enough for travel.",
    details: ["Triacetate and polyester cady", "Elasticated back waistband", "Slant pockets, pressed creases", "Tapered leg with gathered cuff", RTW_CARE, "Made in Italy"],
    sizes: [["XS", 3], ["S", 8], ["M", 7], ["L", 4], ["XL", 2]],
  },
  {
    slug: "woven-top-handle-bag",
    name: "Woven top handle bag",
    category: "bags",
    price: 265000,
    styleCode: "AL-2630-BAG",
    color: "Tangerine",
    badge: "New",
    photo: "1590874103328-eac38a683ce7",
    crops: ["detailCenter", "detailLower"],
    alt: "Orange woven handbag with leather flap",
    description:
      "A structured handbag pairing a hand-woven body with a smooth calfskin flap and rolled top handle. Turn-lock closure in polished palladium.",
    details: ["Hand-woven calfskin, calfskin trim", "Suede lining, one interior pocket", "Turn-lock closure", "W 24 × H 20 × D 11 cm", "Dust bag included", "Made in Italy"],
    stock: 6,
  },
  {
    slug: "floral-satin-pump",
    name: "Floral satin pump",
    category: "shoes",
    price: 89000,
    styleCode: "AL-2641-SHO",
    color: "Azure floral",
    photo: "1543163521-1bf539c55dd2",
    crops: ["detailUpper", "detailLower"],
    alt: "Pair of floral print stiletto pumps",
    description:
      "A pointed pump in printed duchess satin on a slender 100mm heel. The leather sole is stitched by hand and lightly padded through the insole.",
    details: ["Silk satin upper, leather lining and sole", "100mm heel", "Pointed toe", "Fits true to size", "Made in Italy"],
    sizes: [["36", 2], ["37", 0], ["38", 4], ["39", 1], ["40", 0], ["41", 3]],
  },
  {
    slug: "structured-mini-bag",
    name: "Structured leather mini bag",
    category: "bags",
    price: 310000,
    styleCode: "AL-2633-BAG",
    color: "Teal",
    photo: "1594223274512-ad4803739b7c",
    crops: ["detailCenter", "detailLower"],
    alt: "Teal grained leather top handle bag with gold clasp",
    description:
      "A compact top handle bag in grained calfskin with a structured flap and push-lock clasp. Carry it by hand or on the detachable shoulder strap.",
    details: ["Grained calfskin", "Detachable shoulder strap", "Leather lining, card slot", "W 20 × H 17 × D 9 cm", "Dust bag included", "Made in Italy"],
    stock: 0,
  },
  {
    slug: "brushed-cotton-sweatshirt",
    name: "Brushed cotton sweatshirt",
    category: "rtw",
    price: 69000,
    styleCode: "AL-2650-RTW",
    color: "Optic white",
    photo: "1620799140408-edc6dcb6d633",
    crops: ["detailUpper", "detailLower"],
    alt: "White crewneck sweatshirt on a grey surface",
    description:
      "A heavyweight crewneck in loopback cotton, brushed on the inside for warmth. Dropped shoulders and a ribbed hem give it an easy, boxy shape.",
    details: ["100% cotton, 480gsm", "Brushed interior", "Boxy fit", "Machine wash cold", "Made in Portugal"],
    sizes: [["XS", 10], ["S", 14], ["M", 12], ["L", 9], ["XL", 6]],
  },
  {
    slug: "sapphire-drop-earrings",
    name: "Sapphire drop earrings",
    category: "jewelry",
    price: 540000,
    styleCode: "AL-2670-JWL",
    color: "White gold, sapphire",
    photo: "1535632066927-ab7c9ab60908",
    crops: ["detailCenter", "detailLower"],
    alt: "Silver earrings set with blue stones on a leaf",
    description:
      "Pear-cut sapphires framed by baguette and round diamonds, set in 18k white gold. A statement pair that moves beautifully with the light.",
    details: ["18k white gold", "Sapphires and diamonds", "Post and butterfly back", "Length 4.2 cm", "Presented in an Altiere box"],
    stock: 2,
  },
  {
    slug: "crescent-pendant",
    name: "Crescent pendant necklace",
    category: "jewelry",
    price: 128000,
    styleCode: "AL-2672-JWL",
    color: "Yellow gold",
    photo: "1599643478518-a784e5dc4c8f",
    crops: ["detailUpper", "detailLower"],
    alt: "Gold chain necklace with crescent pendant",
    description:
      "A layered pair of fine chains in 18k yellow gold: one with a faceted topaz drop, the other with a crescent pendant dotted with diamonds.",
    details: ["18k yellow gold", "London blue topaz and diamonds", "Adjustable 40–45 cm", "Presented in an Altiere box"],
    stock: 7,
  },
  {
    slug: "halo-solitaire-ring",
    name: "Halo solitaire ring",
    category: "jewelry",
    price: 760000,
    styleCode: "AL-2675-JWL",
    color: "Rose and white gold",
    photo: "1605100804763-247f67b3557e",
    crops: ["detailCenter", "detailUpper"],
    alt: "Diamond halo ring on a dark surface",
    description:
      "A round brilliant centre stone wrapped in a halo of pavé diamonds, on a split shank of white gold with a rose gold crown.",
    details: ["18k white and rose gold", "Diamonds, 1.2ct total", "Split shank, pavé setting", "Complimentary resizing", "Presented in an Altiere box"],
    sizes: [["5", 0], ["6", 1], ["7", 0], ["8", 0]],
  },
  {
    slug: "minimal-dial-watch",
    name: "Minimal dial watch, 36mm",
    category: "watches",
    price: 145000,
    styleCode: "AL-2680-WCH",
    color: "Rose gold, taupe",
    photo: "1524592094714-0f0654e20314",
    crops: ["detailCenter", "detailUpper"],
    alt: "Watch with white dial and taupe leather strap held in hand",
    description:
      "A slim 36mm case in rose gold-tone steel with a lacquered white dial and baton hands. Swiss quartz movement on a suede strap.",
    details: ["Rose gold-tone stainless steel, 36mm", "Swiss quartz movement", "Sapphire crystal", "Water resistant to 30m", "Two-year warranty"],
    stock: 11,
  },
  {
    slug: "round-metal-sunglasses",
    name: "Round metal sunglasses",
    category: "eyewear",
    price: 52000,
    styleCode: "AL-2690-EYE",
    color: "Gold, green",
    photo: "1511499767150-a48a237f0083",
    crops: ["detailCenter", "detailLower"],
    alt: "Gold round sunglasses with green lenses",
    description:
      "A fine round frame in gold-finish titanium with mineral glass lenses in bottle green. Adjustable nose pads and acetate temple tips.",
    details: ["Titanium frame, mineral glass lenses", "100% UV protection", "Adjustable nose pads", "Case and cloth included", "Made in Japan"],
    stock: 14,
  },
];

async function main() {
  // neon-http has no interactive transactions; a batch runs as one transaction.
  // Deleting categories last satisfies the products → categories RESTRICT rule.
  await db.batch([
    db.delete(productStock),
    db.delete(products),
    db.delete(categories),
  ]);

  const insertedCategories = await db
    .insert(categories)
    .values(Object.values(categorySeed))
    .returning({ id: categories.id, slug: categories.slug });
  const categoryIdBySlug = new Map(insertedCategories.map((c) => [c.slug, c.id]));

  const now = Date.now();
  const insertedProducts = await db
    .insert(products)
    .values(
      productSeed.map((p, i) => ({
        slug: p.slug,
        name: p.name,
        categoryId: categoryIdBySlug.get(categorySeed[p.category].slug)!,
        priceCents: p.price,
        styleCode: p.styleCode,
        color: p.color,
        description: p.description,
        details: p.details,
        images: [
          { src: unsplash(p.photo, "product"), alt: p.alt },
          ...p.crops.map((c) => ({ src: unsplash(p.photo, c), alt: `${p.name}, detail` })),
        ],
        badge: p.badge ?? null,
        // One minute apart, first in the list newest.
        createdAt: new Date(now - i * 60_000),
      })),
    )
    .returning({ id: products.id, slug: products.slug });
  const productIdBySlug = new Map(insertedProducts.map((p) => [p.slug, p.id]));

  const stockRows = productSeed.flatMap((p): (typeof productStock.$inferInsert)[] => {
    const productId = productIdBySlug.get(p.slug)!;
    return p.sizes
      ? p.sizes.map(([size, quantity], position) => ({ productId, size, quantity, position }))
      : [{ productId, size: null, quantity: p.stock ?? 0, position: 0 }];
  });
  await db.insert(productStock).values(stockRows);

  console.log(
    `Seeded ${insertedCategories.length} categories, ${insertedProducts.length} products, ${stockRows.length} stock rows.`,
  );
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
