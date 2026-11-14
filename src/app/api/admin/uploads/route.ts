import { handleUpload, type HandleUploadBody } from "@vercel/blob/client";
import { NextResponse } from "next/server";

import { PRODUCT_IMAGE_PREFIX } from "@/lib/blob";
import { isAdminRequest } from "@/lib/session";

/*
 * Issues short-lived Vercel Blob upload tokens for product images. The admin's
 * browser then sends the file straight to Blob (`upload()` from
 * `@vercel/blob/client`), so it never passes through this function and the
 * 4.5 MB function body limit doesn't apply.
 *
 * This is a public endpoint: the admin check below is what protects it. The
 * uploaded URL only reaches the catalog when `saveProduct` stores it, and it
 * validates the host and folder again. Files are never deleted here: order
 * lines keep a copy of the image URL, so a blob must outlive the product.
 */

/** The browser re-encodes photos before uploading, so these are generous. */
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/avif"];
const MAX_BYTES = 10 * 1024 * 1024;
/** `products/<cleaned file name>.<ext>`; Blob adds a random suffix, so every upload gets a new URL. */
const PATHNAME = new RegExp(`^${PRODUCT_IMAGE_PREFIX}[a-z0-9-]{1,60}\\.(?:jpg|jpeg|png|webp|avif)$`);

class UploadRefused extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
  }
}

export async function POST(request: Request): Promise<NextResponse> {
  // Admins only, before anything else, so others learn nothing about the setup.
  if (!(await isAdminRequest())) {
    return NextResponse.json({ error: "You don't have access to do that. Sign in again as an admin." }, { status: 403 });
  }

  let body: HandleUploadBody;
  try {
    body = (await request.json()) as HandleUploadBody;
  } catch {
    return NextResponse.json({ error: "The upload request is invalid." }, { status: 400 });
  }
  // Only token requests. We don't register completion callbacks: the URL is
  // saved by `saveProduct`, which also works on localhost, where Blob can't call back.
  if (body?.type !== "blob.generate-client-token") {
    return NextResponse.json({ error: "The upload request is invalid." }, { status: 400 });
  }

  const token = process.env.BLOB_READ_WRITE_TOKEN;
  if (!token) {
    return NextResponse.json(
      { error: "Image uploads aren't set up: BLOB_READ_WRITE_TOKEN is missing." },
      { status: 503 },
    );
  }

  try {
    const result = await handleUpload({
      token,
      request,
      body,
      onBeforeGenerateToken: async (pathname) => {
        if (!PATHNAME.test(pathname)) throw new UploadRefused("The file name is invalid.", 400);
        return {
          allowedContentTypes: ALLOWED_TYPES,
          maximumSizeInBytes: MAX_BYTES,
          addRandomSuffix: true,
          allowOverwrite: false,
          validUntil: Date.now() + 10 * 60 * 1000,
        };
      },
    });
    return NextResponse.json(result);
  } catch (error) {
    if (error instanceof UploadRefused) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    console.error("Image upload token failed", error);
    return NextResponse.json({ error: "The upload couldn't be started. Please try again." }, { status: 500 });
  }
}
