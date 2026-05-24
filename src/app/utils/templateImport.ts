import * as XLSX from "xlsx";
import { ProductRecord, StoreRecord, SystemCooperationStatus, SystemItem, UserAccount } from "../types";
import { nowLabel } from "./format";
import { canAccessSystem } from "./permissions";
import {
  normalizeSystemLabel,
  normalizeSystemRecord,
  SYSTEM_STATUS_OPTIONS,
  SYSTEM_TYPE_OPTIONS,
} from "./systemInfo";

const PRODUCT_HEADERS = {
  system: "系统",
  barcode: "条码",
  productCode: "商品编码",
  productName: "商品名称",
  archiveSupplyPrice: "建档供价",
  archiveSalePrice: "建档售价",
  promoSupplyPrice: "促销供价",
  promoSalePrice: "促销售价",
  category: "行销品类",
} as const;

const STORE_HEADERS = {
  system: "系统",
  storeCode: "门店编码",
  storeName: "门店名称",
  city: "城市",
  region: "区域",
  format: "业态",
  businessStatus: "营业状态",
  plannedCloseDate: "计划闭店时间",
  plannedOpenDate: "计划开业时间",
  renovationOpenDate: "店改开业时间",
  salesVolume: "销量",
} as const;

const SYSTEM_HEADERS = {
  label: "系统名称",
  id: "系统标识",
  systemType: "系统类型",
  region: "归属区域",
  cooperationStatus: "合作状态",
  businessScope: "主要业务范围",
  keyCategories: "重点品类/品牌",
  settlementNotes: "结算/费用备注",
  updatedAt: "最近更新日期",
  nextReviewDate: "下次复核日期",
  notes: "备注",
} as const;

const HELP_HEADER = "说明";

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

function normalizeSystemDate(value: unknown, rowNumber: number, fieldName: string) {
  if (value === null || value === undefined || value === "") return undefined;

  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    return value.toISOString().slice(0, 10);
  }

  if (typeof value === "number" && Number.isFinite(value)) {
    const parsed = XLSX.SSF.parse_date_code(value);
    if (parsed) {
      return `${parsed.y}-${String(parsed.m).padStart(2, "0")}-${String(parsed.d).padStart(2, "0")}`;
    }
  }

  const text = normalizeText(value);
  if (!text) return undefined;

  const match = text.match(/^(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})$/);
  if (!match) {
    throw new Error(`第 ${rowNumber} 行的${fieldName}格式不正确，请使用 YYYY-MM-DD。`);
  }

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const date = new Date(year, month - 1, day);
  const valid =
    date.getFullYear() === year &&
    date.getMonth() === month - 1 &&
    date.getDate() === day;

  if (!valid) {
    throw new Error(`第 ${rowNumber} 行的${fieldName}不是有效日期。`);
  }

  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

function findSystemByInput(systemInput: string, systems: SystemItem[]) {
  const normalized = systemInput.trim().toLowerCase();
  return systems.find(
    (item) => item.id !== "all" && (item.id.toLowerCase() === normalized || item.label.trim().toLowerCase() === normalized),
  );
}

function resolveImportSystemId(
  systemInput: string,
  selectedSystemId: string,
  systems: SystemItem[],
  authUser: UserAccount | null,
  rowNumber: number,
) {
  const explicitSystem = normalizeText(systemInput);

  if (explicitSystem) {
    const matchedSystem = findSystemByInput(explicitSystem, systems);
    if (!matchedSystem) {
      throw new Error(`第 ${rowNumber} 行的系统 "${explicitSystem}" 不存在。`);
    }

    if (selectedSystemId !== "all" && matchedSystem.id !== selectedSystemId) {
      const selectedLabel = systems.find((item) => item.id === selectedSystemId)?.label ?? selectedSystemId;
      throw new Error(`第 ${rowNumber} 行的系统与当前页面已选系统 "${selectedLabel}" 不一致。`);
    }

    if (!canAccessSystem(authUser, matchedSystem.id, "edit")) {
      throw new Error(`第 ${rowNumber} 行的系统 "${matchedSystem.label}" 没有编辑权限。`);
    }

    return matchedSystem.id;
  }

  const fallbackSystemId = pickTargetSystemId(selectedSystemId, systems, authUser);
  if (!fallbackSystemId) {
    throw new Error(`第 ${rowNumber} 行未填写系统，请先切换到具体系统或在 Excel 中补齐系统列。`);
  }

  return fallbackSystemId;
}

