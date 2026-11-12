import { neon } from "@neondatabase/serverless";
import { drizzle, type NeonHttpDatabase } from "drizzle-orm/neon-http";

import { env } from "@/lib/env";
import * as schema from "./schema";

type Database = NeonHttpDatabase<typeof schema>;

let instance: Database | undefined;

function getDb(): Database {
  instance ??= drizzle({ client: neon(env.DATABASE_URL), schema });
  return instance;
}

/**
 * Drizzle client over Neon's serverless HTTP driver.
 *
 * Created on first use, so importing this module never requires
 * DATABASE_URL to be set (e.g. during `next build`).
 */
export const db = new Proxy({} as Database, {
  get(_target, prop) {
    const real = getDb();
    const value = Reflect.get(real, prop, real);
    return typeof value === "function" ? value.bind(real) : value;
  },
});

export { schema };
