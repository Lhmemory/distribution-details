import { downloadObjectWorkbook } from "./workbook";

export async function exportRowsToXlsx<T extends Record<string, unknown>>(
  rows: T[],
  fileName: string,
  sheetName = "Sheet1",
) {
  await downloadObjectWorkbook(fileName, sheetName, rows);
}
