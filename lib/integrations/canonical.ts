// The canonical freight model.
//
// Every connector maps through this structure, never directly from
// `documents.fields`. The reason is arithmetic: with N document types and M
// external systems, per-connector mapping is N×M pieces of field logic that
// drift apart, and the first sign of drift is a customer's accounting system
// receiving a gross weight in pounds. Through one canonical shape it is N+M.
//
// The shape follows the entities in the standards crosswalk — DCSA transport
// document, UN/CEFACT multimodal reference data, FIATA eFBL — so a receiving
// system's own mapping has recognisable names to bind to. It is a mapping
// target, not a certification: see /standards for what that does and does not
// claim.
//
// Two rules hold everywhere in this file:
//   1. Printed legal values are carried through verbatim. Nothing here
//      normalizes, translates or "cleans" a value that appears on a document.
//   2. A value that was not on the document is `null`, never zero and never an
//      empty string. A downstream system must be able to tell "not stated" from
//      "stated as nothing".

import { docRef } from "@/lib/export/rows";
import { CANONICAL_SCHEMA_VERSION, standardsProfile } from "@/lib/standards/crosswalk";

export const CANONICAL_MODEL_VERSION = "1.0.0";

type Json = Record<string, unknown>;

export interface CanonicalParty {
  role: "shipper" | "consignee" | "notify_party" | "carrier" | "forwarder" | "supplier" | "buyer";
  name: string | null;
  address: string | null;
  reference: string | null;
}

export interface CanonicalLocation {
  role: "place_of_receipt" | "port_of_loading" | "port_of_discharge" | "place_of_delivery" | "origin" | "destination";
  name: string | null;
  unlocode: string | null;
}

export interface CanonicalContainer {
  container_no: string | null;
  seal_no: string | null;
  iso_type: string | null;
  packages: number | null;
  package_type: string | null;
  gross_kg: number | null;
  volume_cbm: number | null;
  check_digit_valid: boolean | null;
}

export interface CanonicalCommodity {
  line_no: number | null;
  description: string | null;
  hs_code: string | null;
  quantity: number | null;
  uom: string | null;
  net_kg: number | null;
  gross_kg: number | null;
  volume_cbm: number | null;
  unit_price: number | null;
  amount: number | null;
  currency: string | null;
  country_of_origin: string | null;
}

export interface CanonicalCharge {
  line_no: number | null;
  charge_code: string | null;
  description: string | null;
  quantity: number | null;
  uom: string | null;
  rate: number | null;
  amount: number | null;
  currency: string | null;
  tax_amount: number | null;
  prepaid_collect: string | null;
  container_no: string | null;
}

export interface CanonicalDocument {
  id: string;
  document_type: string;
  status: string;
  reference: string | null;
  source_filename: string | null;
  page_count: number | null;
  parties: CanonicalParty[];
  locations: CanonicalLocation[];
  containers: CanonicalContainer[];
  commodities: CanonicalCommodity[];
  charges: CanonicalCharge[];
  transport: {
    mode: "air" | "ocean" | "unspecified";
    vessel: string | null;
    voyage: string | null;
    flight_no: string | null;
    etd: string | null;
    eta: string | null;
    incoterm: string | null;
    freight_terms: string | null;
  };
  totals: {
    gross_kg: number | null;
    net_kg: number | null;
    volume_cbm: number | null;
    packages: number | null;
    chargeable_kg: number | null;
    invoice_total: number | null;
    currency: string | null;
  };
  standards: ReturnType<typeof standardsProfile>;
  /** Every extracted value, unmodified, for fields the canonical shape omits. */
  extracted_fields: Json;
  created_at: string;
  updated_at: string;
}

export interface CanonicalDiscrepancy {
  id: string;
  severity: "red" | "amber";
  field: string;
  message: string | null;
  value_a: string | null;
  value_b: string | null;
  document_a: string | null;
  document_b: string | null;
  questioned_amount: number | null;
  questioned_currency: string | null;
  resolved: boolean;
  resolution_status: string | null;
  resolution_note: string | null;
}

