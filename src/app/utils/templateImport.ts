import * as XLSX from "xlsx";
import { ProductRecord, StoreRecord, SystemItem, UserAccount } from "../types";
import { nowLabel } from "./format";
import { canAccessSystem } from "./permissions";

const PRODUCT_HEADERS = {
  system: "\u7cfb\u7edf",
  barcode: "\u6761\u7801",
  productCode: "\u5546\u54c1\u7f16\u7801",
  productName: "\u5546\u54c1\u540d\u79f0",
  archiveSupplyPrice: "\u5efa\u6863\u4f9b\u4ef7",
  archiveSalePrice: "\u5efa\u6863\u552e\u4ef7",
  promoSupplyPrice: "\u4fc3\u9500\u4f9b\u4ef7",
  promoSalePrice: "\u4fc3\u9500\u552e\u4ef7",
  category: "\u884c\u9500\u54c1\u7c7b",
} as const;

const STORE_HEADERS = {
  system: "\u7cfb\u7edf",
  storeCode: "\u95e8\u5e97\u7f16\u7801",
  storeName: "\u95e8\u5e97\u540d\u79f0",
  city: "\u57ce\u5e02",
  region: "\u533a\u57df",
  format: "\u4e1a\u6001",
  businessStatus: "\u8425\u4e1a\u72b6\u6001",
  plannedCloseDate: "\u8ba1\u5212\u95ed\u5e97\u65f6\u95f4",
  plannedOpenDate: "\u8ba1\u5212\u5f00\u4e1a\u65f6\u95f4",
  renovationOpenDate: "\u5e97\u6539\u5f00\u4e1a\u65f6\u95f4",
  salesVolume: "\u9500\u91cf",
} as const;

const HELP_HEADER = "\u8bf4\u660e";

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
      throw new Error(`\u7b2c ${rowNumber} \u884c\u7684\u7cfb\u7edf "${explicitSystem}" \u4e0d\u5b58\u5728\u3002`);
    }

    if (selectedSystemId !== "all" && matchedSystem.id !== selectedSystemId) {
      const selectedLabel = systems.find((item) => item.id === selectedSystemId)?.label ?? selectedSystemId;
      throw new Error(`\u7b2c ${rowNumber} \u884c\u7684\u7cfb\u7edf\u4e0e\u5f53\u524d\u9875\u9762\u5df2\u9009\u7cfb\u7edf "${selectedLabel}" \u4e0d\u4e00\u81f4\u3002`);
    }

    if (!canAccessSystem(authUser, matchedSystem.id, "edit")) {
      throw new Error(`\u7b2c ${rowNumber} \u884c\u7684\u7cfb\u7edf "${matchedSystem.label}" \u6ca1\u6709\u7f16\u8f91\u6743\u9650\u3002`);
    }

    return matchedSystem.id;
  }

  const fallbackSystemId = pickTargetSystemId(selectedSystemId, systems, authUser);
  if (!fallbackSystemId) {
    throw new Error(`\u7b2c ${rowNumber} \u884c\u672a\u586b\u5199\u7cfb\u7edf\uff0c\u8bf7\u5148\u5207\u6362\u5230\u5177\u4f53\u7cfb\u7edf\u6216\u5728 Excel \u4e2d\u8865\u9f50\u7cfb\u7edf\u5217\u3002`);
  }

  return fallbackSystemId;
}

export function downloadProductTemplate() {
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(
    workbook,
    XLSX.utils.json_to_sheet([
      {
        [PRODUCT_HEADERS.system]: "\u5929\u8679",
        [PRODUCT_HEADERS.barcode]: "6900000000001",
        [PRODUCT_HEADERS.productCode]: "TH-0001",
        [PRODUCT_HEADERS.productName]: "\u793a\u4f8b\u5546\u54c1\u540d\u79f0",
        [PRODUCT_HEADERS.archiveSupplyPrice]: 49.9,
        [PRODUCT_HEADERS.archiveSalePrice]: 56.9,
        [PRODUCT_HEADERS.promoSupplyPrice]: 45.9,
        [PRODUCT_HEADERS.promoSalePrice]: 52.9,
        [PRODUCT_HEADERS.category]: "\u6218\u7565",
      },
    ]),
    "\u5546\u54c1\u6a21\u677f",
  );
  XLSX.utils.book_append_sheet(
    workbook,
    XLSX.utils.json_to_sheet([
      { [HELP_HEADER]: "1. \u53ef\u4ee5\u76f4\u63a5\u5728 Excel \u4e2d\u586b\u5199\u201c\u7cfb\u7edf\u201d\u5217\uff0c\u652f\u6301\u7cfb\u7edf\u540d\u79f0\u6216\u7cfb\u7edf ID\u3002" },
      { [HELP_HEADER]: "2. \u5982\u679c\u4e0d\u586b\u7cfb\u7edf\u5217\uff0c\u5c06\u9ed8\u8ba4\u5bfc\u5165\u5230\u5f53\u524d\u9875\u9762\u5df2\u9009\u7684\u5177\u4f53\u7cfb\u7edf\u3002" },
      { [HELP_HEADER]: "3. \u5546\u54c1\u7f16\u7801\u53ef\u7559\u7a7a\uff0c\u6761\u7801\u548c\u5546\u54c1\u540d\u79f0\u5efa\u8bae\u586b\u5199\u3002" },
      { [HELP_HEADER]: "4. \u4ef7\u683c\u7559\u7a7a\u65f6\u6309 0 \u5904\u7406\uff0c\u652f\u6301 .xlsx / .xls / .csv\u3002" },
    ]),
    "\u586b\u5199\u8bf4\u660e",
  );
  XLSX.writeFile(workbook, "\u5546\u54c1\u5bfc\u5165\u6a21\u677f.xlsx");
}

