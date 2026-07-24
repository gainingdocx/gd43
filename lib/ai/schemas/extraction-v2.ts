// Extraction schema v2 (BUILD_SPEC §M4). The model fills ONE superset
// "fields" object (single-call detect+extract); normalizeModelOutput()
// coerces it into the exact per-type shapes from ./shared.

import {
  DETECTED_TYPES,
  type BillOfLadingFields,
  type ArrivalNoticeFields,
  type AirWaybillFields,
  type BookingConfirmationFields,
  type CommercialInvoiceFields,
  type PurchaseOrderFields,
  type FreightInvoiceFields,
  type GoodsReceiptFields,
  type ChargeLine,
  type ContainerRow,
  type DetectedType,
  type Dims,
  type DangerousGoodsItem,
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
  properties: { name: str, address: str, city: str, postal_code: str, country: str, tax_id: str },
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
      source_languages: {
        type: "array",
        items: { type: "string" },
        description: "ISO 639-1 language codes visibly used in the document.",
      },
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
          master_bl_number: str,
          house_bl_number: str,
          shipper_reference: str,
          export_references: { type: "array", items: { type: "string" } },
          customs_reference: str,
          purchase_order_refs: { type: "array", items: { type: "string" } },
          scac: str,
          carrier_name: str,
          invoice_no: str,
          invoice_date: str,
          due_date: str,
          carrier_invoice_ref: str,
          revision_no: str,
          contract_no: str,
          po_number: str,
          po_date: str,
          receipt_no: str,
          receipt_date: str,
          pl_no: str,
          po_no: str,
          date: str,
          invoice_ref: str,
          notice_no: str,
          booking_no: str,
          service_contract_no: str,
          bl_numbers: { type: "array", items: { type: "string" } },
          booking_refs: { type: "array", items: { type: "string" } },
          shipment_refs: { type: "array", items: { type: "string" } },
          delivery_note_refs: { type: "array", items: { type: "string" } },
          awb_number: str,
          master_awb_number: str,
          house_awb_number: str,
          airline_name: str,
          airline_prefix: str,
          dangerous_goods: {
            type: "array",
            items: {
              type: "object",
              properties: {
                un_number: str,
                proper_shipping_name: str,
                hazard_class: str,
                subsidiary_risk: str,
                packing_group: {
                  type: ["string", "null"],
                  enum: ["I", "II", "III", null],
                },
                marine_pollutant: bool,
                flash_point_c: num,
                emergency_contact: str,
              },
            },
          },
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
          carrier: partySchema,
          bill_to: partySchema,
          ship_to: partySchema,
          remit_to: partySchema,
          supplier: partySchema,
          receiver: partySchema,
          issuing_carrier_agent: partySchema,
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
          requested_delivery_date: str,
          promised_delivery_date: str,
          service_period_start: str,
          service_period_end: str,
          flight_date: str,
          // commercial
          freight_terms: { type: ["string", "null"], enum: ["prepaid", "collect", null] },
          incoterm: str,
          currency: str,
          subtotal: num,
          discount_amount: num,
          freight_charge: num,
          freight_amount: num,
          insurance: num,
          tax_amount: num,
          total_amount: num,
          amount_due: num,
          amount_paid: num,
          exchange_rate: num,
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
          shipping_method: str,
          approval_status: str,
          approved_by: str,
          notes: str,
          payment_reference: str,
          delivery_location: str,
          received_by: str,
          origin_airport: str,
          destination_airport: str,
          flight_no: str,
          charge_code: str,
          declared_value_carriage: str,
          declared_value_customs: str,
          insurance_amount: num,
          handling_information: str,
          // totals as printed (never computed)
          total_packages: num,
          total_cartons: num,
          total_gross_kg: num,
          total_net_kg: num,
          total_volume_cbm: num,
          total_received_quantity: num,
          total_accepted_quantity: num,
          total_rejected_quantity: num,
          total_pieces: num,
          total_chargeable_kg: num,
          total_prepaid: num,
          total_collect: num,
          // B/L specifics
          originals_count: num,
          bl_type: {
            type: ["string", "null"],
            enum: ["original", "seaway", "telex", null],
          },
          bl_level: {
            type: ["string", "null"],
            enum: ["master", "house", "unknown", null],
          },
          awb_type: {
            type: ["string", "null"],
            enum: ["master", "house", "unknown", null],
          },
          clauses: { type: "array", items: { type: "string" } },
          cargo_raw_text: str,
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
          charges: {
            type: "array",
            items: {
              type: "object",
              properties: {
                line_no: str, charge_code: str, description: str,
                container_no: str, bl_number: str, quantity: num, uom: str,
                rate: num, amount: num, currency: str, tax_rate: num,
                tax_amount: num,
                prepaid_collect: { type: ["string", "null"], enum: ["prepaid", "collect", null] },
              },
            },
          },
          line_items: {
            type: "array",
            items: {
              type: "object",
              properties: {
                line_no: str,
                product_code: str,
                buyer_product_code: str,
                seller_product_code: str,
                description: str,
                hs_code: str,
                marks: str,
                packages: num,
                package_type: str,
                quantity: num,
                uom: str,
                net_kg: num,
                gross_kg: num,
                volume_cbm: num,
                unit_price: num,
                amount: num,
                currency: str,
                tax_rate: num,
                tax_amount: num,
                discount_amount: num,
                country_of_origin: str,
                lot_no: str,
                cartons: num,
                dims: {
                  type: ["object", "null"],
                  properties: { l: num, w: num, h: num, unit: str },
                },
                chargeable_kg: num,
                rate_class: str,
                rate_charge: num,
                commodity_item_no: str,
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
    // Accept a printed numeric value followed by one or more unit words, e.g.
    // "15,000.000 NET KGS" or "20.000 CBM", without fishing digits out of
    // identifiers or descriptive text.
    const match = v.trim().match(
      /^(-?\d(?:[\d, ]*\d)?(?:\.\d+)?)(?:\s*[A-Za-z][A-Za-z0-9./-]*(?:\s+[A-Za-z0-9./-]+)*)?$/
    );
    if (!match) return null;
    const cleaned = match[1].replace(/[, ]/g, "");
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
    postal_code: cStr(v.postal_code),
    country: cStr(v.country),
    tax_id: cStr(v.tax_id),
  };
  return Object.values(p).every((x) => x === null) ? null : p;
}

function cConsignee(v: unknown): (Party & { to_order: boolean | null }) | null {
  const p = cParty(v);
  if (!p) return null;
  const explicit = isObj(v) ? cBool(v.to_order) : null;
  const toOrder = explicit ?? (p.name && /\bTO\s+(?:THE\s+)?ORDER\b/i.test(p.name) ? true : null);
  return { ...p, to_order: toOrder };
}

function locationMatches(a: string | null | undefined, b: string | null | undefined): boolean {
  if (!a || !b) return false;
  const normalize = (value: string) => value.toUpperCase().replace(/[^A-Z0-9]/g, "");
  const left = normalize(a);
  const right = normalize(b);
  return left.length >= 4 && right.length >= 4 &&
    (left === right || left.startsWith(right) || right.startsWith(left));
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
    line_no: cStr(v.line_no),
    product_code: cStr(v.product_code),
    buyer_product_code: cStr(v.buyer_product_code),
    seller_product_code: cStr(v.seller_product_code),
    description: cStr(v.description),
    hs_code: cStr(v.hs_code),
    marks: cStr(v.marks),
    packages: cNum(v.packages),
    package_type: cStr(v.package_type),
    quantity: cNum(v.quantity),
    uom: cStr(v.uom),
    net_kg: cNum(v.net_kg),
    gross_kg: cNum(v.gross_kg),
    volume_cbm: cNum(v.volume_cbm),
    unit_price: cNum(v.unit_price),
    amount: cNum(v.amount),
    currency: cStr(v.currency),
    tax_rate: cNum(v.tax_rate),
    tax_amount: cNum(v.tax_amount),
    discount_amount: cNum(v.discount_amount),
    country_of_origin: cStr(v.country_of_origin),
    lot_no: cStr(v.lot_no),
    cartons: cNum(v.cartons),
    dims: cDims(v.dims),
    chargeable_kg: cNum(v.chargeable_kg),
    rate_class: cStr(v.rate_class),
    rate_charge: cNum(v.rate_charge),
    commodity_item_no: cStr(v.commodity_item_no),
  };
}

function cCharge(v: unknown): ChargeLine | null {
  if (!isObj(v)) return null;
  const row: ChargeLine = {
    line_no: cStr(v.line_no), charge_code: cStr(v.charge_code),
    description: cStr(v.description), container_no: cStr(v.container_no),
    bl_number: cStr(v.bl_number), quantity: cNum(v.quantity), uom: cStr(v.uom),
    rate: cNum(v.rate), amount: cNum(v.amount), currency: cStr(v.currency),
    tax_rate: cNum(v.tax_rate), tax_amount: cNum(v.tax_amount),
    prepaid_collect: cEnum(v.prepaid_collect, ["prepaid", "collect"] as const),
  };
  return Object.values(row).every((x) => x === null) ? null : row;
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

function cDangerousGoods(v: unknown): DangerousGoodsItem | null {
  if (!isObj(v)) return null;
  const printedUn = cStr(v.un_number);
  const digits = printedUn?.replace(/\D/g, "") ?? "";
  const row: DangerousGoodsItem = {
    un_number: digits.length === 4 ? `UN${digits}` : printedUn,
    proper_shipping_name: cStr(v.proper_shipping_name),
    hazard_class: cStr(v.hazard_class),
    subsidiary_risk: cStr(v.subsidiary_risk),
    packing_group: cEnum(v.packing_group, ["I", "II", "III"] as const),
    marine_pollutant: typeof v.marine_pollutant === "boolean" ? v.marine_pollutant : null,
    flash_point_c: cNum(v.flash_point_c),
    emergency_contact: cStr(v.emergency_contact),
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
    source_languages: cNameArray(raw.source_languages).map((language) => language.toLowerCase()),
  };

  switch (detected_type) {
    case "bill_of_lading":
    case "sea_waybill": {
      const fields: BillOfLadingFields = {
        bl_number: cStr(f.bl_number),
        bl_level: cEnum(f.bl_level, ["master", "house", "unknown"] as const),
        master_bl_number: cStr(f.master_bl_number),
        house_bl_number: cStr(f.house_bl_number),
        booking_no: cStr(f.booking_no),
        shipper_reference: cStr(f.shipper_reference),
        export_references: cStrArray(f.export_references),
        customs_reference: cStr(f.customs_reference),
        purchase_order_refs: cStrArray(f.purchase_order_refs),
        lc_number: cStr(f.lc_number),
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
        cargo_raw_text: cStr(f.cargo_raw_text),
        total_packages: cNum(f.total_packages),
        total_net_kg: cNum(f.total_net_kg),
        total_gross_kg: cNum(f.total_gross_kg),
        total_volume_cbm: cNum(f.total_volume_cbm),
        originals_count: cNum(f.originals_count),
        bl_type: cEnum(f.bl_type, ["original", "seaway", "telex"] as const),
        clauses: cStrArray(f.clauses),
        dangerous_goods: cArray(f.dangerous_goods, cDangerousGoods),
        _meta,
      };
      // Models occasionally leave an explicitly printed L/C reference inside
      // a cargo description. Promote only a labelled value; never infer one.
      if (!fields.lc_number) {
        const cargoText = [fields.cargo_raw_text ?? "", ...fields.cargo
          .map((line) => line.description ?? "")
        ].join("\n");
        const labelledLc = cargoText.match(/\bL\s*\/?\s*C\s*(?:NO\.?|NUMBER)?\s*[:.#-]?\s*([A-Z0-9][A-Z0-9./-]{3,})/i);
        if (labelledLc) fields.lc_number = labelledLc[1];
      }
      // Remove a duplicated parent declaration when the model returned both
      // the printed grand-total row and its complete child breakdown. The
      // total remains in total_packages; this prevents double counting.
      if (fields.cargo.length >= 3) {
        const parentIndex = fields.cargo.findIndex((candidate, candidateIndex) => {
          const parentCount = candidate.packages ?? candidate.cartons;
          if (parentCount === null) return false;
          const childCounts = fields.cargo
            .filter((_, index) => index !== candidateIndex)
            .map((line) => line.packages ?? line.cartons);
          if (!childCounts.every((value): value is number => value !== null) ||
              childCounts.reduce((sum, value) => sum + value, 0) !== parentCount) return false;
          return fields.total_packages === parentCount || fields.total_packages === parentCount * 2;
        });
        if (parentIndex >= 0) {
          const parentCount = fields.cargo[parentIndex].packages ?? fields.cargo[parentIndex].cartons;
          fields.cargo = fields.cargo.filter((_, index) => index !== parentIndex);
          if (parentCount !== null && fields.total_packages !== parentCount) {
            fields.total_packages = parentCount;
            if (!fields._meta.confidence_flags.includes("total_packages:removed_parent_double_count")) {
              fields._meta.confidence_flags.push("total_packages:removed_parent_double_count");
            }
          }
        }
      }
      // When the raw cargo block preserves an unambiguous parent count plus a
      // complete sequence of child counts, prefer those printed child values
      // over visually confused row digits (for example 200 misread as 250).
      if (fields.total_packages !== null && fields.cargo_raw_text && fields.cargo.length >= 2) {
        const printedCounts = [...fields.cargo_raw_text.matchAll(/\b(\d[\d,]*)\s+(?:CARTONS?|CASES?|BAGS?|PALLETS?|PACKAGES?|PCS)\b/gi)]
          .map((match) => Number(match[1].replace(/,/g, "")))
          .filter(Number.isFinite);
        const withoutParent = printedCounts.filter((value, index) =>
          !(value === fields.total_packages && printedCounts.indexOf(value) === index));
        if (withoutParent.length === fields.cargo.length &&
            withoutParent.reduce((sum, value) => sum + value, 0) === fields.total_packages) {
          fields.cargo = fields.cargo.map((line, index) => ({
            ...line,
            packages: withoutParent[index],
            cartons: line.cartons === null || line.cartons === line.packages ? withoutParent[index] : line.cartons,
          }));
        }
      }
      // A noisy OCR transcription can corrupt a repeated grand total while
      // the structured aggregate cargo row remains internally corroborated by
      // its printed description and physical totals. Prefer that stronger
      // evidence only when both signals agree; otherwise retain the printed
      // total and route the contradiction to review.
      if (fields.total_packages !== null && fields.cargo.length === 1) {
        const aggregate = fields.cargo[0];
        const cargoPackages = aggregate.packages ?? aggregate.cartons;
        const describedPackages = cargoPackages !== null && new RegExp(
          `\\b${cargoPackages.toLocaleString("en-US").replace(/,/g, "[, ]?")}\\s+(?:CARTONS?|CASES?|BAGS?|PALLETS?|PACKAGES?|PCS)\\b`,
          "i"
        ).test(aggregate.description ?? "");
        const physicalTotalMatches =
          (aggregate.net_kg !== null && aggregate.net_kg === fields.total_net_kg) ||
          (aggregate.gross_kg !== null && aggregate.gross_kg === fields.total_gross_kg) ||
          (aggregate.volume_cbm !== null && aggregate.volume_cbm === fields.total_volume_cbm);
        if (cargoPackages !== null && cargoPackages !== fields.total_packages && describedPackages && physicalTotalMatches) {
          fields.total_packages = cargoPackages;
          if (!fields._meta.confidence_flags.includes("total_packages:reconciled_to_cargo")) {
            fields._meta.confidence_flags.push("total_packages:reconciled_to_cargo");
          }
        }
      }
      // Correct the characteristic origin/destination inversion only when two
      // independent party-location signals agree on the exact opposite ports.
      const destinationCity = fields.notify?.city ?? fields.consignee?.city;
      if (
        locationMatches(fields.shipper?.city, fields.port_of_discharge?.name) &&
        locationMatches(destinationCity, fields.port_of_load?.name) &&
        !locationMatches(fields.shipper?.city, fields.port_of_load?.name) &&
        !locationMatches(destinationCity, fields.port_of_discharge?.name)
      ) {
        [fields.port_of_load, fields.port_of_discharge] = [fields.port_of_discharge, fields.port_of_load];
      }
      // Repair the common four-column routing-grid shift only with destination
      // party corroboration: POD copied into Place of Receipt while Place of
      // Delivery was left empty.
      if (!fields.place_of_delivery &&
          locationMatches(fields.place_of_receipt, fields.port_of_discharge?.name) &&
          locationMatches(destinationCity, fields.port_of_discharge?.name) &&
          !locationMatches(fields.shipper?.city, fields.place_of_receipt)) {
        fields.place_of_delivery = fields.place_of_receipt;
        fields.place_of_receipt = null;
      }
      const carrierWord = fields.carrier_name?.toUpperCase().match(/[A-Z0-9]{5,}/)?.[0] ?? null;
      const vesselWord = fields.vessel_name?.toUpperCase().match(/[A-Z0-9]{3,}/)?.[0] ?? null;
      if (carrierWord && vesselWord &&
          (vesselWord.startsWith(carrierWord) || carrierWord.endsWith(vesselWord)) &&
          !fields._meta.confidence_flags.includes("vessel_name")) {
        fields._meta.confidence_flags.push("vessel_name");
      }
      return { detected_type, fields };
    }
    case "commercial_invoice": {
      const fields: CommercialInvoiceFields = {
        invoice_no: cStr(f.invoice_no),
        invoice_date: cStr(f.invoice_date),
        po_no: cStr(f.po_no),
        purchase_order_refs: cStrArray(f.purchase_order_refs ?? (f.po_no ? [f.po_no] : [])),
        bl_numbers: cStrArray(f.bl_numbers),
        booking_refs: cStrArray(f.booking_refs),
        container_refs: cStrArray(f.container_refs),
        seller: cParty(f.seller ?? f.shipper),
        buyer: cParty(f.buyer ?? f.consignee),
        incoterm: cStr(f.incoterm),
        currency: cStr(f.currency),
        line_items: cArray(f.line_items, cLineItem),
        subtotal: cNum(f.subtotal),
        discount_amount: cNum(f.discount_amount),
        freight_charge: cNum(f.freight_charge),
        insurance: cNum(f.insurance),
        tax_amount: cNum(f.tax_amount),
        total_amount: cNum(f.total_amount),
        amount_due: cNum(f.amount_due),
        due_date: cStr(f.due_date),
        payment_terms: cStr(f.payment_terms),
        lc_number: cStr(f.lc_number),
        country_of_origin: cStr(f.country_of_origin),
        bank_details: cStr(f.bank_details),
        dangerous_goods: cArray(f.dangerous_goods, cDangerousGoods),
        _meta,
      };
      return { detected_type, fields };
    }
    case "purchase_order": {
      const fields: PurchaseOrderFields = {
        po_number: cStr(f.po_number ?? f.po_no), po_date: cStr(f.po_date ?? f.date),
        revision_no: cStr(f.revision_no), contract_no: cStr(f.contract_no),
        buyer: cParty(f.buyer), seller: cParty(f.seller ?? f.supplier),
        bill_to: cParty(f.bill_to), ship_to: cParty(f.ship_to),
        requested_delivery_date: cStr(f.requested_delivery_date),
        promised_delivery_date: cStr(f.promised_delivery_date), shipping_method: cStr(f.shipping_method),
        incoterm: cStr(f.incoterm), payment_terms: cStr(f.payment_terms), currency: cStr(f.currency),
        line_items: cArray(f.line_items, cLineItem), subtotal: cNum(f.subtotal),
        discount_amount: cNum(f.discount_amount), freight_amount: cNum(f.freight_amount ?? f.freight_charge),
        tax_amount: cNum(f.tax_amount), total_amount: cNum(f.total_amount),
        approval_status: cStr(f.approval_status), approved_by: cStr(f.approved_by), notes: cStr(f.notes), _meta,
      };
      return { detected_type, fields };
    }
    case "freight_invoice": {
      const fields: FreightInvoiceFields = {
        invoice_no: cStr(f.invoice_no), invoice_date: cStr(f.invoice_date), due_date: cStr(f.due_date),
        carrier_invoice_ref: cStr(f.carrier_invoice_ref), purchase_order_refs: cStrArray(f.purchase_order_refs ?? (f.po_no ? [f.po_no] : [])),
        bl_numbers: cStrArray(f.bl_numbers), booking_refs: cStrArray(f.booking_refs),
        shipment_refs: cStrArray(f.shipment_refs), container_refs: cStrArray(f.container_refs),
        carrier: cParty(f.carrier ?? f.seller), bill_to: cParty(f.bill_to ?? f.buyer), remit_to: cParty(f.remit_to),
        vessel_name: cStr(f.vessel_name), voyage_no: cStr(f.voyage_no),
        port_of_load: cPort(f.port_of_load), port_of_discharge: cPort(f.port_of_discharge),
        service_period_start: cStr(f.service_period_start), service_period_end: cStr(f.service_period_end),
        currency: cStr(f.currency), exchange_rate: cNum(f.exchange_rate), charges: cArray(f.charges ?? f.line_items, cCharge),
        subtotal: cNum(f.subtotal), discount_amount: cNum(f.discount_amount), tax_amount: cNum(f.tax_amount),
        total_amount: cNum(f.total_amount), amount_paid: cNum(f.amount_paid), amount_due: cNum(f.amount_due),
        payment_terms: cStr(f.payment_terms), payment_reference: cStr(f.payment_reference),
        bank_details: cStr(f.bank_details), _meta,
      };
      return { detected_type, fields };
    }
    case "goods_receipt": {
      const fields: GoodsReceiptFields = {
        receipt_no: cStr(f.receipt_no), receipt_date: cStr(f.receipt_date ?? f.date),
        purchase_order_refs: cStrArray(f.purchase_order_refs ?? (f.po_no ? [f.po_no] : [])),
        delivery_note_refs: cStrArray(f.delivery_note_refs), bl_numbers: cStrArray(f.bl_numbers),
        container_refs: cStrArray(f.container_refs), supplier: cParty(f.supplier ?? f.seller),
        receiver: cParty(f.receiver ?? f.buyer), delivery_location: cStr(f.delivery_location),
        line_items: cArray(f.line_items, cLineItem), total_received_quantity: cNum(f.total_received_quantity),
        total_accepted_quantity: cNum(f.total_accepted_quantity), total_rejected_quantity: cNum(f.total_rejected_quantity),
        total_packages: cNum(f.total_packages), total_gross_kg: cNum(f.total_gross_kg),
        received_by: cStr(f.received_by), notes: cStr(f.notes), _meta,
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
        dangerous_goods: cArray(f.dangerous_goods, cDangerousGoods),
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
        dangerous_goods: cArray(f.dangerous_goods, cDangerousGoods),
      };
      return { detected_type, fields };
    }
    case "air_waybill": {
      const fields: AirWaybillFields = {
        awb_number: cStr(f.awb_number),
        awb_type: cEnum(f.awb_type, ["master", "house", "unknown"] as const),
        master_awb_number: cStr(f.master_awb_number),
        house_awb_number: cStr(f.house_awb_number),
        airline_name: cStr(f.airline_name ?? f.carrier_name),
        airline_prefix: cStr(f.airline_prefix),
        shipper: cParty(f.shipper),
        consignee: cParty(f.consignee),
        issuing_carrier_agent: cParty(f.issuing_carrier_agent ?? f.agent),
        origin_airport: cStr(f.origin_airport),
        destination_airport: cStr(f.destination_airport),
        flight_no: cStr(f.flight_no),
        flight_date: cStr(f.flight_date),
        issue_date: cStr(f.issue_date),
        issue_place: cStr(f.issue_place),
        currency: cStr(f.currency),
        charge_code: cStr(f.charge_code),
        declared_value_carriage: cStr(f.declared_value_carriage),
        declared_value_customs: cStr(f.declared_value_customs),
        insurance_amount: cNum(f.insurance_amount),
        handling_information: cStr(f.handling_information),
        line_items: cArray(f.line_items, cLineItem),
        total_pieces: cNum(f.total_pieces ?? f.total_packages),
        total_gross_kg: cNum(f.total_gross_kg),
        total_chargeable_kg: cNum(f.total_chargeable_kg),
        total_prepaid: cNum(f.total_prepaid),
        total_collect: cNum(f.total_collect),
        dangerous_goods: cArray(f.dangerous_goods, cDangerousGoods),
        _meta,
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
    case "purchase_order": {
      const f = extraction.fields;
      return [f.po_number, f.po_date, f.buyer?.name ?? null, f.seller?.name ?? null,
        f.currency, f.line_items, f.total_amount].filter(empty).length;
    }
    case "freight_invoice": {
      const f = extraction.fields;
      return [f.invoice_no, f.invoice_date, f.carrier?.name ?? null, f.bill_to?.name ?? null,
        f.currency, f.charges, f.total_amount].filter(empty).length;
    }
    case "goods_receipt": {
      const f = extraction.fields;
      return [f.receipt_no, f.receipt_date, f.purchase_order_refs,
        f.supplier?.name ?? null, f.line_items].filter(empty).length;
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
    case "air_waybill": {
      const f = extraction.fields;
      return [f.awb_number, f.shipper?.name ?? null, f.consignee?.name ?? null,
        f.origin_airport, f.destination_airport, f.line_items, f.total_gross_kg].filter(empty).length;
    }
    default:
      return 0;
  }
}

// Matching-grade completeness score. This does not claim that a value is
// correct; it prevents a sparse but valid JSON response from winning over a
// materially richer retry. Scores are deterministic and capped at 100.
export function extractionQualityScore(extraction: NormalizedExtraction): number {
  const present = (v: unknown) =>
    v !== null && v !== undefined && v !== "" && (!Array.isArray(v) || v.length > 0);
  const points = (v: unknown, weight: number) => (present(v) ? weight : 0);
  let score = 0;

  if (extraction.detected_type === "bill_of_lading" || extraction.detected_type === "sea_waybill") {
    const f = extraction.fields;
    score += points(f.bl_number, 8) + points(f.carrier_name, 2);
    score += points(f.shipper?.name, 3) + points(f.shipper?.address, 3);
    score += points(f.consignee?.name, 3) + points(f.consignee?.address, 3);
    score += points(f.notify?.name, 2);
    score += points(f.vessel_name, 3) + points(f.voyage_no, 3);
    score += points(f.port_of_load?.name, 4) + points(f.port_of_discharge?.name, 4);
    score += points(f.place_of_receipt, 2) + points(f.place_of_delivery, 2);
    score += points(f.shipped_on_board_date, 4) + points(f.issue_date, 3) + points(f.issue_place, 1);
    score += points(f.freight_terms, 3) + points(f.bl_type, 1) + points(f.originals_count, 1);
    score += Math.min(8,
      points(f.booking_no, 2) + points(f.shipper_reference, 1) +
      points(f.export_references, 2) + points(f.customs_reference, 1) +
      points(f.purchase_order_refs, 1) + points(f.lc_number, 2));

    const bestContainer = f.containers.reduce((best, c) => Math.max(best,
      points(c.container_no, 7) + points(c.seal_no, 3) + points(c.iso_type, 2) +
      points(c.packages, 1) + points(c.gross_kg, 1) + points(c.volume_cbm, 1)), 0);
    score += Math.min(14, bestContainer);

    const bestCargo = f.cargo.reduce((best, line) => Math.max(best,
      points(line.description, 5) + points(line.packages, 2) + points(line.package_type, 1) +
      points(line.net_kg, 2) + points(line.gross_kg, 2) + points(line.volume_cbm, 2) +
      points(line.marks, 1) + points(line.hs_code, 1)), 0);
    score += Math.min(15, bestCargo);
    score += points(f.total_packages, 2) + points(f.total_net_kg, 2) +
      points(f.total_gross_kg, 2) + points(f.total_volume_cbm, 2);
  } else {
    // Preserve the existing critical-field behaviour for other document types,
    // while still allowing a richer retry to win when both outputs are valid.
    score = 100 - countEmptyCriticalFields(extraction) * 16;
    const fields = extraction.fields as unknown as Record<string, unknown>;
    const populated = Object.entries(fields).filter(([key, value]) => key !== "_meta" && present(value)).length;
    score = Math.min(100, score + Math.min(12, populated));
  }

  const penalty = Math.min(10, extraction.fields._meta.confidence_flags.length * 2);
  return Math.max(0, Math.min(100, Math.round(score - penalty)));
}

export function needsQualityEscalation(extraction: NormalizedExtraction): boolean {
  const threshold =
    extraction.detected_type === "bill_of_lading" || extraction.detected_type === "sea_waybill"
      ? 82
      : 60;
  if (extraction.detected_type === "bill_of_lading" || extraction.detected_type === "sea_waybill") {
    const f = extraction.fields;
    // A carrier brand accidentally prefixed to the vessel is a common logo-to-cell
    // vision error. A single aggregate cargo row is also suspicious when the
    // verbatim block visibly contains several package-count declarations.
    const carrierToken = f.carrier_name?.toUpperCase().match(/[A-Z0-9]{4,}/)?.[0] ?? null;
    const vesselToken = f.vessel_name?.toUpperCase().match(/[A-Z0-9]{3,}/)?.[0] ?? null;
    const vesselLooksLogoLed = Boolean(carrierToken && vesselToken &&
      (vesselToken.startsWith(carrierToken) || carrierToken.endsWith(vesselToken)));
    const packageMentions = f.cargo_raw_text?.match(/\b\d[\d,.]*\s+(?:CARTONS?|CASES?|BAGS?|PALLETS?|PACKAGES?|PCS)\b/gi) ?? [];
    const aggregateOnly = f.cargo.length === 1 && packageMentions.length >= 2;
    if (vesselLooksLogoLed || aggregateOnly) return true;
  }
  return extractionQualityScore(extraction) < threshold;
}