export interface CanonicalShipment {
  schema: "gainingdocx.canonical.shipment";
  schema_version: string;
  canonical_schema_version: string;
  generated_at: string;
  shipment: {
    id: string;
    reference: string | null;
    bl_number: string | null;
    house_bl_number: string | null;
    bill_level: string;
    master_shipment_id: string | null;
    mode: "air" | "ocean" | "unspecified";
    created_at: string;
  };
  parties: CanonicalParty[];
  locations: CanonicalLocation[];
  containers: CanonicalContainer[];
  documents: CanonicalDocument[];
  discrepancies: CanonicalDiscrepancy[];
  summary: {
    document_count: number;
    open_critical: number;
    open_warnings: number;
    clear_for_write_back: boolean;
  };
  disclaimer: string;
}

// ---------------------------------------------------------------------------
// Coercion
// ---------------------------------------------------------------------------

function str(value: unknown): string | null {
  if (typeof value === "string") return value.trim() === "" ? null : value;
  if (typeof value === "number" && Number.isFinite(value)) return String(value);
  return null;
}

function num(value: unknown): number | null {
  if (typeof value === "number") return Number.isFinite(value) ? value : null;
  if (typeof value === "string") {
    // Printed numbers carry thousands separators and unit suffixes ("12,480 KG").
    // Anything left after stripping those that is not a clean number stays null
    // rather than becoming a confidently wrong figure in an accounting system.
    const cleaned = value.replace(/[,\s]/g, "").replace(/[A-Za-z]+$/, "");
    const parsed = Number(cleaned);
    return cleaned !== "" && Number.isFinite(parsed) ? parsed : null;
  }
  return null;
}

function objects(value: unknown): Json[] {
  return Array.isArray(value) ? value.filter((item): item is Json => !!item && typeof item === "object") : [];
}

/** Read the first present key. Field names vary by parser; the model does not. */
function pick(fields: Json, ...keys: string[]): unknown {
  for (const key of keys) {
    const value = fields[key];
    if (value !== undefined && value !== null && value !== "") return value;
  }
  return null;
}

function partyFrom(fields: Json, role: CanonicalParty["role"], ...keys: string[]): CanonicalParty | null {
  const raw = pick(fields, ...keys);
  if (raw === null) return null;
  if (typeof raw === "object") {
    const party = raw as Json;
    const name = str(pick(party, "name", "company", "party_name"));
    const address = str(pick(party, "address", "full_address", "address_line"));
    if (!name && !address) return null;
    return { role, name, address, reference: str(pick(party, "reference", "ref", "account_no")) };
  }
  const text = str(raw);
  if (!text) return null;
  // Parsers often return the whole printed block as one string. The first line
  // is the name in nearly every document layout; the rest is the address.
  const [first, ...rest] = text.split("\n").map((line) => line.trim()).filter(Boolean);
  return { role, name: first ?? null, address: rest.length > 0 ? rest.join(", ") : null, reference: null };
}

function locationFrom(fields: Json, role: CanonicalLocation["role"], ...keys: string[]): CanonicalLocation | null {
  const raw = pick(fields, ...keys);
  if (raw === null) return null;
  if (typeof raw === "object") {
    const place = raw as Json;
    const name = str(pick(place, "name", "location", "port"));
    const unlocode = str(pick(place, "unlocode", "locode", "code"));
    if (!name && !unlocode) return null;
    return { role, name, unlocode };
  }
  const text = str(raw);
  if (!text) return null;
  // "Shanghai, CN (CNSHA)" and "CNSHA" are both common printed forms.
  const embedded = /\b([A-Z]{2}[A-Z0-9]{3})\b/.exec(text.toUpperCase());
  return { role, name: text, unlocode: embedded ? embedded[1] : null };
}

function compact<T>(items: (T | null)[]): T[] {
  return items.filter((item): item is T => item !== null);
}

// ---------------------------------------------------------------------------
// Document mapping
// ---------------------------------------------------------------------------

function transportMode(docType: string, fields: Json): "air" | "ocean" | "unspecified" {
  if (docType === "air_waybill" || pick(fields, "awb_number", "flight_no") !== null) return "air";
  if (["bill_of_lading", "sea_waybill", "arrival_notice", "booking_confirmation", "shipping_instructions"].includes(docType)) return "ocean";
  if (pick(fields, "bl_number", "vessel", "container_no") !== null) return "ocean";
  return "unspecified";
}

