import { History } from "lucide-react";
import { ChangeLogEntry } from "../../app/types";
import { Badge } from "../common/Badge";

export function VersionHistoryPanel({ items }: { items: ChangeLogEntry[] }) {
  return (
    <aside className="tonal-panel p-5">
      <div className="mb-4 flex items-center gap-2">
        <History className="h-4 w-4 text-primary" />
        <h3 className="text-sm font-semibold text-text">版本记录</h3>
      </div>
      <div className="space-y-3">
        {items.slice(0, 6).map((item) => (
          <article key={item.id} className="rounded-mono bg-surface-low p-3">
            <div className="mb-2 flex items-center justify-between gap-3">
              <p className="text-sm font-medium text-text">{item.title}</p>
              <Badge>{item.action}</Badge>
            </div>
            <p className="text-xs text-muted">{item.description}</p>
            <p className="mt-2 text-[11px] uppercase tracking-[0.1em] text-muted">
              {item.operator} · {item.timestamp}
            </p>
          </article>
        ))}
      </div>
    </aside>
  );
}
