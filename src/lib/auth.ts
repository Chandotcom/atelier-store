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
    // No email provider is connected yet, so the reset link is only logged
    // to the server console. Replace this with a real send before launch.
    sendResetPassword: async ({ user, url }) => {
      console.log(`[auth] Password reset link for ${user.email}: ${url}`);
    },
  },
  plugins: [
    // Lets server actions set auth cookies. Keep this as the last plugin.
    nextCookies(),
  ],
});

export type Session = typeof auth.$Infer.Session;
