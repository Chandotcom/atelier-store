/**
 * Sample-image helper. Each preset is a fixed query string; next.config.ts
 * allow-lists exactly these, so adding a preset here is the only change needed.
 */
export const UNSPLASH_QUERY = {
  /** 4:5 crop, matches `media-product` */
  product: "?auto=format&fit=crop&w=1200&h=1500&q=80",
  /** 3:4 crop for editorial tiles and split features */
  portrait: "?auto=format&fit=crop&w=1600&h=2133&q=80",
  /** 4:5 close-ups (zoomed focal-point crops) for product galleries */
  detailUpper:
    "?auto=format&fit=crop&crop=focalpoint&fp-x=0.5&fp-y=0.3&fp-z=2&w=1200&h=1500&q=80",
  detailCenter:
    "?auto=format&fit=crop&crop=focalpoint&fp-x=0.5&fp-y=0.5&fp-z=1.8&w=1200&h=1500&q=80",
  detailLower:
    "?auto=format&fit=crop&crop=focalpoint&fp-x=0.5&fp-y=0.7&fp-z=2&w=1200&h=1500&q=80",
} as const;

export type UnsplashPreset = keyof typeof UNSPLASH_QUERY;

export function unsplash(id: string, preset: UnsplashPreset): string {
  return `https://images.unsplash.com/photo-${id}${UNSPLASH_QUERY[preset]}`;
}
