import { headers } from "next/headers";

import { auth } from "./auth";

/*
 * Session reads for Server Components and Server Actions. Server-only.
 *
 * These read the request, so with `cacheComponents` a component that calls
 * them must render inside <Suspense> (never at a layout's top level).
 */

export type CurrentUser = {
  id: string;
  name: string;
  email: string;
  createdAt: Date;
};

/** The signed-in customer, or null. Returns only the fields the UI needs. */
export async function getCurrentUser(): Promise<CurrentUser | null> {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return null;
  const { id, name, email, createdAt } = session.user;
  return { id, name, email, createdAt };
}