export function downloadProductTemplate() {
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(
    workbook,
    XLSX.utils.json_to_sheet([
      {
        [PRODUCT_HEADERS.system]: "天虹",
        [PRODUCT_HEADERS.barcode]: "6900000000001",
        [PRODUCT_HEADERS.productCode]: "TH-0001",
        [PRODUCT_HEADERS.productName]: "示例商品名称",
        [PRODUCT_HEADERS.archiveSupplyPrice]: 49.9,
        [PRODUCT_HEADERS.archiveSalePrice]: 56.9,
        [PRODUCT_HEADERS.promoSupplyPrice]: 45.9,
        [PRODUCT_HEADERS.promoSalePrice]: 52.9,
        [PRODUCT_HEADERS.category]: "战略",
      },
    ]),
    "商品模板",
  );
  XLSX.utils.book_append_sheet(
    workbook,
    XLSX.utils.json_to_sheet([
      { [HELP_HEADER]: "1. 可以直接在 Excel 中填写“系统”列，支持系统名称或系统 ID。" },
      { [HELP_HEADER]: "2. 如果不填系统列，将默认导入到当前页面已选的具体系统。" },
      { [HELP_HEADER]: "3. 商品编码可留空，条码和商品名称建议填写。" },
      { [HELP_HEADER]: "4. 价格留空时按 0 处理，支持 .xlsx / .xls / .csv。" },
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
        [STORE_HEADERS.system]: "华润",
        [STORE_HEADERS.storeCode]: "A001",
        [STORE_HEADERS.storeName]: "示例门店",
        [STORE_HEADERS.city]: "广州市",
        [STORE_HEADERS.region]: "广州大超",
        [STORE_HEADERS.format]: "大超",
        [STORE_HEADERS.businessStatus]: "营业",
        [STORE_HEADERS.plannedCloseDate]: "",
        [STORE_HEADERS.plannedOpenDate]: "",
        [STORE_HEADERS.renovationOpenDate]: "",
        [STORE_HEADERS.salesVolume]: 100000,
      },
    ]),
    "门店模板",
  );
  XLSX.utils.book_append_sheet(
    workbook,
    XLSX.utils.json_to_sheet([
      { [HELP_HEADER]: "1. 可以直接在 Excel 中填写“系统”列，支持系统名称或系统 ID。" },
      { [HELP_HEADER]: "2. 如果不填系统列，将默认导入到当前页面已选的具体系统。" },
      { [HELP_HEADER]: "3. 门店编码可留空，门店名称建议必填。" },
      { [HELP_HEADER]: "4. 营业状态支持：营业、已闭店、计划闭店、计划开业、店改。" },
    ]),
    "填写说明",
  );
  XLSX.writeFile(workbook, "门店导入模板.xlsx");
}

