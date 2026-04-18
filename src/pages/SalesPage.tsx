import { useEffect, useMemo, useState } from "react";
import { Download, RotateCcw, Save } from "lucide-react";
import { useAppContext } from "../app/context/AppContext";
import { SalesPeriodRecord, TimeGranularity } from "../app/types";
import { exportRowsToXlsx } from "../app/utils/export";
import { canAccessSystem } from "../app/utils/permissions";
import { AppShell } from "../components/layout/AppShell";
import { Button } from "../components/common/Button";
import { Badge } from "../components/common/Badge";
import { VersionHistoryPanel } from "../components/sales/VersionHistoryPanel";

const granularityOptions: { key: TimeGranularity; label: string }[] = [
  { key: "month", label: "月" },
  { key: "quarter", label: "季" },
  { key: "year", label: "年" },
  { key: "custom", label: "自定义区间" },
];

export function SalesPage() {
  const { sales, selectedSystemId, authUser, saveSalesRecord, changeLogs } = useAppContext();
  const [granularity, setGranularity] = useState<TimeGranularity>("quarter");
  const [brandFilter, setBrandFilter] = useState("福临门");
  const [customRange, setCustomRange] = useState({ start: "2026-01-01", end: "2026-03-31" });
  const [draftValues, setDraftValues] = useState<Record<string, number>>({});

  const scopedRecords = useMemo(
    () =>
      sales.filter((record) => {
        const matchSystem = selectedSystemId === "all" || record.systemId === selectedSystemId;
        const matchBrand = !brandFilter || record.brand === brandFilter;
        const matchPermission = canAccessSystem(authUser, record.systemId, "view");
        const matchGranularity = record.granularity === granularity || (granularity === "custom" && record.granularity === "quarter");
        return matchSystem && matchBrand && matchPermission && matchGranularity;
      }),
    [authUser, brandFilter, granularity, sales, selectedSystemId],
  );

  const activeRecord = scopedRecords[0] ?? null;

  useEffect(() => {
    setDraftValues(activeRecord?.values ?? {});
  }, [activeRecord]);

  const columns = activeRecord ? Object.keys(activeRecord.values) : [];
  const dirty = JSON.stringify(draftValues) !== JSON.stringify(activeRecord?.values ?? {});
  const canEdit = Boolean(activeRecord && authUser && canAccessSystem(authUser, activeRecord.systemId, "edit"));

  function handleSave() {
    if (!activeRecord || !authUser) return;
    saveSalesRecord(
      {
        ...activeRecord,
        values: draftValues,
        version: activeRecord.version + 1,
        updatedAt: new Intl.DateTimeFormat("zh-CN", {
          year: "numeric",
          month: "2-digit",
          day: "2-digit",
          hour: "2-digit",
          minute: "2-digit",
        }).format(new Date()),
        updatedBy: authUser.name,
      },
      authUser.name,
    );
  }

  return (
    <AppShell
      pageTitle="销售数据"
      pageDescription="按期间维护销售数据，支持表格内编辑、保存、撤销和版本记录。"
      pageActions={
        <div className="flex gap-2">
          <Button
            variant="secondary"
            onClick={() =>
              exportRowsToXlsx(
                scopedRecords.map((record) => ({
                  系统: record.systemId,
                  品牌: record.brand,
                  期间: record.periodLabel,
                  粒度: record.granularity,
                  版本: record.version,
                  更新时间: record.updatedAt,
                  更新人: record.updatedBy,
                  ...record.values,
                })),
                "销售数据导出",
                "销售数据",
              )
            }
          >
            <Download className="mr-1 h-4 w-4" />
            导出 XLSX
          </Button>
          <Button variant="secondary" disabled={!dirty} onClick={() => setDraftValues(activeRecord?.values ?? {})}>
            <RotateCcw className="mr-1 h-4 w-4" />
            撤销
          </Button>
          <Button disabled={!dirty || !canEdit} onClick={handleSave}>
            <Save className="mr-1 h-4 w-4" />
            保存版本
          </Button>
        </div>
      }
    >
      <section className="grid gap-6 xl:grid-cols-[1.8fr_1fr]">
        <div className="space-y-6">
          <article className="tonal-panel p-5">
            <div className="mb-4 flex flex-wrap gap-3">
              {granularityOptions.map((item) => (
                <button
                  key={item.key}
                  className={`rounded-mono px-4 py-2 text-sm font-medium ${
                    granularity === item.key ? "bg-primary text-white" : "bg-surface-low text-muted"
                  }`}
                  onClick={() => setGranularity(item.key)}
                >
                  {item.label}
                </button>
              ))}
              <select className="field-input max-w-44" value={brandFilter} onChange={(event) => setBrandFilter(event.target.value)}>
                <option value="福临门">福临门</option>
                <option value="">全部品牌</option>
              </select>
              {granularity === "custom" ? (
                <>
                  <input
                    className="field-input max-w-44"
                    type="date"
                    value={customRange.start}
                    onChange={(event) =>
                      setCustomRange((current) => ({ ...current, start: event.target.value }))
                    }
                  />
                  <input
                    className="field-input max-w-44"
                    type="date"
                    value={customRange.end}
                    onChange={(event) =>
                      setCustomRange((current) => ({ ...current, end: event.target.value }))
                    }
                  />
                </>
              ) : null}
            </div>

            <div className="mb-4 flex items-center justify-between">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-muted">按期间维护数据</p>
                <h2 className="mt-1 text-lg font-semibold text-text">
                  {activeRecord ? `${activeRecord.periodLabel} · ${activeRecord.brand}` : "暂无销售记录"}
                </h2>
              </div>
              {activeRecord ? <Badge tone="primary">版本 {activeRecord.version}</Badge> : null}
            </div>

            {activeRecord ? (
              <div className="overflow-x-auto rounded-mono bg-surface-base shadow-ambient">
                <table className="table-grid min-w-[760px]">
                  <thead>
                    <tr>
                      {columns.map((column) => (
                        <th key={column}>{column}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      {columns.map((column) => (
                        <td key={column}>
                          <input
                            className="field-input tabular"
                            type="number"
                            value={draftValues[column] ?? 0}
                            disabled={!canEdit}
                            onChange={(event) =>
                              setDraftValues((current) => ({
                                ...current,
                                [column]: Number(event.target.value),
                              }))
                            }
                          />
                        </td>
                      ))}
                    </tr>
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="rounded-mono bg-surface-low px-6 py-12 text-center text-sm text-muted">
                当前筛选条件下没有可维护的销售记录。
              </div>
            )}
          </article>

          <section className="grid gap-4 md:grid-cols-3">
            <MetricCard title="保存状态" value={dirty ? "有未保存修改" : "已同步"} helper={canEdit ? "可继续编辑" : "当前账号只读"} />
            <MetricCard title="期间粒度" value={granularityOptions.find((item) => item.key === granularity)?.label ?? "-"} helper="支持月 / 季 / 年 / 自定义" />
            <MetricCard title="版本记录" value={String(scopedRecords.length)} helper="已维护的期间条目" />
          </section>
        </div>

        <VersionHistoryPanel items={changeLogs.filter((item) => item.entity === "sales")} />
      </section>
    </AppShell>
  );
}

function MetricCard({ title, value, helper }: { title: string; value: string; helper: string }) {
  return (
    <article className="tonal-panel p-5">
      <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-muted">{title}</p>
      <h3 className="mt-3 text-lg font-semibold text-text">{value}</h3>
      <p className="mt-2 text-sm text-muted">{helper}</p>
    </article>
  );
}
