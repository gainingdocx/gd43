// Extraction schema v2 (BUILD_SPEC §M4). The model fills ONE superset
// "fields" object (single-call detect+extract); normalizeModelOutput()
// coerces it into the exact per-type shapes from ./shared.

import {
  DETECTED_TYPES,
  type BillOfLadingFields,
  type ArrivalNoticeFields,
  type BookingConfirmationFields,
  type CommercialInvoiceFields,
  type ContainerRow,
  type DetectedType,
  type Dims,
  type LineItem,
  type Meta,
  type NormalizedExtraction,
  type PackingListFields,
  type Party,
  type PortRef,
} from "./shared";

export { DETECTED_TYPES } from "./shared";
export type { NormalizedExtraction } from "./shared";

// ---------------------------------------------------------------------------
// Model-facing JSON Schema (superset of all three document types).
// ---------------------------------------------------------------------------

const str = { type: ["string", "null"] } as const;
const num = { type: ["number", "null"] } as const;
const bool = { type: ["boolean", "null"] } as const;

const partySchema = {
  type: ["object", "null"],
  properties: { name: str, address: str, city: str, country: str, tax_id: str },
} as const;

const portSchema = {
  type: ["object", "null"],
  properties: { name: str, unlocode: str },
} as const;

export const EXTRACTION_JSON_SCHEMA = {
  name: "shipping_document_extraction",
  schema: {
    type: "object",
    required: ["detected_type", "fields"],
    properties: {
      detected_type: { type: "string", enum: DETECTED_TYPES },
      confidence_flags: { type: "array", items: { type: "string" } },
      page_refs: {
        type: "object",
        description:
          "For each filled top-level field: the 1-based page number it was read from.",
        additionalProperties: { type: "integer" },
      },
      fields: {
        type: "object",
        properties: {
          // identifiers
          bl_number: str,
          scac: str,
          carrier_name: str,
          invoice_no: str,
          invoice_date: str,
          pl_no: str,
          po_no: str,
          date: str,
          invoice_ref: str,
          notice_no: str,
          booking_no: str,
          service_contract_no: str,
          // parties
          shipper: partySchema,
          consignee: {
            type: ["object", "null"],
            properties: { ...partySchema.properties, to_order: bool },
          },
          notify: partySchema,
          seller: partySchema,
          buyer: partySchema,
          agent: partySchema,
          // voyage
          vessel_name: str,
          imo_number: str,
          voyage_no: str,
          port_of_load: portSchema,
          port_of_discharge: portSchema,
          place_of_receipt: str,
          place_of_delivery: str,
          terminal: str,
          // dates (copied exactly as printed)
          issue_date: str,
          issue_place: str,
          shipped_on_board_date: str,
          eta: str,
          etd: str,
          availability_date: str,
          last_free_day: str,
          documentation_cutoff: str,
          vgm_cutoff: str,
          cargo_cutoff: str,
          si_cutoff: str,
          // commercial
          freight_terms: { type: ["string", "null"], enum: ["prepaid", "collect", null] },
          incoterm: str,
          currency: str,
          subtotal: num,
          freight_charge: num,
          insurance: num,
          total_amount: num,
          payment_terms: str,
          lc_number: str,
          country_of_origin: str,
          bank_details: str,
          pickup_reference: str,
          freight_due: num,
          terminal_charges: num,
          other_charges: num,
          total_charges: num,
          payment_instructions: str,
          commodity: str,
          special_instructions: str,
          // totals as printed (never computed)
          total_packages: num,
          total_cartons: num,
          total_gross_kg: num,
          total_net_kg: num,
          total_volume_cbm: num,
          // B/L specifics
          originals_count: num,
          bl_type: {
            type: ["string", "null"],
            enum: ["original", "seaway", "telex", null],
          },
          clauses: { type: "array", items: { type: "string" } },
          containers: {
            type: "array",
            items: {
              type: "object",
              properties: {
                container_no: str,
                seal_no: str,
                iso_type: str,
                packages: num,
                package_type: str,
                gross_kg: num,
                tare_kg: num,
                volume_cbm: num,
              },
            },
          },
          equipment: {
            type: "array",
            items: {
              type: "object",
              properties: {
                container_no: str, seal_no: str, iso_type: str, packages: num,
                package_type: str, gross_kg: num, tare_kg: num, volume_cbm: num,
              },
            },
          },
          container_refs: { type: "array", items: { type: "string" } },
          line_items: {
            type: "array",
            items: {
              type: "object",
              properties: {
                description: str,
                hs_code: str,
                marks: str,
                packages: num,
                package_type: str,
                net_kg: num,
                gross_kg: num,
                volume_cbm: num,
                unit_price: num,
                amount: num,
                currency: str,
                cartons: num,
                dims: {
                  type: ["object", "null"],
                  properties: { l: num, w: num, h: num, unit: str },
                },
              },
            },
          },
        },
      },
    },
  },
} as const;

