"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { authClient } from "@/lib/auth-client";
import { resetWishlist } from "@/lib/wishlist";

export function SignOutButton() {
  const router = useRouter();
  const [pending, setPending] = useState(false);

  async function signOut() {
    setPending(true);
    const { error } = await authClient.signOut();
    if (error) {
      setPending(false);
      return;
    }
    resetWishlist();
    router.push("/");
    router.refresh();
  }

  return (
    <button type="button" className="btn btn-secondary" onClick={signOut} disabled={pending}>
      {pending ? "Signing out…" : "Sign out"}
    </button>
  );
}
