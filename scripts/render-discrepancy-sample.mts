import { mkdir, writeFile } from "node:fs/promises";
import { discrepancyNoticePdf } from "../lib/export/discrepancy-pdf";

await mkdir("tmp/pdfs", { recursive: true });
const pdf = await discrepancyNoticePdf({
  shipmentReference: "MBL-SIN-2026-00418",
  discrepancies: [
    { severity: "red", field: "total_gross_kg", documentA: "Bill of Lading", documentB: "Packing List", valueA: "10,000 kg", valueB: "10,800 kg", message: "Gross weight differs by 800 kg." },
    { severity: "red", field: "total_packages", documentA: "Packing List", documentB: "Commercial Invoice", valueA: "540 cartons", valueB: "500 cartons", message: "Package count differs across commercial documents." },
    { severity: "amber", field: "consignee", documentA: "Bill of Lading", documentB: "Commercial Invoice", valueA: "Northstar Imports LLC", valueB: "North Star Imports, LLC", message: "Consignee names require confirmation." },
  ],
});
await writeFile("tmp/pdfs/discrepancy-notice-sample.pdf", pdf);
