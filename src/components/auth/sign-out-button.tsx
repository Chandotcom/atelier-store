"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { authClient } from "@/lib/auth-client";

export function SignOutButton() {
  const router = useRouter();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function signOut() {
    setErrorMessage(null);
    setPending(true);
    const { error } = await authClient.signOut();
    if (error) {
      setErrorMessage("We couldn’t sign you out. Please try again.");
      setPending(false);
      return;
    }
    router.push("/");
    router.refresh();
  }

  return (
    <>
      <button type="button" className="btn btn-secondary" onClick={signOut} disabled={pending}>
        {pending ? "Signing out…" : "Sign out"}
      </button>
      {errorMessage && (
        <p role="alert" className="text-caption text-sale mt-3">
          {errorMessage}
        </p>
      )}
    </>
  );
}
