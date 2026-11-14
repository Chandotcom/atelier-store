"use client";

import { useState, useTransition } from "react";
import { setCustomerAdmin } from "@/app/admin/actions";
import { ShieldIcon } from "@/components/icons";

type Props = { userId: string; name: string; isAdmin: boolean };

/**
 * "Make admin" / "Remove admin" for one account, with a confirm step: the
 * role gives full access to orders, products and customers.
 */
export function RoleControl({ userId, name, isAdmin }: Props) {
  const [pending, startTransition] = useTransition();
  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function apply() {
    setError(null);
    startTransition(async () => {
      try {
        const result = await setCustomerAdmin(userId, !isAdmin);
        // On success the page re-renders with the new role.
        if (!result.ok) setError(result.message);
      } catch {
        setError("We couldn't update this account. Please try again.");
      }
      setConfirming(false);
    });
  }

  if (confirming) {
    return (
      <span className="inline-flex flex-wrap items-center justify-end gap-2" role="group" aria-label="Confirm role change">
        <span className="text-[0.8125rem] text-muted">
          {isAdmin ? `Remove admin access from ${name}?` : `Give ${name} full admin access?`}
        </span>
        <button type="button" className="admin-btn admin-btn-primary h-8" disabled={pending} onClick={apply}>
          {pending ? "Saving…" : "Yes"}
        </button>
        <button
          type="button"
          className="admin-btn admin-btn-secondary h-8"
          disabled={pending}
          onClick={() => setConfirming(false)}
        >
          Cancel
        </button>
      </span>
    );
  }

  return (
    <span className="inline-flex flex-col items-end gap-1">
      <button
        type="button"
        className="admin-btn admin-btn-secondary h-8"
        onClick={() => {
          setError(null);
          setConfirming(true);
        }}
      >
        <ShieldIcon className="size-4" strokeWidth={1.5} />
        {isAdmin ? "Remove admin" : "Make admin"}
        <span className="sr-only"> {name}</span>
      </button>
      {error && (
        <span className="text-[0.8125rem] text-sale" role="alert">
          {error}
        </span>
      )}
    </span>
  );
}
