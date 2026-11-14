"use server";

import { addNewsletterContact } from "@/lib/email";

export type NewsletterResult = { ok: true } | { ok: false; reason: "invalid" | "unavailable" };

// Deliberately loose: the browser's type="email" check runs first, and Resend
// has the final say on what it accepts.
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Footer newsletter signup. Subscribers are stored as Resend contacts, not in
 * our database. An address that is already subscribed gets the same answer as
 * a new one, so the form can't be used to check who is on the list.
 */
export async function subscribeToNewsletter(input: string): Promise<NewsletterResult> {
  if (typeof input !== "string") return { ok: false, reason: "invalid" };
  const email = input.trim().toLowerCase();
  if (email.length > 320 || !EMAIL.test(email)) return { ok: false, reason: "invalid" };

  try {
    await addNewsletterContact(email);
    return { ok: true };
  } catch (error) {
    console.error("[newsletter] Could not save the subscriber", error);
    return { ok: false, reason: "unavailable" };
  }
}
