import * as XLSX from "xlsx";
import { PriceGuideRecord } from "../types";

interface SheetMeta {
  executionPeriod?: string;
  category?: string;
  publishDate?: string;
  mailTitle?: string;
}

function textOf(value: unknown) {
  return String(value ?? "").replace(/\s+/g, " ").trim();
}

function numberOf(value: unknown) {
  if (value === null || value === undefined || value === "") return undefined;
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : undefined;
}

function excelDateToText(value: unknown) {
  if (typeof value === "number" && value > 30000) {
    return XLSX.SSF.format("yyyy-mm-dd", value);
  }
  return textOf(value);
}

function buildSheetMeta(rows: unknown[][]) {
  const meta = new Map<string, SheetMeta>();
  rows.slice(1).forEach((row) => {
    const sheetName = textOf(row[0]);
    if (!sheetName) return;
    meta.set(sheetName, {
      executionPeriod: textOf(row[1]),
      category: textOf(row[2]),
      publishDate: excelDateToText(row[3]),
      mailTitle: textOf(row[4]),
    });
  });
  return meta;
}

function buildHeaders(headerRows: unknown[][], columnCount: number) {
  return Array.from({ length: columnCount }, (_, index) =>
    headerRows
      .map((row) => textOf(row[index]))
      .filter(Boolean)
      .join(" / "),
  );
}

function pickFirst(object: Record<string, unknown>, patterns: RegExp[]) {
  for (const key of Object.keys(object)) {
    if (patterns.some((pattern) => pattern.test(key))) {
      return object[key];
    }
  }
  return undefined;
}

export async function parsePriceGuideWorkbook(
  file: File,
  systemId: string,
  importedAt: string,
): Promise<PriceGuideRecord[]> {
  const buffer = await file.arrayBuffer();
  const workbook = XLSX.read(buffer, { type: "array" });
  const noteSheet = workbook.Sheets["说明"];
  const noteRows = noteSheet ? (XLSX.utils.sheet_to_json(noteSheet, { header: 1, defval: "" }) as unknown[][]) : [];
  const metaBySheet = buildSheetMeta(noteRows);
  const records: PriceGuideRecord[] = [];

  workbook.SheetNames.filter((name) => name !== "说明").forEach((sheetName) => {
    const sheet = workbook.Sheets[sheetName];
    const rows = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: "" }) as unknown[][];
    if (rows.length < 5) return;

    const dataRows = rows.slice(4).filter((row) => row.some((value) => textOf(value)));
    if (!dataRows.length) return;

    const columnCount = Math.max(...rows.slice(0, 4).map((row) => row.length), ...dataRows.map((row) => row.length));
    const headers = buildHeaders(rows.slice(0, 4), columnCount);
    const sheetMeta = metaBySheet.get(sheetName);

    dataRows.forEach((row, rowIndex) => {
      const mapped = Object.fromEntries(headers.map((header, index) => [header || `col-${index}`, row[index]]));
      const materialCode = textOf(pickFirst(mapped, [/物料码/]));
      const productName = textOf(pickFirst(mapped, [/物料描述/]));
      if (!materialCode && !productName) return;

      records.push({
        id: `pg-${systemId}-${sheetName}-${rowIndex}-${Date.now()}`,
        systemId,
        sourceFileName: file.name,
        importedAt,
        sheetName,
        executionPeriod: sheetMeta?.executionPeriod,
        category: sheetMeta?.category,
        publishDate: sheetMeta?.publishDate,
        mailTitle: sheetMeta?.mailTitle,
        materialCode,
        subCategory: textOf(pickFirst(mapped, [/子品类/])),
        productCategory: textOf(pickFirst(mapped, [/产品类别/])),
        productName,
        spec: textOf(pickFirst(mapped, [/规格/])),
        cartonSize: textOf(pickFirst(mapped, [/箱容/])),
        scope: textOf(pickFirst(mapped, [/执行范围/])),
        policyNote: textOf(pickFirst(mapped, [/政策说明/])),
        distributorSettlementPrice: numberOf(pickFirst(mapped, [/经销商结算价/])),
        keyAccountPromoSupplyPrice: numberOf(
          pickFirst(mapped, [/现渠直营促销供售价/, /现渠直营供价/, /促销供价/]),
        ),
      });
    });
  });

  return records;
}
