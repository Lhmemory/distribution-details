import { clsx } from "clsx";
import { PropsWithChildren } from "react";

interface BadgeProps {
  tone?: "neutral" | "success" | "critical" | "primary";
}

const toneMap = {
  neutral: "bg-surface-low text-muted",
  success: "bg-primary-soft text-primary-dim",
  critical: "bg-critical-bg/20 text-critical",
  primary: "bg-primary text-white",
};

export function Badge({ children, tone = "neutral" }: PropsWithChildren<BadgeProps>) {
  return (
    <span className={clsx("inline-flex rounded-full px-2.5 py-1 text-[11px] font-semibold", toneMap[tone])}>
      {children}
    </span>
  );
}
