// Trust-Screen field model (BUILD_SPEC §M6.3). Flattens documents.fields
// into ordered, labeled, editable rows and applies edits back by path.
// Paths look like "shipper.name" or "containers[0].container_no".

export interface FieldRow {
  path: string;
  label: string;
  value: string;
  /** 1-based page number from _meta.page_refs, when the model reported one. */
  page: number | null;
  editable: boolean;
}

type Json = Record<string, unknown>;

const BL_ORDER: [string, string][] = [
  ["bl_number", "B/L number"],
  ["carrier_name", "Carrier"],
  ["scac", "SCAC"],
  ["shipper.name", "Shipper"],
  ["shipper.address", "Shipper address"],
  ["consignee.name", "Consignee"],
  ["consignee.address", "Consignee address"],
  ["notify.name", "Notify party"],
  ["vessel_name", "Vessel"],
  ["imo_number", "IMO number"],
  ["voyage_no", "Voyage"],
  ["port_of_load.name", "Port of load"],
  ["port_of_load.unlocode", "POL code"],
  ["port_of_discharge.name", "Port of discharge"],
  ["port_of_discharge.unlocode", "POD code"],
  ["place_of_receipt", "Place of receipt"],
  ["place_of_delivery", "Place of delivery"],
  ["shipped_on_board_date", "Shipped on board"],
  ["issue_date", "Issue date"],
  ["issue_place", "Issue place"],
  ["freight_terms", "Freight terms"],
  ["incoterm", "Incoterm"],
  ["total_packages", "Total packages"],
  ["total_gross_kg", "Total gross (kg)"],
  ["total_volume_cbm", "Total volume (cbm)"],
  ["originals_count", "Originals"],
  ["bl_type", "B/L type"],
];

const CI_ORDER: [string, string][] = [
  ["invoice_no", "Invoice number"],
  ["invoice_date", "Invoice date"],
  ["po_no", "PO number"],
  ["seller.name", "Seller"],
  ["seller.address", "Seller address"],
  ["buyer.name", "Buyer"],
  ["buyer.address", "Buyer address"],
  ["incoterm", "Incoterm"],
  ["currency", "Currency"],
  ["subtotal", "Subtotal"],
  ["freight_charge", "Freight"],
  ["insurance", "Insurance"],
  ["total_amount", "Total amount"],
  ["payment_terms", "Payment terms"],
  ["lc_number", "L/C number"],
  ["country_of_origin", "Country of origin"],
  ["bank_details", "Bank details"],
];

const PL_ORDER: [string, string][] = [
  ["pl_no", "Packing list no."],
  ["date", "Date"],
  ["invoice_ref", "Invoice ref"],
  ["po_no", "PO number"],
  ["seller.name", "Seller"],
  ["buyer.name", "Buyer"],
  ["total_cartons", "Total cartons"],
  ["total_net_kg", "Total net (kg)"],
  ["total_gross_kg", "Total gross (kg)"],
  ["total_volume_cbm", "Total volume (cbm)"],
];

const ARRIVAL_ORDER: [string, string][] = [
  ["notice_no", "Notice number"], ["issue_date", "Issue date"], ["bl_number", "B/L number"],
  ["booking_no", "Booking number"], ["carrier_name", "Carrier"], ["agent.name", "Destination agent"],
  ["consignee.name", "Consignee"], ["notify.name", "Notify party"], ["vessel_name", "Vessel"],
  ["voyage_no", "Voyage"], ["port_of_discharge.name", "Discharge port"],
  ["port_of_discharge.unlocode", "Discharge port code"], ["terminal", "Terminal / CFS"],
  ["eta", "ETA"], ["availability_date", "Availability date"], ["last_free_day", "Last free day"],
  ["pickup_reference", "Pickup / release reference"], ["currency", "Currency"],
  ["freight_due", "Freight due"], ["terminal_charges", "Terminal charges"],
  ["other_charges", "Other charges"], ["total_charges", "Total charges"],
  ["payment_instructions", "Payment instructions"],
];

const BOOKING_ORDER: [string, string][] = [
  ["booking_no", "Booking number"], ["carrier_name", "Carrier"], ["shipper.name", "Shipper"],
  ["service_contract_no", "Service contract"], ["vessel_name", "Vessel"], ["voyage_no", "Voyage"],
  ["place_of_receipt", "Place of receipt"], ["port_of_load.name", "Port of loading"],
  ["port_of_load.unlocode", "POL code"], ["port_of_discharge.name", "Port of discharge"],
  ["port_of_discharge.unlocode", "POD code"], ["place_of_delivery", "Place of delivery"],
  ["etd", "ETD"], ["eta", "ETA"], ["documentation_cutoff", "Documentation cut-off"],
  ["si_cutoff", "Shipping instructions cut-off"], ["vgm_cutoff", "VGM cut-off"],
  ["cargo_cutoff", "Cargo cut-off"], ["commodity", "Commodity"],
  ["total_packages", "Total packages"], ["total_gross_kg", "Total gross kg"],
  ["special_instructions", "Special instructions"],
];

