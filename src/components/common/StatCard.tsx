import { ArrowDownRight, ArrowRight, ArrowUpRight } from "lucide-react";
import { ReactNode } from "react";
import { StatCardItem } from "../../app/types";

function TrendIcon({ trend }: Pick<StatCardItem, "trend">) {
  if (trend === "up") return <ArrowUpRight className="h-4 w-4 text-primary" />;
  if (trend === "down") return <ArrowDownRight className="h-4 w-4 text-critical" />;
  return <ArrowRight className="h-4 w-4 text-muted" />;
}

export function StatCard({ item, icon }: { item: StatCardItem; icon: ReactNode }) {
  return (
    <article className="tonal-panel p-5">
      <div className="mb-6 flex items-start justify-between">
        <div>
          <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.12em] text-muted">{item.label}</p>
          <h3 className="text-[1.75rem] font-semibold leading-none text-text">{item.value}</h3>
        </div>
        <div className="rounded-mono bg-surface-low p-2 text-primary">{icon}</div>
      </div>
      <div className="flex items-center gap-2 text-xs text-muted">
        <TrendIcon trend={item.trend} />
        <span>{item.helper}</span>
      </div>
    </article>
  );
}
