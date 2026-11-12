/**
 * Server-side environment access.
 *
 * Values are read lazily so that `next build` and tooling can import modules
 * without every secret being present; a missing variable throws the first
 * time it is actually used.
 */
function required(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(
      `Missing environment variable "${name}". Copy .env.example to .env.local and fill it in.`,
    );
  }
  return value;
}

export const env = {
  get DATABASE_URL() {
    return required("DATABASE_URL");
  },
};
