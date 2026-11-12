# Altiere Store

Next.js (App Router) · TypeScript · Tailwind CSS v4 · Better Auth · Drizzle ORM · Neon Postgres

## Setup

```bash
npm install
cp .env.example .env.local   # fill in DATABASE_URL, BETTER_AUTH_SECRET (npm run auth:secret)
npm run dev
```

## Structure

```
src/
  app/api/auth/[...all]/route.ts   Better Auth route handler
  db/index.ts                      Drizzle client (Neon HTTP driver), created lazily
  db/schema/index.ts               Schema barrel — export all tables here
  lib/auth.ts                      Better Auth server instance (drizzle adapter)
  lib/auth-client.ts               Better Auth React client
  lib/env.ts                       Server env access
drizzle.config.ts                  drizzle-kit config (loads .env* via @next/env)
```

## Scripts

| Script                  | Purpose                                                  |
| ----------------------- | -------------------------------------------------------- |
| `npm run dev` / `build` | Next.js dev server / production build                    |
| `npm run typecheck`     | `tsc --noEmit`                                           |
| `npm run auth:secret`   | Generate a `BETTER_AUTH_SECRET`                          |
| `npm run auth:generate` | Generate Better Auth tables → `src/db/schema/auth.ts`    |
| `npm run db:generate`   | Create SQL migrations in `./drizzle`                     |
| `npm run db:migrate`    | Apply migrations                                         |
| `npm run db:push`       | Push schema directly (prototyping)                       |
| `npm run db:studio`     | Open Drizzle Studio                                      |

## Enabling auth

Better Auth rejects requests until its tables exist:

1. `npm run auth:generate`
2. Add `export * from "./auth";` to `src/db/schema/index.ts`
3. `npm run db:generate && npm run db:migrate`
4. Enable sign-in methods (e.g. `emailAndPassword`) in `src/lib/auth.ts`
