"use client";

import { useState, useTransition } from "react";
import { subscribeToNewsletter } from "@/app/newsletter/actions";

const ERRORS = {
  invalid: "Please enter a valid email address.",
  unavailable: "We couldn’t sign you up just now. Please try again in a moment.",
};

/** Footer newsletter signup. Subscribers are saved as Resend contacts. */
export function NewsletterForm() {
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  if (done) {
    return (
      <p className="text-body text-white/80" role="status">
        Thank you. You&rsquo;ll hear from us soon.
      </p>
    );
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        const email = String(new FormData(e.currentTarget).get("email") ?? "");
        setError(null);
        startTransition(async () => {
          const result = await subscribeToNewsletter(email);
          if (result.ok) setDone(true);
          else setError(ERRORS[result.reason]);
        });
      }}
    >
      <div className="flex items-end gap-4">
        <label className="flex-1">
          <span className="sr-only">Email address</span>
          <input
            type="email"
            name="email"
            required
            autoComplete="email"
            placeholder="Email address"
            aria-invalid={error ? true : undefined}
            aria-describedby={error ? "newsletter-error" : undefined}
            className="h-12 w-full border-0 border-b border-white/40 bg-transparent text-body text-paper placeholder:text-white/50 focus:border-white focus:outline-none"
          />
        </label>
        <button type="submit" className="btn btn-inverse btn-sm" disabled={pending}>
          {pending ? "Subscribing…" : "Subscribe"}
        </button>
      </div>
      {error && (
        <p id="newsletter-error" role="alert" className="text-caption mt-3 text-white/80">
          {error}
        </p>
      )}
    </form>
  );
}
