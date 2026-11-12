"use client";

import { useState } from "react";

/** Placeholder signup: no backend yet, so it only acknowledges locally. */
export function NewsletterForm() {
  const [done, setDone] = useState(false);

  if (done) {
    return (
      <p className="text-body text-white/80" role="status">
        Thank you. You&rsquo;ll hear from us soon.
      </p>
    );
  }

  return (
    <form
      className="flex items-end gap-4"
      onSubmit={(e) => {
        e.preventDefault();
        setDone(true);
      }}
    >
      <label className="flex-1">
        <span className="sr-only">Email address</span>
        <input
          type="email"
          name="email"
          required
          autoComplete="email"
          placeholder="Email address"
          className="h-12 w-full border-0 border-b border-white/40 bg-transparent text-body text-paper placeholder:text-white/50 focus:border-white focus:outline-none"
        />
      </label>
      <button type="submit" className="btn btn-inverse btn-sm">
        Subscribe
      </button>
    </form>
  );
}
