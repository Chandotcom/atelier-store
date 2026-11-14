import { useId, type ComponentProps, type ReactNode } from "react";

/* Form controls for the admin area: label above, boxed input, optional hint. */

/** A label, an optional hint, and whatever control `children` renders for the given id. */
export function Labelled({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: (id: string, hintId: string | undefined) => ReactNode;
}) {
  const id = useId();
  const hintId = hint ? `${id}-hint` : undefined;
  return (
    <div className="min-w-0 flex-1">
      <label htmlFor={id} className="admin-label mb-1.5 block">
        {label}
      </label>
      {children(id, hintId)}
      {hint && (
        <p id={hintId} className="mt-1.5 text-[0.8125rem] text-muted">
          {hint}
        </p>
      )}
    </div>
  );
}

export function Input({
  label,
  hint,
  ...props
}: { label: string; hint?: string } & Omit<ComponentProps<"input">, "id" | "className">) {
  return (
    <Labelled label={label} hint={hint}>
      {(id, hintId) => <input id={id} className="admin-field" aria-describedby={hintId} {...props} />}
    </Labelled>
  );
}

export function FormError({ message }: { message: string | null }) {
  if (!message) return null;
  return (
    <p className="rounded-[0.5rem] bg-sale/10 px-3 py-2 text-[0.8125rem] text-sale" role="alert">
      {message}
    </p>
  );
}

/** A titled card that groups related fields. */
export function Section({ title, description, children }: { title: string; description?: string; children: ReactNode }) {
  return (
    <section className="admin-card">
      <div className="border-b px-5 py-4">
        <h2 className="admin-heading">{title}</h2>
        {description && <p className="mt-0.5 text-[0.8125rem] text-muted">{description}</p>}
      </div>
      <div className="space-y-5 p-5">{children}</div>
    </section>
  );
}
