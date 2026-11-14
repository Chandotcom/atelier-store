import type { Metadata } from "next";
import { Suspense } from "react";
import { AuthShell } from "@/components/auth/auth-shell";
import { ResetPasswordForm } from "@/components/auth/reset-password-form";

export const metadata: Metadata = { title: "Choose a new password" };

export default function ResetPasswordPage() {
  return (
    <AuthShell eyebrow="My account" title="Choose a new password">
      {/* The form reads the token from the URL, which isn't known at prerender. */}
      <Suspense fallback={<div className="h-48 animate-pulse bg-surface" aria-busy="true" />}>
        <ResetPasswordForm />
      </Suspense>
    </AuthShell>
  );
}
