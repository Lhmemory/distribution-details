import { ArrowDownRight, ArrowRight, ArrowUpRight } from "lucide-react";
import { ReactNode } from "react";
import { StatCardItem } from "../../app/types";

function TrendIcon({ trend }: Pick<StatCardItem, "trend">) {
  if (trend === "up") return <ArrowUpRight className="h-4 w-4 text-success" />;
  if (trend === "down") return <ArrowDownRight className="h-4 w-4 text-critical" />;
  return <ArrowRight className="h-4 w-4 text-muted" />;
}

export function StatCard({ item, icon }: { item: StatCardItem; icon: ReactNode }) {
  return (
    <article className="tonal-panel min-h-[128px] p-4">
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <p className="mb-2 text-[13px] font-medium text-muted">{item.label}</p>
          <h3 className="text-[1.65rem] font-semibold leading-none tracking-normal text-text">{item.value}</h3>
        </div>
        <div className="rounded-mono bg-primary-soft p-2 text-primary">{icon}</div>
      </div>
      <div className="flex items-center gap-2 text-[13px] text-muted">
        <TrendIcon trend={item.trend} />
        <span className={item.trend === "up" ? "font-semibold text-success" : undefined}>{item.helper}</span>
      </div>
    </article>
  );
}
