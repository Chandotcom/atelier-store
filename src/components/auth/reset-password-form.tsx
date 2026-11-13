"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useState, type FormEvent } from "react";
import { authClient } from "@/lib/auth-client";
import { Field, FormError, MIN_PASSWORD_LENGTH } from "./fields";

/** Reads the `token` (or `error`) that Better Auth appends to the reset link. */
export function ResetPasswordForm() {
  const params = useSearchParams();
  const token = params.get("token");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [done, setDone] = useState(false);

  if (done) {
    return (
      <div className="space-y-6">
        <p role="status">Your password has been updated.</p>
        <Link href="/sign-in" className="btn btn-primary btn-lg btn-block">
          Sign in
        </Link>
      </div>
    );
  }

  if (!token || params.get("error")) {
    return (
      <div className="space-y-6">
        <p role="alert">This reset link is invalid or has expired.</p>
        <Link href="/forgot-password" className="btn btn-secondary btn-lg btn-block">
          Request a new link
        </Link>
      </div>
    );
  }

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!token) return;
    const data = new FormData(e.currentTarget);
    const password = String(data.get("password"));
    if (password !== String(data.get("confirm"))) {
      setError("The passwords don't match.");
      return;
    }
    setPending(true);
    setError(null);

    const { error } = await authClient.resetPassword({ newPassword: password, token });

    setPending(false);
    if (error) {
      setError(error.message ?? "We couldn't update your password. Please request a new link.");
      return;
    }
    setDone(true);
  }

  return (
    <form onSubmit={onSubmit} className="space-y-6">
      <Field
        label="New password"
        name="password"
        type="password"
        autoComplete="new-password"
        minLength={MIN_PASSWORD_LENGTH}
        hint={`At least ${MIN_PASSWORD_LENGTH} characters.`}
        required
      />
      <Field
        label="Confirm new password"
        name="confirm"
        type="password"
        autoComplete="new-password"
        minLength={MIN_PASSWORD_LENGTH}
        required
      />
      <FormError message={error} />
      <button type="submit" className="btn btn-primary btn-lg btn-block" disabled={pending}>
        {pending ? "Updating…" : "Update password"}
      </button>
    </form>
  );
}
