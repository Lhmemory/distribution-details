import * as XLSX from "xlsx";
import { ProductRecord, StoreRecord, SystemItem, UserAccount } from "../types";
import { nowLabel } from "./format";
import { canAccessSystem } from "./permissions";

function pickTargetSystemId(selectedSystemId: string, systems: SystemItem[], authUser: UserAccount | null) {
  if (selectedSystemId !== "all") {
    return selectedSystemId;
  }

  return systems.find((item) => item.id !== "all" && canAccessSystem(authUser, item.id, "edit"))?.id;
}

function readWorkbook(file: File) {
  return file.arrayBuffer().then((buffer) => XLSX.read(buffer, { type: "array" }));
}

function normalizeText(value: unknown) {
  return String(value ?? "").trim();
}

function normalizeNumber(value: unknown) {
  if (value === null || value === undefined || value === "") return 0;
  const text = String(value).replace(/,/g, "").trim();
  const parsed = Number(text);
  return Number.isFinite(parsed) ? parsed : 0;
}

function normalizeOptionalDate(value: unknown) {
  const text = normalizeText(value);
  return text || undefined;
}

export function downloadProductTemplate() {
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(
    workbook,
    XLSX.utils.json_to_sheet([
      {
        条码: "6900000000001",
        商品编码: "TH-0001",
        商品名称: "示例商品名称",
        建档供价: 49.9,
        建档售价: 56.9,
        促销供价: 45.9,
        促销售价: 52.9,
        行销品类: "战略",
      },
    ]),
    "商品模板",
  );
  XLSX.utils.book_append_sheet(
    workbook,
    XLSX.utils.json_to_sheet([
      { 说明: "1. 请先切到具体系统，再上传模板。" },
      { 说明: "2. 商品编码可留空，条码和商品名称建议填写。" },
      { 说明: "3. 价格留空时按 0 处理。" },
      { 说明: "4. 支持 .xlsx / .xls / .csv。" },
    ]),
    "填写说明",
  );
  XLSX.writeFile(workbook, "商品导入模板.xlsx");
}

export function downloadStoreTemplate() {
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(
    workbook,
    XLSX.utils.json_to_sheet([
      {
        门店编码: "A001",
        门店名称: "示例门店",
        城市: "广州市",
        区域: "广州大超",
        业态: "大超",
        营业状态: "营业",
        计划闭店时间: "",
        计划开业时间: "",
        店改开业时间: "",
        销量: 100000,
      },
    ]),
    "门店模板",
  );
  XLSX.utils.book_append_sheet(
    workbook,
    XLSX.utils.json_to_sheet([
      { 说明: "1. 请先切到具体系统，再上传模板。" },
      { 说明: "2. 门店编码可留空，门店名称建议必填。" },
      { 说明: "3. 营业状态支持：营业、已闭店、计划闭店、计划开业、店改。" },
      { 说明: "4. 对应状态再填写计划时间。" },
    ]),
    "填写说明",
  );
  XLSX.writeFile(workbook, "门店导入模板.xlsx");
}

export async function parseProductTemplate(
  file: File,
  selectedSystemId: string,
  systems: SystemItem[],
  authUser: UserAccount | null,
) {
  const systemId = pickTargetSystemId(selectedSystemId, systems, authUser);
  if (!systemId) {
    throw new Error("请先切换到具体系统，再上传商品模板。");
  }

  const workbook = await readWorkbook(file);
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, { defval: "" });

  const records = rows
    .map((row, index): ProductRecord | null => {
      const barcode = normalizeText(row["条码"]);
      const productName = normalizeText(row["商品名称"]);
      if (!barcode && !productName) return null;

      const category = normalizeText(row["行销品类"]);
      return {
        id: `prd-import-${Date.now()}-${index}`,
        systemId,
        barcode,
        productCode: normalizeText(row["商品编码"]),
        productName,
        archiveSupplyPrice: normalizeNumber(row["建档供价"]),
        archiveSalePrice: normalizeNumber(row["建档售价"]),
        promoSupplyPrice: normalizeNumber(row["促销供价"]),
        promoSalePrice: normalizeNumber(row["促销售价"]),
        category: category || undefined,
        brand: "福临门",
        updatedAt: nowLabel(),
      };
    })
    .filter((item): item is ProductRecord => Boolean(item));

  if (!records.length) {
    throw new Error("模板里没有识别到可导入的商品数据。");
  }

  return records;
}

export async function parseStoreTemplate(
  file: File,
  selectedSystemId: string,
  systems: SystemItem[],
  authUser: UserAccount | null,
) {
  const systemId = pickTargetSystemId(selectedSystemId, systems, authUser);
  if (!systemId) {
    throw new Error("请先切换到具体系统，再上传门店模板。");
  }

  const workbook = await readWorkbook(file);
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, { defval: "" });

  const records = rows
    .map((row, index): StoreRecord | null => {
      const storeName = normalizeText(row["门店名称"]);
      if (!storeName) return null;

      const rawStatus = normalizeText(row["营业状态"]);
      const businessStatus: StoreRecord["businessStatus"] =
        rawStatus === "营业" ||
        rawStatus === "已闭店" ||
        rawStatus === "计划闭店" ||
        rawStatus === "计划开业" ||
        rawStatus === "店改"
          ? rawStatus
          : "营业";

      return {
        id: `sto-import-${Date.now()}-${index}`,
        systemId,
        storeCode: normalizeText(row["门店编码"]),
        storeName,
        city: normalizeText(row["城市"]),
        region: normalizeText(row["区域"]),
        format: normalizeText(row["业态"]),
        businessStatus,
        plannedCloseDate: businessStatus === "计划闭店" ? normalizeOptionalDate(row["计划闭店时间"]) : undefined,
        plannedOpenDate: businessStatus === "计划开业" ? normalizeOptionalDate(row["计划开业时间"]) : undefined,
        renovationOpenDate: businessStatus === "店改" ? normalizeOptionalDate(row["店改开业时间"]) : undefined,
        salesVolume: normalizeNumber(row["销量"]),
        updatedAt: nowLabel(),
      };
    })
    .filter((item): item is StoreRecord => Boolean(item));

  if (!records.length) {
    throw new Error("模板里没有识别到可导入的门店数据。");
  }

  return records;
}
