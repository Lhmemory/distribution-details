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
      header: "\u95e8\u5e97\u7f16\u7801",
      sortable: true,
      width: "8%",
      headerClassName: "whitespace-nowrap",
      cellClassName: "whitespace-nowrap",
      sortValue: (row) => row.storeCode,
      render: (row) => <span className="tabular">{row.storeCode || "-"}</span>,
    },
    {
      key: "storeName",
      header: "\u95e8\u5e97\u540d\u79f0",
      sortable: true,
      width: "12%",
      headerClassName: "whitespace-nowrap",
      sortValue: (row) => row.storeName,
      render: (row) => <span className="block break-words font-medium leading-6">{row.storeName}</span>,
    },
    {
      key: "city",
      header: "\u57ce\u5e02",
      width: "8%",
      headerClassName: "whitespace-nowrap",
      cellClassName: "whitespace-nowrap",
      render: (row) => row.city,
    },
    {
      key: "region",
      header: "\u533a\u57df",
      width: "10%",
      headerClassName: "whitespace-nowrap",
      cellClassName: "whitespace-nowrap",
      render: (row) => row.region,
    },
    {
      key: "format",
      header: "\u4e1a\u6001",
      width: "7%",
      headerClassName: "whitespace-nowrap",
      cellClassName: "whitespace-nowrap",
      render: (row) => row.format,
    },
    {
      key: "status",
      header: "\u8425\u4e1a\u72b6\u6001",
      width: "8%",
      headerClassName: "whitespace-nowrap",
      render: (row) => (
        <Badge
          tone={
            row.businessStatus === "\u8425\u4e1a"
              ? "success"
              : row.businessStatus === "\u5df2\u95ed\u5e97"
                ? "critical"
                : row.businessStatus === "\u5e97\u6539"
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
      header: "\u8ba1\u5212\u65f6\u95f4",
      width: "8%",
      headerClassName: "whitespace-nowrap",
      cellClassName: "whitespace-nowrap",
      render: (row) => row.plannedCloseDate ?? row.plannedOpenDate ?? "-",
    },
    {
      key: "salesVolume",
      header: "\u9500\u91cf",
      sortable: true,
      width: "12%",
      headerClassName: "whitespace-nowrap",
      cellClassName: "whitespace-nowrap",
      sortValue: (row) => row.salesVolume,
      render: (row) => <span className="tabular">{formatNumber(row.salesVolume)}</span>,
    },
    {
      key: "updatedAt",
      header: "\u6700\u8fd1\u66f4\u65b0\u65f6\u95f4",
      sortable: true,
      width: "12%",
      headerClassName: "whitespace-nowrap",
      cellClassName: "whitespace-nowrap",
      sortValue: (row) => row.updatedAt,
      render: (row) => <span className="tabular text-[14px]">{row.updatedAt}</span>,
    },
    {
      key: "actions",
      header: "\u64cd\u4f5c",
      width: "15%",
      headerClassName: "whitespace-nowrap",
      cellClassName: "whitespace-nowrap",
      render: (row) => (
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="secondary" className="min-h-9 min-w-[108px] px-3" onClick={() => setActiveStore(row)}>
            \u67e5\u770b\u8be6\u60c5
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
            \u7f16\u8f91\u95e8\u5e97
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
      setUploadMessage(`\u5df2\u5bfc\u5165 ${records.length} \u4e2a\u95e8\u5e97\u3002`);
    } catch (error) {
      setUploadError(error instanceof Error ? error.message : "\u95e8\u5e97\u6a21\u677f\u5bfc\u5165\u5931\u8d25\u3002");
    } finally {
      event.target.value = "";
      setUploading(false);
    }
  }

  return (
    <AppShell
      pageTitle="\u95e8\u5e97\u4fe1\u606f"
      pageDescription="\u7ef4\u62a4\u95e8\u5e97\u7f16\u7801\u3001\u57ce\u5e02\u3001\u533a\u57df\u3001\u4e1a\u6001\u3001\u8425\u4e1a\u72b6\u6001\u548c\u6a21\u677f\u5bfc\u5165\u3002"
      pageActions={
        <div className="flex flex-wrap gap-2">
          <input ref={fileInputRef} type="file" accept=".xlsx,.xls,.csv" className="hidden" onChange={handleUpload} />
          <Button variant="secondary" onClick={downloadStoreTemplate}>
            <Download className="mr-1 h-4 w-4" />
            \u4e0b\u8f7d\u6a21\u677f
          </Button>
          <Button variant="secondary" disabled={uploading} onClick={() => fileInputRef.current?.click()}>
            <Upload className="mr-1 h-4 w-4" />
            {uploading ? "\u5bfc\u5165\u4e2d..." : "\u4e0a\u4f20\u6a21\u677f"}
          </Button>
          <Button
            variant="secondary"
            onClick={() =>
              exportRowsToXlsx(
                rows.map((row) => ({
                  \u7cfb\u7edf: systems.find((item) => item.id === row.systemId)?.label ?? row.systemId,
                  \u95e8\u5e97\u7f16\u7801: row.storeCode,
                  \u95e8\u5e97\u540d\u79f0: row.storeName,
                  \u57ce\u5e02: row.city,
                  \u533a\u57df: row.region,
                  \u4e1a\u6001: row.format,
                  \u95e8\u5e97\u72b6\u6001: row.businessStatus,
                  \u8ba1\u5212\u95ed\u5e97\u65f6\u95f4: row.plannedCloseDate ?? "",
                  \u8ba1\u5212\u5f00\u4e1a\u65f6\u95f4: row.plannedOpenDate ?? "",
                  \u5e97\u6539\u5f00\u4e1a\u65f6\u95f4: row.renovationOpenDate ?? "",
                  \u9500\u91cf: row.salesVolume,
                  \u6700\u8fd1\u66f4\u65b0\u65f6\u95f4: row.updatedAt,
                })),
                "\u95e8\u5e97\u4fe1\u606f\u5bfc\u51fa",
                "\u95e8\u5e97\u4fe1\u606f",
              )
            }
          >
            <Download className="mr-1 h-4 w-4" />
            \u5bfc\u51fa XLSX
          </Button>
          <Button
            disabled={!canCreateStore}
            onClick={() => {
              setEditingStore(null);
              setFormOpen(true);
            }}
          >
            <Plus className="mr-1 h-4 w-4" />
            \u65b0\u589e\u95e8\u5e97
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
              placeholder="\u641c\u7d22\u95e8\u5e97\u7f16\u7801 / \u95e8\u5e97\u540d\u79f0 / \u57ce\u5e02"
              value={keyword}
              onChange={(event) => setKeyword(event.target.value)}
            />
          </label>
          <select className="field-input bg-white" value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
            <option value="all">\u5168\u90e8\u95e8\u5e97\u72b6\u6001</option>
            <option value="\u8425\u4e1a">\u8425\u4e1a</option>
            <option value="\u5df2\u95ed\u5e97">\u5df2\u95ed\u5e97</option>
            <option value="\u8ba1\u5212\u95ed\u5e97">\u8ba1\u5212\u95ed\u5e97</option>
            <option value="\u8ba1\u5212\u5f00\u4e1a">\u8ba1\u5212\u5f00\u4e1a</option>
            <option value="\u5e97\u6539">\u5e97\u6539</option>
          </select>
        </div>

        <div className="mb-4 flex items-center gap-2">
          <Badge tone="primary">\u5df2\u542f\u7528\u6a21\u677f\u5bfc\u5165</Badge>
          <span className="text-sm text-muted">\u6a21\u677f\u548c\u5bfc\u51fa\u90fd\u5df2\u5e26\u7cfb\u7edf\u5217\uff1b\u672a\u586b\u5199\u7cfb\u7edf\u65f6\uff0c\u9ed8\u8ba4\u5bfc\u5165\u5230\u5f53\u524d\u5df2\u9009\u7cfb\u7edf\u3002</span>
        </div>

        {uploadMessage ? <p className="mb-4 rounded-mono bg-primary/10 px-3 py-2 text-sm text-primary">{uploadMessage}</p> : null}
        {uploadError ? <p className="mb-4 rounded-mono bg-critical-bg/10 px-3 py-2 text-sm text-critical">{uploadError}</p> : null}

        <DataTable
          rows={rows}
          columns={columns}
          pageSize={20}
          paginationSummary={`\u5f53\u524d\u7cfb\u7edf\u5171 ${scopedTotalCount} \u4e2a\u95e8\u5e97`}
          emptyTitle="\u6682\u65e0\u95e8\u5e97\u4fe1\u606f"
          emptyDescription="\u5f53\u524d\u7cfb\u7edf\u4e0b\u6ca1\u6709\u5339\u914d\u95e8\u5e97\uff0c\u53ef\u4ee5\u8c03\u6574\u7b5b\u9009\u6761\u4ef6\u6216\u4e0a\u4f20\u6a21\u677f\u3002"
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
