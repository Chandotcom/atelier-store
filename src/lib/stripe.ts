import Stripe from "stripe";

/*
 * Stripe client. Server-only. Created on first use, like the DB client, so
 * importing this module never requires the Stripe env vars to be set.
 */

let instance: Stripe | undefined;

export function isStripeConfigured(): boolean {
  return Boolean(process.env.STRIPE_SECRET_KEY);
}

export function getStripe(): Stripe {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) throw new Error("STRIPE_SECRET_KEY is not set.");
  instance ??= new Stripe(key);
  return instance;
}

/** Countries the Stripe payment page accepts as a shipping destination. */
export const SHIPPING_COUNTRIES = ["US", "CA", "GB", "AU"] as const;
