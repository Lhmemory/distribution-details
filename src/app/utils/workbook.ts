import ExcelJS from "exceljs";

export interface TabularSheet {
  name: string;
  rows: unknown[][];
}

export interface TabularWorkbook {
  sheets: TabularSheet[];
}

export function objectsToRows(rows: Record<string, unknown>[]) {
  const headers = Array.from(new Set(rows.flatMap((row) => Object.keys(row))));
  if (!headers.length) return [];
  return [headers, ...rows.map((row) => headers.map((header) => row[header] ?? ""))];
}

export function rowsToObjects<T extends Record<string, unknown>>(rows: unknown[][]) {
  const headers = (rows[0] ?? []).map((value, index) => textOf(value) || `col-${index}`);
  return rows.slice(1).map((row) =>
    Object.fromEntries(headers.map((header, index) => [header, row[index] ?? ""])) as T,
  );
}

export async function readWorkbookRows(file: File): Promise<TabularWorkbook> {
  const extension = file.name.split(".").pop()?.toLowerCase();

  if (extension === "csv") {
    return {
      sheets: [
        {
          name: file.name.replace(/\.[^.]+$/, "") || "CSV",
          rows: parseCsv(await file.text()),
        },
      ],
    };
  }

  if (extension === "xls") {
    throw new Error("暂不支持 .xls 文件，请在 Excel 中另存为 .xlsx 或 .csv 后再上传。");
  }

  if (extension !== "xlsx") {
    throw new Error("仅支持上传 .xlsx 或 .csv 文件。");
  }

  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(await file.arrayBuffer());

  return {
    sheets: workbook.worksheets.map((worksheet) => ({
      name: worksheet.name,
      rows: worksheetToRows(worksheet),
    })),
  };
}

export async function downloadWorkbook(fileName: string, sheets: TabularSheet[]) {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = "华南重客基础资料后台";
  workbook.created = new Date();
  workbook.modified = new Date();

  sheets.forEach((sheet) => {
    const worksheet = workbook.addWorksheet(sheet.name);
    sheet.rows.forEach((row) => worksheet.addRow(row.map((value) => value ?? "")));
    worksheet.views = [{ state: "frozen", ySplit: 1 }];
    worksheet.columns.forEach((column) => {
      const maxLength = Math.max(
        10,
        ...((column.values ?? []) as unknown[]).map((value) => textOf(value).length),
      );
      column.width = Math.min(36, maxLength + 4);
    });
  });

  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer as BlobPart], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
  downloadBlob(blob, fileName.endsWith(".xlsx") ? fileName : `${fileName}.xlsx`);
}

export async function downloadObjectWorkbook<T extends Record<string, unknown>>(
  fileName: string,
  sheetName: string,
  rows: T[],
) {
  await downloadWorkbook(fileName, [{ name: sheetName, rows: objectsToRows(rows) }]);
}

export function excelSerialDateToIso(value: unknown) {
  if (typeof value !== "number" || !Number.isFinite(value)) return undefined;
  const epoch = Date.UTC(1899, 11, 30);
  const date = new Date(epoch + value * 86400 * 1000);
  if (Number.isNaN(date.getTime())) return undefined;
  return date.toISOString().slice(0, 10);
}

function worksheetToRows(worksheet: ExcelJS.Worksheet) {
  const rows: unknown[][] = [];
  const columnCount = Math.max(worksheet.columnCount, 1);

  for (let rowNumber = 1; rowNumber <= worksheet.rowCount; rowNumber += 1) {
    const row = worksheet.getRow(rowNumber);
    const values: unknown[] = [];
    for (let columnNumber = 1; columnNumber <= columnCount; columnNumber += 1) {
      values.push(normalizeCellValue(row.getCell(columnNumber).value));
    }
    rows.push(trimTrailingEmpty(values));
  }

  return trimTrailingEmptyRows(rows);
}

function normalizeCellValue(value: unknown): unknown {
  if (value === null || value === undefined) return "";
  if (value instanceof Date) return value;
  if (typeof value !== "object") return value;

  const object = value as Record<string, unknown>;
  if (Array.isArray(object.richText)) {
    return object.richText
      .map((part) => (part && typeof part === "object" ? (part as Record<string, unknown>).text : ""))
      .join("");
  }
  if ("result" in object) return normalizeCellValue(object.result);
  if ("text" in object) return object.text ?? "";

  return "";
}

function textOf(value: unknown) {
  if (value instanceof Date) return value.toISOString().slice(0, 10);
  return String(value ?? "").replace(/\s+/g, " ").trim();
}

function trimTrailingEmpty(row: unknown[]) {
  let end = row.length;
  while (end > 0 && !textOf(row[end - 1])) end -= 1;
  return row.slice(0, end);
}

function trimTrailingEmptyRows(rows: unknown[][]) {
  let end = rows.length;
  while (end > 0 && !rows[end - 1].some((value) => textOf(value))) end -= 1;
  return rows.slice(0, end);
}

function parseCsv(text: string) {
  const content = text.replace(/^\uFEFF/, "");
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = "";
  let inQuotes = false;

  for (let index = 0; index < content.length; index += 1) {
    const char = content[index];
    const next = content[index + 1];

    if (char === "\"") {
      if (inQuotes && next === "\"") {
        cell += "\"";
        index += 1;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }

    if (char === "," && !inQuotes) {
      row.push(cell);
      cell = "";
      continue;
    }

    if ((char === "\n" || char === "\r") && !inQuotes) {
      if (char === "\r" && next === "\n") index += 1;
      row.push(cell);
      rows.push(row);
      row = [];
      cell = "";
      continue;
    }

    cell += char;
  }

  row.push(cell);
  if (row.some((value) => value.trim())) rows.push(row);
  return rows.map((items) => items.map((item) => item.trim()));
}

function downloadBlob(blob: Blob, fileName: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  link.click();
  URL.revokeObjectURL(url);
}
