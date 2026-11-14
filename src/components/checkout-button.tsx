"use client";

import { unstable_rethrow } from "next/navigation";
import { useState, useTransition } from "react";
import { startCheckout } from "@/app/checkout/actions";

/** Sends the bag to Stripe's payment page. `blocked` disables it while a line exceeds stock. */
export function CheckoutButton({ blocked }: { blocked: boolean }) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function checkout() {
    setError(null);
    startTransition(async () => {
      // Redirects to Stripe on success, so a return value is always a failure.
      try {
        const result = await startCheckout();
        if (result) setError(result.message);
      } catch (error) {
        unstable_rethrow(error);
        setError("We couldn’t start checkout. Please try again.");
      }
    });
  }

  return (
    <>
      <button
        type="button"
        className="btn btn-primary btn-lg btn-block mt-8"
        onClick={checkout}
        disabled={blocked || pending}
      >
        {pending ? "Redirecting…" : "Checkout"}
      </button>
      {blocked && !error && (
        <p className="text-caption text-muted mt-3">
          Some items are no longer available in the quantity selected.
        </p>
      )}
      {error && (
        <p className="text-caption text-sale mt-3" role="alert">
          {error}
        </p>
      )}
    </>
  );
}