export interface DocumentInput {
  id: string;
  doc_type: string;
  status: string;
  source_filename?: string | null;
  page_count?: number | null;
  fields: Json | null;
  created_at: string;
  updated_at: string;
}

export function canonicalDocument(input: DocumentInput): CanonicalDocument {
  const fields = input.fields ?? {};
  const containerSource = objects(fields.containers);
  const lineSource = objects(fields.line_items).length > 0 ? objects(fields.line_items) : objects(fields.cargo);

  return {
    id: input.id,
    document_type: input.doc_type,
    status: input.status,
    reference: docRef(fields),
    source_filename: input.source_filename ?? null,
    page_count: input.page_count ?? null,
    parties: compact([
      partyFrom(fields, "shipper", "shipper", "exporter", "consignor"),
      partyFrom(fields, "consignee", "consignee", "importer", "buyer"),
      partyFrom(fields, "notify_party", "notify_party", "notify"),
      partyFrom(fields, "carrier", "carrier", "carrier_name", "airline"),
      partyFrom(fields, "forwarder", "forwarder", "agent", "freight_forwarder"),
      partyFrom(fields, "supplier", "supplier", "vendor", "seller"),
    ]),
    locations: compact([
      locationFrom(fields, "place_of_receipt", "place_of_receipt", "receipt_place"),
      locationFrom(fields, "port_of_loading", "port_of_loading", "pol", "airport_of_departure", "origin_airport"),
      locationFrom(fields, "port_of_discharge", "port_of_discharge", "pod", "airport_of_destination", "destination_airport"),
      locationFrom(fields, "place_of_delivery", "place_of_delivery", "final_destination", "delivery_place"),
    ]),
    containers: containerSource.map((container) => ({
      container_no: str(container.container_no),
      seal_no: str(container.seal_no),
      iso_type: str(container.iso_type),
      packages: num(container.packages),
      package_type: str(container.package_type),
      gross_kg: num(container.gross_kg),
      volume_cbm: num(container.volume_cbm),
      check_digit_valid: typeof container.check_digit_valid === "boolean" ? container.check_digit_valid : null,
    })),
    commodities: lineSource.map((line, index) => ({
      line_no: num(line.line_no) ?? index + 1,
      description: str(line.description),
      hs_code: str(line.hs_code),
      quantity: num(line.quantity),
      uom: str(line.uom),
      net_kg: num(line.net_kg),
      gross_kg: num(line.gross_kg),
      volume_cbm: num(line.volume_cbm),
      unit_price: num(line.unit_price),
      amount: num(line.amount),
      currency: str(line.currency) ?? str(fields.currency),
      country_of_origin: str(line.country_of_origin),
    })),
    charges: objects(fields.charges).map((charge, index) => ({
      line_no: num(charge.line_no) ?? index + 1,
      charge_code: str(charge.charge_code),
      description: str(charge.description),
      quantity: num(charge.quantity),
      uom: str(charge.uom),
      rate: num(charge.rate),
      amount: num(charge.amount),
      currency: str(charge.currency) ?? str(fields.currency),
      tax_amount: num(charge.tax_amount),
      prepaid_collect: str(charge.prepaid_collect),
      container_no: str(charge.container_no),
    })),
    transport: {
      mode: transportMode(input.doc_type, fields),
      vessel: str(pick(fields, "vessel", "vessel_name")),
      voyage: str(pick(fields, "voyage", "voyage_no")),
      flight_no: str(pick(fields, "flight_no", "flight_number")),
      etd: str(pick(fields, "etd", "departure_date", "sailing_date", "shipped_on_board")),
      eta: str(pick(fields, "eta", "arrival_date", "estimated_arrival")),
      incoterm: str(pick(fields, "incoterm", "incoterms", "delivery_terms")),
      freight_terms: str(pick(fields, "freight_terms", "prepaid_collect", "payment_terms")),
    },
    totals: {
      gross_kg: num(pick(fields, "total_gross_kg", "gross_weight_kg", "gross_kg")),
      net_kg: num(pick(fields, "total_net_kg", "net_weight_kg", "net_kg")),
      volume_cbm: num(pick(fields, "total_volume_cbm", "volume_cbm", "measurement_cbm")),
      packages: num(pick(fields, "total_packages", "packages", "no_of_packages")),
      chargeable_kg: num(pick(fields, "chargeable_weight_kg", "chargeable_kg")),
      invoice_total: num(pick(fields, "total_amount", "invoice_total", "grand_total", "total")),
      currency: str(pick(fields, "currency", "invoice_currency")),
    },
    standards: standardsProfile(input.doc_type, fields),
    extracted_fields: fields,
    created_at: input.created_at,
    updated_at: input.updated_at,
  };
}

