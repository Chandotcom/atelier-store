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
npm run db:seed        # WIPES categories/products/product_stock (and, by cascade, every cart line), then loads the sample catalog (dev only)
```

There is no test framework yet. Use npm (there's a `package-lock.json`). Env vars go in `.env.local`; `.env.example` lists the variables.

## Stack

Next.js 16 App Router · TypeScript (strict, `@/*` → `src/*`) · Tailwind CSS v4 (configured in `src/app/globals.css`; there is no `tailwind.config`) · Better Auth 1.7 · Drizzle ORM over Neon's HTTP driver (`drizzle-orm/neon-http`).

## Architecture

The dependency direction is `src/app` → `src/lib` → `src/db`.

- **Auth request path:** `src/app/api/auth/[...all]/route.ts` passes requests to `toNextJsHandler(auth)`. `auth` is created in `src/lib/auth.ts` with `drizzleAdapter(db, { provider: "pg", schema })`, so Better Auth stores users and sessions through the same Drizzle client as the app. `nextCookies()` must stay the **last** plugin, because it lets Server Actions set auth cookies. Browser code uses `authClient` from `src/lib/auth-client.ts`, which talks to the same origin.
- **Auth UI and session reads.** The forms in `src/components/auth/` are client components that call `authClient`; their pages live in the `src/app/(auth)/` route group (`/sign-in`, `/sign-up`, `/forgot-password`, `/reset-password`). Server code reads the signed-in customer with `getCurrentUser()` from `src/lib/session.ts`, as `/account` does inside `<Suspense>`.
- **The cart is database-backed and belongs to a browser, not an account.** `carts.id` is a random token kept in the httpOnly `altiere_cart` cookie; `cart_items` has one row per product and size (`size` NULL for one-size, like `product_stock`). Reads are in `src/lib/cart-data.ts` (uncached, cookie-dependent, so call `getCart()` only inside `<Suspense>`); mutations are the Server Actions in `src/app/cart/actions.ts`, which check live stock and cap quantities at it. Adding to the bag does not reserve stock. `src/lib/cart.ts` holds the types and browser helpers that client components import.
- **The header bag count is read in the browser.** Product and category pages set `ensureStatic = "navigation"`, which also covers the root layout, so the header can't read cookies on the server. The cart actions mirror the count into the readable `altiere_cart_count` cookie, and `CartLink` reads it with `useSyncExternalStore`. Client code must call `notifyCartChanged()` after a cart action resolves.
- **The wishlist belongs to an account, unlike the cart.** `wishlist_items` has one row per customer and product. The only mutation is the `setWishlisted` Server Action in `src/app/wishlist/actions.ts`, which returns `signed_out` for guests (the button then sends them to `/sign-in`). Because product pages are static, the save button can't know the saved state on the server: `src/lib/wishlist.ts` is a browser store that loads the ids once from `/api/wishlist` and shares them through `useSyncExternalStore`. Client code must call `markWishlisted()` after the action resolves and `resetWishlist()` after signing in, up or out. `/wishlist` renders the list on the server inside `<Suspense>` from `src/lib/wishlist-data.ts`.
- **Checkout is Stripe's hosted payment page.** `startCheckout` in `src/app/checkout/actions.ts` re-reads the bag's prices and stock from the database, snapshots it into a `pending` row in `orders`/`order_items`, creates a Stripe Checkout Session and redirects to it. Stripe returns the customer to the `/checkout/return` route handler, which confirms the payment with Stripe and redirects to `/checkout/success`. `/api/stripe/webhook` does the same fulfilment in case the customer never returns. Guests can check out; a signed-in customer's order gets their `userId` and appears on `/account`.
- **`fulfillCheckoutSession` in `src/lib/orders.ts` is the only code that marks an order paid.** It is a single SQL statement that flips `pending` to `paid`, decrements `product_stock` and takes the bought pieces out of the bag (lines or quantities added after checkout started stay), so calling it twice (webhook and return route) is safe. The statement returns a row only to the call that flipped the order, and that call sends the order confirmation email; a failed send is logged and never blocks the order. Keep it one statement: `neon-http` has no interactive transactions. Stock is not reserved before payment, so two customers can pay for the last piece; stock is clamped at zero.
- **Stripe env vars:** `STRIPE_SECRET_KEY` (checkout shows an error without it) and `STRIPE_WEBHOOK_SECRET` (the webhook returns 500 without it). `src/lib/stripe.ts` builds the client lazily, like `db`. Stripe sends customers back to `BETTER_AUTH_URL`. Shipping countries are the `SHIPPING_COUNTRIES` list in that file.
- **The DB client is lazy.** `db` in `src/db/index.ts` is a Proxy that builds the Neon/Drizzle client on first property access and binds methods to the real instance. Because of this, importing anything in the auth/db chain needs no env vars. Keep it this way, and don't read env at module top level in this chain. (`next build` itself does need `DATABASE_URL` and a migrated, seeded database: the home and product pages are prerendered from it, and `generateStaticParams` must return at least one slug.)
- **Catalog data is split in two.** `src/lib/products.ts` holds the DB queries (server-only, each one `'use cache'` + `cacheTag("products")` + `cacheLife("hours")`) and maps rows to the `Product` type. `src/lib/catalog.ts` holds that type, the pure helpers (`formatPrice`, `stockStatus`) and editorial content, and is what client components import. Don't import `@/db` or `products.ts` from a client component. Code that writes products or stock must call `updateTag(PRODUCTS_TAG)`.
- **Search is a cached catalog query.** `/search?q=…` calls `searchProducts` in `products.ts`, which matches every word of the query against name, color, description, style code and category with `ILIKE`. Pass it the output of `normalizeSearchQuery`, so equivalent queries share a cache entry.
- **Stock is per size.** `product_stock` has one row per size, or a single row with `size` NULL for one-size products. A product's total is summed in `toProduct()`, not stored.
- **One schema barrel.** `src/db/schema/index.ts` is read by the app (`db`), by Better Auth's adapter and by drizzle-kit (`drizzle.config.ts`). Every new table file must be re-exported from it, or none of them will see it.
- **`drizzle.config.ts` loads env with `@next/env`'s `loadEnvConfig`**, so CLI tools resolve `.env*` the same way Next does. Don't add `dotenv`.
- **Better Auth reads `BETTER_AUTH_SECRET` and `BETTER_AUTH_URL` from the env itself.** `src/lib/env.ts` only wraps `DATABASE_URL`.

## Gotchas

- **Don't import `server-only` from `src/lib/auth.ts`, or from anything it imports** (`src/db/*`, `src/lib/env.ts`). The Better Auth CLI loads this config directly and fails if it does.
- **`src/db/schema/auth.ts` is generated.** Better Auth 1.7 checks the schema on each request and returns 500 with `SCHEMA_MISMATCH` if it's out of date. After changing plugins or user fields in `auth.ts`, run `npm run auth:generate`, then `db:generate` and `db:migrate`. Don't edit the file by hand.
- **Auth is email and password only.** Email verification is off. `sendResetPassword` in `auth.ts` emails the reset link through Resend.
- **Email goes through Resend's HTTP API** (`src/lib/email.ts`, no SDK). It needs `RESEND_API_KEY`; without it nothing is sent and the message is logged to the server console, which is how local development works. `EMAIL_FROM` sets the sender and must be on a domain verified in Resend; the default `onboarding@resend.dev` only delivers to the Resend account's own address. Better Auth runs its sends through `after()` (`advanced.backgroundTasks` in `auth.ts`) so response time doesn't reveal whether an address has an account.
- **Better Auth rejects requests whose origin isn't `BETTER_AUTH_URL`** (403 `INVALID_ORIGIN`), so the auth forms only work when the dev server runs on that URL's port.
- **`cacheComponents: true` is on** (`next.config.ts`, along with `partialPrefetching`). Code that reads the request (`cookies()`, `headers()`, `auth.api.getSession(...)`) can't be part of the prerendered static shell. Put it behind `<Suspense>` or use `'use cache: private'`, and keep session reads out of a layout's top level. Otherwise the build fails. See `node_modules/next/dist/docs/01-app/02-guides/authentication-with-cache-components.md`.
- **`neon-http` doesn't support interactive transactions.** If you need `db.transaction(...)`, switch to the Neon WebSocket `Pool` driver (`drizzle-orm/neon-serverless`).
