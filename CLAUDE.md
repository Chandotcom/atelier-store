# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

@AGENTS.md

The import above is the Next.js-managed agent note: this is Next.js 16.4, whose APIs differ from older versions. Check `node_modules/next/dist/docs/` before writing Next-specific code.

## Commands

```bash
npm run dev            # dev server (Turbopack)
npm run build          # production build — also runs the TypeScript check
npm run typecheck      # tsc --noEmit
npm run lint           # eslint (flat config, eslint-config-next)

npm run auth:secret    # print a BETTER_AUTH_SECRET
npm run auth:generate  # Better Auth CLI → writes src/db/schema/auth.ts from src/lib/auth.ts
npm run db:generate    # drizzle-kit: SQL migrations into ./drizzle
npm run db:migrate     # apply migrations
npm run db:push        # push schema without migrations (prototyping)
npm run db:studio      # Drizzle Studio
npm run db:seed        # WIPES categories/products/product_stock, then loads the sample catalog (dev only)
```

There is no test framework yet. Use npm (there's a `package-lock.json`). Env vars go in `.env.local`; `.env.example` lists the variables.

## Stack

Next.js 16 App Router · TypeScript (strict, `@/*` → `src/*`) · Tailwind CSS v4 (configured in `src/app/globals.css`; there is no `tailwind.config`) · Better Auth 1.7 · Drizzle ORM over Neon's HTTP driver (`drizzle-orm/neon-http`).

## Architecture

The dependency direction is `src/app` → `src/lib` → `src/db`.

- **Auth request path:** `src/app/api/auth/[...all]/route.ts` passes requests to `toNextJsHandler(auth)`. `auth` is created in `src/lib/auth.ts` with `drizzleAdapter(db, { provider: "pg", schema })`, so Better Auth stores users and sessions through the same Drizzle client as the app. `nextCookies()` must stay the **last** plugin, because it lets Server Actions set auth cookies. Browser code uses `authClient` from `src/lib/auth-client.ts`, which talks to the same origin.
- **Auth UI and session reads.** The forms in `src/components/auth/` are client components that call `authClient`; their pages live in the `src/app/(auth)/` route group (`/sign-in`, `/sign-up`, `/forgot-password`, `/reset-password`). Server code reads the signed-in customer with `getCurrentUser()` from `src/lib/session.ts`, as `/account` does inside `<Suspense>`.
- **The DB client is lazy.** `db` in `src/db/index.ts` is a Proxy that builds the Neon/Drizzle client on first property access and binds methods to the real instance. Because of this, importing anything in the auth/db chain needs no env vars. Keep it this way, and don't read env at module top level in this chain. (`next build` itself does need `DATABASE_URL` and a migrated, seeded database: the home and product pages are prerendered from it, and `generateStaticParams` must return at least one slug.)
- **Catalog data is split in two.** `src/lib/products.ts` holds the DB queries (server-only, each one `'use cache'` + `cacheTag("products")` + `cacheLife("hours")`) and maps rows to the `Product` type. `src/lib/catalog.ts` holds that type, the pure helpers (`formatPrice`, `stockStatus`) and editorial content, and is what client components import. Don't import `@/db` or `products.ts` from a client component. Code that writes products or stock must call `updateTag(PRODUCTS_TAG)`.
- **Stock is per size.** `product_stock` has one row per size, or a single row with `size` NULL for one-size products. A product's total is summed in `toProduct()`, not stored.
- **One schema barrel.** `src/db/schema/index.ts` is read by the app (`db`), by Better Auth's adapter and by drizzle-kit (`drizzle.config.ts`). Every new table file must be re-exported from it, or none of them will see it.
- **`drizzle.config.ts` loads env with `@next/env`'s `loadEnvConfig`**, so CLI tools resolve `.env*` the same way Next does. Don't add `dotenv`.
- **Better Auth reads `BETTER_AUTH_SECRET` and `BETTER_AUTH_URL` from the env itself.** `src/lib/env.ts` only wraps `DATABASE_URL`.

## Gotchas

- **Don't import `server-only` from `src/lib/auth.ts`, or from anything it imports** (`src/db/*`, `src/lib/env.ts`). The Better Auth CLI loads this config directly and fails if it does.
- **`src/db/schema/auth.ts` is generated.** Better Auth 1.7 checks the schema on each request and returns 500 with `SCHEMA_MISMATCH` if it's out of date. After changing plugins or user fields in `auth.ts`, run `npm run auth:generate`, then `db:generate` and `db:migrate`. Don't edit the file by hand.
- **Auth is email and password only, with no email provider.** Email verification is off, and `sendResetPassword` in `auth.ts` only logs the reset link to the server console. Connect a real email provider before launch.
- **Better Auth rejects requests whose origin isn't `BETTER_AUTH_URL`** (403 `INVALID_ORIGIN`), so the auth forms only work when the dev server runs on that URL's port.
- **`cacheComponents: true` is on** (`next.config.ts`, along with `partialPrefetching`). Code that reads the request (`cookies()`, `headers()`, `auth.api.getSession(...)`) can't be part of the prerendered static shell. Put it behind `<Suspense>` or use `'use cache: private'`, and keep session reads out of a layout's top level. Otherwise the build fails. See `node_modules/next/dist/docs/01-app/02-guides/authentication-with-cache-components.md`.
- **`neon-http` doesn't support interactive transactions.** If you need `db.transaction(...)`, switch to the Neon WebSocket `Pool` driver (`drizzle-orm/neon-serverless`).
