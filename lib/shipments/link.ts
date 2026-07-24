// Auto-link a parsed document to a shipment (BUILD_SPEC §M6.4: "docs
// grouped — auto-link by bl_number/invoice refs"). Pure decision function;
// the parse route fetches candidates and executes the decision.

import type { NormalizedExtraction } from "@/lib/ai/schemas/shared";
import { normalizeText } from "@/lib/validators";

export interface ShipmentCandidate {
  id: string;
  bl_number: string | null;
}

export interface DocCandidate {
  id: string;
  shipment_id: string | null;
  doc_type: string;
  /** fields->>invoice_no for CIs, fields->>invoice_ref for PLs. */
  invoice_no: string | null;
  invoice_ref: string | null;
  fields?: Record<string, unknown> | null;
}

export type LinkDecision =
  | { action: "attach"; shipmentId: string }
  | { action: "create"; bl_number: string }
  | { action: "none" };

function refKey(s: string | null): string | null {
  if (!s) return null;
  const k = normalizeText(s).replace(/ /g, "");
  return k === "" ? null : k;
}

function fieldStrings(doc: DocCandidate, key: string): string[] {
  const value = doc.fields?.[key];
  if (typeof value === "string") return [value];
  return Array.isArray(value) ? value.filter((x): x is string => typeof x === "string") : [];
}

function anyRefMatches(values: string[], target: string | null): boolean {
  const key = refKey(target);
  return Boolean(key && values.some((value) => refKey(value) === key));
}

/**
 * B/L: join (or create) the shipment keyed by its bl_number.
 * CI:  join the shipment of a PL whose invoice_ref matches its invoice_no.
 * PL:  join the shipment of the CI its invoice_ref points to.
 */
export function decideLink(
  extraction: NormalizedExtraction,
  shipments: ShipmentCandidate[],
  docs: DocCandidate[]
): LinkDecision {
  if (extraction.detected_type === "bill_of_lading") {
    const bl = refKey(extraction.fields.bl_number);
    if (!bl) return { action: "none" };
    const existing = shipments.find((s) => refKey(s.bl_number) === bl);
    if (existing) return { action: "attach", shipmentId: existing.id };
    return { action: "create", bl_number: extraction.fields.bl_number! };
  }

  if (extraction.detected_type === "commercial_invoice") {
    const inv = refKey(extraction.fields.invoice_no);
    if (!inv) return { action: "none" };
    const pl = docs.find(
      (d) =>
        d.doc_type === "packing_list" &&
        d.shipment_id !== null &&
        refKey(d.invoice_ref) === inv
    );
    if (pl) return { action: "attach", shipmentId: pl.shipment_id! };
    return { action: "none" };
  }

  if (extraction.detected_type === "packing_list") {
    const ref = refKey(extraction.fields.invoice_ref);
    if (!ref) return { action: "none" };
    const ci = docs.find(
      (d) =>
        d.doc_type === "commercial_invoice" &&
        d.shipment_id !== null &&
        refKey(d.invoice_no) === ref
    );
    if (ci) return { action: "attach", shipmentId: ci.shipment_id! };
    return { action: "none" };
  }

  if (extraction.detected_type === "freight_invoice") {
    for (const bl of extraction.fields.bl_numbers) {
      const shipment = shipments.find((item) => refKey(item.bl_number) === refKey(bl));
      if (shipment) return { action: "attach", shipmentId: shipment.id };
    }
    for (const po of extraction.fields.purchase_order_refs) {
      const attached = docs.find((doc) => doc.doc_type === "purchase_order" && doc.shipment_id &&
        anyRefMatches(fieldStrings(doc, "po_number"), po));
      if (attached) return { action: "attach", shipmentId: attached.shipment_id! };
    }
  }

  if (extraction.detected_type === "purchase_order") {
    const po = extraction.fields.po_number;
    if (!po) return { action: "none" };
    const attached = docs.find((doc) => doc.shipment_id &&
      ["bill_of_lading", "sea_waybill", "freight_invoice", "commercial_invoice", "goods_receipt"].includes(doc.doc_type) &&
      anyRefMatches(fieldStrings(doc, "purchase_order_refs"), po));
    if (attached) return { action: "attach", shipmentId: attached.shipment_id! };
  }

  if (extraction.detected_type === "goods_receipt") {
    for (const po of extraction.fields.purchase_order_refs) {
      const attached = docs.find((doc) => doc.doc_type === "purchase_order" && doc.shipment_id &&
        anyRefMatches(fieldStrings(doc, "po_number"), po));
      if (attached) return { action: "attach", shipmentId: attached.shipment_id! };
    }
  }

  return { action: "none" };
}
