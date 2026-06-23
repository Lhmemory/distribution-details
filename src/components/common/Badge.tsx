import { clsx } from "clsx";
import { PropsWithChildren } from "react";

interface BadgeProps {
  tone?: "neutral" | "success" | "critical" | "primary";
}

const toneMap = {
  neutral: "border-line bg-surface-low text-muted",
  success: "border-emerald-200 bg-emerald-50 text-success",
  critical: "border-rose-200 bg-critical-bg text-critical",
  primary: "border-blue-200 bg-primary-soft text-primary-dim",
};

export function Badge({ children, tone = "neutral" }: PropsWithChildren<BadgeProps>) {
  return (
    <span className={clsx("inline-flex rounded-mono border px-2.5 py-1 text-[11px] font-semibold", toneMap[tone])}>
      {children}
    </span>
  );
}
