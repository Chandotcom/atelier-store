"use client";

import { useState, useTransition, type FormEvent } from "react";
import { markOrderShipped } from "@/app/admin/actions";
import { Field, FormError } from "@/components/auth/fields";

/** Marks an order shipped. The page re-renders with the shipped details once it succeeds. */
export function ShipOrderForm({ orderId, hasEmail }: { orderId: number; hasEmail: boolean }) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const tracking = String(new FormData(e.currentTarget).get("tracking") ?? "");
    setError(null);
    startTransition(async () => {
      try {
        const result = await markOrderShipped(orderId, tracking);
        if (!result.ok) setError(result.message);
      } catch {
        // The request never completed (connection or server failure).
        setError("We couldn't update the order. Please try again.");
      }
    });
  }

  return (
    <form onSubmit={onSubmit} className="mt-4 space-y-6">
      <Field
        label="Tracking number"
        name="tracking"
        maxLength={80}
        autoComplete="off"
        hint={
          hasEmail
            ? "Optional. The customer is emailed when you mark the order as shipped."
            : "Optional. This order has no email address, so no notice will be sent."
        }
      />
      <FormError message={error} />
      <button type="submit" className="btn btn-primary btn-block" disabled={pending}>
        {pending ? "Saving…" : "Mark as shipped"}
      </button>
    </form>
  );
}
