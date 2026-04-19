import { Download, FileSpreadsheet, Search, Upload } from "lucide-react";
import { ChangeEvent, useMemo, useRef, useState } from "react";
import { useAppContext } from "../app/context/AppContext";
import { PriceGuideRecord } from "../app/types";
import { exportRowsToXlsx } from "../app/utils/export";
import { formatCurrency, nowLabel } from "../app/utils/format";
import { parsePriceGuideWorkbook } from "../app/utils/priceGuide";
import { Button } from "../components/common/Button";
import { DataTable, TableColumn } from "../components/common/DataTable";
import { AppShell } from "../components/layout/AppShell";

const PRICE_GUIDE_GLOBAL_SYSTEM_ID = "global-price-guide";

export function PriceGuidePage() {
  const { priceGuides, importPriceGuides } = useAppContext();
  const [keyword, setKeyword] = useState("");
  const [sheetFilter, setSheetFilter] = useState("all");
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const scopedRecords = priceGuides;

  const visibleRecords = useMemo(
    () =>
      scopedRecords.filter((record) => {
        const matchSheet = sheetFilter === "all" || record.sheetName === sheetFilter;
        const matchKeyword =
          !keyword ||
          [
            record.sourceFileName,
            record.sheetName,
            record.materialCode,
            record.productName,
            record.spec,
            record.scope,
            record.executionPeriod,
          ]
            .join(" ")
            .toLowerCase()
            .includes(keyword.toLowerCase());
        return matchSheet && matchKeyword;
      }),
    [keyword, scopedRecords, sheetFilter],
  );

  const sheetOptions = useMemo(
    () => Array.from(new Set(scopedRecords.map((item) => item.sheetName))).sort((left, right) => left.localeCompare(right, "zh-CN")),
    [scopedRecords],
  );

  async function handleUpload(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setUploadError("");

    try {
      const records = await parsePriceGuideWorkbook(file, PRICE_GUIDE_GLOBAL_SYSTEM_ID, nowLabel());
      if (!records.length) {
        throw new Error("这份 Excel 没有识别到可导入的价格指引数据。");
      }

      importPriceGuides(records, file.name, PRICE_GUIDE_GLOBAL_SYSTEM_ID);
    } catch (error) {
      setUploadError(error instanceof Error ? error.message : "导入失败，请检查文件格式。");
    } finally {
      event.target.value = "";
      setUploading(false);
    }
  }

  const columns: TableColumn<PriceGuideRecord>[] = [
    {
      key: "sheetName",
      header: "页签",
      sortable: true,
      width: "10%",
      headerClassName: "whitespace-nowrap",
      sortValue: (row) => row.sheetName,
      render: (row) => <span className="block break-words font-medium">{row.sheetName}</span>,
    },
    {
      key: "materialCode",
      header: "物料码",
      sortable: true,
      width: "11%",
      headerClassName: "whitespace-nowrap",
      cellClassName: "whitespace-nowrap",
      sortValue: (row) => row.materialCode,
      render: (row) => row.materialCode || "-",
    },
    {
      key: "productName",
      header: "物料描述",
      sortable: true,
      width: "22%",
      sortValue: (row) => row.productName,
      render: (row) => <span className="clamp-2 block break-words font-medium">{row.productName}</span>,
    },
    {
      key: "spec",
      header: "规格",
      width: "8%",
      headerClassName: "whitespace-nowrap",
      cellClassName: "whitespace-nowrap",
      render: (row) => row.spec || "-",
    },
    {
      key: "executionPeriod",
      header: "执行时间",
      sortable: true,
      width: "11%",
      sortValue: (row) => row.executionPeriod ?? "",
      render: (row) => row.executionPeriod || "-",
    },
    {
      key: "distributorSettlementPrice",
      header: "经销商结算价",
      sortable: true,
      width: "10%",
      headerClassName: "whitespace-nowrap",
      cellClassName: "whitespace-nowrap",
      sortValue: (row) => row.distributorSettlementPrice ?? 0,
      render: (row) => (row.distributorSettlementPrice ? formatCurrency(row.distributorSettlementPrice) : "-"),
    },
    {
      key: "keyAccountPromoSupplyPrice",
      header: "重客促销供价",
      sortable: true,
      width: "10%",
      headerClassName: "whitespace-nowrap",
      cellClassName: "whitespace-nowrap",
      sortValue: (row) => row.keyAccountPromoSupplyPrice ?? 0,
      render: (row) => (row.keyAccountPromoSupplyPrice ? formatCurrency(row.keyAccountPromoSupplyPrice) : "-"),
    },
    {
      key: "scope",
      header: "执行范围",
      width: "18%",
      render: (row) => <span className="clamp-2 block break-words text-sm">{row.scope || "-"}</span>,
    },
  ];

  return (
    <AppShell
      pageTitle="价格指引"
      pageDescription="上传每月价格指引 Excel，统一维护经销商结算价和重客促销供价。"
      showSystemTabs={false}
      pageActions={
        <div className="flex flex-wrap gap-2">
          <input
            ref={fileInputRef}
            type="file"
            accept=".xlsx,.xls,.csv"
            className="hidden"
            onChange={handleUpload}
          />
          <Button variant="secondary" disabled={uploading} onClick={() => fileInputRef.current?.click()}>
            <Upload className="mr-1 h-4 w-4" />
            {uploading ? "导入中..." : "上传价格指引"}
          </Button>
          <Button
            variant="secondary"
            disabled={!visibleRecords.length}
            onClick={() =>
              exportRowsToXlsx(
                visibleRecords.map((row) => ({
                  文件名: row.sourceFileName,
                  页签: row.sheetName,
                  执行时间: row.executionPeriod ?? "",
                  物料码: row.materialCode,
                  子品类: row.subCategory ?? "",
                  产品类别: row.productCategory ?? "",
                  物料描述: row.productName,
                  规格: row.spec ?? "",
                  箱容: row.cartonSize ?? "",
                  执行范围: row.scope ?? "",
                  政策说明: row.policyNote ?? "",
                  经销商结算价: row.distributorSettlementPrice ?? "",
                  重客促销供价: row.keyAccountPromoSupplyPrice ?? "",
                  导入时间: row.importedAt,
                })),
                "价格指引导出",
                "价格指引",
              )
            }
          >
            <Download className="mr-1 h-4 w-4" />
            导出 XLSX
          </Button>
        </div>
      }
    >
      <section className="mb-6 grid gap-4 xl:grid-cols-[1.15fr_0.85fr]">
        <article className="tonal-panel p-5">
          <div className="mb-3 flex items-center gap-2">
            <FileSpreadsheet className="h-5 w-5 text-primary" />
            <h2 className="text-base font-semibold text-text">导入说明</h2>
          </div>
          <div className="space-y-2 text-sm text-muted">
            <p>1. 支持上传你们每个月下发的 `.xlsx / .xls` 价格指引。</p>
            <p>2. 系统会优先识别“说明”页中的执行时间、品类和邮件标题。</p>
            <p>3. 明细页目前只提取两个价格口径：经销商结算价、重客促销供价。</p>
          </div>
          {uploadError ? <p className="mt-4 rounded-mono bg-critical-bg/10 px-3 py-2 text-sm text-critical">{uploadError}</p> : null}
        </article>

        <article className="tonal-panel grid gap-4 p-5 sm:grid-cols-3">
          <MetricCard title="当前记录" value={String(scopedRecords.length)} helper="全局价格指引条数" />
          <MetricCard title="当前页签" value={String(sheetOptions.length)} helper="已识别的价格页签" />
          <MetricCard title="数据范围" value="全系统共用" helper="所有有权限账号共用同一套价格指引" />
        </article>
      </section>

      <section className="tonal-panel p-5">
        <div className="mb-4 grid gap-3 xl:grid-cols-[1fr_260px]">
          <label className="relative block">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
            <input
              className="field-input bg-white pl-10"
              placeholder="搜索文件名 / 页签 / 物料码 / 物料描述 / 规格 / 执行范围"
              value={keyword}
              onChange={(event) => setKeyword(event.target.value)}
            />
          </label>
          <select className="field-input bg-white" value={sheetFilter} onChange={(event) => setSheetFilter(event.target.value)}>
            <option value="all">全部页签</option>
            {sheetOptions.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </div>

        <DataTable
          rows={visibleRecords}
          columns={columns}
          pageSize={20}
          paginationSummary={`共 ${scopedRecords.length} 条价格指引`}
          emptyTitle="暂无价格指引"
          emptyDescription="先上传一份月度价格指引 Excel，页面就会自动解析并显示。"
        />
      </section>
    </AppShell>
  );
}

function MetricCard({ title, value, helper }: { title: string; value: string; helper: string }) {
  return (
    <div className="rounded-mono bg-surface-low px-4 py-4">
      <p className="text-[11px] font-semibold tracking-[0.08em] text-muted">{title}</p>
      <p className="mt-2 text-lg font-semibold text-text">{value}</p>
      <p className="mt-1 text-sm text-muted">{helper}</p>
    </div>
  );
}
