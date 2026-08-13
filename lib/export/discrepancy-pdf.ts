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
  drawPdfText,
  newDoc,
  truncate,
} from "@/lib/export/pdf";

export interface NoticeDiscrepancy {
  severity: "red" | "amber" | "info";
  field: string;
  documentA: string;
  documentB: string;
  valueA: string | null;
  valueB: string | null;
  message: string;
  ruleReason?: string | null;
  workflow?: string | null;
  sourceA?: { page?: number; quote?: string | null } | null;
  sourceB?: { page?: number; quote?: string | null } | null;
  questionedAmount?: number | null;
  questionedCurrency?: string | null;
}

export async function discrepancyNoticePdf(opts: {
  shipmentReference: string;
  discrepancies: NoticeDiscrepancy[];
}): Promise<Uint8Array> {
  const { pdf, fonts, logo } = await newDoc();
  pdf.setTitle(`Shipment Discrepancy & Claims Notice - ${opts.shipmentReference}`);
  let page = pdf.addPage(A4);
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
  page.drawText("EXPECTED / REFERENCE", { x: 218, y: y + 2, size: 8, font: fonts.bold, color: NAVY });
  page.drawText("OBSERVED / COMPARED", { x: 394, y: y + 2, size: 8, font: fonts.bold, color: NAVY });
  y -= 26;

  for (let index = 0; index < opts.discrepancies.length; index += 1) {
    const item = opts.discrepancies[index];
    const evidence = [item.sourceA?.quote, item.sourceB?.quote].filter(Boolean).join(" | ");
    const detail = [item.workflow?.replace(/_/g, " "), item.ruleReason].filter(Boolean).join(" · ");
    const rowHeight = 47 + (item.questionedAmount ? 11 : 0) + (evidence ? 11 : 0) + (detail ? 11 : 0);
    if (y - rowHeight < 72) {
      drawFooter(page, fonts, "Working notice generated from unresolved checks; verify against originals before sending or filing a claim.");
      page = pdf.addPage(A4);
      drawHeader(page, fonts, "Discrepancy & Claims Notice · continued", opts.shipmentReference, logo);
      y = page.getHeight() - 126;
      page.drawRectangle({ x: MARGIN, y: y - 4, width: width - 2 * MARGIN, height: 20, color: LIGHT });
      page.drawText("ISSUE", { x: MARGIN + 6, y: y + 2, size: 8, font: fonts.bold, color: NAVY });
      page.drawText("EXPECTED / REFERENCE", { x: 218, y: y + 2, size: 8, font: fonts.bold, color: NAVY });
      page.drawText("OBSERVED / COMPARED", { x: 394, y: y + 2, size: 8, font: fonts.bold, color: NAVY });
      y -= 26;
    }
    const color = item.severity === "red" ? RED : item.severity === "info" ? NAVY : rgb(0.72, 0.42, 0.02);
    page.drawRectangle({ x: MARGIN, y: y - rowHeight + 8, width: 3, height: rowHeight - 4, color });
    drawPdfText(page, fonts, truncate(fonts.bold, `${index + 1}. ${item.field}`, 8.5, 154), { x: MARGIN + 9, y, size: 8.5, font: fonts.bold, color });
    drawPdfText(page, fonts, truncate(fonts.regular, item.message, 7.5, 154), { x: MARGIN + 9, y: y - 12, size: 7.5, font: fonts.regular, color: GRAY });
    drawPdfText(page, fonts, truncate(fonts.bold, item.documentA, 7.5, 160), { x: 218, y, size: 7.5, font: fonts.bold, color: NAVY });
    drawPdfText(page, fonts, truncate(fonts.regular, item.valueA ?? "Not stated", 8.5, 160), { x: 218, y: y - 13, size: 8.5, font: fonts.regular, color: NAVY });
    if (item.sourceA?.page) page.drawText(`Source p.${item.sourceA.page}`, { x: 218, y: y - 24, size: 6.8, font: fonts.regular, color: GRAY });
    drawPdfText(page, fonts, truncate(fonts.bold, item.documentB, 7.5, 150), { x: 394, y, size: 7.5, font: fonts.bold, color: NAVY });
    drawPdfText(page, fonts, truncate(fonts.regular, item.valueB ?? "Not stated", 8.5, 150), { x: 394, y: y - 13, size: 8.5, font: fonts.regular, color: NAVY });
    if (item.sourceB?.page) page.drawText(`Source p.${item.sourceB.page}`, { x: 394, y: y - 24, size: 6.8, font: fonts.regular, color: GRAY });
    let detailY = y - 34;
    if (item.questionedAmount && item.questionedAmount > 0) { page.drawText(`Amount questioned: ${item.questionedCurrency ?? ""} ${item.questionedAmount.toFixed(2)}`, { x: MARGIN + 9, y: detailY, size: 7.2, font: fonts.bold, color }); detailY -= 11; }
    if (evidence) { drawPdfText(page, fonts, truncate(fonts.regular, `Evidence: ${evidence}`, 6.8, width - 2 * MARGIN - 18), { x: MARGIN + 9, y: detailY, size: 6.8, font: fonts.regular, color: GRAY }); detailY -= 11; }
    if (detail) drawPdfText(page, fonts, truncate(fonts.regular, `Rule: ${detail}`, 6.8, width - 2 * MARGIN - 18), { x: MARGIN + 9, y: detailY, size: 6.8, font: fonts.regular, color: GRAY });
    y -= rowHeight;
  }

  if (y < 142) { drawFooter(page, fonts, "Working notice generated from unresolved checks; verify against originals before sending or filing a claim."); page = pdf.addPage(A4); drawHeader(page, fonts, "Discrepancy & Claims Notice · requested action", opts.shipmentReference, logo); y = page.getHeight() - 126; }
  y = Math.max(y - 8, 112);
  page.drawRectangle({ x: MARGIN, y: y - 54, width: width - 2 * MARGIN, height: 64, borderColor: LIGHT, borderWidth: 1 });
  page.drawText("REQUESTED ACTION", { x: MARGIN + 10, y: y - 6, size: 8, font: fonts.bold, color: NAVY });
  page.drawText("Please confirm the authoritative value, provide corrected document(s), and advise whether the variance affects customs, freight, insurance, or delivery instructions.", { x: MARGIN + 10, y: y - 22, size: 8, font: fonts.regular, color: GRAY, maxWidth: width - 2 * MARGIN - 20, lineHeight: 11 });
  page.drawText("RESPONSE / REFERENCE: __________________________________________________________________", { x: MARGIN + 10, y: y - 44, size: 8, font: fonts.regular, color: GRAY });

  drawFooter(page, fonts, "Working notice generated from unresolved checks; verify against originals before sending or filing a claim.");
  return pdf.save();
}
