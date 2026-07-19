import ExcelJS from "exceljs";
import JSZip from "jszip";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

const templates = [
  ["bill-of-lading-template", "Bill of Lading"],
  ["commercial-invoice-template", "Commercial Invoice"],
  ["packing-list-template", "Packing List"],
  ["shipping-instructions-template", "Shipping Instructions"],
  ["arrival-notice-template", "Arrival Notice"],
  ["delivery-order-template", "Delivery Order"],
];
const out = path.join(process.cwd(), "public", "downloads");
await mkdir(out, { recursive: true });

function xmlEscape(value) { return value.replace(/[<>&'"]/g, (c) => ({"<":"&lt;",">":"&gt;","&":"&amp;","'":"&apos;",'"':"&quot;"}[c])); }
for (const [slug, title] of templates) {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = "GainingDocx";
  const summary = workbook.addWorksheet("Summary");
  summary.columns = [{ header: "Field", key: "field", width: 28 }, { header: "Value", key: "value", width: 54 }];
  ["Document number", "Date", "Shipper / seller", "Consignee / buyer", "Booking / B/L reference", "Vessel and voyage", "Port of loading", "Port of discharge", "Container number", "Notes"].forEach((field) => summary.addRow({ field, value: "" }));
  summary.getRow(1).font = { bold: true, color: { argb: "FFFFFFFF" } }; summary.getRow(1).fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF0B1F3A" } }; summary.views = [{ state: "frozen", ySplit: 1 }];
  const lines = workbook.addWorksheet("Lines");
  lines.addRow(["Description", "Quantity", "Unit price", "Cartons", "Net kg", "Gross kg", "Length cm", "Width cm", "Height cm", "CBM", "Amount"]);
  for (let i = 2; i <= 26; i++) { lines.addRow(["", "", "", "", "", "", "", "", "", { formula: `IFERROR(D${i}*G${i}*H${i}*I${i}/1000000,0)` }, { formula: `IFERROR(B${i}*C${i},0)` }]); }
  lines.columns.forEach((column, i) => { column.width = i === 0 ? 34 : 14; }); lines.getRow(1).font = { bold: true, color: { argb: "FFFFFFFF" } }; lines.getRow(1).fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF0B1F3A" } }; lines.views = [{ state: "frozen", ySplit: 1 }];
  await workbook.xlsx.writeFile(path.join(out, `${slug}.xlsx`));

  const zip = new JSZip();
  zip.file("[Content_Types].xml", `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/></Types>`);
  zip.folder("_rels").file(".rels", `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/></Relationships>`);
  const rows = [title.toUpperCase(), "Prepared with GainingDocx", "", "Document number:", "Date:", "Shipper / seller:", "Consignee / buyer:", "Booking / B/L reference:", "Vessel and voyage:", "Port of loading:", "Port of discharge:", "Container number:", "", "CARGO LINES", "Description | Qty | Cartons | Net kg | Gross kg | L × W × H cm", "", "", "", "", "Notes:"];
  const paragraphs = rows.map((row, i) => `<w:p><w:r>${i===0||i===13?"<w:rPr><w:b/><w:sz w:val=\"28\"/></w:rPr>":""}<w:t xml:space="preserve">${xmlEscape(row)}</w:t></w:r></w:p>`).join("");
  zip.folder("word").file("document.xml", `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:body>${paragraphs}<w:sectPr><w:pgSz w:w="11906" w:h="16838"/><w:pgMar w:top="1134" w:right="1134" w:bottom="1134" w:left="1134"/></w:sectPr></w:body></w:document>`);
  await writeFile(path.join(out, `${slug}.docx`), await zip.generateAsync({ type: "nodebuffer", compression: "DEFLATE" }));
}
console.log(`Generated ${templates.length * 2} template files in ${out}`);
