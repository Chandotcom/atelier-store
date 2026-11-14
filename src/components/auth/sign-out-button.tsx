"use client";

import { useState } from "react";
import { authClient } from "@/lib/auth-client";
import { connectionError } from "./fields";

export function SignOutButton() {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function signOut() {
    setPending(true);
    setError(null);
    const { error } = await authClient.signOut().catch(connectionError);
    if (error) {
      setError("We couldn't sign you out. Please try again.");
      setPending(false);
      return;
    }
    // A full page load, not router.push: the client router may still hold
    // signed-in pages (account, wishlist, admin), which must not be shown
    // again from memory after signing out, for example on a shared computer.
    // eslint-disable-next-line @next/next/no-location-assign-relative-destination -- the full reload is the point (see above)
    window.location.assign("/");
  }

  return (
    <>
      <button type="button" className="btn btn-secondary" onClick={signOut} disabled={pending}>
        {pending ? "Signing out…" : "Sign out"}
      </button>
      {error && (
        <p className="text-caption text-sale mt-3" role="alert">
          {error}
        </p>
      )}
    </>
  );
}
