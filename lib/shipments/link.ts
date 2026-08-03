// Auto-link a parsed document to a shipment (BUILD_SPEC §M6.4: "docs
// grouped — auto-link by bl_number/invoice refs"). Pure decision function;
// the parse route fetches candidates and executes the decision.

import type { NormalizedExtraction } from "@/lib/ai/schemas/shared";
import { normalizeText } from "@/lib/validators";

export interface ShipmentCandidate {
  id: string;
  bl_number: string | null;
  ref?: string | null;
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
  | { action: "create_ref"; ref: string }
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

function extractionRefs(extraction: NormalizedExtraction): string[] {
  const f = extraction.fields as unknown as Record<string, unknown>;
  const one = (key: string) => typeof f[key] === "string" ? [f[key] as string] : [];
  const many = (key: string) => Array.isArray(f[key]) ? (f[key] as unknown[]).filter((value): value is string => typeof value === "string") : [];
  const containerNumbers = (key: string) => Array.isArray(f[key]) ? (f[key] as unknown[]).flatMap((value) => {
    if (!value || typeof value !== "object") return [];
    const number = (value as { container_no?: unknown }).container_no;
    return typeof number === "string" ? [number] : [];
  }) : [];
  switch (extraction.detected_type) {
    case "bill_of_lading": case "sea_waybill":
      return [...one("bl_number"), ...one("booking_no"), ...one("shipper_reference"), ...many("purchase_order_refs")];
    case "booking_confirmation": return [...one("booking_no"), ...one("service_contract_no")];
    case "shipping_instructions": return [...one("si_number"), ...one("booking_no"), ...one("bl_number"), ...one("shipper_reference")];
    case "commercial_invoice": return [...one("invoice_no"), ...one("po_no"), ...many("bl_numbers"), ...many("booking_refs"), ...many("container_refs")];
    case "packing_list": return [...one("pl_no"), ...one("invoice_ref"), ...one("po_no"), ...many("container_refs")];
    case "certificate_of_origin": return [...one("certificate_no"), ...many("invoice_refs"), ...many("bl_numbers")];
    case "air_waybill": return [...one("awb_number"), ...one("master_awb_number"), ...one("house_awb_number")];
    case "shipper_letter_of_instruction": return [...one("instruction_no"), ...many("awb_numbers")];
    case "dangerous_goods_declaration": return [...one("declaration_reference"), ...many("awb_numbers")];
    case "air_cargo_manifest": return [...one("manifest_no"), ...many("awb_numbers")];
    case "cargo_security_declaration": return [...one("declaration_reference"), ...many("awb_numbers")];
    case "quotation": case "rate_confirmation": return [...one("quotation_no"), ...one("rate_agreement_no"), ...many("booking_refs")];
    case "freight_invoice": case "demurrage_detention_invoice":
      return [...one("invoice_no"), ...many("bl_numbers"), ...many("awb_numbers"), ...many("booking_refs"), ...many("shipment_refs"), ...many("container_refs"), ...many("purchase_order_refs")];
    case "arrival_notice": return [...one("notice_no"), ...one("bl_number"), ...one("booking_no"), ...containerNumbers("containers")];
    case "container_event": return [...one("container_no"), ...one("bl_number"), ...one("booking_no")];
    case "purchase_order": return [...one("po_number"), ...one("contract_no")];
    case "goods_receipt": return [...one("receipt_no"), ...many("purchase_order_refs"), ...many("bl_numbers"), ...many("container_refs")];
    default: return [];
  }
}

function docRefs(doc: DocCandidate): string[] {
  const keys = [
    "bl_number", "booking_no", "si_number", "invoice_no", "invoice_ref", "pl_no", "po_number", "po_no",
    "certificate_no", "quotation_no", "rate_agreement_no", "container_no", "notice_no", "shipper_reference",
    "bl_numbers", "booking_refs", "shipment_refs", "container_refs", "purchase_order_refs", "invoice_refs",
    "awb_number", "master_awb_number", "house_awb_number", "awb_numbers", "instruction_no", "declaration_reference", "manifest_no",
  ];
  return keys.flatMap((key) => fieldStrings(doc, key));
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
    if (bl) {
      const existing = shipments.find((s) => refKey(s.bl_number) === bl);
      if (existing) return { action: "attach", shipmentId: existing.id };
    }
    const connectedRefs = new Set(extractionRefs(extraction).map(refKey).filter((x): x is string => Boolean(x)));
    const connected = docs.find((doc) => doc.shipment_id && docRefs(doc).some((value) => {
      const key = refKey(value);
      return Boolean(key && connectedRefs.has(key));
    }));
    if (connected?.shipment_id) return { action: "attach", shipmentId: connected.shipment_id };
    return extraction.fields.bl_number ? { action: "create", bl_number: extraction.fields.bl_number } : { action: "none" };
  }

  if (extraction.detected_type === "commercial_invoice") {
    const inv = refKey(extraction.fields.invoice_no);
    if (inv) {
      const pl = docs.find(
        (d) =>
          d.doc_type === "packing_list" &&
          d.shipment_id !== null &&
          refKey(d.invoice_ref) === inv
      );
      if (pl) return { action: "attach", shipmentId: pl.shipment_id! };
    }
  }

  if (extraction.detected_type === "packing_list") {
    const ref = refKey(extraction.fields.invoice_ref);
    if (ref) {
      const ci = docs.find(
        (d) =>
          d.doc_type === "commercial_invoice" &&
          d.shipment_id !== null &&
          refKey(d.invoice_no) === ref
      );
      if (ci) return { action: "attach", shipmentId: ci.shipment_id! };
    }
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

  const candidateKeys = new Set(extractionRefs(extraction).map(refKey).filter((x): x is string => Boolean(x)));
  if (candidateKeys.size) {
    const attached = docs.find((doc) => doc.shipment_id && docRefs(doc).some((value) => {
      const key = refKey(value);
      return Boolean(key && candidateKeys.has(key));
    }));
    if (attached?.shipment_id) return { action: "attach", shipmentId: attached.shipment_id };
  }

  if (extraction.detected_type === "booking_confirmation" && extraction.fields.booking_no) {
    return { action: "create_ref", ref: extraction.fields.booking_no };
  }
  if (extraction.detected_type === "shipping_instructions" && extraction.fields.booking_no) {
    return { action: "create_ref", ref: extraction.fields.booking_no };
  }
  if (extraction.detected_type === "air_waybill") {
    const reference = extraction.fields.master_awb_number ?? extraction.fields.awb_number ?? extraction.fields.house_awb_number;
    if (reference) return { action: "create_ref", ref: reference };
  }
  if ((extraction.detected_type === "quotation" || extraction.detected_type === "rate_confirmation")) {
    const reference = extraction.fields.booking_refs[0] ?? extraction.fields.rate_agreement_no ?? extraction.fields.quotation_no;
    if (reference) return { action: "create_ref", ref: reference };
  }

  return { action: "none" };
}
