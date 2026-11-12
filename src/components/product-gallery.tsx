"use client";

import Image from "next/image";
import { useRef, useState } from "react";
import type { ProductImage } from "@/lib/catalog";

/**
 * Mobile/tablet: full-width swipe carousel with a position counter.
 * Desktop (lg): images stacked in a 2-column grid; with an odd count the
 * first image spans both columns so no row is half empty.
 */
export function ProductGallery({ images }: { images: ProductImage[] }) {
  const track = useRef<HTMLDivElement>(null);
  const [index, setIndex] = useState(0);
  const spanFirst = images.length % 2 === 1;

  return (
    <div className="relative">
      <div
        ref={track}
        onScroll={(e) => {
          const el = e.currentTarget;
          setIndex(Math.round(el.scrollLeft / el.clientWidth));
        }}
        className="flex snap-x snap-mandatory overflow-x-auto overscroll-x-contain [scrollbar-width:none] lg:grid lg:grid-cols-2 lg:gap-1 lg:overflow-visible [&::-webkit-scrollbar]:hidden"
        aria-label="Product images"
        role="region"
        tabIndex={0}
      >
        {images.map((img, i) => {
          const wide = i === 0 && spanFirst;
          return (
            <div
              key={img.src}
              className={`media-product w-full shrink-0 snap-start ${wide ? "lg:col-span-2" : ""}`}
            >
              <Image
                src={img.src}
                alt={img.alt}
                fill
                preload={i === 0}
                sizes={wide ? "(min-width: 64rem) 58vw, 100vw" : "(min-width: 64rem) 29vw, 100vw"}
              />
            </div>
          );
        })}
      </div>

      {images.length > 1 && (
        <>
          <p className="text-eyebrow absolute right-gutter bottom-4 bg-paper/80 px-2 py-1 lg:hidden" aria-hidden="true">
            {index + 1} / {images.length}
          </p>
          <div className="absolute inset-x-0 bottom-5 flex justify-center gap-1.5 lg:hidden">
            {images.map((img, i) => (
              <button
                key={img.src}
                type="button"
                aria-label={`Show image ${i + 1} of ${images.length}`}
                aria-current={i === index}
                onClick={() =>
                  track.current?.scrollTo({ left: i * track.current.clientWidth, behavior: "smooth" })
                }
                className={`h-0.5 w-6 transition-colors ${i === index ? "bg-ink" : "bg-ink/25"}`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