const ORDERS: Record<string, [string, string][]> = {
  bill_of_lading: BL_ORDER,
  sea_waybill: BL_ORDER,
  commercial_invoice: CI_ORDER,
  packing_list: PL_ORDER,
  arrival_notice: ARRIVAL_ORDER,
  booking_confirmation: BOOKING_ORDER,
};

function tokenize(path: string): (string | number)[] {
  const tokens: (string | number)[] = [];
  for (const part of path.split(".")) {
    const m = part.match(/^([^[]+)((\[\d+\])*)$/);
    if (!m) return [];
    tokens.push(m[1]);
    for (const idx of m[2].matchAll(/\[(\d+)\]/g)) tokens.push(Number(idx[1]));
  }
  return tokens;
}

export function getPath(fields: Json, path: string): unknown {
  let cur: unknown = fields;
  for (const t of tokenize(path)) {
    if (cur === null || typeof cur !== "object") return undefined;
    cur = (cur as Record<string | number, unknown>)[t];
  }
  return cur;
}

/** Immutable set; creates intermediate objects when a party was null. */
export function setPath(fields: Json, path: string, value: unknown): Json {
  const tokens = tokenize(path);
  if (tokens.length === 0) return fields;
  const clone = (x: unknown): unknown =>
    Array.isArray(x) ? [...x] : x !== null && typeof x === "object" ? { ...(x as Json) } : x;
  const root = clone(fields) as Json;
  let cur: Record<string | number, unknown> = root;
  for (let i = 0; i < tokens.length - 1; i++) {
    const t = tokens[i];
    const next = clone(cur[t]);
    cur[t] =
      next !== null && typeof next === "object"
        ? next
        : typeof tokens[i + 1] === "number"
          ? []
          : {};
    cur = cur[t] as Record<string | number, unknown>;
  }
  cur[tokens[tokens.length - 1]] = value;
  return root;
}

function display(v: unknown): string {
  if (v === null || v === undefined) return "";
  if (typeof v === "number") return String(v);
  if (typeof v === "boolean") return v ? "yes" : "no";
  return String(v);
}

/** Page ref for a path: _meta.page_refs is keyed by top-level field name. */
function pageFor(fields: Json, path: string): number | null {
  const meta = fields._meta as { page_refs?: Record<string, number> } | undefined;
  const top = path.split(/[.[]/)[0];
  const n = meta?.page_refs?.[top];
  return typeof n === "number" ? n : null;
}

export function flattenFields(docType: string, fields: Json): FieldRow[] {
  const order = ORDERS[docType];
  if (!order) {
    // "other" docs: show raw keys read-only.
    const raw = (fields.raw ?? {}) as Json;
    return Object.entries(raw)
      .filter(([, v]) => typeof v !== "object" || v === null)
      .slice(0, 40)
      .map(([k, v]) => ({
        path: `raw.${k}`,
        label: k.replace(/_/g, " "),
        value: display(v),
        page: null,
        editable: false,
      }));
  }
  const rows: FieldRow[] = order.map(([path, label]) => ({
    path,
    label,
    value: display(getPath(fields, path)),
    page: pageFor(fields, path),
    editable: true,
  }));

  // Container rows (B/L) get appended per container.
  const containers = fields.containers;
  if (Array.isArray(containers)) {
    containers.forEach((c, i) => {
      if (c === null || typeof c !== "object") return;
      rows.push(
        {
          path: `containers[${i}].container_no`,
          label: `Container ${i + 1}`,
          value: display((c as Json).container_no),
          page: pageFor(fields, "containers"),
          editable: true,
        },
        {
          path: `containers[${i}].seal_no`,
          label: `Seal ${i + 1}`,
          value: display((c as Json).seal_no),
          page: pageFor(fields, "containers"),
          editable: true,
        },
        {
          path: `containers[${i}].gross_kg`,
          label: `Gross kg ${i + 1}`,
          value: display((c as Json).gross_kg),
          page: pageFor(fields, "containers"),
          editable: true,
        }
      );
    });
  }
  const equipment = fields.equipment;
  if (Array.isArray(equipment)) {
    equipment.forEach((c, i) => {
      if (c === null || typeof c !== "object") return;
      rows.push({ path: `equipment[${i}].container_no`, label: `Equipment ${i + 1}`, value: display((c as Json).container_no), page: pageFor(fields, "equipment"), editable: true }, { path: `equipment[${i}].iso_type`, label: `Equipment type ${i + 1}`, value: display((c as Json).iso_type), page: pageFor(fields, "equipment"), editable: true });
    });
  }
  return rows;
}

/** Coerce an edited string back to the stored type (numbers stay numbers). */
export function coerceEdit(oldValue: unknown, input: string): unknown {
  const t = input.trim();
  if (t === "") return null;
  if (typeof oldValue === "number" || /^-?\d+(\.\d+)?$/.test(t)) {
    const n = Number(t.replace(/,/g, ""));
    if (Number.isFinite(n) && /^[\d.,\s-]+$/.test(t)) return n;
  }
  return t;
}
