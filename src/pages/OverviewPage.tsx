import { Activity, AlertTriangle, Download, Package, Store, BarChart3, History } from "lucide-react";
import { useMemo } from "react";
import { useAppContext } from "../app/context/AppContext";
import { exportRowsToXlsx } from "../app/utils/export";
import { cnRoleLabel, formatNumber } from "../app/utils/format";
import { canAccessSystem } from "../app/utils/permissions";
import { AppShell } from "../components/layout/AppShell";
import { Badge } from "../components/common/Badge";
import { StatCard } from "../components/common/StatCard";

export function OverviewPage() {
  const { selectedSystemId, systems, products, stores, sales, changeLogs, alerts, authUser } = useAppContext();
  const systemLabel = systems.find((item) => item.id === selectedSystemId)?.label ?? "全部";
  const systemLabelMap = new Map(systems.map((item) => [item.id, item.label]));

  const scopedProducts = products.filter(
    (item) =>
      (selectedSystemId === "all" || item.systemId === selectedSystemId) &&
      canAccessSystem(authUser, item.systemId),
  );
  const scopedStores = stores.filter(
    (item) =>
      (selectedSystemId === "all" || item.systemId === selectedSystemId) &&
      canAccessSystem(authUser, item.systemId),
  );
  const scopedSales = sales.filter(
    (item) =>
      (selectedSystemId === "all" || item.systemId === selectedSystemId) &&
      canAccessSystem(authUser, item.systemId),
  );
  const scopedLogs = changeLogs.filter(
    (item) =>
      (!item.systemId || selectedSystemId === "all" || item.systemId === selectedSystemId) &&
      (!item.systemId || canAccessSystem(authUser, item.systemId)),
  );
  const scopedAlerts = alerts.filter(
    (item) =>
      (!item.systemId || selectedSystemId === "all" || item.systemId === selectedSystemId) &&
      (!item.systemId || canAccessSystem(authUser, item.systemId)),
  );

  const statCards = useMemo(
    () => [
      {
        id: "products",
        label: "产品数",
        value: formatNumber(scopedProducts.length),
        helper: "当前系统内已建档产品",
        trend: "up" as const,
        icon: <Package className="h-4 w-4" />,
      },
      {
        id: "stores",
        label: "门店数",
        value: formatNumber(scopedStores.length),
        helper: "可查看门店档案总量",
        trend: "flat" as const,
        icon: <Store className="h-4 w-4" />,
      },
      {
        id: "sales",
        label: "销售记录数",
        value: formatNumber(scopedSales.length),
        helper: "按期间维护的版本条目",
        trend: "up" as const,
        icon: <BarChart3 className="h-4 w-4" />,
      },
      {
        id: "changes",
        label: "最近修改次数",
        value: formatNumber(scopedLogs.length),
        helper: "最近操作与保存版本",
        trend: "down" as const,
        icon: <History className="h-4 w-4" />,
      },
    ],
    [scopedLogs.length, scopedProducts.length, scopedSales.length, scopedStores.length],
  );

  return (
    <AppShell
      pageTitle="总览"
      pageDescription={`当前系统：${systemLabel} · 当前账号：${authUser?.name} (${cnRoleLabel(authUser?.role ?? "viewer")})`}
    >
      <section className="grid gap-4 xl:grid-cols-4">
        {statCards.map((item) => (
          <StatCard key={item.id} item={item} icon={item.icon} />
        ))}
      </section>

      <section className="mt-6 grid gap-6 xl:grid-cols-[1.6fr_1fr]">
        <article className="tonal-panel p-5">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-muted">最近修改记录</p>
              <h2 className="mt-1 text-lg font-semibold text-text">变更日志</h2>
            </div>
            <div className="flex items-center gap-2">
              <button
                className="inline-flex min-h-9 items-center justify-center rounded-mono bg-surface-base px-3 text-sm font-medium text-text transition hover:bg-surface-high"
                onClick={() =>
                  exportRowsToXlsx(
                    scopedLogs.map((log) => ({
                      系统: log.systemId ? systemLabelMap.get(log.systemId) ?? log.systemId : "全部",
                      操作人: log.operator,
                      动作: log.action,
                      标题: log.title,
                      说明: log.description,
                      时间: log.timestamp,
                    })),
                    "变更日志导出",
                    "变更日志",
                  )
                }
              >
                <Download className="mr-1 h-4 w-4" />
                导出 XLSX
              </button>
              <Badge tone="primary">最近 {Math.min(scopedLogs.length, 6)} 条</Badge>
            </div>
          </div>
          <div className="overflow-hidden rounded-mono bg-surface-low">
            <table className="table-grid min-w-0">
              <thead>
                <tr>
                  <th>系统</th>
                  <th>操作人</th>
                  <th>动作</th>
                  <th>说明</th>
                  <th>时间</th>
                </tr>
              </thead>
              <tbody>
                {scopedLogs.slice(0, 6).map((log) => (
                  <tr key={log.id}>
                    <td>{log.systemId ? systemLabelMap.get(log.systemId) ?? log.systemId : "全部"}</td>
                    <td>{log.operator}</td>
                    <td>
                      <Badge>{log.action}</Badge>
                    </td>
                    <td>{log.description}</td>
                    <td className="tabular text-muted">{log.timestamp}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </article>

        <div className="space-y-6">
          <article className="tonal-panel p-5">
            <div className="mb-4 flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-warning" />
              <h2 className="text-lg font-semibold text-text">数据异常提醒</h2>
            </div>
            <div className="space-y-3">
              {scopedAlerts.map((alert) => (
                <div key={alert.id} className="rounded-mono bg-surface-low p-4">
                  <div className="mb-2 flex items-center justify-between gap-3">
                    <p className="text-sm font-semibold text-text">{alert.title}</p>
                    <Badge tone={alert.level === "critical" ? "critical" : alert.level === "warning" ? "primary" : "neutral"}>
                      {alert.level}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted">{alert.description}</p>
                  <p className="mt-2 text-xs text-muted">
                    系统：{alert.systemId ? systemLabelMap.get(alert.systemId) ?? alert.systemId : "全部"}
                  </p>
                </div>
              ))}
            </div>
          </article>

          <article className="tonal-panel p-5">
            <div className="mb-4 flex items-center gap-2">
              <Activity className="h-4 w-4 text-primary" />
              <h2 className="text-lg font-semibold text-text">当前上下文</h2>
            </div>
            <div className="grid gap-3">
              <Meta label="系统标签" value={systemLabel} />
              <Meta label="可查看系统数" value={String(authUser?.viewSystemIds.length ?? systems.length - 1)} />
              <Meta label="可编辑系统数" value={String(authUser?.editSystemIds.length ?? systems.length - 1)} />
            </div>
          </article>
        </div>
      </section>
    </AppShell>
  );
}

function Meta({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-mono bg-surface-low p-4">
      <p className="mb-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-muted">{label}</p>
      <p className="text-base font-medium text-text">{value}</p>
    </div>
  );
}
