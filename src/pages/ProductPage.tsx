import { ChevronDown, ChevronUp, Download, Plus, SlidersHorizontal, Trash2, Upload } from "lucide-react";
import { ChangeEvent, useMemo, useRef, useState } from "react";
import { useAppContext } from "../app/context/AppContext";
import { AsyncStatus, ColumnConfig, ProductRecord } from "../app/types";
import { exportRowsToXlsx } from "../app/utils/export";
import { formatCurrency } from "../app/utils/format";
import { canAccessSystem } from "../app/utils/permissions";
import { downloadProductTemplate, parseProductTemplate } from "../app/utils/templateImport";
import { Badge } from "../components/common/Badge";
import { Button } from "../components/common/Button";
import { DataTable, TableColumn } from "../components/common/DataTable";
import { AppShell } from "../components/layout/AppShell";
import { ProductDrawer } from "../components/products/ProductDrawer";

const defaultColumns: ColumnConfig[] = [
  { key: "barcode", label: "\u6761\u7801", enabled: true },
  { key: "productCode", label: "\u5546\u54c1\u7f16\u7801", enabled: false },
  { key: "productName", label: "\u5546\u54c1\u540d\u79f0", enabled: true },
  { key: "archiveSupplyPrice", label: "\u5efa\u6863\u4f9b\u4ef7", enabled: true },
  { key: "archiveSalePrice", label: "\u5efa\u6863\u552e\u4ef7", enabled: true },
  { key: "promoSupplyPrice", label: "\u4fc3\u9500\u4f9b\u4ef7", enabled: true },
  { key: "promoSalePrice", label: "\u4fc3\u9500\u552e\u4ef7", enabled: true },
  { key: "category", label: "\u884c\u9500\u54c1\u7c7b", enabled: true },
  { key: "updatedAt", label: "\u66f4\u65b0\u65f6\u95f4", enabled: true },
  { key: "actions", label: "\u64cd\u4f5c", enabled: true },
];

