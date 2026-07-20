// Counterpart-document generation (BUILD_SPEC §M7): deterministic mapping
// from parsed fields into an editable draft — every value is copied or
// summed from the source document (consistency by construction), never
// invented. The user edits the draft before the PDF is rendered.

type Json = Record<string, unknown>;

export type GenType = "packing_list" | "commercial_invoice" | "shipping_instructions";

export interface GenLine {
  description: string;
  hs_code: string;
  packages: string;
  cartons: string;
  net_kg: string;
  gross_kg: string;
  volume_cbm: string;
  unit_price: string;
  amount: string;
}

export interface GenDoc {
  type: GenType;
  title: string;
  /** Small header facts (doc no, dates, refs) — all editable. */
  header: { label: string; value: string }[];
  /** Multiline party blocks. */
  parties: { label: string; value: string }[];
  lines: GenLine[];
  totals: { label: string; value: string }[];
  notes: string;
}

/** Which drafts can be generated from which parsed doc type. */
export function generatableTypes(docType: string): GenType[] {
  switch (docType) {
    case "commercial_invoice":
      return ["packing_list", "shipping_instructions"];
    case "packing_list":
      return ["commercial_invoice", "shipping_instructions"];
    case "bill_of_lading":
    case "sea_waybill":
    case "booking_confirmation":
      return ["shipping_instructions"];
    default:
      return [];
  }
}

const s = (v: unknown): string =>
  v === null || v === undefined ? "" : String(v);

function partyBlock(p: unknown): string {
  if (p === null || typeof p !== "object") return "";
  const o = p as Json;
  return [o.name, o.address, [o.city, o.country].filter(Boolean).join(", ")]
    .map(s)
    .filter((x) => x !== "")
    .join("\n");
}

function linesOf(fields: Json): Json[] {
  const list = Array.isArray(fields.line_items)
    ? fields.line_items
    : Array.isArray(fields.cargo)
      ? fields.cargo
      : [];
  return list.filter((l): l is Json => l !== null && typeof l === "object");
}

function genLine(l: Json): GenLine {
  return {
    description: s(l.description),
    hs_code: s(l.hs_code),
    packages: s(l.packages),
    cartons: s(l.cartons ?? l.packages),
    net_kg: s(l.net_kg),
    gross_kg: s(l.gross_kg),
    volume_cbm: s(l.volume_cbm),
    unit_price: s(l.unit_price),
    amount: s(l.amount),
  };
}

/** Sum a numeric column; "" when no line carries it (never invents zeros). */
function sumCol(lines: GenLine[], key: keyof GenLine): string {
  const nums = lines
    .map((l) => l[key])
    .filter((v) => v !== "" && /^-?\d+(\.\d+)?$/.test(v))
    .map(Number);
  if (nums.length === 0) return "";
  const total = nums.reduce((a, b) => a + b, 0);
  return String(Math.round(total * 1000) / 1000);
}

export function ciToPackingList(ci: Json): GenDoc {
  const lines = linesOf(ci).map(genLine);
  return {
    type: "packing_list",
    title: "PACKING LIST",
    header: [
      { label: "Packing list no.", value: "" },
      { label: "Date", value: "" },
      { label: "Invoice ref", value: s(ci.invoice_no) },
      { label: "PO number", value: s(ci.po_no) },
    ],
    parties: [
      { label: "Seller / Exporter", value: partyBlock(ci.seller) },
      { label: "Buyer / Consignee", value: partyBlock(ci.buyer) },
    ],
    lines,
    totals: [
      { label: "Total cartons", value: sumCol(lines, "cartons") },
      { label: "Total net (kg)", value: sumCol(lines, "net_kg") },
      { label: "Total gross (kg)", value: sumCol(lines, "gross_kg") },
      { label: "Total volume (cbm)", value: sumCol(lines, "volume_cbm") },
    ],
    notes: "",
  };
}

export function plToCommercialInvoice(pl: Json): GenDoc {
  const lines = linesOf(pl).map(genLine);
  return {
    type: "commercial_invoice",
    title: "COMMERCIAL INVOICE",
    header: [
      { label: "Invoice no.", value: s(pl.invoice_ref) },
      { label: "Date", value: "" },
      { label: "PO number", value: s(pl.po_no) },
      { label: "Currency", value: "" },
      { label: "Incoterm", value: "" },
    ],
    parties: [
      { label: "Seller", value: partyBlock(pl.seller) },
      { label: "Buyer", value: partyBlock(pl.buyer) },
    ],
    lines,
    totals: [
      { label: "Subtotal", value: sumCol(lines, "amount") },
      { label: "Total amount", value: sumCol(lines, "amount") },
    ],
    notes: "",
  };
}

export function toShippingInstructions(fields: Json, docType: string): GenDoc {
  const lines = linesOf(fields).map(genLine);
  const port = (p: unknown): string => {
    if (p === null || typeof p !== "object") return "";
    const o = p as Json;
    return [o.name, o.unlocode ? `(${s(o.unlocode)})` : ""].map(s).filter(Boolean).join(" ");
  };
  const equipmentList = Array.isArray(fields.containers) ? fields.containers : fields.equipment;
  const containers = Array.isArray(equipmentList)
    ? (equipmentList as Json[])
        .filter((c) => c && typeof c === "object")
        .map((c) => [s(c.container_no), s(c.seal_no), s(c.iso_type)].filter(Boolean).join(" / "))
        .join("\n")
    : "";
  const transportDoc = docType === "bill_of_lading" || docType === "sea_waybill" || docType === "booking_confirmation";
  const shipper = transportDoc ? fields.shipper : fields.seller;
  const consignee = transportDoc ? fields.consignee : fields.buyer;
  return {
    type: "shipping_instructions",
    title: "SHIPPING INSTRUCTIONS (DRAFT)",
    header: [
      { label: "Booking / B/L ref", value: s(fields.booking_no ?? fields.bl_number) },
      { label: "Vessel / Voyage", value: [s(fields.vessel_name), s(fields.voyage_no)].filter(Boolean).join(" ") },
      { label: "Port of loading", value: port(fields.port_of_load) },
      { label: "Port of discharge", value: port(fields.port_of_discharge) },
      { label: "Freight terms", value: s(fields.freight_terms) },
      { label: "Incoterm", value: s(fields.incoterm) },
    ],
    parties: [
      { label: "Shipper", value: partyBlock(shipper) },
      { label: "Consignee", value: partyBlock(consignee) },
      { label: "Notify party", value: partyBlock(fields.notify) },
    ],
    lines,
    totals: [
      { label: "Total packages", value: s(fields.total_packages) || sumCol(lines, "packages") },
      { label: "Total gross (kg)", value: s(fields.total_gross_kg) || sumCol(lines, "gross_kg") },
      { label: "Total volume (cbm)", value: s(fields.total_volume_cbm) || sumCol(lines, "volume_cbm") },
    ],
    notes: containers ? `Containers:\n${containers}` : "",
  };
}

export function buildDraft(type: GenType, fields: Json, docType: string): GenDoc {
  switch (type) {
    case "packing_list":
      return ciToPackingList(fields);
    case "commercial_invoice":
      return plToCommercialInvoice(fields);
    case "shipping_instructions":
      return toShippingInstructions(fields, docType);
  }
}
