import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { nextCookies } from "better-auth/next-js";
import { after } from "next/server";

import { db, schema } from "@/db";
import { passwordResetEmail, sendEmail } from "./email";

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
    // Sent through Resend. Without RESEND_API_KEY the link is logged to the
    // server console instead (see src/lib/email.ts).
    sendResetPassword: async ({ user, url }) => {
      try {
        await sendEmail(passwordResetEmail({ to: user.email, url }));
      } catch (error) {
        console.error("[auth] Could not send the password reset email", error);
      }
    },
  },
  advanced: {
    // Better Auth runs email sends through this instead of awaiting them, so
    // the response time doesn't reveal whether an address has an account.
    // `after` keeps the send alive once the response has gone out.
    backgroundTasks: {
      handler: (promise) => {
        try {
          after(promise);
        } catch {
          // Outside a request there is nothing to wait for; the send still runs.
        }
      },
    },
  },
  plugins: [
    // Lets server actions set auth cookies. Keep this as the last plugin.
    nextCookies(),
  ],
});

export type Session = typeof auth.$Infer.Session;
