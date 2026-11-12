import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { nextCookies } from "better-auth/next-js";

import { db, schema } from "@/db";

/**
 * Better Auth server instance.
 *
 * BETTER_AUTH_SECRET and BETTER_AUTH_URL are read from the environment by
 * Better Auth itself. No sign-in methods are enabled yet — add
 * `emailAndPassword`, `socialProviders`, or plugins here when building auth.
 */
export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: "pg",
    schema,
  }),
  plugins: [
    // Lets server actions set auth cookies. Keep this as the last plugin.
    nextCookies(),
  ],
});

export type Session = typeof auth.$Infer.Session;
