import { ButtonHTMLAttributes, PropsWithChildren } from "react";
import { clsx } from "clsx";

type Variant = "primary" | "secondary" | "ghost" | "danger";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
}

const variants: Record<Variant, string> = {
  primary: "border border-primary bg-primary text-white shadow-sm hover:bg-primary-dim",
  secondary: "border border-line bg-surface-base text-text hover:border-primary/35 hover:bg-primary-soft/40",
  ghost: "border border-transparent bg-transparent text-primary hover:bg-primary-soft",
  danger: "border border-critical-bg bg-critical-bg text-critical hover:border-critical/25",
};

export function Button({
  children,
  className,
  variant = "primary",
  ...props
}: PropsWithChildren<ButtonProps>) {
  return (
    <button
      className={clsx(
        "inline-flex min-h-10 items-center justify-center whitespace-nowrap rounded-mono px-4 text-sm font-semibold transition active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-45",
        variants[variant],
        className,
      )}
      {...props}
    >
      {children}
    </button>
  );
}
