import ExcelJS from "exceljs";
import JSZip from "jszip";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

const defs = [
  {
    slug: "bill-of-lading-template", title: "BILL OF LADING DATA WORKSHEET",
    notice: "NOT A BILL OF LADING. Use this worksheet for carrier shipping instructions or draft checking. Only a carrier, NVOCC or authorized agent may issue the transport document.",
    fields: ["B/L number (if assigned)", "Booking number *", "Exporter / customer reference", "Requested B/L type", "Number of originals", "Shipper *", "Consignee *", "Notify party", "Carrier / NVOCC", "Place of receipt", "Vessel *", "Voyage", "Port of loading / UN/LOCODE *", "Port of discharge / UN/LOCODE *", "Place of delivery", "Freight terms", "Shipped-on-board date", "Place / date of issue", "Container / seal / type details", "Requested clauses", "Prepared by / contact *"],
    lines: ["Marks & numbers", "Packages", "Package type", "Goods description", "HS code", "Gross kg", "CBM"],
  },
  {
    slug: "commercial-invoice-template", title: "COMMERCIAL INVOICE",
    notice: "The exporter is responsible for customs value, HS classification, origin and destination-specific declarations. Review with the broker before filing.",
    fields: ["Invoice number *", "Invoice date *", "Purchase order / contract", "Exporter reference", "Seller / exporter *", "Buyer *", "Consignee / ship-to *", "Currency (ISO code) *", "Incoterm and named place *", "Payment terms", "Country of origin *", "Country of final destination", "Mode of transport", "Carrier / vessel / voyage", "Port of loading", "Port of discharge", "Freight charge", "Insurance", "Other charges", "Exporter declaration / DCS", "Authorized name / title / signature *"],
    lines: ["Goods description", "SKU / part no.", "HS code", "Origin", "Quantity", "UOM", "Unit price", "Line amount", "Net kg", "Gross kg"],
    amount: true,
  },
  {
    slug: "packing-list-template", title: "EXPORT PACKING LIST",
    notice: "Package counts, marks, weights and dimensions must match the physically packed cargo and the commercial invoice.",
    fields: ["Packing list number *", "Packing list date *", "Commercial invoice number *", "Purchase order / contract", "Seller / exporter *", "Buyer *", "Consignee / ship-to *", "Mode of transport", "Carrier / vessel / voyage", "Port of loading", "Port of discharge", "Container number", "Seal number", "Packing / handling notes", "Prepared by / signature *"],
    lines: ["Marks & package nos.", "Package type", "Packages", "Contents", "SKU / part no.", "HS code", "Item quantity", "Net kg", "Gross kg", "Length cm", "Width cm", "Height cm", "CBM"],
    cbm: true,
  },
  {
    slug: "shipping-instructions-template", title: "SHIPPING INSTRUCTIONS",
    notice: "Submit by the carrier cut-off and verify the carrier-issued draft. This document is not a Bill of Lading.",
    fields: ["Booking number *", "Shipper reference", "Requested B/L type / release", "Shipper *", "Consignee *", "Notify party", "Carrier / NVOCC", "Place of receipt", "Vessel", "Voyage", "Port of loading / UN/LOCODE *", "Port of discharge / UN/LOCODE *", "Place of delivery", "Freight prepaid / collect *", "Incoterm and named place", "Container, seal, size/type and VGM", "Marks and numbers", "Special clauses / handling", "Submission contact / email *"],
    lines: ["Marks & numbers", "Packages", "Package type", "Goods description", "HS code", "Gross kg", "CBM"],
  },
  {
    slug: "arrival-notice-template", title: "ARRIVAL NOTICE DATA SHEET",
    notice: "NOT AN OFFICIAL CARRIER NOTICE. Confirm arrival, charges and free time with the carrier, NVOCC, terminal or authorized destination agent.",
    fields: ["Notice number", "Issue date", "Carrier / NVOCC / destination agent *", "B/L number *", "Booking / manifest reference", "Consignee *", "Notify party", "Vessel *", "Voyage", "ETA *", "Discharge port / UN/LOCODE *", "Terminal / CFS / depot *", "Cargo availability / status", "Last free day", "Pickup / release reference", "Charge currency", "Freight due", "Terminal / destination charges", "Other charges", "Payment and release instructions", "Destination contact *"],
    lines: ["Container", "Seal", "Package type", "Packages", "Gross kg", "Status / location"],
  },
  {
    slug: "delivery-order-template", title: "DELIVERY ORDER DATA SHEET",
    notice: "DOES NOT RELEASE CARGO. Only the carrier, NVOCC or authorized agent can issue a valid delivery order after all release conditions are satisfied.",
    fields: ["Delivery order number *", "Issue date *", "Issuing carrier / NVOCC / agent *", "B/L number *", "Manifest / booking reference", "Consignee *", "Release cargo to *", "Ocean carrier", "Vessel / voyage", "Terminal / CFS / depot *", "Pickup / PIN / release reference", "Valid from", "Valid until *", "Customs release / entry reference", "Release conditions / instructions *", "Authorized signatory / authentication *"],
    lines: ["Container / unit", "Seal", "Package type", "Packages", "Gross kg", "Release status / depot"],
  },
];

