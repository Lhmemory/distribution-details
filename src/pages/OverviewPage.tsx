import {
  AlertTriangle,
  BarChart3,
  Download,
  History,
  Package,
  RefreshCw,
  ShieldCheck,
  Store,
  UsersRound,
} from "lucide-react";
import { useMemo } from "react";
import { useAppContext } from "../app/context/AppContext";
import { exportRowsToXlsx } from "../app/utils/export";
import { cnRoleLabel, formatNumber } from "../app/utils/format";
import { canAccessSystem } from "../app/utils/permissions";
import { Badge } from "../components/common/Badge";
import { Button } from "../components/common/Button";
import { StatCard } from "../components/common/StatCard";
import { AppShell } from "../components/layout/AppShell";

export function OverviewPage() {
  const { selectedSystemId, systems, products, stores, sales, changeLogs, alerts, authUser } = useAppContext();
  const systemLabel = systems.find((item) => item.id === selectedSystemId)?.label ?? "全部";
  const systemLabelMap = new Map(systems.map((item) => [item.id, item.label]));
  const visibleSystemIds = systems
    .filter((system) => system.id !== "all" && canAccessSystem(authUser, system.id))
    .map((system) => system.id);
  const editableSystemIds = systems
    .filter((system) => system.id !== "all" && canAccessSystem(authUser, system.id, "edit"))
    .map((system) => system.id);
  const visibleSystemNames = visibleSystemIds.map((id) => systemLabelMap.get(id)).filter(Boolean).join("、");
  const editableSystemNames = editableSystemIds.map((id) => systemLabelMap.get(id)).filter(Boolean).join("、") || "无";

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
        label: "商品总数",
        value: formatNumber(scopedProducts.length),
        helper: "较上月 +236 (+2.78%)",
        trend: "up" as const,
        icon: <Package className="h-4 w-4" />,
      },
      {
        id: "stores",
        label: "门店总数",
        value: formatNumber(scopedStores.length),
        helper: "较上月 +128 (+2.30%)",
        trend: "up" as const,
        icon: <Store className="h-4 w-4" />,
      },
      {
        id: "sales",
        label: "销售记录",
        value: formatNumber(scopedSales.length),
        helper: "可查看期间版本",
        trend: "flat" as const,
        icon: <BarChart3 className="h-4 w-4" />,
      },
      {
        id: "changes",
        label: "最近修改",
        value: formatNumber(scopedLogs.length),
        helper: "最近操作与保存版本",
        trend: "flat" as const,
        icon: <History className="h-4 w-4" />,
      },
      {
        id: "alerts",
        label: "数据预警",
        value: formatNumber(scopedAlerts.length),
        helper: scopedAlerts.length ? "待处理预警" : "暂无待处理",
        trend: scopedAlerts.length ? "down" as const : "flat" as const,
        icon: <AlertTriangle className="h-4 w-4" />,
      },
    ],
    [scopedAlerts.length, scopedLogs.length, scopedProducts.length, scopedSales.length, scopedStores.length],
  );

  return (
    <AppShell
      pageTitle="总览"
      pageDescription={`当前系统：${systemLabel} · 当前账号：${authUser?.name ?? "-"} (${cnRoleLabel(authUser?.role ?? "viewer")})`}
    >
      <section className="grid gap-3 xl:grid-cols-6">
        {statCards.map((item) => (
          <StatCard key={item.id} item={item} icon={item.icon} />
        ))}
        <article className="tonal-panel p-4">
          <div className="mb-5 flex items-start justify-between gap-3">
            <div>
              <p className="mb-2 text-[13px] font-medium text-muted">我的权限</p>
              <h3 className="text-[1.65rem] font-semibold leading-none text-primary">
                {cnRoleLabel(authUser?.role ?? "viewer")}
              </h3>
            </div>
            <div className="rounded-mono bg-primary-soft p-2 text-primary">
              <UsersRound className="h-4 w-4" />
            </div>
          </div>
          <div className="flex items-center gap-2 text-[13px] text-muted">
            <ShieldCheck className="h-4 w-4 text-success" />
            <span>{editableSystemIds.length ? `可编辑 ${editableSystemIds.length} 个系统` : "当前只读"}</span>
          </div>
        </article>
      </section>

      <div className="mt-4 flex flex-wrap items-center gap-3 text-sm text-muted">
        <span>数据更新时间：2026-06-22 08:43:12</span>
        <button className="inline-flex items-center gap-1 rounded-mono px-2 py-1 font-medium text-muted transition hover:bg-surface-low hover:text-primary">
          <RefreshCw className="h-4 w-4" />
          刷新
        </button>
      </div>

      <section className="mt-5 grid gap-5 xl:grid-cols-[1.45fr_1fr]">
        <article className="tonal-panel">
          <div className="flex flex-col gap-3 border-b border-line px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-base font-semibold text-text">最近变更记录</h2>
              <p className="mt-1 text-sm text-muted">按当前系统权限展示最近操作。</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <select className="field-input min-h-10 w-36 bg-white">
                <option>全部类型</option>
                <option>新增</option>
                <option>修改</option>
                <option>删除</option>
              </select>
              <Button
                variant="secondary"
                className="min-h-10"
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
                导出
              </Button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="table-grid min-w-[760px]">
              <thead>
                <tr>
                  <th>时间</th>
                  <th>类型</th>
                  <th>系统</th>
                  <th>对象</th>
                  <th>内容摘要</th>
                  <th>操作人</th>
                </tr>
              </thead>
              <tbody>
                {scopedLogs.slice(0, 8).map((log) => (
                  <tr key={log.id}>
                    <td className="tabular text-muted">{log.timestamp}</td>
                    <td>
                      <Badge tone={log.action === "delete" ? "critical" : log.action === "update" ? "success" : "primary"}>
                        {log.action}
                      </Badge>
                    </td>
                    <td>{log.systemId ? systemLabelMap.get(log.systemId) ?? log.systemId : "全部"}</td>
                    <td>{log.title}</td>
                    <td>{log.description}</td>
                    <td>{log.operator}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </article>

        <article className="tonal-panel">
          <div className="flex items-center justify-between border-b border-line px-4 py-4">
            <div>
              <h2 className="text-base font-semibold text-text">数据预警 ({scopedAlerts.length})</h2>
              <p className="mt-1 text-sm text-muted">优先处理高风险资料缺口。</p>
            </div>
            <button className="text-sm font-semibold text-primary">查看全部</button>
          </div>
          <div className="divide-y divide-line">
            {scopedAlerts.length ? (
              scopedAlerts.slice(0, 6).map((alert) => (
                <div key={alert.id} className="px-4 py-4">
                  <div className="mb-2 flex items-center justify-between gap-3">
                    <div className="flex min-w-0 items-center gap-3">
                      <Badge tone={alert.level === "critical" ? "critical" : alert.level === "warning" ? "primary" : "neutral"}>
                        {alert.level === "critical" ? "高" : alert.level === "warning" ? "中" : "低"}
                      </Badge>
                      <p className="truncate text-sm font-semibold text-text">{alert.title}</p>
                    </div>
                    <span className="shrink-0 text-xs text-muted">2026-06-22</span>
                  </div>
                  <p className="text-sm leading-6 text-muted">{alert.description}</p>
                </div>
              ))
            ) : (
              <div className="px-4 py-10 text-center text-sm text-muted">当前系统暂无数据预警。</div>
            )}
          </div>
        </article>
      </section>

      <section className="tonal-panel mt-5 overflow-hidden">
        <div className="border-b border-line px-4 py-4">
          <h2 className="text-base font-semibold text-text">我的受限上下文</h2>
        </div>
        <div className="grid gap-0 divide-y divide-line lg:grid-cols-[160px_minmax(0,1fr)_minmax(0,1fr)_minmax(300px,1.25fr)] lg:divide-x lg:divide-y-0">
          <Meta label="角色" value={cnRoleLabel(authUser?.role ?? "viewer")} />
          <Meta label="可查看系统" value={`${visibleSystemIds.length} 个`} helper={visibleSystemNames} />
          <Meta label="可编辑系统" value={`${editableSystemIds.length} 个`} helper={editableSystemNames} />
          <div className="min-w-0 p-4">
            <p className="mb-2 text-[12px] font-semibold text-muted">允许的操作范围</p>
            <div className="grid gap-2 sm:grid-cols-2">
              {["查看商品", "查看门店", "查看价格指引", editableSystemIds.length ? "编辑商品" : "只读商品", editableSystemIds.length ? "导入销售数据" : "无导入权限"].map((item) => (
                <span key={item} className="inline-flex min-h-8 items-center whitespace-nowrap rounded-mono bg-primary-soft px-3 py-1 text-sm font-medium text-primary-dim">
                  {item}
                </span>
              ))}
            </div>
          </div>
        </div>
      </section>
    </AppShell>
  );
}

function Meta({ label, value, helper }: { label: string; value: string; helper?: string }) {
  return (
    <div className="min-w-0 p-4">
      <p className="mb-2 text-[12px] font-semibold text-muted">{label}</p>
      <p className="whitespace-nowrap text-xl font-semibold text-text">{value}</p>
      {helper ? (
        <p className="mt-2 truncate text-sm text-muted" title={helper}>
          {helper}
        </p>
      ) : null}
    </div>
  );
}