// ---------------------------------------------------------------------------
// Coercion helpers: the model mostly follows the schema, but strings for
// numbers ("36,430.00"), stray keys and wrong enum casing must never leak
// into documents.fields.
// ---------------------------------------------------------------------------

type Raw = Record<string, unknown>;

function isObj(v: unknown): v is Raw {
  return v !== null && typeof v === "object" && !Array.isArray(v);
}

function cStr(v: unknown): string | null {
  if (typeof v === "string") {
    const t = v.trim();
    return t === "" ? null : t;
  }
  if (typeof v === "number" && Number.isFinite(v)) return String(v);
  return null;
}

function cNum(v: unknown): number | null {
  if (typeof v === "number" && Number.isFinite(v)) return v;
  if (typeof v === "string") {
    const cleaned = v.replace(/[, ]/g, "").replace(/[A-Za-z]+$/g, "").trim();
    if (cleaned === "" || !/^-?\d*\.?\d+$/.test(cleaned)) return null;
    const n = Number(cleaned);
    return Number.isFinite(n) ? n : null;
  }
  return null;
}

function cBool(v: unknown): boolean | null {
  return typeof v === "boolean" ? v : null;
}

function cEnum<T extends string>(v: unknown, allowed: readonly T[]): T | null {
  if (typeof v !== "string") return null;
  const lower = v.trim().toLowerCase();
  return (allowed as readonly string[]).includes(lower) ? (lower as T) : null;
}

function cParty(v: unknown): Party | null {
  if (!isObj(v)) return null;
  const p: Party = {
    name: cStr(v.name),
    address: cStr(v.address),
    city: cStr(v.city),
    country: cStr(v.country),
    tax_id: cStr(v.tax_id),
  };
  return Object.values(p).every((x) => x === null) ? null : p;
}

function cConsignee(v: unknown): (Party & { to_order: boolean | null }) | null {
  const p = cParty(v);
  if (!p) return null;
  return { ...p, to_order: isObj(v) ? cBool(v.to_order) : null };
}

function cPort(v: unknown): PortRef | null {
  if (isObj(v)) {
    const p: PortRef = { name: cStr(v.name), unlocode: cStr(v.unlocode) };
    return p.name === null && p.unlocode === null ? null : p;
  }
  // Model occasionally returns a bare string port name.
  const name = cStr(v);
  return name ? { name, unlocode: null } : null;
}

function cDims(v: unknown): Dims | null {
  if (!isObj(v)) return null;
  const d: Dims = {
    l: cNum(v.l),
    w: cNum(v.w),
    h: cNum(v.h),
    unit: cStr(v.unit),
  };
  return d.l === null && d.w === null && d.h === null ? null : d;
}

function cLineItem(v: unknown): LineItem | null {
  if (!isObj(v)) return null;
  return {
    description: cStr(v.description),
    hs_code: cStr(v.hs_code),
    marks: cStr(v.marks),
    packages: cNum(v.packages),
    package_type: cStr(v.package_type),
    net_kg: cNum(v.net_kg),
    gross_kg: cNum(v.gross_kg),
    volume_cbm: cNum(v.volume_cbm),
    unit_price: cNum(v.unit_price),
    amount: cNum(v.amount),
    currency: cStr(v.currency),
    cartons: cNum(v.cartons),
    dims: cDims(v.dims),
  };
}

function cContainer(v: unknown): ContainerRow | null {
  if (!isObj(v)) return null;
  let containerNo = cStr(v.container_no);
  let sealNo = cStr(v.seal_no);
  // Vision models sometimes merge adjacent "Container / Seal" table cells.
  // Repair only the unambiguous ISO-number + separator + seal form so the
  // deterministic container validator receives the actual container number.
  if (containerNo && !sealNo) {
    const combined = containerNo.match(/^\s*([A-Z]{4}[\s-]*\d{7})\s*[\/:|]\s*(\S(?:.*\S)?)\s*$/i);
    if (combined) {
      containerNo = combined[1];
      sealNo = combined[2];
    }
  }
  const row: ContainerRow = {
    container_no: containerNo,
    seal_no: sealNo,
    iso_type: cStr(v.iso_type),
    packages: cNum(v.packages),
    package_type: cStr(v.package_type),
    gross_kg: cNum(v.gross_kg),
    tare_kg: cNum(v.tare_kg),
    volume_cbm: cNum(v.volume_cbm),
  };
  return Object.values(row).every((x) => x === null) ? null : row;
}