export function downloadStoreTemplate() {
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(
    workbook,
    XLSX.utils.json_to_sheet([
      {
        [STORE_HEADERS.system]: "\u534e\u6da6",
        [STORE_HEADERS.storeCode]: "A001",
        [STORE_HEADERS.storeName]: "\u793a\u4f8b\u95e8\u5e97",
        [STORE_HEADERS.city]: "\u5e7f\u5dde\u5e02",
        [STORE_HEADERS.region]: "\u5e7f\u5dde\u5927\u8d85",
        [STORE_HEADERS.format]: "\u5927\u8d85",
        [STORE_HEADERS.businessStatus]: "\u8425\u4e1a",
        [STORE_HEADERS.plannedCloseDate]: "",
        [STORE_HEADERS.plannedOpenDate]: "",
        [STORE_HEADERS.renovationOpenDate]: "",
        [STORE_HEADERS.salesVolume]: 100000,
      },
    ]),
    "\u95e8\u5e97\u6a21\u677f",
  );
  XLSX.utils.book_append_sheet(
    workbook,
    XLSX.utils.json_to_sheet([
      { [HELP_HEADER]: "1. \u53ef\u4ee5\u76f4\u63a5\u5728 Excel \u4e2d\u586b\u5199\u201c\u7cfb\u7edf\u201d\u5217\uff0c\u652f\u6301\u7cfb\u7edf\u540d\u79f0\u6216\u7cfb\u7edf ID\u3002" },
      { [HELP_HEADER]: "2. \u5982\u679c\u4e0d\u586b\u7cfb\u7edf\u5217\uff0c\u5c06\u9ed8\u8ba4\u5bfc\u5165\u5230\u5f53\u524d\u9875\u9762\u5df2\u9009\u7684\u5177\u4f53\u7cfb\u7edf\u3002" },
      { [HELP_HEADER]: "3. \u95e8\u5e97\u7f16\u7801\u53ef\u7559\u7a7a\uff0c\u95e8\u5e97\u540d\u79f0\u5efa\u8bae\u5fc5\u586b\u3002" },
      { [HELP_HEADER]: "4. \u8425\u4e1a\u72b6\u6001\u652f\u6301\uff1a\u8425\u4e1a\u3001\u5df2\u95ed\u5e97\u3001\u8ba1\u5212\u95ed\u5e97\u3001\u8ba1\u5212\u5f00\u4e1a\u3001\u5e97\u6539\u3002" },
    ]),
    "\u586b\u5199\u8bf4\u660e",
  );
  XLSX.writeFile(workbook, "\u95e8\u5e97\u5bfc\u5165\u6a21\u677f.xlsx");
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
        brand: "\u798f\u4e34\u95e8",
        updatedAt: nowLabel(),
      };
    })
    .filter((item): item is ProductRecord => Boolean(item));

  if (!records.length) {
    throw new Error("\u6a21\u677f\u91cc\u6ca1\u6709\u8bc6\u522b\u5230\u53ef\u5bfc\u5165\u7684\u5546\u54c1\u6570\u636e\u3002");
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
        rawStatus === "\u8425\u4e1a" ||
        rawStatus === "\u5df2\u95ed\u5e97" ||
        rawStatus === "\u8ba1\u5212\u95ed\u5e97" ||
        rawStatus === "\u8ba1\u5212\u5f00\u4e1a" ||
        rawStatus === "\u5e97\u6539"
          ? rawStatus
          : "\u8425\u4e1a";

      return {
        id: `sto-import-${Date.now()}-${index}`,
        systemId,
        storeCode: normalizeText(row[STORE_HEADERS.storeCode]),
        storeName,
        city: normalizeText(row[STORE_HEADERS.city]),
        region: normalizeText(row[STORE_HEADERS.region]),
        format: normalizeText(row[STORE_HEADERS.format]),
        businessStatus,
        plannedCloseDate:
          businessStatus === "\u8ba1\u5212\u95ed\u5e97" ? normalizeOptionalDate(row[STORE_HEADERS.plannedCloseDate]) : undefined,
        plannedOpenDate:
          businessStatus === "\u8ba1\u5212\u5f00\u4e1a" ? normalizeOptionalDate(row[STORE_HEADERS.plannedOpenDate]) : undefined,
        renovationOpenDate:
          businessStatus === "\u5e97\u6539" ? normalizeOptionalDate(row[STORE_HEADERS.renovationOpenDate]) : undefined,
        salesVolume: normalizeNumber(row[STORE_HEADERS.salesVolume]),
        updatedAt: nowLabel(),
      };
    })
    .filter((item): item is StoreRecord => Boolean(item));

  if (!records.length) {
    throw new Error("\u6a21\u677f\u91cc\u6ca1\u6709\u8bc6\u522b\u5230\u53ef\u5bfc\u5165\u7684\u95e8\u5e97\u6570\u636e\u3002");
  }

  return records;
}