const out = path.join(process.cwd(), "public", "downloads");
await mkdir(out, { recursive: true });
const BLUE = "FF013BB3";
const RED = "FFD40505";
const PALE = "FFEAF1FF";

function styleHeader(row) {
  row.height = 25;
  row.font = { bold: true, color: { argb: "FFFFFFFF" } };
  row.fill = { type: "pattern", pattern: "solid", fgColor: { argb: BLUE } };
  row.alignment = { vertical: "middle", wrapText: true };
}

function border(ws, startRow, endRow, endCol) {
  for (let rowNo = startRow; rowNo <= endRow; rowNo++) {
    for (let colNo = 1; colNo <= endCol; colNo++) {
      const cell = ws.getCell(rowNo, colNo);
      cell.border = { top: { style: "thin", color: { argb: "FFB8C5D9" } }, left: { style: "thin", color: { argb: "FFB8C5D9" } }, bottom: { style: "thin", color: { argb: "FFB8C5D9" } }, right: { style: "thin", color: { argb: "FFB8C5D9" } } };
      cell.alignment = { vertical: "top", wrapText: true };
    }
  }
}

function xlsxFor(def) {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = "GainingDocx";
  workbook.created = new Date("2026-07-20T00:00:00Z");
  const info = workbook.addWorksheet("Document", { properties: { defaultRowHeight: 22 } });
  info.mergeCells("A1:B1"); info.getCell("A1").value = def.title; info.getCell("A1").font = { bold: true, size: 18, color: { argb: "FFFFFFFF" } }; info.getCell("A1").fill = { type: "pattern", pattern: "solid", fgColor: { argb: BLUE } }; info.getCell("A1").alignment = { vertical: "middle" }; info.getRow(1).height = 38;
  info.mergeCells("A2:B3"); info.getCell("A2").value = def.notice; info.getCell("A2").font = { bold: true, color: { argb: RED } }; info.getCell("A2").fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFFFEEEE" } }; info.getCell("A2").alignment = { wrapText: true, vertical: "middle" }; info.getRow(2).height = 25; info.getRow(3).height = 25;
  info.addRow(["Field", "Enter value"]); styleHeader(info.getRow(4));
  def.fields.forEach((field) => { const row = info.addRow([field]); row.height = field.includes("Shipper") || field.includes("Consignee") || field.includes("instructions") || field.includes("declaration") || field.includes("clauses") ? 48 : 25; row.getCell(2).fill = { type: "pattern", pattern: "solid", fgColor: { argb: PALE } }; });
  info.columns = [{ width: 38 }, { width: 78 }];
  border(info, 4, info.rowCount, 2);
  info.views = [{ state: "frozen", ySplit: 4 }];
  info.pageSetup = { orientation: "portrait", fitToPage: true, fitToWidth: 1, fitToHeight: 0, paperSize: 9, margins: { left: .3, right: .3, top: .5, bottom: .5, header: .2, footer: .2 } };
  info.headerFooter.oddFooter = "GainingDocx working template — verify and authorize before use | Page &P of &N";

  const lines = workbook.addWorksheet("Lines", { properties: { defaultRowHeight: 22 } });
  lines.addRow(def.lines); styleHeader(lines.getRow(1));
  const amountIndex = def.lines.indexOf("Line amount") + 1;
  const qtyIndex = def.lines.indexOf("Quantity") + 1;
  const priceIndex = def.lines.indexOf("Unit price") + 1;
  const cbmIndex = def.lines.indexOf("CBM") + 1;
  const packagesIndex = def.lines.indexOf("Packages") + 1;
  const lIndex = def.lines.indexOf("Length cm") + 1;
  const wIndex = def.lines.indexOf("Width cm") + 1;
  const hIndex = def.lines.indexOf("Height cm") + 1;
  for (let r = 2; r <= 51; r++) {
    const row = lines.addRow([]);
    if (def.amount && amountIndex && qtyIndex && priceIndex) row.getCell(amountIndex).value = { formula: `IFERROR(${lines.getColumn(qtyIndex).letter}${r}*${lines.getColumn(priceIndex).letter}${r},0)` };
    if (def.cbm && cbmIndex && packagesIndex && lIndex && wIndex && hIndex) row.getCell(cbmIndex).value = { formula: `IFERROR(${lines.getColumn(packagesIndex).letter}${r}*${lines.getColumn(lIndex).letter}${r}*${lines.getColumn(wIndex).letter}${r}*${lines.getColumn(hIndex).letter}${r}/1000000,0)` };
    row.eachCell({ includeEmpty: true }, (cell) => { cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: r % 2 ? "FFF7FAFF" : "FFFFFFFF" } }; });
  }
  const totalRow = lines.addRow([]);
  totalRow.getCell(1).value = "TOTAL"; totalRow.getCell(1).font = { bold: true };
  def.lines.forEach((header, i) => {
    if (["Packages", "Quantity", "Line amount", "Net kg", "Gross kg", "CBM"].includes(header)) {
      totalRow.getCell(i + 1).value = { formula: `SUM(${lines.getColumn(i + 1).letter}2:${lines.getColumn(i + 1).letter}51)` };
      totalRow.getCell(i + 1).font = { bold: true };
    }
  });
  def.lines.forEach((header, i) => { lines.getColumn(i + 1).width = /description|Contents|Status/i.test(header) ? 36 : Math.max(13, Math.min(23, header.length + 4)); });
  border(lines, 1, lines.rowCount, def.lines.length);
  lines.views = [{ state: "frozen", ySplit: 1 }];
  lines.autoFilter = { from: { row: 1, column: 1 }, to: { row: 51, column: def.lines.length } };
  lines.pageSetup = { orientation: "landscape", fitToPage: true, fitToWidth: 1, fitToHeight: 0, paperSize: 9, printTitlesRow: "1:1", margins: { left: .2, right: .2, top: .4, bottom: .4, header: .2, footer: .2 } };
  lines.headerFooter.oddFooter = "GainingDocx working template | Page &P of &N";

  const readme = workbook.addWorksheet("Read me");
  readme.columns = [{ width: 110 }];
  [def.title, def.notice, "1. Complete required (*) document fields.", "2. Add one row per item, package group or container.", "3. Do not overwrite calculated Line amount or CBM cells unless your source basis differs.", "4. Check totals against the commercial invoice, packing list, booking and carrier draft.", "5. Obtain destination-specific customs, carrier and authorization review before operational use."].forEach((text, i) => { const row = readme.addRow([text]); row.height = i < 2 ? 42 : 28; row.getCell(1).alignment = { wrapText: true, vertical: "middle" }; if (i === 0) row.getCell(1).font = { bold: true, size: 16, color: { argb: BLUE } }; if (i === 1) row.getCell(1).font = { bold: true, color: { argb: RED } }; });
  return workbook;
}