export function downloadSystemTemplate() {
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(
    workbook,
    XLSX.utils.json_to_sheet([
      {
        [SYSTEM_HEADERS.label]: "示例系统",
        [SYSTEM_HEADERS.id]: "",
        [SYSTEM_HEADERS.systemType]: "客户/渠道系统",
        [SYSTEM_HEADERS.region]: "华南",
        [SYSTEM_HEADERS.cooperationStatus]: "资料待补",
        [SYSTEM_HEADERS.businessScope]: "线下门店 / O2O",
        [SYSTEM_HEADERS.keyCategories]: "福临门",
        [SYSTEM_HEADERS.settlementNotes]: "按实际业务资料填写",
        [SYSTEM_HEADERS.updatedAt]: "2026-05-24",
        [SYSTEM_HEADERS.nextReviewDate]: "2026-06-24",
        [SYSTEM_HEADERS.notes]: "",
      },
    ]),
    "系统基本信息模板",
  );
  XLSX.utils.book_append_sheet(
    workbook,
    XLSX.utils.json_to_sheet([
      { [HELP_HEADER]: "1. 系统名称必填；系统标识可留空，留空时按系统名称匹配已有系统或新增系统。" },
      { [HELP_HEADER]: `2. 系统类型建议使用：${SYSTEM_TYPE_OPTIONS.join("、")}。` },
      { [HELP_HEADER]: `3. 合作状态仅支持：${SYSTEM_STATUS_OPTIONS.join("、")}。` },
      { [HELP_HEADER]: "4. 日期使用 YYYY-MM-DD；同一模板内系统名称或系统标识不能重复。" },
      { [HELP_HEADER]: "5. 不要在模板中填写密码、密钥、个人联系方式等敏感信息。" },
    ]),
    "填写说明",
  );
  XLSX.writeFile(workbook, "系统基本信息导入模板.xlsx");
}

export async function parseSystemTemplate(
  file: File,
  systems: SystemItem[],
  authUser: UserAccount | null,
) {
  const workbook = await readWorkbook(file);
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, { defval: "" });
  const seenKeys = new Set<string>();

  const records = rows
    .map((row, index): SystemItem | null => {
      const rowNumber = index + 2;
      const label = normalizeText(row[SYSTEM_HEADERS.label]);
      const rawId = normalizeText(row[SYSTEM_HEADERS.id]);
      if (!label && !rawId) return null;
      if (!label) {
        throw new Error(`第 ${rowNumber} 行缺少系统名称。`);
      }
      if (rawId === "all") {
        throw new Error(`第 ${rowNumber} 行不能使用系统标识 "all"。`);
      }

      const existingById = rawId ? systems.find((item) => item.id === rawId && item.id !== "all") : undefined;
      const existingByLabel = systems.find(
        (item) => item.id !== "all" && normalizeSystemLabel(item.label) === normalizeSystemLabel(label),
      );
      if (existingById && existingByLabel && existingById.id !== existingByLabel.id) {
        throw new Error(`第 ${rowNumber} 行的系统标识和系统名称分别匹配到不同系统，请检查重复名称。`);
      }
      const existing = existingById ?? existingByLabel;
      const duplicateKey = rawId || normalizeSystemLabel(label);
      if (seenKeys.has(duplicateKey)) {
        throw new Error(`第 ${rowNumber} 行的系统 "${label}" 在模板中重复。`);
      }
      seenKeys.add(duplicateKey);

      if (!existing && authUser?.role !== "admin") {
        throw new Error(`第 ${rowNumber} 行的系统 "${label}" 不存在，只有管理员可以新增系统。`);
      }

      if (existing && !canAccessSystem(authUser, existing.id, "edit")) {
        throw new Error(`第 ${rowNumber} 行的系统 "${existing.label}" 没有编辑权限。`);
      }

      const rawStatus = normalizeText(row[SYSTEM_HEADERS.cooperationStatus]);
      const cooperationStatus: SystemCooperationStatus =
        SYSTEM_STATUS_OPTIONS.includes(rawStatus as SystemCooperationStatus)
          ? (rawStatus as SystemCooperationStatus)
          : "资料待补";
      if (rawStatus && !SYSTEM_STATUS_OPTIONS.includes(rawStatus as SystemCooperationStatus)) {
        throw new Error(`第 ${rowNumber} 行的合作状态 "${rawStatus}" 不在支持范围内。`);
      }

      const updatedAt = normalizeSystemDate(row[SYSTEM_HEADERS.updatedAt], rowNumber, "最近更新日期");
      const nextReviewDate = normalizeSystemDate(row[SYSTEM_HEADERS.nextReviewDate], rowNumber, "下次复核日期");
      const now = nowLabel();

      return normalizeSystemRecord({
        id: existing?.id ?? (rawId || `sys-${Date.now()}-${index}`),
        label,
        editable: existing?.editable ?? true,
        createdAt: existing?.createdAt ?? now,
        systemType: normalizeText(row[SYSTEM_HEADERS.systemType]) || undefined,
        region: normalizeText(row[SYSTEM_HEADERS.region]) || undefined,
        cooperationStatus,
        businessScope: normalizeText(row[SYSTEM_HEADERS.businessScope]) || undefined,
        keyCategories: normalizeText(row[SYSTEM_HEADERS.keyCategories]) || undefined,
        settlementNotes: normalizeText(row[SYSTEM_HEADERS.settlementNotes]) || undefined,
        updatedAt,
        nextReviewDate,
        notes: normalizeText(row[SYSTEM_HEADERS.notes]) || undefined,
      });
    })
    .filter((item): item is SystemItem => Boolean(item));

  if (!records.length) {
    throw new Error("模板里没有识别到可导入的系统基本信息。");
  }

  return records;
}

