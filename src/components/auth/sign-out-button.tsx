"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { authClient } from "@/lib/auth-client";
import { resetWishlist } from "@/lib/wishlist";
import { connectionError } from "./fields";

export function SignOutButton() {
  const router = useRouter();
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
    resetWishlist();
    router.push("/");
    router.refresh();
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
