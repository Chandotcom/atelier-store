// Drizzle schema barrel.
//
// Export every table from this file so both the app (`src/db/index.ts`) and
// drizzle-kit (`drizzle.config.ts`) see the same schema.
//
// Better Auth tables can be generated with `npm run auth:generate`, which
// writes `src/db/schema/auth.ts`. Then re-export it here:
//
//   export * from "./auth";

export * from "./catalog";
