import { headers } from "next/headers";
import { notFound, redirect } from "next/navigation";

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
  /** Staff accounts can open /admin. Set with `npm run admin:grant <email>`. */
  isAdmin: boolean;
};

/** The role value the Better Auth admin plugin treats as an administrator. */
export const ADMIN_ROLE = "admin";

/** The signed-in customer, or null. Returns only the fields the UI needs. */
export async function getCurrentUser(): Promise<CurrentUser | null> {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return null;
  const { id, name, email, createdAt, role } = session.user;
  // A user can hold several comma-separated roles.
  const isAdmin = (role ?? "").split(",").includes(ADMIN_ROLE);
  return { id, name, email, createdAt, isAdmin };
}

/**
 * For admin pages. Sends signed-out visitors to sign in, and shows everyone
 * else who isn't an admin the not-found page, so the admin area isn't
 * advertised. Call it before reading any admin data.
 */
export async function requireAdmin(): Promise<CurrentUser> {
  const user = await getCurrentUser();
  if (!user) redirect("/sign-in");
  if (!user.isAdmin) notFound();
  return user;
}

/** For admin Server Actions, which answer with a result instead of redirecting. */
export async function isAdminRequest(): Promise<boolean> {
  return (await getCurrentUser())?.isAdmin ?? false;
}
