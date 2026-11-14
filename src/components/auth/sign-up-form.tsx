"use client";

import { useState, type FormEvent } from "react";
import { authClient } from "@/lib/auth-client";
import { connectionError, Field, FormError, MIN_PASSWORD_LENGTH } from "./fields";

export function SignUpForm() {
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const data = new FormData(e.currentTarget);
    setPending(true);
    setError(null);

    const { error } = await authClient.signUp
      .email({
        name: String(data.get("name")).trim(),
        email: String(data.get("email")),
        password: String(data.get("password")),
      })
      .catch(connectionError);

    if (error) {
      setPending(false);
      setError(error.message ?? "We couldn't create your account. Please try again.");
      return;
    }
    // No email verification yet, so sign-up also signs the customer in. A full
    // page load, so nothing the router stored while signed out is replayed
    // (see sign-in-form.tsx).
    // eslint-disable-next-line @next/next/no-location-assign-relative-destination -- the full reload is the point (see above)
    window.location.assign("/account");
  }

  return (
    <form onSubmit={onSubmit} className="space-y-6">
      <Field label="Full name" name="name" autoComplete="name" required />
      <Field label="Email address" name="email" type="email" autoComplete="email" required />
      <Field
        label="Password"
        name="password"
        type="password"
        autoComplete="new-password"
        minLength={MIN_PASSWORD_LENGTH}
        hint={`At least ${MIN_PASSWORD_LENGTH} characters.`}
        required
      />
      <FormError message={error} />
      <button type="submit" className="btn btn-primary btn-lg btn-block" disabled={pending}>
        {pending ? "Creating account…" : "Create account"}
      </button>
    </form>
  );
}
