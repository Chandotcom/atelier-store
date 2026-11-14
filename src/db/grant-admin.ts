/*
 * Makes an existing account an admin, or takes the role away again.
 *
 *   npm run admin:grant -- someone@example.com
 *   npm run admin:grant -- someone@example.com --revoke
 *
 * The account must already exist (sign up on the site first). This is the
 * only way to create the first admin; there is no screen for it.
 */
import { loadEnvConfig } from "@next/env";
import { eq } from "drizzle-orm";

import { db } from "./index";
import { user } from "./schema";

// Load .env / .env.local the same way Next.js does. `db` connects lazily.
loadEnvConfig(process.cwd());

async function main() {
  const args = process.argv.slice(2);
  const revoke = args.includes("--revoke");
  const email = args.find((a) => !a.startsWith("--"))?.trim().toLowerCase();
  if (!email) {
    console.error("Usage: npm run admin:grant -- <email> [--revoke]");
    process.exit(1);
  }

  const updated = await db
    .update(user)
    .set({ role: revoke ? "user" : "admin" })
    .where(eq(user.email, email))
    .returning({ email: user.email });

  if (updated.length === 0) {
    console.error(`No account found for ${email}. Sign up on the site first.`);
    process.exit(1);
  }
  console.log(revoke ? `${email} is no longer an admin.` : `${email} is now an admin.`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