function esc(value) { return String(value).replace(/[<>&'\"]/g, (c) => ({ "<": "&lt;", ">": "&gt;", "&": "&amp;", "'": "&apos;", '"': "&quot;" }[c])); }
function p(text, { bold = false, size = 20, color = "172033", align = "left" } = {}) { return `<w:p><w:pPr><w:jc w:val="${align}"/><w:spacing w:after="100"/></w:pPr><w:r><w:rPr>${bold ? "<w:b/>" : ""}<w:sz w:val="${size}"/><w:color w:val="${color}"/></w:rPr><w:t xml:space="preserve">${esc(text)}</w:t></w:r></w:p>`; }
function tc(text, width, header = false) { return `<w:tc><w:tcPr><w:tcW w:w="${width}" w:type="dxa"/><w:shd w:fill="${header ? "013BB3" : "FFFFFF"}"/><w:tcMar><w:top w:w="90" w:type="dxa"/><w:left w:w="90" w:type="dxa"/><w:bottom w:w="90" w:type="dxa"/><w:right w:w="90" w:type="dxa"/></w:tcMar></w:tcPr>${p(text, { bold: header, size: header ? 17 : 18, color: header ? "FFFFFF" : "172033" })}</w:tc>`; }
function table(rows, widths, headerRows = 0) { return `<w:tbl><w:tblPr><w:tblW w:w="0" w:type="auto"/><w:tblBorders><w:top w:val="single" w:sz="4" w:color="AAB8CC"/><w:left w:val="single" w:sz="4" w:color="AAB8CC"/><w:bottom w:val="single" w:sz="4" w:color="AAB8CC"/><w:right w:val="single" w:sz="4" w:color="AAB8CC"/><w:insideH w:val="single" w:sz="4" w:color="D4DDEA"/><w:insideV w:val="single" w:sz="4" w:color="D4DDEA"/></w:tblBorders></w:tblPr><w:tblGrid>${widths.map((w) => `<w:gridCol w:w="${w}"/>`).join("")}</w:tblGrid>${rows.map((row, ri) => `<w:tr>${row.map((cell, ci) => tc(cell, widths[ci], ri < headerRows)).join("")}</w:tr>`).join("")}</w:tbl>`; }

async function docxFor(def) {
  const zip = new JSZip();
  zip.file("[Content_Types].xml", `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/><Override PartName="/word/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.styles+xml"/><Override PartName="/docProps/core.xml" ContentType="application/vnd.openxmlformats-package.core-properties+xml"/><Override PartName="/docProps/app.xml" ContentType="application/vnd.openxmlformats-officedocument.extended-properties+xml"/></Types>`);
  zip.folder("_rels").file(".rels", `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/><Relationship Id="rId2" Type="http://schemas.openxmlformats.org/package/2006/relationships/metadata/core-properties" Target="docProps/core.xml"/><Relationship Id="rId3" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/extended-properties" Target="docProps/app.xml"/></Relationships>`);
  zip.folder("docProps").file("core.xml", `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><cp:coreProperties xmlns:cp="http://schemas.openxmlformats.org/package/2006/metadata/core-properties" xmlns:dc="http://purl.org/dc/elements/1.1/"><dc:title>${esc(def.title)}</dc:title><dc:creator>GainingDocx</dc:creator></cp:coreProperties>`).file("app.xml", `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Properties xmlns="http://schemas.openxmlformats.org/officeDocument/2006/extended-properties"><Application>GainingDocx</Application></Properties>`);
  const word = zip.folder("word");
  word.folder("_rels").file("document.xml.rels", `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/></Relationships>`);
  word.file("styles.xml", `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><w:styles xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:docDefaults><w:rPrDefault><w:rPr><w:rFonts w:ascii="Aptos" w:hAnsi="Aptos"/><w:sz w:val="20"/></w:rPr></w:rPrDefault></w:docDefaults><w:style w:type="paragraph" w:default="1" w:styleId="Normal"><w:name w:val="Normal"/></w:style></w:styles>`);
  const fieldRows = [["FIELD", "ENTER / VERIFY VALUE"], ...def.fields.map((f) => [f, "\u00a0\n\u00a0"] )];
  const fieldTable = table(fieldRows, [4200, 6300], 1);
  const lineCount = def.lines.length;
  const totalWidth = 10500;
  const lineWidths = def.lines.map((h) => /description|Contents|Status/i.test(h) ? 1800 : Math.max(650, Math.floor((totalWidth - 1800) / Math.max(1, lineCount - 1))));
  const normalized = lineWidths.map((w) => Math.floor(w * totalWidth / lineWidths.reduce((a, b) => a + b, 0)));
  const lineRows = [def.lines, ...Array.from({ length: 10 }, () => def.lines.map(() => "\u00a0\n\u00a0"))];
  const lineTable = table(lineRows, normalized, 1);
  const body = p(def.title, { bold: true, size: 36, color: "013BB3", align: "center" }) + p("Prepared with GainingDocx", { bold: true, size: 18, color: "D40505", align: "center" }) + p(def.notice, { bold: true, size: 18, color: "D40505" }) + p("DOCUMENT PARTICULARS", { bold: true, size: 22, color: "013BB3" }) + fieldTable + `<w:p><w:r><w:br w:type="page"/></w:r></w:p>` + p("LINES / EQUIPMENT DETAILS", { bold: true, size: 22, color: "013BB3" }) + lineTable + p("Review, authorize and retain supporting commercial, carrier and customs records before operational use.", { size: 16, color: "566273" });
  word.file("document.xml", `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:body>${body}<w:sectPr><w:pgSz w:w="11906" w:h="16838"/><w:pgMar w:top="720" w:right="540" w:bottom="720" w:left="540"/></w:sectPr></w:body></w:document>`);
  return zip.generateAsync({ type: "nodebuffer", compression: "DEFLATE" });
}

for (const def of defs) {
  await xlsxFor(def).xlsx.writeFile(path.join(out, `${def.slug}.xlsx`));
  await writeFile(path.join(out, `${def.slug}.docx`), await docxFor(def));
}
console.log(`Generated ${defs.length * 2} document-specific template files in ${out}`);
