import { useId, type ComponentProps } from "react";

type FieldProps = { label: string; hint?: string } & Omit<ComponentProps<"input">, "id" | "className">;

/** Labelled text input in the design system's bottom-border style. */
export function Field({ label, hint, ...props }: FieldProps) {
  const id = useId();
  const hintId = `${id}-hint`;
  return (
    <div>
      <label htmlFor={id} className="text-label">
        {label}
      </label>
      <input id={id} className="field" aria-describedby={hint ? hintId : undefined} {...props} />
      {hint && (
        <p id={hintId} className="text-caption text-muted mt-2">
          {hint}
        </p>
      )}
    </div>
  );
}

export function FormError({ message }: { message: string | null }) {
  if (!message) return null;
  return (
    <p className="text-caption text-sale" role="alert">
      {message}
    </p>
  );
}

/** Shared with the server config's default; shown as a hint and enforced by the input. */
export const MIN_PASSWORD_LENGTH = 8;

/**
 * The auth client rejects, rather than returning `{ error }`, when the request
 * never reaches the server. Forms add `.catch(connectionError)` so that case
 * shows a message like any other failure instead of leaving the button disabled.
 */
export function connectionError() {
  return {
    error: { message: "We couldn't reach the server. Please check your connection and try again." },
  };
}
