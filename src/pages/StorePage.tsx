import { Download, Plus, Search, Upload } from "lucide-react";
import { ChangeEvent, useMemo, useRef, useState } from "react";
import { useAppContext } from "../app/context/AppContext";
import { StoreRecord } from "../app/types";
import { exportRowsToXlsx } from "../app/utils/export";
import { formatNumber } from "../app/utils/format";
import { canAccessSystem } from "../app/utils/permissions";
import { downloadStoreTemplate, parseStoreTemplate } from "../app/utils/templateImport";
import { Badge } from "../components/common/Badge";
import { Button } from "../components/common/Button";
import { DataTable, TableColumn } from "../components/common/DataTable";
import { AppShell } from "../components/layout/AppShell";
import { StoreFormDrawer } from "../components/stores/StoreFormDrawer";
import { StoreDrawer } from "../components/stores/StoreDrawer";

export function StorePage() {
  const { stores, selectedSystemId, authUser, systems, upsertStore } = useAppContext();
  const [keyword, setKeyword] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [activeStore, setActiveStore] = useState<StoreRecord | null>(null);
  const [editingStore, setEditingStore] = useState<StoreRecord | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadMessage, setUploadMessage] = useState("");
  const [uploadError, setUploadError] = useState("");
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const rows = useMemo(
    () =>
      stores.filter((store) => {
        const matchSystem = selectedSystemId === "all" || store.systemId === selectedSystemId;
        const matchPermission = canAccessSystem(authUser, store.systemId);
        const matchStatus = statusFilter === "all" || store.businessStatus === statusFilter;
        const matchKeyword =
          !keyword ||
          [store.storeCode, store.storeName, store.city, store.region].some((value) =>
            value.toLowerCase().includes(keyword.toLowerCase()),
          );

        return matchSystem && matchPermission && matchStatus && matchKeyword;
      }),
    [authUser, keyword, selectedSystemId, statusFilter, stores],
  );

  const scopedTotalCount = useMemo(
    () =>
      stores.filter((store) => {
        const matchSystem = selectedSystemId === "all" || store.systemId === selectedSystemId;
        const matchPermission = canAccessSystem(authUser, store.systemId);
        return matchSystem && matchPermission;
      }).length,
    [authUser, selectedSystemId, stores],
  );

  const canCreateStore = Boolean(
    authUser &&
      (selectedSystemId === "all" ? authUser.role === "admin" : canAccessSystem(authUser, selectedSystemId, "edit")),
  );

  const columns: TableColumn<StoreRecord>[] = [
    {
      key: "storeCode",
      header: "门店编码",
      sortable: true,
      width: "8%",
      headerClassName: "whitespace-nowrap",
      cellClassName: "whitespace-nowrap",
      sortValue: (row) => row.storeCode,
      render: (row) => <span className="tabular">{row.storeCode || "-"}</span>,
    },
    {
      key: "storeName",
      header: "门店名称",
      sortable: true,
      width: "12%",
      headerClassName: "whitespace-nowrap",
      sortValue: (row) => row.storeName,
      render: (row) => <span className="block break-words font-medium leading-6">{row.storeName}</span>,
    },
    {
      key: "city",
      header: "城市",
      width: "8%",
      headerClassName: "whitespace-nowrap",
      cellClassName: "whitespace-nowrap",
      render: (row) => row.city,
    },
    {
      key: "region",
      header: "区域",
      width: "10%",
      headerClassName: "whitespace-nowrap",
      cellClassName: "whitespace-nowrap",
      render: (row) => row.region,
    },
    {
      key: "format",
      header: "业态",
      width: "7%",
      headerClassName: "whitespace-nowrap",
      cellClassName: "whitespace-nowrap",
      render: (row) => row.format,
    },
    {
      key: "status",
      header: "营业状态",
      width: "8%",
      headerClassName: "whitespace-nowrap",
      render: (row) => (
        <Badge
          tone={
            row.businessStatus === "营业"
              ? "success"
              : row.businessStatus === "已闭店"
                ? "critical"
                : row.businessStatus === "店改"
                  ? "neutral"
                  : "primary"
          }
        >
          {row.businessStatus}
        </Badge>
      ),
    },
    {
      key: "planDate",
      header: "计划时间",
      width: "8%",
      headerClassName: "whitespace-nowrap",
      cellClassName: "whitespace-nowrap",
      render: (row) => row.plannedCloseDate ?? row.plannedOpenDate ?? "-",
    },
    {
      key: "salesVolume",
      header: "销量",
      sortable: true,
      width: "12%",
      headerClassName: "whitespace-nowrap",
      cellClassName: "whitespace-nowrap",
      sortValue: (row) => row.salesVolume,
      render: (row) => <span className="tabular">{formatNumber(row.salesVolume)}</span>,
    },
    {
      key: "updatedAt",
      header: "最近更新时间",
      sortable: true,
      width: "12%",
      headerClassName: "whitespace-nowrap",
      cellClassName: "whitespace-nowrap",
      sortValue: (row) => row.updatedAt,
      render: (row) => <span className="tabular text-[14px]">{row.updatedAt}</span>,
    },
    {
      key: "actions",
      header: "操作",
      width: "15%",
      headerClassName: "whitespace-nowrap",
      cellClassName: "whitespace-nowrap",
      render: (row) => (
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="secondary" className="min-h-9 min-w-[108px] px-3" onClick={() => setActiveStore(row)}>
            查看详情
          </Button>
          <Button
            variant="secondary"
            className="min-h-9 min-w-[108px] px-3"
            disabled={!canAccessSystem(authUser, row.systemId, "edit")}
            onClick={() => {
              setEditingStore(row);
              setFormOpen(true);
            }}
          >
            编辑门店
          </Button>
        </div>
      ),
    },
  ];

  async function handleUpload(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setUploadMessage("");
    setUploadError("");

    try {
      const records = await parseStoreTemplate(file, selectedSystemId, systems, authUser);
      records.forEach((record) => upsertStore(record));
      setUploadMessage(`已导入 ${records.length} 个门店。`);
    } catch (error) {
      setUploadError(error instanceof Error ? error.message : "门店模板导入失败。");
    } finally {
      event.target.value = "";
      setUploading(false);
    }
  }

  return (
    <AppShell
      pageTitle="门店信息"
      pageDescription="维护门店编码、城市、区域、业态、营业状态和模板导入。"
      pageActions={
        <div className="flex flex-wrap gap-2">
          <input ref={fileInputRef} type="file" accept=".xlsx,.xls,.csv" className="hidden" onChange={handleUpload} />
          <Button variant="secondary" onClick={downloadStoreTemplate}>
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
                  门店编码: row.storeCode,
                  门店名称: row.storeName,
                  城市: row.city,
                  区域: row.region,
                  业态: row.format,
                  门店状态: row.businessStatus,
                  计划闭店时间: row.plannedCloseDate ?? "",
                  计划开业时间: row.plannedOpenDate ?? "",
                  店改开业时间: row.renovationOpenDate ?? "",
                  销量: row.salesVolume,
                  最近更新时间: row.updatedAt,
                })),
                "门店信息导出",
                "门店信息",
              )
            }
          >
            <Download className="mr-1 h-4 w-4" />
            导出 XLSX
          </Button>
          <Button
            disabled={!canCreateStore}
            onClick={() => {
              setEditingStore(null);
              setFormOpen(true);
            }}
          >
            <Plus className="mr-1 h-4 w-4" />
            新增门店
          </Button>
        </div>
      }
    >
      <section className="tonal-panel p-5">
        <div className="mb-4 grid gap-3 md:grid-cols-[1fr_220px]">
          <label className="relative block">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
            <input
              className="field-input bg-white pl-10"
              placeholder="搜索门店编码 / 门店名称 / 城市"
              value={keyword}
              onChange={(event) => setKeyword(event.target.value)}
            />
          </label>
          <select className="field-input bg-white" value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
            <option value="all">全部门店状态</option>
            <option value="营业">营业</option>
            <option value="已闭店">已闭店</option>
            <option value="计划闭店">计划闭店</option>
            <option value="计划开业">计划开业</option>
            <option value="店改">店改</option>
          </select>
        </div>

        <div className="mb-4 flex items-center gap-2">
          <Badge tone="primary">已启用模板导入</Badge>
          <span className="text-sm text-muted">先下载标准模板，按模板填完后上传到当前系统。</span>
        </div>

        {uploadMessage ? <p className="mb-4 rounded-mono bg-primary/10 px-3 py-2 text-sm text-primary">{uploadMessage}</p> : null}
        {uploadError ? <p className="mb-4 rounded-mono bg-critical-bg/10 px-3 py-2 text-sm text-critical">{uploadError}</p> : null}

        <DataTable
          rows={rows}
          columns={columns}
          pageSize={20}
          paginationSummary={`当前系统共 ${scopedTotalCount} 个门店`}
          emptyTitle="暂无门店信息"
          emptyDescription="当前系统下没有匹配门店，可以调整筛选条件或上传模板。"
        />
      </section>

      <StoreDrawer open={Boolean(activeStore)} store={activeStore} onClose={() => setActiveStore(null)} />
      <StoreFormDrawer
        open={formOpen}
        systems={systems}
        initialValue={editingStore}
        onClose={() => setFormOpen(false)}
        onSubmit={(record) => {
          upsertStore(record);
          setFormOpen(false);
        }}
      />
    </AppShell>
  );
}
