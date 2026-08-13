import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { createServer } from "node:http";
import "regenerator-runtime/runtime";

import { discrepancyNoticePdf } from "../lib/export/discrepancy-pdf";
import { summaryReportPdf } from "../lib/export/pdf";
import { buildShipmentSummaryPdf } from "../lib/export/shipment-pdf";
import { generatedDocPdf } from "../lib/generate/pdf";
import type { GenDoc } from "../lib/generate/map";

const multilingual = "出口单证 · مستندات الشحن · निर्यात दस्तावेज़ · São Paulo";

async function main() {
  const fontDirectory = join(process.cwd(), "public", "fonts");
  const server = createServer(async (request, response) => {
    const name = request.url === "/fonts/unifont.ttf" ? "unifont.ttf" : request.url === "/fonts/noto-sans-devanagari.woff" ? "noto-sans-devanagari.woff" : null;
    if (!name) { response.writeHead(404).end(); return; }
    const { readFile } = await import("node:fs/promises");
    response.end(await readFile(join(fontDirectory, name)));
  });
  await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
  const address = server.address();
  if (!address || typeof address === "string") throw new Error("Font verification server could not start");
  process.env.NEXT_PUBLIC_APP_URL = `http://127.0.0.1:${address.port}`;
  const outputDirectory = join(process.cwd(), "tmp", "pdfs", "unicode-all-generators");
  await mkdir(outputDirectory, { recursive: true });

  const outputs: Array<[string, Uint8Array]> = [];
  outputs.push(["parsed-summary.pdf", await summaryReportPdf({
    docType: "commercial_invoice",
    fields: { invoice_no: "INV-多言語-001", seller: { name: multilingual }, buyer: { name: "مستورد دبي" }, currency: "USD", total_amount: 1200 },
    validation: [{ field: "seller.name", rule: "unicode", status: "warn", message: multilingual }],
    shareUrl: null,
  })]);

  outputs.push(["shipment-summary.pdf", await buildShipmentSummaryPdf({
    reference: "SHIP-多言語-001",
    documents: [{ id: "11111111-1111-1111-1111-111111111111", doc_type: "commercial_invoice", status: "parsed", source_filename: "发票-निर्यात.pdf", fields: { invoice_no: "INV-001", seller: { name: multilingual } }, validation: [] }],
    completeness: [{ requirement_key: "commercial_invoice", label: `Commercial invoice · ${multilingual}`, accepted_types: ["commercial_invoice"], required: true, state: "present", matchingCount: 1 }],
    alerts: [],
  })]);

  outputs.push(["discrepancy-notice.pdf", await discrepancyNoticePdf({
    shipmentReference: "REF-多言語",
    discrepancies: [{ severity: "amber", field: "shipper.name", documentA: "Commercial Invoice", documentB: "Packing List", valueA: "出口有限公司", valueB: "شركة التصدير", message: `Party names require review: ${multilingual}`, sourceA: { page: 1, quote: "出口有限公司" }, sourceB: { page: 1, quote: "निर्यात कंपनी" } }],
  })]);

  const generated: GenDoc = {
    type: "commercial_invoice", title: "COMMERCIAL INVOICE", header: [{ label: "Invoice no.", value: "INV-多言語-001" }],
    parties: [{ label: "Exporter", value: multilingual }, { label: "Consignee", value: "شركة الاستيراد\nدبي" }],
    lines: [{ description: "纺织品 · वस्त्र · منسوجات", hs_code: "5208", packages: "12", cartons: "12", net_kg: "120", gross_kg: "130", volume_cbm: "2.4", unit_price: "10", amount: "1200" }],
    totals: [{ label: "Total", value: "USD 1,200" }], notes: multilingual,
  };
  outputs.push(["generated-draft.pdf", await generatedDocPdf(generated, false)]);

  for (const [name, bytes] of outputs) await writeFile(join(outputDirectory, name), bytes);
  console.log(outputs.map(([name, bytes]) => `${join(outputDirectory, name)} (${bytes.length} bytes)`).join("\n"));
  server.close();
}

void main();
