import { getCurrentUser } from "@/lib/session";
import { getWishlistProductIds } from "@/lib/wishlist-data";

/** The current visitor's saved product ids, for the browser store in `src/lib/wishlist.ts`. */
export async function GET() {
  const user = await getCurrentUser();
  const body = user
    ? { signedIn: true, ids: await getWishlistProductIds(user.id) }
    : { signedIn: false, ids: [] };
  return Response.json(body, { headers: { "Cache-Control": "private, no-store" } });
}
