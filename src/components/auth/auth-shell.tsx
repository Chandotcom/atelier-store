import type { ReactNode } from "react";

type Props = {
  eyebrow: string;
  title: string;
  intro?: ReactNode;
  children: ReactNode;
  /** Secondary route below the form ("New to Altiere? Create an account"). */
  footer?: ReactNode;
};

/** Narrow centered column shared by the sign-in, sign-up and password pages. */
export function AuthShell({ eyebrow, title, intro, children, footer }: Props) {
  return (
    <main id="main" className="prose-container section flex-1">
      <div className="mx-auto max-w-sm">
        <p className="text-eyebrow text-muted">{eyebrow}</p>
        <h1 className="heading-headline mt-4">{title}</h1>
        {intro && <p className="text-muted mt-4">{intro}</p>}
        <div className="mt-10">{children}</div>
        {footer && <p className="divider text-muted mt-10 pt-6">{footer}</p>}
      </div>
    </main>
  );
}
