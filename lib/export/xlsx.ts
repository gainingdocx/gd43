// Excel workbook (BUILD_SPEC §M7): "Summary" (key fields vertical),
// "Containers" (row per container), "Lines" (row per line item).

import ExcelJS from "exceljs";

import { containerRows, lineRows, summaryPairs } from "./rows";

const HEADER_FILL: ExcelJS.Fill = {
  type: "pattern",
  pattern: "solid",
  fgColor: { argb: "FF0B1F3A" }, // deep navy (design tokens)
};

function addTableSheet(
  wb: ExcelJS.Workbook,
  name: string,
  rows: (string | number)[][]
) {
  if (rows.length === 0) return;
  const ws = wb.addWorksheet(name);
  ws.addRows(rows);
  const header = ws.getRow(1);
  header.font = { bold: true, color: { argb: "FFFFFFFF" } };
  header.fill = HEADER_FILL;
  ws.columns.forEach((col, i) => {
    const contentWidth = Math.max(
      ...rows.map((r) => String(r[i] ?? "").length),
      10
    );
    col.width = Math.min(contentWidth + 2, 50);
  });
}

export async function buildWorkbook(
  docType: string,
  fields: Record<string, unknown>
): Promise<ArrayBuffer> {
  const wb = new ExcelJS.Workbook();
  wb.creator = "GainingDocx";
  wb.created = new Date();

  const summary = wb.addWorksheet("Summary");
  summary.columns = [
    { header: "Field", width: 26 },
    { header: "Value", width: 60 },
  ];
  for (const pair of summaryPairs(docType, fields)) {
    summary.addRow([pair.label, pair.value]);
  }
  const head = summary.getRow(1);
  head.font = { bold: true, color: { argb: "FFFFFFFF" } };
  head.fill = HEADER_FILL;

  addTableSheet(wb, "Containers", containerRows(fields));
  addTableSheet(wb, "Lines", lineRows(fields));

  return wb.xlsx.writeBuffer();
}