function cArray<T>(v: unknown, item: (x: unknown) => T | null): T[] {
  return Array.isArray(v)
    ? v.map(item).filter((x): x is T => x !== null)
    : [];
}

function cStrArray(v: unknown): string[] {
  return cArray(v, cStr);
}

/** Strict variant: keeps only real strings (used for field-name lists). */
function cNameArray(v: unknown): string[] {
  return Array.isArray(v)
    ? v.filter((x): x is string => typeof x === "string" && x !== "")
    : [];
}

function cPageRefs(v: unknown): Record<string, number> {
  if (!isObj(v)) return {};
  const out: Record<string, number> = {};
  for (const [key, val] of Object.entries(v)) {
    const n = cNum(val);
    if (n !== null && Number.isInteger(n) && n >= 1) out[key] = n;
  }
  return out;
}

// ---------------------------------------------------------------------------
// Normalization: raw model output -> exact per-type shape.
// ---------------------------------------------------------------------------

export function normalizeModelOutput(
  raw: unknown,
  promptVersion: string
): NormalizedExtraction {
  if (!isObj(raw)) throw new Error("extraction is not an object");
  const f = isObj(raw.fields) ? raw.fields : null;
  if (!f) throw new Error("extraction has no fields object");

  const detected_type: DetectedType = DETECTED_TYPES.includes(
    raw.detected_type as DetectedType
  )
    ? (raw.detected_type as DetectedType)
    : "other";

  const _meta: Meta = {
    detected_type,
    confidence_flags: cNameArray(raw.confidence_flags),
    page_refs: cPageRefs(raw.page_refs),
    prompt_version: promptVersion,
  };

  switch (detected_type) {
    case "bill_of_lading":
    case "sea_waybill": {
      const fields: BillOfLadingFields = {
        bl_number: cStr(f.bl_number),
        scac: cStr(f.scac),
        carrier_name: cStr(f.carrier_name),
        shipper: cParty(f.shipper),
        consignee: cConsignee(f.consignee),
        notify: cParty(f.notify),
        vessel_name: cStr(f.vessel_name),
        imo_number: cStr(f.imo_number),
        voyage_no: cStr(f.voyage_no),
        port_of_load: cPort(f.port_of_load),
        port_of_discharge: cPort(f.port_of_discharge),
        place_of_receipt: cStr(f.place_of_receipt),
        place_of_delivery: cStr(f.place_of_delivery),
        shipped_on_board_date: cStr(f.shipped_on_board_date),
        issue_date: cStr(f.issue_date),
        issue_place: cStr(f.issue_place),
        freight_terms: cEnum(f.freight_terms, ["prepaid", "collect"] as const),
        incoterm: cStr(f.incoterm),
        containers: cArray(f.containers, cContainer),
        cargo: cArray(f.cargo ?? f.line_items, cLineItem),
        total_packages: cNum(f.total_packages),
        total_gross_kg: cNum(f.total_gross_kg),
        total_volume_cbm: cNum(f.total_volume_cbm),
        originals_count: cNum(f.originals_count),
        bl_type: cEnum(f.bl_type, ["original", "seaway", "telex"] as const),
        clauses: cStrArray(f.clauses),
        _meta,
      };
      return { detected_type, fields };
    }
    case "commercial_invoice": {
      const fields: CommercialInvoiceFields = {
        invoice_no: cStr(f.invoice_no),
        invoice_date: cStr(f.invoice_date),
        po_no: cStr(f.po_no),
        seller: cParty(f.seller ?? f.shipper),
        buyer: cParty(f.buyer ?? f.consignee),
        incoterm: cStr(f.incoterm),
        currency: cStr(f.currency),
        line_items: cArray(f.line_items, cLineItem),
        subtotal: cNum(f.subtotal),
        freight_charge: cNum(f.freight_charge),
        insurance: cNum(f.insurance),
        total_amount: cNum(f.total_amount),
        payment_terms: cStr(f.payment_terms),
        lc_number: cStr(f.lc_number),
        country_of_origin: cStr(f.country_of_origin),
        bank_details: cStr(f.bank_details),
        _meta,
      };
      return { detected_type, fields };
    }
    case "packing_list": {
      const fields: PackingListFields = {
        pl_no: cStr(f.pl_no),
        date: cStr(f.date),
        invoice_ref: cStr(f.invoice_ref),
        po_no: cStr(f.po_no),
        seller: cParty(f.seller ?? f.shipper),
        buyer: cParty(f.buyer ?? f.consignee),
        line_items: cArray(f.line_items, cLineItem),
        total_cartons: cNum(f.total_cartons ?? f.total_packages),
        total_net_kg: cNum(f.total_net_kg),
        total_gross_kg: cNum(f.total_gross_kg),
        total_volume_cbm: cNum(f.total_volume_cbm),
        container_refs: cStrArray(f.container_refs),
        _meta,
      };
      return { detected_type, fields };
    }
    case "arrival_notice": {
      const fields: ArrivalNoticeFields = {
        notice_no: cStr(f.notice_no), issue_date: cStr(f.issue_date), bl_number: cStr(f.bl_number),
        booking_no: cStr(f.booking_no), carrier_name: cStr(f.carrier_name), agent: cParty(f.agent),
        consignee: cParty(f.consignee), notify: cParty(f.notify), vessel_name: cStr(f.vessel_name),
        voyage_no: cStr(f.voyage_no), port_of_discharge: cPort(f.port_of_discharge), terminal: cStr(f.terminal),
        eta: cStr(f.eta), availability_date: cStr(f.availability_date), last_free_day: cStr(f.last_free_day),
        pickup_reference: cStr(f.pickup_reference), currency: cStr(f.currency), freight_due: cNum(f.freight_due),
        terminal_charges: cNum(f.terminal_charges), other_charges: cNum(f.other_charges), total_charges: cNum(f.total_charges),
        payment_instructions: cStr(f.payment_instructions), containers: cArray(f.containers, cContainer), _meta,
      };
      return { detected_type, fields };
    }
    case "booking_confirmation": {
      const fields: BookingConfirmationFields = {
        booking_no: cStr(f.booking_no), carrier_name: cStr(f.carrier_name), shipper: cParty(f.shipper),
        service_contract_no: cStr(f.service_contract_no), vessel_name: cStr(f.vessel_name), voyage_no: cStr(f.voyage_no),
        port_of_load: cPort(f.port_of_load), port_of_discharge: cPort(f.port_of_discharge),
        place_of_receipt: cStr(f.place_of_receipt), place_of_delivery: cStr(f.place_of_delivery),
        etd: cStr(f.etd), eta: cStr(f.eta), documentation_cutoff: cStr(f.documentation_cutoff),
        vgm_cutoff: cStr(f.vgm_cutoff), cargo_cutoff: cStr(f.cargo_cutoff), si_cutoff: cStr(f.si_cutoff),
        equipment: cArray(f.equipment ?? f.containers, cContainer), commodity: cStr(f.commodity),
        total_packages: cNum(f.total_packages), total_gross_kg: cNum(f.total_gross_kg),
        special_instructions: cStr(f.special_instructions), _meta,
      };
      return { detected_type, fields };
    }
    default:
      return { detected_type: "other", fields: { raw: f, _meta } };
  }
}

