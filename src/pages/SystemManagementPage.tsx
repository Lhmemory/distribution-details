import { ChangeEvent, FormEvent, useMemo, useRef, useState } from "react";
import { Download, Edit3, Plus, Search, Trash2, Upload } from "lucide-react";
import { useAppContext } from "../app/context/AppContext";
import { SystemCooperationStatus, SystemItem } from "../app/types";
import { exportRowsToXlsx } from "../app/utils/export";
import { nowLabel } from "../app/utils/format";
import { canAccessSystem, canManageAccounts, getVisibleSystems } from "../app/utils/permissions";
import {
  calculateSystemCompleteness,
  normalizeSystemLabel,
  normalizeSystemRecord,
  SYSTEM_STATUS_OPTIONS,
  SYSTEM_TYPE_OPTIONS,
} from "../app/utils/systemInfo";
import { downloadSystemTemplate, parseSystemTemplate } from "../app/utils/templateImport";
import { Badge } from "../components/common/Badge";
import { Button } from "../components/common/Button";
import { DataTable, TableColumn } from "../components/common/DataTable";
import { Drawer } from "../components/common/Drawer";
import { FormField } from "../components/common/FormField";
import { AppShell } from "../components/layout/AppShell";

type SystemFormState = Pick<
  SystemItem,
  | "id"
  | "label"
  | "editable"
  | "createdAt"
  | "systemType"
  | "region"
  | "cooperationStatus"
  | "businessScope"
  | "keyCategories"
  | "settlementNotes"
  | "updatedAt"
  | "nextReviewDate"
  | "notes"
>;

