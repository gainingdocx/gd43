import { rgb } from "pdf-lib";

import {
  A4,
  GRAY,
  LIGHT,
  MARGIN,
  NAVY,
  RED,
  drawFooter,
  drawHeader,
  newDoc,
  truncate,
} from "@/lib/export/pdf";

export interface NoticeDiscrepancy {
  severity: "red" | "amber";
  field: string;
  documentA: string;
  documentB: string;
  valueA: string | null;
  valueB: string | null;
  message: string;
}

export async function discrepancyNoticePdf(opts: {
  shipmentReference: string;
  discrepancies: NoticeDiscrepancy[];
}): Promise<Uint8Array> {
  const { pdf, fonts, logo } = await newDoc();
  pdf.setTitle(`Shipment Discrepancy & Claims Notice - ${opts.shipmentReference}`);
  const page = pdf.addPage(A4);
  const width = page.getWidth();
  drawHeader(page, fonts, "Discrepancy & Claims Notice", opts.shipmentReference, logo);

  let y = page.getHeight() - 126;
  page.drawText("TO: ____________________________________", { x: MARGIN, y, size: 9, font: fonts.regular, color: GRAY });
  page.drawText("DATE: __________________", { x: width - MARGIN - 160, y, size: 9, font: fonts.regular, color: GRAY });
  y -= 24;
  page.drawText("SUBJECT: REQUEST FOR DOCUMENT REVIEW AND CORRECTION", { x: MARGIN, y, size: 10, font: fonts.bold, color: NAVY });
  y -= 22;
  page.drawText(
    truncate(fonts.regular, `Our shipment document check identified ${opts.discrepancies.length} unresolved discrepanc${opts.discrepancies.length === 1 ? "y" : "ies"}. Please review the evidence below and issue corrected documents or written clarification.`, 9, width - 2 * MARGIN),
    { x: MARGIN, y, size: 9, font: fonts.regular, color: GRAY }
  );
  y -= 28;

  page.drawRectangle({ x: MARGIN, y: y - 4, width: width - 2 * MARGIN, height: 20, color: LIGHT });
  page.drawText("ISSUE", { x: MARGIN + 6, y: y + 2, size: 8, font: fonts.bold, color: NAVY });
  page.drawText("DOCUMENT A", { x: 218, y: y + 2, size: 8, font: fonts.bold, color: NAVY });
  page.drawText("DOCUMENT B", { x: 394, y: y + 2, size: 8, font: fonts.bold, color: NAVY });
  y -= 26;

  const shown = opts.discrepancies.slice(0, 9);
  for (let index = 0; index < shown.length; index += 1) {
    const item = shown[index];
    const color = item.severity === "red" ? RED : rgb(0.72, 0.42, 0.02);
    page.drawRectangle({ x: MARGIN, y: y - 26, width: 3, height: 34, color });
    page.drawText(truncate(fonts.bold, `${index + 1}. ${item.field}`, 8.5, 154), { x: MARGIN + 9, y, size: 8.5, font: fonts.bold, color });
    page.drawText(truncate(fonts.regular, item.message, 7.5, 154), { x: MARGIN + 9, y: y - 12, size: 7.5, font: fonts.regular, color: GRAY });
    page.drawText(truncate(fonts.bold, item.documentA, 7.5, 160), { x: 218, y, size: 7.5, font: fonts.bold, color: NAVY });
    page.drawText(truncate(fonts.regular, item.valueA ?? "Not stated", 8.5, 160), { x: 218, y: y - 13, size: 8.5, font: fonts.regular, color: NAVY });
    page.drawText(truncate(fonts.bold, item.documentB, 7.5, 150), { x: 394, y, size: 7.5, font: fonts.bold, color: NAVY });
    page.drawText(truncate(fonts.regular, item.valueB ?? "Not stated", 8.5, 150), { x: 394, y: y - 13, size: 8.5, font: fonts.regular, color: NAVY });
    y -= 43;
  }

  if (opts.discrepancies.length > shown.length) {
    page.drawText(`+ ${opts.discrepancies.length - shown.length} additional issue(s) remain in the GainingDocx shipment record.`, { x: MARGIN, y, size: 8, font: fonts.bold, color: RED });
    y -= 20;
  }

  y = Math.max(y - 8, 112);
  page.drawRectangle({ x: MARGIN, y: y - 54, width: width - 2 * MARGIN, height: 64, borderColor: LIGHT, borderWidth: 1 });
  page.drawText("REQUESTED ACTION", { x: MARGIN + 10, y: y - 6, size: 8, font: fonts.bold, color: NAVY });
  page.drawText("Please confirm the authoritative value, provide corrected document(s), and advise whether the variance affects customs, freight, insurance, or delivery instructions.", { x: MARGIN + 10, y: y - 22, size: 8, font: fonts.regular, color: GRAY, maxWidth: width - 2 * MARGIN - 20, lineHeight: 11 });
  page.drawText("RESPONSE / REFERENCE: __________________________________________________________________", { x: MARGIN + 10, y: y - 44, size: 8, font: fonts.regular, color: GRAY });

  drawFooter(page, fonts, "Working notice generated from unresolved checks; verify against originals before sending or filing a claim.");
  return pdf.save();
}
