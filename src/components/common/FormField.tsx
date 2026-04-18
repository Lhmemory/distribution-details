import { ReactNode } from "react";

export function FormField({
  label,
  error,
  children,
  hint,
}: {
  label: string;
  error?: string;
  hint?: string;
  children: ReactNode;
}) {
  return (
    <label className="block">
      <span className="field-label">{label}</span>
      {children}
      {error ? <span className="mt-2 block text-xs text-critical">{error}</span> : null}
      {!error && hint ? <span className="mt-2 block text-xs text-muted">{hint}</span> : null}
    </label>
  );
}