export async function parseProductTemplate(
  file: File,
  selectedSystemId: string,
  systems: SystemItem[],
  authUser: UserAccount | null,
) {
  const workbook = await readWorkbook(file);
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, { defval: "" });

  const records = rows
    .map((row, index): ProductRecord | null => {
      const barcode = normalizeText(row[PRODUCT_HEADERS.barcode]);
      const productName = normalizeText(row[PRODUCT_HEADERS.productName]);
      if (!barcode && !productName) return null;

      const rowNumber = index + 2;
      const systemId = resolveImportSystemId(
        normalizeText(row[PRODUCT_HEADERS.system]),
        selectedSystemId,
        systems,
        authUser,
        rowNumber,
      );
      const category = normalizeText(row[PRODUCT_HEADERS.category]);

      return {
        id: `prd-import-${Date.now()}-${index}`,
        systemId,
        barcode,
        productCode: normalizeText(row[PRODUCT_HEADERS.productCode]),
        productName,
        archiveSupplyPrice: normalizeNumber(row[PRODUCT_HEADERS.archiveSupplyPrice]),
        archiveSalePrice: normalizeNumber(row[PRODUCT_HEADERS.archiveSalePrice]),
        promoSupplyPrice: normalizeNumber(row[PRODUCT_HEADERS.promoSupplyPrice]),
        promoSalePrice: normalizeNumber(row[PRODUCT_HEADERS.promoSalePrice]),
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
  const workbook = await readWorkbook(file);
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, { defval: "" });

  const records = rows
    .map((row, index): StoreRecord | null => {
      const storeName = normalizeText(row[STORE_HEADERS.storeName]);
      if (!storeName) return null;

      const rowNumber = index + 2;
      const systemId = resolveImportSystemId(
        normalizeText(row[STORE_HEADERS.system]),
        selectedSystemId,
        systems,
        authUser,
        rowNumber,
      );
      const rawStatus = normalizeText(row[STORE_HEADERS.businessStatus]);
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
        storeCode: normalizeText(row[STORE_HEADERS.storeCode]),
        storeName,
        city: normalizeText(row[STORE_HEADERS.city]),
        region: normalizeText(row[STORE_HEADERS.region]),
        format: normalizeText(row[STORE_HEADERS.format]),
        businessStatus,
        plannedCloseDate: businessStatus === "计划闭店" ? normalizeOptionalDate(row[STORE_HEADERS.plannedCloseDate]) : undefined,
        plannedOpenDate: businessStatus === "计划开业" ? normalizeOptionalDate(row[STORE_HEADERS.plannedOpenDate]) : undefined,
        renovationOpenDate: businessStatus === "店改" ? normalizeOptionalDate(row[STORE_HEADERS.renovationOpenDate]) : undefined,
        salesVolume: normalizeNumber(row[STORE_HEADERS.salesVolume]),
        updatedAt: nowLabel(),
      };
    })
    .filter((item): item is StoreRecord => Boolean(item));

  if (!records.length) {
    throw new Error("模板里没有识别到可导入的门店数据。");
  }

  return records;
}
