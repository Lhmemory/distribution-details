import * as XLSX from "xlsx";

export function exportRowsToXlsx<T extends Record<string, unknown>>(
  rows: T[],
  fileName: string,
  sheetName = "Sheet1",
) {
  const worksheet = XLSX.utils.json_to_sheet(rows);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
  XLSX.writeFile(workbook, `${fileName}.xlsx`);
}
