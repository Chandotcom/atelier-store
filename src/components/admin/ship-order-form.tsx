"use client";

import { useState, useTransition, type FormEvent } from "react";
import { markOrderShipped } from "@/app/admin/actions";
import { TruckIcon } from "@/components/icons";
import { FormError, Input } from "./fields";

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
    <form onSubmit={onSubmit} className="space-y-4">
      <Input
        label="Tracking number"
        name="tracking"
        maxLength={80}
        autoComplete="off"
        placeholder="Optional"
        hint={
          hasEmail
            ? "The customer is emailed when you mark the order as shipped."
            : "This order has no email address, so no notice will be sent."
        }
      />
      <FormError message={error} />
      <button type="submit" className="admin-btn admin-btn-primary w-full" disabled={pending}>
        <TruckIcon className="size-4" strokeWidth={1.5} />
        {pending ? "Saving…" : "Mark as shipped"}
      </button>
    </form>
  );
}
