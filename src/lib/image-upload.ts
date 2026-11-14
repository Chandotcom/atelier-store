import { put } from "@vercel/blob/client";
import { PRODUCT_IMAGE_PREFIX } from "@/lib/blob";

/*
 * Browser side of product image uploads. A photo is decoded, cropped to the
 * storefront's 4:5 frame (`media-product`), scaled down and re-encoded on a
 * canvas, which also drops EXIF data such as GPS location. The result goes
 * straight to Vercel Blob with a token from /api/admin/uploads.
 */

/** Matches `media-product` and the Unsplash `product` preset (1200×1500). */
const ASPECT = 4 / 5;
const MAX_WIDTH = 1600;
/** Below this the product page (up to 58vw) looks soft on large screens. */
export const MIN_RECOMMENDED_WIDTH = 1200;
const UPLOAD_ROUTE = "/api/admin/uploads";

export type PreparedImage = {
  blob: Blob;
  /** Width of the cropped area in the original photo, before scaling. */
  sourceWidth: number;
  extension: "webp" | "jpg";
};

/** Crops the centre of the photo to 4:5, scales it to at most 1600 px wide and re-encodes it. */
export async function prepareImage(file: File): Promise<PreparedImage> {
  let bitmap: ImageBitmap;
  try {
    bitmap = await createImageBitmap(file, { imageOrientation: "from-image" });
  } catch {
    throw new Error(`${file.name} couldn't be read. Use a JPEG, PNG, WebP or AVIF photo.`);
  }

  try {
    let cropW = bitmap.width;
    let cropH = Math.round(cropW / ASPECT);
    if (cropH > bitmap.height) {
      cropH = bitmap.height;
      cropW = Math.round(cropH * ASPECT);
    }
    const sx = Math.round((bitmap.width - cropW) / 2);
    const sy = Math.round((bitmap.height - cropH) / 2);

    const width = Math.min(cropW, MAX_WIDTH);
    const height = Math.round(width / ASPECT);
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const context = canvas.getContext("2d");
    if (!context) throw new Error("Your browser couldn't process this photo.");
    context.imageSmoothingQuality = "high";
    context.drawImage(bitmap, sx, sy, cropW, cropH, 0, 0, width, height);

    // Not every browser can encode WebP; it then returns PNG, so fall back to JPEG.
    const webp = await toBlob(canvas, "image/webp", 0.88);
    if (webp?.type === "image/webp") return { blob: webp, sourceWidth: cropW, extension: "webp" };
    const jpeg = await toBlob(canvas, "image/jpeg", 0.88);
    if (!jpeg) throw new Error("Your browser couldn't process this photo.");
    return { blob: jpeg, sourceWidth: cropW, extension: "jpg" };
  } finally {
    bitmap.close();
  }
}

function toBlob(canvas: HTMLCanvasElement, type: string, quality: number): Promise<Blob | null> {
  return new Promise((resolve) => canvas.toBlob(resolve, type, quality));
}

/** `products/<file-name-stem>.<ext>`, the only shape the upload route accepts. */
function pathnameFor(fileName: string, extension: string): string {
  const stem =
    fileName
      .replace(/\.[^.]*$/, "")
      .toLowerCase()
      .normalize("NFKD")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 60) || "image";
  return `${PRODUCT_IMAGE_PREFIX}${stem}.${extension}`;
}

/** Uploads a prepared image and returns its public URL. */
export async function uploadProductImage(
  fileName: string,
  image: PreparedImage,
  options: { onProgress?: (percentage: number) => void; signal?: AbortSignal } = {},
): Promise<string> {
  const pathname = pathnameFor(fileName, image.extension);

  // Asking for the token ourselves (rather than `upload()`) lets us show the
  // route's own reason when it refuses, such as a signed-out admin.
  const res = await fetch(UPLOAD_ROUTE, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      type: "blob.generate-client-token",
      payload: { pathname, clientPayload: null, multipart: false },
    }),
    signal: options.signal,
  });
  const data = (await res.json().catch(() => null)) as { clientToken?: string; error?: string } | null;
  if (!res.ok || !data?.clientToken) {
    throw new Error(data?.error ?? "The upload couldn't be started. Please try again.");
  }

  const blob = await put(pathname, image.blob, {
    access: "public",
    token: data.clientToken,
    contentType: image.blob.type,
    abortSignal: options.signal,
    onUploadProgress: ({ percentage }) => options.onProgress?.(percentage),
  });
  return blob.url;
}
