"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { authClient } from "@/lib/auth-client";
import { resetWishlist } from "@/lib/wishlist";
import { connectionError, Field, FormError } from "./fields";

export function SignInForm() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const data = new FormData(e.currentTarget);
    setPending(true);
    setError(null);

    const { error } = await authClient.signIn
      .email({
        email: String(data.get("email")),
        password: String(data.get("password")),
      })
      .catch(connectionError);

    if (error) {
      setPending(false);
      setError(error.message ?? "We couldn't sign you in. Please try again.");
      return;
    }
    resetWishlist();
    router.push("/account");
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="space-y-6">
      <Field label="Email address" name="email" type="email" autoComplete="email" required />
      <Field label="Password" name="password" type="password" autoComplete="current-password" required />
      <FormError message={error} />
      <button type="submit" className="btn btn-primary btn-lg btn-block" disabled={pending}>
        {pending ? "Signing in…" : "Sign in"}
      </button>
      <p className="text-center">
        <Link href="/forgot-password" className="link text-muted">
          Forgot your password?
        </Link>
      </p>
    </form>
  );
}
