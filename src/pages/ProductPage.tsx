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
  { key: "barcode", label: "条码", enabled: true },
  { key: "productCode", label: "商品编码", enabled: false },
  { key: "productName", label: "商品名称", enabled: true },
  { key: "archiveSupplyPrice", label: "建档供价", enabled: true },
  { key: "archiveSalePrice", label: "建档售价", enabled: true },
  { key: "promoSupplyPrice", label: "促销供价", enabled: true },
  { key: "promoSalePrice", label: "促销售价", enabled: true },
  { key: "category", label: "行销品类", enabled: true },
  { key: "updatedAt", label: "更新时间", enabled: true },
  { key: "actions", label: "操作", enabled: true },
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
          header: "条码",
          sortable: true,
          width: "15%",
          headerClassName: "whitespace-nowrap",
          cellClassName: "whitespace-nowrap",
          sortValue: (row: ProductRecord) => row.barcode,
          render: (row: ProductRecord) => <span className="tabular">{row.barcode}</span>,
        },
        {
          key: "productCode",
          header: "商品编码",
          sortable: true,
          width: "11%",
          headerClassName: "whitespace-nowrap",
          cellClassName: "whitespace-nowrap",
          sortValue: (row: ProductRecord) => row.productCode,
          render: (row: ProductRecord) => <span className="tabular">{row.productCode || "-"}</span>,
        },
        {
          key: "productName",
          header: "商品名称",
          sortable: true,
          width: "18%",
          sortValue: (row: ProductRecord) => row.productName,
          render: (row: ProductRecord) => <span className="clamp-2 block break-words font-medium leading-6 text-text">{row.productName}</span>,
        },
        {
          key: "archiveSupplyPrice",
          header: "建档供价",
          sortable: true,
          width: "8%",
          headerClassName: "whitespace-nowrap",
          cellClassName: "whitespace-nowrap",
          sortValue: (row: ProductRecord) => row.archiveSupplyPrice,
          render: (row: ProductRecord) => <span className="tabular">{formatCurrency(row.archiveSupplyPrice)}</span>,
        },
        {
          key: "archiveSalePrice",
          header: "建档售价",
          sortable: true,
          width: "8%",
          headerClassName: "whitespace-nowrap",
          cellClassName: "whitespace-nowrap",
          sortValue: (row: ProductRecord) => row.archiveSalePrice,
          render: (row: ProductRecord) => <span className="tabular">{formatCurrency(row.archiveSalePrice)}</span>,
        },
        {
          key: "promoSupplyPrice",
          header: "促销供价",
          sortable: true,
          width: "8%",
          headerClassName: "whitespace-nowrap",
          cellClassName: "whitespace-nowrap",
          sortValue: (row: ProductRecord) => row.promoSupplyPrice,
          render: (row: ProductRecord) => <span className="tabular">{formatCurrency(row.promoSupplyPrice)}</span>,
        },
        {
          key: "promoSalePrice",
          header: "促销售价",
          sortable: true,
          width: "8%",
          headerClassName: "whitespace-nowrap",
          cellClassName: "whitespace-nowrap",
          sortValue: (row: ProductRecord) => row.promoSalePrice,
          render: (row: ProductRecord) => <span className="tabular">{formatCurrency(row.promoSalePrice)}</span>,
        },
        {
          key: "category",
          header: "行销品类",
          width: "8%",
          headerClassName: "whitespace-nowrap",
          cellClassName: "whitespace-nowrap text-center",
          render: (row: ProductRecord) => row.category ?? "-",
        },
        {
          key: "updatedAt",
          header: "更新时间",
          sortable: true,
          width: "14%",
          headerClassName: "whitespace-nowrap",
          cellClassName: "whitespace-nowrap",
          sortValue: (row: ProductRecord) => row.updatedAt,
          render: (row: ProductRecord) => <span className="tabular text-[14px]">{row.updatedAt}</span>,
        },
        {
          key: "actions",
          header: "操作",
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
                编辑
              </Button>
              <Button variant="danger" className="min-h-9 w-[92px] px-3" onClick={() => deleteProduct(row.id)}>
                <Trash2 className="mr-1 h-4 w-4" />
                删除
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
      setUploadMessage(`已导入 ${records.length} 个商品。`);
    } catch (error) {
      setUploadError(error instanceof Error ? error.message : "商品模板导入失败。");
    } finally {
      event.target.value = "";
      setUploading(false);
    }
  }

  return (
    <AppShell
      pageTitle="商品信息"
      pageDescription="按系统维护商品档案、价格字段与模板导入导出。"
      pageActions={
        <div className="flex flex-wrap gap-2">
          <input ref={fileInputRef} type="file" accept=".xlsx,.xls,.csv" className="hidden" onChange={handleUpload} />
          <Button variant="secondary" onClick={downloadProductTemplate}>
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
                filteredRows.map((row) => ({
                  系统: systems.find((item) => item.id === row.systemId)?.label ?? row.systemId,
                  条码: row.barcode,
                  商品编码: row.productCode,
                  商品名称: row.productName,
                  建档供价: row.archiveSupplyPrice,
                  建档售价: row.archiveSalePrice,
                  促销供价: row.promoSupplyPrice,
                  促销售价: row.promoSalePrice,
                  行销品类: row.category ?? "",
                  更新时间: row.updatedAt,
                })),
                "商品信息导出",
                "商品信息",
              )
            }
          >
            <Download className="mr-1 h-4 w-4" />
            导出 XLSX
          </Button>
          <Button
            onClick={() => {
              setEditing(null);
              setDrawerOpen(true);
            }}
          >
            <Plus className="mr-1 h-4 w-4" />
            新增商品
          </Button>
        </div>
      }
    >
      <section className="tonal-panel p-5">
        <div className="mb-4 grid gap-3 xl:grid-cols-[1fr_280px]">
          <input
            className="field-input bg-white"
            placeholder="搜索条码 / 商品编码 / 商品名称"
            value={keyword}
            onChange={(event) => setKeyword(event.target.value)}
          />
          <select className="field-input bg-white" value={categoryFilter} onChange={(event) => setCategoryFilter(event.target.value)}>
            <option value="all">全部行销品类</option>
            <option value="战略">战略</option>
            <option value="盈利">盈利</option>
            <option value="渠道">渠道</option>
            <option value="行情">行情</option>
            <option value="精品调味">精品调味</option>
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
              列配置
              <span className="text-xs font-normal text-muted">已启用 {columns.filter((item) => item.enabled).length} 列</span>
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
          <Badge tone="primary">已启用模板导入</Badge>
          <span className="text-sm text-muted">模板和导出都已带系统列；未填写系统时，默认导入到当前已选系统。</span>
        </div>

        {uploadMessage ? <p className="mb-4 rounded-mono bg-primary/10 px-3 py-2 text-sm text-primary">{uploadMessage}</p> : null}
        {uploadError ? <p className="mb-4 rounded-mono bg-critical-bg/10 px-3 py-2 text-sm text-critical">{uploadError}</p> : null}

        <DataTable
          rows={filteredRows}
          columns={tableColumns}
          status={status}
          pageSize={20}
          paginationSummary={`当前系统共 ${scopedTotalCount} 个商品`}
          emptyTitle="暂无商品信息"
          emptyDescription="当前系统或筛选条件下没有匹配商品，可以先新增或上传模板。"
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
