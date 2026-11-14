import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { nextCookies } from "better-auth/next-js";

import { db, schema } from "@/db";

/**
 * Better Auth server instance.
 *
 * BETTER_AUTH_SECRET and BETTER_AUTH_URL are read from the environment by
 * Better Auth itself. Customers sign in with email and password; email
 * verification is not required yet.
 */
export const auth = betterAuth({
  appName: "Altiere",
  database: drizzleAdapter(db, {
    provider: "pg",
    schema,
  }),
  emailAndPassword: {
    enabled: true,
    // Fail explicitly until an email delivery provider is configured.
    sendResetPassword: async () => {
      throw new Error("Password reset email delivery is not configured.");
    },
  },
  plugins: [
    // Lets server actions set auth cookies. Keep this as the last plugin.
    nextCookies(),
  ],
});

export type Session = typeof auth.$Infer.Session;
