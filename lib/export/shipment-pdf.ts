import { rgb } from "pdf-lib";
import { A4, GRAY, LIGHT, MARGIN, NAVY, drawFooter, drawHeader, drawPdfText, newDoc, truncate } from "./pdf";
import { summaryPairs } from "./rows";
import type { RequirementResult } from "@/lib/shipments/completeness";

type ShipmentDocument = {
  id: string;
  doc_type: string;
  status: string;
  source_filename?: string | null;
  fields: Record<string, unknown> | null;
  validation?: Array<{ status?: string }> | null;
};

const title = (value: string) => value.replace(/_/g, " ").replace(/\b\w/g, (letter) => letter.toUpperCase());

export async function buildShipmentSummaryPdf(opts: {
  reference: string;
  documents: ShipmentDocument[];
  completeness: RequirementResult[];
  alerts: Array<{ alert_type: string; free_until: string; status: string }>;
}) {
  const { pdf, fonts, logo } = await newDoc();
  pdf.setTitle(`Shipment summary - ${opts.reference}`);
  const cover = pdf.addPage(A4);
  drawHeader(cover, fonts, "Consolidated shipment summary", opts.reference, logo);
  let y = cover.getHeight() - 135;
  cover.drawText("READINESS", { x: MARGIN, y, size: 8, font: fonts.bold, color: GRAY });
  y -= 22;
  for (const requirement of opts.completeness) {
    const color = requirement.state === "present" ? NAVY : requirement.state === "missing" ? rgb(0.83, 0.02, 0.02) : GRAY;
    cover.drawCircle({ x: MARGIN + 5, y: y + 3, size: 4, color });
    cover.drawText(truncate(fonts.bold, requirement.label, 10, 320), { x: MARGIN + 18, y, size: 10, font: fonts.bold, color: NAVY });
    cover.drawText(requirement.state.toUpperCase(), { x: cover.getWidth() - MARGIN - 80, y, size: 8, font: fonts.bold, color });
    y -= 20;
  }
  y -= 10;
  cover.drawRectangle({ x: MARGIN, y: y - 44, width: cover.getWidth() - 2 * MARGIN, height: 54, color: LIGHT });
  cover.drawText(`${opts.documents.length} attached document${opts.documents.length === 1 ? "" : "s"}`, { x: MARGIN + 14, y: y - 10, size: 13, font: fonts.bold, color: NAVY });
  cover.drawText(`${opts.alerts.length} active charge alert${opts.alerts.length === 1 ? "" : "s"}`, { x: MARGIN + 14, y: y - 29, size: 9, font: fonts.regular, color: GRAY });
  drawFooter(cover, fonts, "Consolidated from every attached parsed record. Verify against original documents.");

  for (const document of opts.documents) {
    const page = pdf.addPage(A4);
    drawHeader(page, fonts, title(document.doc_type), document.source_filename ?? document.id.slice(0, 8), logo);
    let py = page.getHeight() - 130;
    const fails = (document.validation ?? []).filter((item) => item.status === "fail").length;
    const warns = (document.validation ?? []).filter((item) => item.status === "warn").length;
    page.drawText(`STATUS: ${document.status.toUpperCase()}   FAILS: ${fails}   WARNINGS: ${warns}`, { x: MARGIN, y: py, size: 8, font: fonts.bold, color: fails ? rgb(0.83, 0.02, 0.02) : NAVY });
    py -= 26;
    const pairs = document.fields ? summaryPairs(document.doc_type, document.fields).filter((pair) => pair.value !== "") : [];
    if (!pairs.length) {
      page.drawText("No parsed fields are available for this document.", { x: MARGIN, y: py, size: 10, font: fonts.regular, color: GRAY });
    } else {
      for (const pair of pairs.slice(0, 34)) {
        if (py < 62) break;
        page.drawText(truncate(fonts.regular, pair.label.toUpperCase(), 7, 145), { x: MARGIN, y: py, size: 7, font: fonts.regular, color: GRAY });
        drawPdfText(page, fonts, truncate(fonts.bold, pair.value, 9, page.getWidth() - 2 * MARGIN - 155), { x: MARGIN + 155, y: py, size: 9, font: fonts.bold, color: NAVY });
        py -= 18;
      }
    }
    drawFooter(page, fonts, `Document ${document.id}`);
  }
  return pdf.save();
}

