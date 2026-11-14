import type { Metadata } from "next";
import Link from "next/link";
import { AuthShell } from "@/components/auth/auth-shell";
import { SignInForm } from "@/components/auth/sign-in-form";

export const metadata: Metadata = { title: "Sign in" };

export default function SignInPage() {
  return (
    <AuthShell
      eyebrow="My account"
      title="Sign in"
      footer={
        <>
          New to Altiere?{" "}
          <Link href="/sign-up" className="link text-ink">
            Create an account
          </Link>
        </>
      }
    >
      <SignInForm />
    </AuthShell>
  );
}
