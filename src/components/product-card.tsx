import Image from "next/image";
import Link from "next/link";
import { formatPrice, stockStatus, type Product } from "@/lib/catalog";

type Props = {
  product: Product;
  /** Responsive `sizes` for the image; defaults to the product-grid columns. */
  sizes?: string;
};

export function ProductCard({
  product,
  sizes = "(min-width: 64rem) 25vw, (min-width: 48rem) 33vw, 50vw",
}: Props) {
  const soldOut = stockStatus(product.stock) === "out_of_stock";
  const badge = soldOut ? "Sold out" : product.badge;

  return (
    <article className="group">
      {/* prefetch={true} resolves the product page's URL-specific content ahead of
          the click (it's static, so this is served from prerendered output). */}
      <Link href={`/products/${product.slug}`} prefetch={true} className="block">
        <div className="media-product">
          <Image
            src={product.image}
            alt={product.alt}
            fill
            sizes={sizes}
            className="group-hover:scale-[1.03]"
          />
          {badge && <span className="text-eyebrow absolute top-3 left-3">{badge}</span>}
        </div>
        <div className="mt-3 space-y-1 px-1 md:mt-4 md:px-0">
          <h3 className="text-product font-sans font-normal">{product.name}</h3>
          <p className="text-price">{formatPrice(product.price)}</p>
        </div>
      </Link>
    </article>
  );
}