/** Container rows to persist for a document (B/L only). */
export function containersOf(extraction: NormalizedExtraction): ContainerRow[] {
  if (extraction.detected_type === "bill_of_lading" || extraction.detected_type === "sea_waybill" || extraction.detected_type === "arrival_notice") return extraction.fields.containers;
  if (extraction.detected_type === "booking_confirmation") return extraction.fields.equipment;
  return [];
}

// ---------------------------------------------------------------------------
// Escalation gate (spec §M3 step 4): ≥3 empty critical fields.
// ---------------------------------------------------------------------------

export function countEmptyCriticalFields(
  extraction: NormalizedExtraction
): number {
  const empty = (v: unknown) =>
    v === null || v === "" || (Array.isArray(v) && v.length === 0);

  switch (extraction.detected_type) {
    case "bill_of_lading":
    case "sea_waybill": {
      const f = extraction.fields;
      return [
        f.bl_number,
        f.shipper?.name ?? null,
        f.consignee?.name ?? null,
        f.port_of_load?.name ?? null,
        f.port_of_discharge?.name ?? null,
        f.containers,
      ].filter(empty).length;
    }
    case "commercial_invoice": {
      const f = extraction.fields;
      return [
        f.invoice_no,
        f.seller?.name ?? null,
        f.buyer?.name ?? null,
        f.currency,
        f.total_amount,
        f.line_items,
      ].filter(empty).length;
    }
    case "packing_list": {
      const f = extraction.fields;
      return [
        f.seller?.name ?? null,
        f.buyer?.name ?? null,
        f.total_cartons,
        f.total_gross_kg,
        f.line_items,
      ].filter(empty).length;
    }
    case "arrival_notice": {
      const f = extraction.fields;
      return [f.bl_number, f.carrier_name, f.consignee?.name ?? null, f.vessel_name, f.port_of_discharge?.name ?? null, f.eta].filter(empty).length;
    }
    case "booking_confirmation": {
      const f = extraction.fields;
      return [f.booking_no, f.carrier_name, f.port_of_load?.name ?? null, f.port_of_discharge?.name ?? null, f.etd, f.equipment].filter(empty).length;
    }
    default:
      return 0;
  }
}