function todayInputDate() {
  const date = new Date();
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function emptyForm(): SystemFormState {
  return {
    id: "",
    label: "",
    editable: true,
    createdAt: nowLabel(),
    systemType: "",
    region: "",
    cooperationStatus: "资料待补",
    businessScope: "",
    keyCategories: "",
    settlementNotes: "",
    updatedAt: todayInputDate(),
    nextReviewDate: "",
    notes: "",
  };
}

function toFormState(system: SystemItem): SystemFormState {
  return {
    id: system.id,
    label: system.label,
    editable: system.editable,
    createdAt: system.createdAt,
    systemType: system.systemType ?? "",
    region: system.region ?? "",
    cooperationStatus: system.cooperationStatus ?? "资料待补",
    businessScope: system.businessScope ?? "",
    keyCategories: system.keyCategories ?? "",
    settlementNotes: system.settlementNotes ?? "",
    updatedAt: system.updatedAt ?? "",
    nextReviewDate: system.nextReviewDate ?? "",
    notes: system.notes ?? "",
  };
}

function formToRecord(form: SystemFormState, fallbackId: string): SystemItem {
  return normalizeSystemRecord({
    id: form.id || fallbackId,
    label: form.label,
    editable: form.editable,
    createdAt: form.createdAt || nowLabel(),
    systemType: form.systemType,
    region: form.region,
    cooperationStatus: form.cooperationStatus,
    businessScope: form.businessScope,
    keyCategories: form.keyCategories,
    settlementNotes: form.settlementNotes,
    updatedAt: form.updatedAt,
    nextReviewDate: form.nextReviewDate,
    notes: form.notes,
  });
}

function statusTone(status?: SystemCooperationStatus) {
  if (status === "合作中") return "success";
  if (status === "已终止" || status === "暂停合作") return "critical";
  if (status === "待开发") return "primary";
  return "neutral";
}

function displayValue(value: string | undefined) {
  return value?.trim() ? value : "-";
}

export function SystemManagementPage() {
  const {
    systems,
    products,
    stores,
    sales,
    priceGuides,
    authUser,
    upsertSystem,
    deleteSystem,
  } = useAppContext();
  const [keyword, setKeyword] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [regionFilter, setRegionFilter] = useState("all");
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editing, setEditing] = useState<SystemItem | null>(null);
  const [form, setForm] = useState<SystemFormState>(emptyForm);
  const [formError, setFormError] = useState("");
  const [uploading, setUploading] = useState(false);
  const [uploadMessage, setUploadMessage] = useState("");
  const [uploadError, setUploadError] = useState("");
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const visibleSystems = useMemo(
    () => getVisibleSystems(authUser, systems).filter((system) => system.id !== "all"),
    [authUser, systems],
  );

  const relatedCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const system of systems) counts[system.id] = 0;
    for (const row of products) counts[row.systemId] = (counts[row.systemId] ?? 0) + 1;
    for (const row of stores) counts[row.systemId] = (counts[row.systemId] ?? 0) + 1;
    for (const row of sales) counts[row.systemId] = (counts[row.systemId] ?? 0) + 1;
    for (const row of priceGuides) counts[row.systemId] = (counts[row.systemId] ?? 0) + 1;
    return counts;
  }, [priceGuides, products, sales, stores, systems]);

  const regionOptions = useMemo(
    () =>
      Array.from(new Set(visibleSystems.map((system) => system.region).filter((item): item is string => Boolean(item)))).sort(),
    [visibleSystems],
  );

  const rows = useMemo(
    () =>
      visibleSystems.filter((system) => {
        const matchKeyword =
          !keyword ||
          [
            system.label,
            system.id,
            system.systemType,
            system.region,
            system.businessScope,
            system.keyCategories,
            system.settlementNotes,
            system.notes,
          ]
            .filter(Boolean)
            .some((value) => String(value).toLowerCase().includes(keyword.toLowerCase()));
        const matchStatus = statusFilter === "all" || system.cooperationStatus === statusFilter;
        const matchRegion = regionFilter === "all" || system.region === regionFilter;
        return matchKeyword && matchStatus && matchRegion;
      }),
    [keyword, regionFilter, statusFilter, visibleSystems],
  );

  function canEditSystem(system: SystemItem) {
    return canManageAccounts(authUser) || canAccessSystem(authUser, system.id, "edit");
  }

  function openCreateDrawer() {
    setEditing(null);
    setForm(emptyForm());
    setFormError("");
    setDrawerOpen(true);
  }

  function openEditDrawer(system: SystemItem) {
    setEditing(system);
    setForm(toFormState(system));
    setFormError("");
    setDrawerOpen(true);
  }

  function updateForm<K extends keyof SystemFormState>(key: K, value: SystemFormState[K]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  function saveForm() {
    const label = form.label.trim();
    if (!label) {
      setFormError("系统名称不能为空。");
      return;
    }

    if (!editing && !canManageAccounts(authUser)) {
      setFormError("只有管理员可以新增系统。");
      return;
    }

    if (editing && !canEditSystem(editing)) {
      setFormError("当前账号没有维护这个系统的权限。");
      return;
    }

    const duplicate = systems.some(
      (system) =>
        system.id !== (editing?.id ?? form.id) &&
        system.id !== "all" &&
        normalizeSystemLabel(system.label) === normalizeSystemLabel(label),
    );

    if (duplicate) {
      setFormError(`系统 "${label}" 已存在。`);
      return;
    }

    upsertSystem(formToRecord(form, editing?.id ?? `sys-${Date.now()}`));
    setDrawerOpen(false);
  }

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    saveForm();
  }

  async function handleUpload(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setUploadMessage("");
    setUploadError("");

    try {
      const records = await parseSystemTemplate(file, systems, authUser);
      records.forEach((record) => upsertSystem(record));
      setUploadMessage(`已导入 ${records.length} 条系统基本信息。`);
    } catch (error) {
      setUploadError(error instanceof Error ? error.message : "系统基本信息导入失败。");
    } finally {
      event.target.value = "";
      setUploading(false);
    }
  }

  function handleDelete(system: SystemItem) {
    const relatedCount = relatedCounts[system.id] ?? 0;
    if (!canManageAccounts(authUser)) return;
    if (relatedCount > 0) {
      window.alert(`"${system.label}" 已关联 ${relatedCount} 条商品、门店、销售或价格指引数据，不能直接删除。`);
      return;
    }

    if (window.confirm(`确认删除系统 "${system.label}"？删除后无法在当前页面恢复。`)) {
      deleteSystem(system.id);
    }
  }

  const columns = useMemo<TableColumn<SystemItem>[]>(
    () => [
      {
        key: "label",
        header: "系统名称",
        sortable: true,
        width: "14%",
        sortValue: (row) => row.label,
        render: (row) => (
          <div>
            <p className="font-semibold text-text">{row.label}</p>
            <p className="mt-1 text-xs text-muted">{row.id}</p>
          </div>
        ),
      },
      {
        key: "type",
        header: "类型 / 区域",
        width: "13%",
        render: (row) => (
          <div className="space-y-1 text-sm">
            <p>{displayValue(row.systemType)}</p>
            <p className="text-muted">{displayValue(row.region)}</p>
          </div>
        ),
      },
      {
        key: "status",
        header: "合作状态",
        sortable: true,
        width: "10%",
        sortValue: (row) => row.cooperationStatus ?? "",
        render: (row) => <Badge tone={statusTone(row.cooperationStatus)}>{row.cooperationStatus ?? "资料待补"}</Badge>,
      },
      {
        key: "scope",
        header: "主要业务范围",
        width: "16%",
        render: (row) => <span className="clamp-2 block leading-6">{displayValue(row.businessScope)}</span>,
      },
      {
        key: "categories",
        header: "重点品类/品牌",
        width: "14%",
        render: (row) => <span className="clamp-2 block leading-6">{displayValue(row.keyCategories)}</span>,
      },
      {
        key: "completeness",
        header: "资料完整度",
        sortable: true,
        width: "11%",
        sortValue: (row) => row.completeness ?? calculateSystemCompleteness(row),
        render: (row) => {
          const score = row.completeness ?? calculateSystemCompleteness(row);
          return (
            <div className="min-w-[96px]">
              <div className="mb-2 flex items-center justify-between text-xs">
                <span className="tabular font-semibold text-text">{score}%</span>
                <span className="text-muted">{score >= 80 ? "较完整" : "待补齐"}</span>
              </div>
              <div className="h-2 rounded-full bg-surface-low">
                <div className="h-2 rounded-full bg-primary" style={{ width: `${score}%` }} />
              </div>
            </div>
          );
        },
      },
      {
        key: "review",
        header: "更新 / 复核",
        width: "12%",
        render: (row) => (
          <div className="space-y-1 text-sm">
            <p className="tabular">{displayValue(row.updatedAt)}</p>
            <p className="tabular text-muted">{displayValue(row.nextReviewDate)}</p>
          </div>
        ),
      },
      {
        key: "actions",
        header: "操作",
        width: "10%",
        render: (row) => (
          <div className="flex flex-col items-end gap-2">
            <Button
              variant="secondary"
              className="min-h-9 w-[92px] px-3"
              disabled={!canEditSystem(row)}
              onClick={() => openEditDrawer(row)}
            >
              <Edit3 className="mr-1 h-4 w-4" />
              编辑
            </Button>
            <Button
              variant="danger"
              className="min-h-9 w-[92px] px-3"
              disabled={!canManageAccounts(authUser) || (relatedCounts[row.id] ?? 0) > 0}
              onClick={() => handleDelete(row)}
            >
              <Trash2 className="mr-1 h-4 w-4" />
              删除
            </Button>
          </div>
        ),
      },
    ],
    [authUser, relatedCounts, systems],
  );

  return (
    <AppShell
      pageTitle="系统基本信息"
      pageDescription="维护客户/渠道系统的基础资料、合作状态、业务范围和复核节奏。"
      pageActions={
        <div className="flex flex-wrap gap-2">
          <input ref={fileInputRef} type="file" accept=".xlsx,.csv" className="hidden" onChange={handleUpload} />
          <Button variant="secondary" onClick={downloadSystemTemplate}>
            <Download className="mr-1 h-4 w-4" />
            下载模板
          </Button>
          <Button variant="secondary" disabled={uploading} onClick={() => fileInputRef.current?.click()}>
            <Upload className="mr-1 h-4 w-4" />
            {uploading ? "导入中..." : "上传模板"}
          </Button>
          <Button
            variant="secondary"
            onClick={() =>
              exportRowsToXlsx(
                rows.map((row) => ({
                  系统名称: row.label,
                  系统标识: row.id,
                  系统类型: row.systemType ?? "",
                  归属区域: row.region ?? "",
                  合作状态: row.cooperationStatus ?? "",
                  主要业务范围: row.businessScope ?? "",
                  "重点品类/品牌": row.keyCategories ?? "",
                  "结算/费用备注": row.settlementNotes ?? "",
                  资料完整度: row.completeness ?? calculateSystemCompleteness(row),
                  最近更新日期: row.updatedAt ?? "",
                  下次复核日期: row.nextReviewDate ?? "",
                  备注: row.notes ?? "",
                })),
                "系统基本信息导出",
                "系统基本信息",
              )
            }
          >
            <Download className="mr-1 h-4 w-4" />
            导出 XLSX
          </Button>
          <Button disabled={!canManageAccounts(authUser)} onClick={openCreateDrawer}>
            <Plus className="mr-1 h-4 w-4" />
            新增系统
          </Button>
        </div>
      }
    >
      <section className="tonal-panel p-5">
        <div className="mb-4 grid gap-3 xl:grid-cols-[1fr_180px_180px]">
          <label className="relative block">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
            <input
              className="field-input bg-white pl-10"
              placeholder="搜索系统名称 / 标识 / 业务范围 / 备注"
              value={keyword}
              onChange={(event) => setKeyword(event.target.value)}
            />
          </label>
          <select className="field-input bg-white" value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
            <option value="all">全部合作状态</option>
            {SYSTEM_STATUS_OPTIONS.map((status) => (
              <option key={status} value={status}>
                {status}
              </option>
            ))}
          </select>
          <select className="field-input bg-white" value={regionFilter} onChange={(event) => setRegionFilter(event.target.value)}>
            <option value="all">全部归属区域</option>
            {regionOptions.map((region) => (
              <option key={region} value={region}>
                {region}
              </option>
            ))}
          </select>
        </div>

        <div className="mb-4 flex flex-wrap items-center gap-2">
          <Badge tone="primary">已启用模板导入</Badge>
          <span className="text-sm text-muted">系统基本信息不记录业务负责人、客户联系人、电话、密码或密钥。</span>
        </div>

        {uploadMessage ? <p className="mb-4 rounded-mono bg-primary/10 px-3 py-2 text-sm text-primary">{uploadMessage}</p> : null}
        {uploadError ? <p className="mb-4 rounded-mono bg-critical-bg/10 px-3 py-2 text-sm text-critical">{uploadError}</p> : null}

        <DataTable
          rows={rows}
          columns={columns}
          pageSize={12}
          paginationSummary={`当前可见 ${visibleSystems.length} 个系统，筛选后 ${rows.length} 个`}
          emptyTitle="暂无系统基本信息"
          emptyDescription="请调整筛选条件，或由管理员新增系统。"
        />
      </section>

      <Drawer
        open={drawerOpen}
        title={editing ? "编辑系统基本信息" : "新增系统"}
        subtitle={editing ? `${editing.label} / ${editing.id}` : "新增后会同步到顶部全局系统标签。"}
        onClose={() => setDrawerOpen(false)}
        footer={
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setDrawerOpen(false)}>
              取消
            </Button>
            <Button onClick={saveForm}>保存</Button>
          </div>
        }
      >
        <form className="space-y-4" onSubmit={handleSubmit}>
          {formError ? <p className="rounded-mono bg-critical-bg/10 px-3 py-2 text-sm text-critical">{formError}</p> : null}

          <div className="grid gap-4 sm:grid-cols-2">
            <FormField label="系统名称">
              <input className="field-input" value={form.label} onChange={(event) => updateForm("label", event.target.value)} />
            </FormField>
            <FormField label="系统标识" hint={editing ? "系统标识用于关联商品、门店、销售等数据，不建议修改。" : "新增时自动生成。"}>
              <input className="field-input" value={form.id || "保存时自动生成"} disabled />
            </FormField>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <FormField label="系统类型">
              <input
                className="field-input"
                list="system-type-options"
                value={form.systemType ?? ""}
                onChange={(event) => updateForm("systemType", event.target.value)}
              />
              <datalist id="system-type-options">
                {SYSTEM_TYPE_OPTIONS.map((item) => (
                  <option key={item} value={item} />
                ))}
              </datalist>
            </FormField>
            <FormField label="归属区域">
              <input className="field-input" value={form.region ?? ""} onChange={(event) => updateForm("region", event.target.value)} />
            </FormField>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <FormField label="合作状态">
              <select
                className="field-input"
                value={form.cooperationStatus ?? "资料待补"}
                onChange={(event) => updateForm("cooperationStatus", event.target.value as SystemCooperationStatus)}
              >
                {SYSTEM_STATUS_OPTIONS.map((status) => (
                  <option key={status} value={status}>
                    {status}
                  </option>
                ))}
              </select>
            </FormField>
            <FormField label="资料完整度">
              <input className="field-input" value={`${calculateSystemCompleteness(formToRecord(form, form.id || "draft"))}%`} disabled />
            </FormField>
          </div>

          <FormField label="主要业务范围">
            <textarea
              className="field-input min-h-24 resize-y"
              value={form.businessScope ?? ""}
              onChange={(event) => updateForm("businessScope", event.target.value)}
            />
          </FormField>

          <FormField label="重点品类/品牌">
            <textarea
              className="field-input min-h-20 resize-y"
              value={form.keyCategories ?? ""}
              onChange={(event) => updateForm("keyCategories", event.target.value)}
            />
          </FormField>

          <FormField label="结算/费用备注">
            <textarea
              className="field-input min-h-24 resize-y"
              value={form.settlementNotes ?? ""}
              onChange={(event) => updateForm("settlementNotes", event.target.value)}
            />
          </FormField>

          <div className="grid gap-4 sm:grid-cols-2">
            <FormField label="最近更新日期">
              <input
                className="field-input"
                type="date"
                value={form.updatedAt ?? ""}
                onChange={(event) => updateForm("updatedAt", event.target.value)}
              />
            </FormField>
            <FormField label="下次复核日期">
              <input
                className="field-input"
                type="date"
                value={form.nextReviewDate ?? ""}
                onChange={(event) => updateForm("nextReviewDate", event.target.value)}
              />
            </FormField>
          </div>

          <FormField label="备注">
            <textarea
              className="field-input min-h-24 resize-y"
              value={form.notes ?? ""}
              onChange={(event) => updateForm("notes", event.target.value)}
            />
          </FormField>
        </form>
      </Drawer>
    </AppShell>
  );
}
