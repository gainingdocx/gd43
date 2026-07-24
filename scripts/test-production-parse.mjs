import { readFile } from "node:fs/promises";

const baseUrl = process.argv[2] ?? "https://gainingdocx.com";
const imagePaths = process.argv.slice(3);

if (imagePaths.length === 0) {
  throw new Error("Pass one or more rendered document page paths.");
}

const pages = await Promise.all(
  imagePaths.map(async (path) => ({
    dataUrl: `data:image/png;base64,${(await readFile(path)).toString("base64")}`,
  }))
);

const response = await fetch(`${baseUrl}/api/parse`, {
  method: "POST",
  headers: { "content-type": "application/json" },
  body: JSON.stringify({ pages }),
});

console.log(`HTTP ${response.status} ${response.headers.get("content-type") ?? ""}`);
const body = await response.text();
const events = body
  .split("\n\n")
  .filter(Boolean)
  .map((block) =>
    Object.fromEntries(
      block.split("\n").map((line) => {
        const separator = line.indexOf(":");
        return [line.slice(0, separator), line.slice(separator + 1).trim()];
      })
    )
  );

console.log(`Events: ${events.map((event) => event.event).join(", ")}`);
const done = events.find((event) => event.event === "done");
if (!done) {
  console.error(body.slice(0, 2_000));
  process.exitCode = 1;
} else {
  const result = JSON.parse(done.data);
  const fields = result.extraction?.fields ?? {};
  console.log(
    JSON.stringify(
      {
        type: result.extraction?.detected_type,
        model: result.model,
        escalated: result.escalated,
        qualityScore: result.qualityScore,
        reference:
          fields.bl_number ?? fields.invoice_no ?? fields.pl_no ?? null,
        shipper: fields.shipper?.name ?? fields.seller?.name ?? fields.exporter?.name ?? null,
        consignee: fields.consignee?.name ?? fields.buyer?.name ?? fields.importer?.name ?? null,
        portOfLoading: fields.port_of_load ?? null,
        portOfDischarge: fields.port_of_discharge ?? null,
        containers: fields.containers?.map((container) => container.container_no) ?? [],
        cargoLines: fields.cargo?.length ?? fields.line_items?.length ?? 0,
        totalGrossWeightKg: fields.total_gross_kg ?? null,
        totalMeasurementCbm: fields.total_volume_cbm ?? null,
        fields,
        checks: (result.validation ?? []).map((check) => ({
          id: check.id,
          status: check.status,
          message: check.message,
        })),
      },
      null,
      2
    )
  );
}