export function ProductPage() {
  const { products, selectedSystemId, authUser, systems, upsertProduct, deleteProduct } = useAppContext();
  const [keyword, setKeyword] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [status] = useState<AsyncStatus>("ready");
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editing, setEditing] = useState<ProductRecord | null>(null);
  const [columns, setColumns] = useState(defaultColumns);
  const [columnsExpanded, setColumnsExpanded] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadMessage, setUploadMessage] = useState("");
  const [uploadError, setUploadError] = useState("");
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const filteredRows = useMemo(
    () =>
      products.filter((record) => {
        const matchSystem = selectedSystemId === "all" || record.systemId === selectedSystemId;
        const matchPermission = canAccessSystem(authUser, record.systemId, "view");
        const matchCategory = categoryFilter === "all" || record.category === categoryFilter;
        const matchKeyword =
          !keyword ||
          [record.barcode, record.productCode, record.productName].some((value) =>
            value.toLowerCase().includes(keyword.toLowerCase()),
          );

        return matchSystem && matchPermission && matchCategory && matchKeyword;
      }),
    [authUser, categoryFilter, keyword, products, selectedSystemId],
  );

  const scopedTotalCount = useMemo(
    () =>
      products.filter((record) => {
        const matchSystem = selectedSystemId === "all" || record.systemId === selectedSystemId;
        const matchPermission = canAccessSystem(authUser, record.systemId, "view");
        return matchSystem && matchPermission;
      }).length,
    [authUser, products, selectedSystemId],
  );

  const tableColumns = useMemo<TableColumn<ProductRecord>[]>(
    () =>
      [
        {
          key: "barcode",
          header: "\u6761\u7801",
          sortable: true,
          width: "15%",
          headerClassName: "whitespace-nowrap",
          cellClassName: "whitespace-nowrap",
          sortValue: (row: ProductRecord) => row.barcode,
          render: (row: ProductRecord) => <span className="tabular">{row.barcode}</span>,
        },
        {
          key: "productCode",
          header: "\u5546\u54c1\u7f16\u7801",
          sortable: true,
          width: "11%",
          headerClassName: "whitespace-nowrap",
          cellClassName: "whitespace-nowrap",
          sortValue: (row: ProductRecord) => row.productCode,
          render: (row: ProductRecord) => <span className="tabular">{row.productCode || "-"}</span>,
        },
        {
          key: "productName",
          header: "\u5546\u54c1\u540d\u79f0",
          sortable: true,
          width: "18%",
          sortValue: (row: ProductRecord) => row.productName,
          render: (row: ProductRecord) => <span className="clamp-2 block break-words font-medium leading-6 text-text">{row.productName}</span>,
        },
        {
          key: "archiveSupplyPrice",
          header: "\u5efa\u6863\u4f9b\u4ef7",
          sortable: true,
          width: "8%",
          headerClassName: "whitespace-nowrap",
          cellClassName: "whitespace-nowrap",
          sortValue: (row: ProductRecord) => row.archiveSupplyPrice,
          render: (row: ProductRecord) => <span className="tabular">{formatCurrency(row.archiveSupplyPrice)}</span>,
        },
        {
          key: "archiveSalePrice",
          header: "\u5efa\u6863\u552e\u4ef7",
          sortable: true,
          width: "8%",
          headerClassName: "whitespace-nowrap",
          cellClassName: "whitespace-nowrap",
          sortValue: (row: ProductRecord) => row.archiveSalePrice,
          render: (row: ProductRecord) => <span className="tabular">{formatCurrency(row.archiveSalePrice)}</span>,
        },
        {
          key: "promoSupplyPrice",
          header: "\u4fc3\u9500\u4f9b\u4ef7",
          sortable: true,
          width: "8%",
          headerClassName: "whitespace-nowrap",
          cellClassName: "whitespace-nowrap",
          sortValue: (row: ProductRecord) => row.promoSupplyPrice,
          render: (row: ProductRecord) => <span className="tabular">{formatCurrency(row.promoSupplyPrice)}</span>,
        },
        {
          key: "promoSalePrice",
          header: "\u4fc3\u9500\u552e\u4ef7",
          sortable: true,
          width: "8%",
          headerClassName: "whitespace-nowrap",
          cellClassName: "whitespace-nowrap",
          sortValue: (row: ProductRecord) => row.promoSalePrice,
          render: (row: ProductRecord) => <span className="tabular">{formatCurrency(row.promoSalePrice)}</span>,
        },
        {
          key: "category",
          header: "\u884c\u9500\u54c1\u7c7b",
          width: "8%",
          headerClassName: "whitespace-nowrap",
          cellClassName: "whitespace-nowrap text-center",
          render: (row: ProductRecord) => row.category ?? "-",
        },
        {
          key: "updatedAt",
          header: "\u66f4\u65b0\u65f6\u95f4",
          sortable: true,
          width: "14%",
          headerClassName: "whitespace-nowrap",
          cellClassName: "whitespace-nowrap",
          sortValue: (row: ProductRecord) => row.updatedAt,
          render: (row: ProductRecord) => <span className="tabular text-[14px]">{row.updatedAt}</span>,
        },
        {
          key: "actions",
          header: "\u64cd\u4f5c",
          width: "12%",
          headerClassName: "whitespace-nowrap",
          cellClassName: "whitespace-nowrap",
          render: (row: ProductRecord) => (
            <div className="flex flex-col items-end gap-2">
              <Button
                variant="secondary"
                className="min-h-9 w-[92px] px-3"
                onClick={() => {
                  setEditing(row);
                  setDrawerOpen(true);
                }}
              >
                \u7f16\u8f91
              </Button>
              <Button variant="danger" className="min-h-9 w-[92px] px-3" onClick={() => deleteProduct(row.id)}>
                <Trash2 className="mr-1 h-4 w-4" />
                \u5220\u9664
              </Button>
            </div>
          ),
        },
      ].filter((column) => columns.find((item) => item.key === column.key)?.enabled),
    [columns, deleteProduct],
  );

  async function handleUpload(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setUploadMessage("");
    setUploadError("");

    try {
      const records = await parseProductTemplate(file, selectedSystemId, systems, authUser);
      records.forEach((record) => upsertProduct(record));
      setUploadMessage(`\u5df2\u5bfc\u5165 ${records.length} \u4e2a\u5546\u54c1\u3002`);
    } catch (error) {
      setUploadError(error instanceof Error ? error.message : "\u5546\u54c1\u6a21\u677f\u5bfc\u5165\u5931\u8d25\u3002");
    } finally {
      event.target.value = "";
      setUploading(false);
    }
  }

  return (
    <AppShell
      pageTitle="\u5546\u54c1\u4fe1\u606f"
      pageDescription="\u6309\u7cfb\u7edf\u7ef4\u62a4\u5546\u54c1\u6863\u6848\u3001\u4ef7\u683c\u5b57\u6bb5\u4e0e\u6a21\u677f\u5bfc\u5165\u5bfc\u51fa\u3002"
      pageActions={
        <div className="flex flex-wrap gap-2">
          <input ref={fileInputRef} type="file" accept=".xlsx,.xls,.csv" className="hidden" onChange={handleUpload} />
          <Button variant="secondary" onClick={downloadProductTemplate}>
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
                filteredRows.map((row) => ({
                  \u7cfb\u7edf: systems.find((item) => item.id === row.systemId)?.label ?? row.systemId,
                  \u6761\u7801: row.barcode,
                  \u5546\u54c1\u7f16\u7801: row.productCode,
                  \u5546\u54c1\u540d\u79f0: row.productName,
                  \u5efa\u6863\u4f9b\u4ef7: row.archiveSupplyPrice,
                  \u5efa\u6863\u552e\u4ef7: row.archiveSalePrice,
                  \u4fc3\u9500\u4f9b\u4ef7: row.promoSupplyPrice,
                  \u4fc3\u9500\u552e\u4ef7: row.promoSalePrice,
                  \u884c\u9500\u54c1\u7c7b: row.category ?? "",
                  \u66f4\u65b0\u65f6\u95f4: row.updatedAt,
                })),
                "\u5546\u54c1\u4fe1\u606f\u5bfc\u51fa",
                "\u5546\u54c1\u4fe1\u606f",
              )
            }
          >
            <Download className="mr-1 h-4 w-4" />
            \u5bfc\u51fa XLSX
          </Button>
          <Button
            onClick={() => {
              setEditing(null);
              setDrawerOpen(true);
            }}
          >
            <Plus className="mr-1 h-4 w-4" />
            \u65b0\u589e\u5546\u54c1
          </Button>
        </div>
      }
    >
      <section className="tonal-panel p-5">
        <div className="mb-4 grid gap-3 xl:grid-cols-[1fr_280px]">
          <input
            className="field-input bg-white"
            placeholder="\u641c\u7d22\u6761\u7801 / \u5546\u54c1\u7f16\u7801 / \u5546\u54c1\u540d\u79f0"
            value={keyword}
            onChange={(event) => setKeyword(event.target.value)}
          />
          <select className="field-input bg-white" value={categoryFilter} onChange={(event) => setCategoryFilter(event.target.value)}>
            <option value="all">\u5168\u90e8\u884c\u9500\u54c1\u7c7b</option>
            <option value="\u6218\u7565">\u6218\u7565</option>
            <option value="\u76c8\u5229">\u76c8\u5229</option>
            <option value="\u6e20\u9053">\u6e20\u9053</option>
            <option value="\u884c\u60c5">\u884c\u60c5</option>
            <option value="\u7cbe\u54c1\u8c03\u5473">\u7cbe\u54c1\u8c03\u5473</option>
          </select>
        </div>

        <div className="mb-4 rounded-mono bg-surface-low p-4">
          <button
            type="button"
            className="flex w-full items-center justify-between gap-3 text-left"
            onClick={() => setColumnsExpanded((current) => !current)}
          >
            <div className="flex items-center gap-2 text-sm font-medium text-text">
              <SlidersHorizontal className="h-4 w-4 text-primary" />
              \u5217\u914d\u7f6e
              <span className="text-xs font-normal text-muted">\u5df2\u542f\u7528 {columns.filter((item) => item.enabled).length} \u5217</span>
            </div>
            {columnsExpanded ? <ChevronUp className="h-4 w-4 text-muted" /> : <ChevronDown className="h-4 w-4 text-muted" />}
          </button>

          {columnsExpanded ? (
            <div className="mt-3 grid gap-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
              {columns.map((column) => (
                <label key={column.key} className="flex items-center gap-2 text-sm text-muted">
                  <input
                    type="checkbox"
                    checked={column.enabled}
                    onChange={(event) =>
                      setColumns((current) =>
                        current.map((item) => (item.key === column.key ? { ...item, enabled: event.target.checked } : item)),
                      )
                    }
                  />
                  {column.label}
                </label>
              ))}
            </div>
          ) : null}
        </div>

        <div className="mb-4 flex items-center gap-2">
          <Badge tone="primary">\u5df2\u542f\u7528\u6a21\u677f\u5bfc\u5165</Badge>
          <span className="text-sm text-muted">\u6a21\u677f\u548c\u5bfc\u51fa\u90fd\u5df2\u5e26\u7cfb\u7edf\u5217\uff1b\u672a\u586b\u5199\u7cfb\u7edf\u65f6\uff0c\u9ed8\u8ba4\u5bfc\u5165\u5230\u5f53\u524d\u5df2\u9009\u7cfb\u7edf\u3002</span>
        </div>

        {uploadMessage ? <p className="mb-4 rounded-mono bg-primary/10 px-3 py-2 text-sm text-primary">{uploadMessage}</p> : null}
        {uploadError ? <p className="mb-4 rounded-mono bg-critical-bg/10 px-3 py-2 text-sm text-critical">{uploadError}</p> : null}

        <DataTable
          rows={filteredRows}
          columns={tableColumns}
          status={status}
          pageSize={20}
          paginationSummary={`\u5f53\u524d\u7cfb\u7edf\u5171 ${scopedTotalCount} \u4e2a\u5546\u54c1`}
          emptyTitle="\u6682\u65e0\u5546\u54c1\u4fe1\u606f"
          emptyDescription="\u5f53\u524d\u7cfb\u7edf\u6216\u7b5b\u9009\u6761\u4ef6\u4e0b\u6ca1\u6709\u5339\u914d\u5546\u54c1\uff0c\u53ef\u4ee5\u5148\u65b0\u589e\u6216\u4e0a\u4f20\u6a21\u677f\u3002"
        />
      </section>

      <ProductDrawer
        open={drawerOpen}
        systems={systems}
        initialValue={editing}
        onClose={() => setDrawerOpen(false)}
        onSubmit={(record) => {
          upsertProduct(record);
          setDrawerOpen(false);
        }}
      />
    </AppShell>
  );
}
