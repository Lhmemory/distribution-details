import { History } from "lucide-react";
import { ChangeLogEntry } from "../../app/types";
import { formatDateTimeLabel } from "../../app/utils/format";
import { Badge } from "../common/Badge";

export function VersionHistoryPanel({ items }: { items: ChangeLogEntry[] }) {
  return (
    <aside className="workspace-panel">
      <div className="flex items-center gap-2 border-b border-line px-4 py-3.5">
        <History className="h-4 w-4 text-primary" />
        <h3 className="text-sm font-semibold text-text">版本记录</h3>
      </div>
      <div className="space-y-3 p-4">
        {items.slice(0, 6).map((item) => (
          <article key={item.id} className="rounded-mono border border-line bg-[#fbfdff] p-3">
            <div className="mb-2 flex items-center justify-between gap-3">
              <p className="text-sm font-medium text-text">{item.title}</p>
              <Badge>{item.action}</Badge>
            </div>
            <p className="text-xs text-muted">{item.description}</p>
            <p className="mt-2 text-[11px] uppercase tracking-[0.1em] text-muted">
              {item.operator} · {formatDateTimeLabel(item.timestamp)}
            </p>
          </article>
        ))}
        {!items.length ? <p className="py-8 text-center text-sm text-muted">暂无销售版本记录。</p> : null}
      </div>
    </aside>
  );
}