// ---------------------------------------------------------------------------
// Shipment mapping
// ---------------------------------------------------------------------------

export interface ShipmentInput {
  id: string;
  ref: string | null;
  bl_number: string | null;
  house_bl_number?: string | null;
  bill_level?: string | null;
  master_shipment_id?: string | null;
  created_at: string;
}

export interface DiscrepancyInput {
  id: string;
  severity: string;
  field: string;
  message: string | null;
  value_a: string | null;
  value_b: string | null;
  doc_a: string | null;
  doc_b: string | null;
  questioned_amount?: number | null;
  questioned_currency?: string | null;
  resolved: boolean;
  resolution_status?: string | null;
  resolution_note?: string | null;
}

const DISCLAIMER =
  "Extracted and reviewed data supplied for operational assistance. Printed legal values are carried through unmodified. " +
  "GainingDocx does not issue transport documents, confirm cargo release or make regulated customs decisions — confirm against the original document before filing, release or payment.";

export function canonicalShipment(
  shipment: ShipmentInput,
  documents: DocumentInput[],
  discrepancies: DiscrepancyInput[] = []
): CanonicalShipment {
  const mapped = documents.map(canonicalDocument);
  const open = discrepancies.filter((item) => !item.resolved);
  const openCritical = open.filter((item) => item.severity === "red").length;

  // Parties, locations and containers are shipment-level facts printed across
  // several documents. Taking the first non-null occurrence in document order
  // is deliberate: a receiving system needs one shipper, and where documents
  // disagree that disagreement is already reported as a discrepancy rather
  // than silently resolved here.
  const parties = new Map<string, CanonicalParty>();
  const locations = new Map<string, CanonicalLocation>();
  const containers = new Map<string, CanonicalContainer>();
  for (const document of mapped) {
    for (const party of document.parties) if (!parties.has(party.role)) parties.set(party.role, party);
    for (const location of document.locations) if (!locations.has(location.role)) locations.set(location.role, location);
    for (const container of document.containers) {
      if (container.container_no && !containers.has(container.container_no)) containers.set(container.container_no, container);
    }
  }

  const mode = mapped.find((document) => document.transport.mode !== "unspecified")?.transport.mode ?? "unspecified";

  return {
    schema: "gainingdocx.canonical.shipment",
    schema_version: CANONICAL_MODEL_VERSION,
    canonical_schema_version: CANONICAL_SCHEMA_VERSION,
    generated_at: new Date().toISOString(),
    shipment: {
      id: shipment.id,
      reference: shipment.ref,
      bl_number: shipment.bl_number,
      house_bl_number: shipment.house_bl_number ?? null,
      bill_level: shipment.bill_level ?? "standalone",
      master_shipment_id: shipment.master_shipment_id ?? null,
      mode,
      created_at: shipment.created_at,
    },
    parties: [...parties.values()],
    locations: [...locations.values()],
    containers: [...containers.values()],
    documents: mapped,
    discrepancies: discrepancies.map((item) => ({
      id: item.id,
      severity: item.severity === "red" ? "red" : "amber",
      field: item.field,
      message: item.message,
      value_a: item.value_a,
      value_b: item.value_b,
      document_a: item.doc_a,
      document_b: item.doc_b,
      questioned_amount: item.questioned_amount ?? null,
      questioned_currency: item.questioned_currency ?? null,
      resolved: item.resolved,
      resolution_status: item.resolution_status ?? null,
      resolution_note: item.resolution_note ?? null,
    })),
    summary: {
      document_count: mapped.length,
      open_critical: openCritical,
      open_warnings: open.length - openCritical,
      // The single flag a connector checks before writing to a customer's TMS
      // or accounting system. Pushing a shipment with an unresolved critical
      // discrepancy is the failure mode this product exists to prevent.
      clear_for_write_back: openCritical === 0 && mapped.length > 0,
    },
    disclaimer: DISCLAIMER,
  };
}
