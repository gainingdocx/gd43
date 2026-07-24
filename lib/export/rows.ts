// Export row builders (BUILD_SPEC §M7). Pure: documents.fields in, plain
// arrays out — every format (xlsx sheets, flat CSV, PDF grid) renders from
// these so the numbers can never disagree between formats.

import { flattenFields } from "@/lib/fields/display";

type Json = Record<string, unknown>;

export interface SummaryPair {
  label: string;
  value: string;
}

const CONTAINER_COLS = [
  "container_no",
  "seal_no",
  "iso_type",
  "packages",
  "package_type",
  "gross_kg",
  "tare_kg",
  "volume_cbm",
] as const;

const LINE_COLS = [
  "description",
  "line_no",
  "product_code",
  "buyer_product_code",
  "seller_product_code",
  "hs_code",
  "hs_code_suggestion", "hs_suggestion_confidence", "hs_suggestion_reason", "us_general_duty_rate",
  "marks",
  "packages",
  "package_type",
  "cartons",
  "quantity",
  "uom",
  "net_kg",
  "gross_kg",
  "volume_cbm",
  "unit_price",
  "amount",
  "currency",
  "tax_rate",
  "tax_amount",
  "discount_amount",
  "country_of_origin",
  "lot_no",
  "chargeable_kg",
  "rate_class",
  "rate_charge",
  "commodity_item_no",
] as const;

const CHARGE_COLS = [
  "line_no", "charge_code", "description", "container_no", "bl_number",
  "quantity", "uom", "rate", "amount", "currency", "tax_rate",
  "tax_amount", "prepaid_collect",
] as const;

const cell = (v: unknown): string | number =>
  typeof v === "number" ? v : v === null || v === undefined ? "" : String(v);

/** Vertical key/value pairs for the Summary sheet (container rows live on
 *  their own sheet, so they are excluded here). */
export function summaryPairs(docType: string, fields: Json): SummaryPair[] {
  return flattenFields(docType, fields)
    .filter((r) => !r.path.startsWith("containers["))
    .map((r) => ({ label: r.label, value: r.value }));
}

/** One row per container (B/L). Header row first. */
export function containerRows(fields: Json): (string | number)[][] {
  const list = Array.isArray(fields.containers) ? fields.containers : [];
  const rows = list
    .filter((c): c is Json => c !== null && typeof c === "object")
    .map((c) => CONTAINER_COLS.map((k) => cell(c[k])));
  return rows.length > 0 ? [[...CONTAINER_COLS], ...rows] : [];
}

/** One row per cargo/invoice/packing line. Header row first. */
export function lineRows(fields: Json): (string | number)[][] {
  const list = Array.isArray(fields.line_items)
    ? fields.line_items
    : Array.isArray(fields.cargo)
      ? fields.cargo
      : Array.isArray(fields.charges)
        ? fields.charges
        : [];
  const columns = Array.isArray(fields.charges) && !Array.isArray(fields.line_items) && !Array.isArray(fields.cargo)
    ? CHARGE_COLS
    : LINE_COLS;
  const rows = list
    .filter((l): l is Json => l !== null && typeof l === "object")
    .map((l) => columns.map((k) => cell(l[k])));
  return rows.length > 0 ? [[...columns], ...rows] : [];
}

/** Best human reference for filenames/titles. */
export function docRef(fields: Json): string | null {
  const ref = fields.bl_number ?? fields.awb_number ?? fields.invoice_no ?? fields.po_number ?? fields.receipt_no ?? fields.pl_no ?? fields.booking_no ?? fields.notice_no ?? null;
  return typeof ref === "string" && ref !== "" ? ref : null;
}

/**
 * Flat CSV table (spec: "CSV flat"): line items when present, else
 * containers, else a single summary row — always one rectangular table.
 */
export function csvTable(docType: string, fields: Json): (string | number)[][] {
  const ref = docRef(fields) ?? "";
  const lines = lineRows(fields);
  if (lines.length > 0) {
    return [
      ["doc_type", "ref", ...lines[0].map(String)],
      ...lines.slice(1).map((r) => [docType, ref, ...r]),
    ];
  }
  const containers = containerRows(fields);
  if (containers.length > 0) {
    return [
      ["doc_type", "ref", ...containers[0].map(String)],
      ...containers.slice(1).map((r) => [docType, ref, ...r]),
    ];
  }
  const pairs = summaryPairs(docType, fields).filter((p) => p.value !== "");
  return [
    ["doc_type", ...pairs.map((p) => p.label)],
    [docType, ...pairs.map((p) => p.value)],
  ];
}
