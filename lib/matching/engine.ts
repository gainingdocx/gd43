import type {
  BillOfLadingFields,
  FreightInvoiceFields,
  LineItem,
  PurchaseOrderFields,
} from "@/lib/ai/schemas/shared";
import type { ShipmentDoc } from "@/lib/validators";
import { crossCheck, normalizeName, similarity } from "@/lib/validators";
import type { MatchRuleResult, ThreeWayMatchResult } from "./types";

export interface MatchPolicy {
  amount_percent: number;
  amount_absolute: number;
  quantity_percent: number;
}

export const DEFAULT_MATCH_POLICY: MatchPolicy = {
  amount_percent: 0.5,
  amount_absolute: 1,
  quantity_percent: 0,
};

type BL = { id: string; f: BillOfLadingFields };
type PO = { id: string; f: PurchaseOrderFields };
type FI = { id: string; f: FreightInvoiceFields };

function ref(value: string | null): string | null {
  const normalized = value?.toUpperCase().replace(/[^A-Z0-9]/g, "") ?? "";
  return normalized || null;
}

function refs(values: (string | null)[]): Set<string> {
  return new Set(values.map(ref).filter((x): x is string => Boolean(x)));
}

function overlap(a: Set<string>, b: Set<string>): boolean {
  return [...a].some((value) => b.has(value));
}

function setText(values: Set<string>): string | null {
  return values.size ? [...values].sort().join(", ") : null;
}

function moneyClose(a: number, b: number, policy: MatchPolicy): boolean {
  const allowance = Math.max(policy.amount_absolute, Math.max(Math.abs(a), Math.abs(b)) * policy.amount_percent / 100);
  return Math.abs(a - b) <= allowance;
}

function quantityClose(a: number, b: number, policy: MatchPolicy): boolean {
  const allowance = Math.max(Math.abs(a), Math.abs(b)) * policy.quantity_percent / 100;
  return Math.abs(a - b) <= allowance;
}

function lineCode(line: LineItem): string | null {
  return ref(line.buyer_product_code ?? line.product_code ?? line.seller_product_code);
}

function lineQuantity(line: LineItem): number | null {
  return line.quantity ?? line.packages ?? line.cartons;
}

function words(value: string | null): Set<string> {
  return new Set(normalizeName(value ?? "").split(" ").filter((x) => x.length > 2));
}

function descriptionScore(a: string | null, b: string | null): number {
  if (!a || !b) return 0;
  const aw = words(a);
  const bw = words(b);
  const union = new Set([...aw, ...bw]);
  if (!union.size) return similarity(a, b);
  const intersection = [...aw].filter((word) => bw.has(word)).length;
  return Math.max(intersection / union.size, similarity(a, b));
}

function bestLine(target: LineItem, candidates: LineItem[]): LineItem | null {
  const code = lineCode(target);
  if (code) {
    const exact = candidates.find((candidate) => lineCode(candidate) === code);
    if (exact) return exact;
  }
  let best: { line: LineItem; score: number } | null = null;
  for (const candidate of candidates) {
    const score = descriptionScore(target.description, candidate.description);
    if (!best || score > best.score) best = { line: candidate, score };
  }
  return best && best.score >= 0.58 ? best.line : null;
}

function rule(over: MatchRuleResult): MatchRuleResult {
  return over;
}

export function runThreeWayMatch(
  docs: ShipmentDoc[],
  policy: MatchPolicy = DEFAULT_MATCH_POLICY,
  now: Date = new Date()
): ThreeWayMatchResult {
  const pos: PO[] = [];
  const bls: BL[] = [];
  const freightInvoices: FI[] = [];
  const transportIds: string[] = [];
  const invoiceIds: string[] = [];

  for (const doc of docs) {
    if (doc.extraction.detected_type === "purchase_order") pos.push({ id: doc.id, f: doc.extraction.fields });
    if (doc.extraction.detected_type === "bill_of_lading" || doc.extraction.detected_type === "sea_waybill") {
      bls.push({ id: doc.id, f: doc.extraction.fields });
      transportIds.push(doc.id);
    }
    if (doc.extraction.detected_type === "packing_list" || doc.extraction.detected_type === "goods_receipt") transportIds.push(doc.id);
    if (doc.extraction.detected_type === "freight_invoice") {
      freightInvoices.push({ id: doc.id, f: doc.extraction.fields });
      invoiceIds.push(doc.id);
    }
    if (doc.extraction.detected_type === "commercial_invoice") invoiceIds.push(doc.id);
  }

  const requirements = [
    { role: "purchase_order" as const, label: "Purchase order", present: pos.length > 0, document_ids: pos.map((x) => x.id) },
    { role: "transport_evidence" as const, label: "B/L or receipt evidence", present: transportIds.length > 0, document_ids: transportIds },
    { role: "invoice" as const, label: "Freight or commercial invoice", present: invoiceIds.length > 0, document_ids: invoiceIds },
  ];
  const results: MatchRuleResult[] = [];

  const requireField = (docId: string, docLabel: string, field: string, value: unknown) => {
    const present = value !== null && value !== undefined && value !== "" && (!Array.isArray(value) || value.length > 0);
    if (!present) results.push(rule({
      rule_id: `completeness.${docLabel.toLowerCase().replace(/\W+/g, "_")}.${field}`,
      category: "completeness", status: "review", severity: "warning",
      label: `${docLabel}: ${field.replace(/_/g, " ")}`,
      message: `${docLabel} is missing matching-critical ${field.replace(/_/g, " ")}`,
      doc_a: docId, doc_b: null, field_a: field, field_b: null, value_a: null, value_b: null,
    }));
  };
  for (const po of pos) {
    requireField(po.id, "Purchase order", "po_number", po.f.po_number);
    requireField(po.id, "Purchase order", "buyer", po.f.buyer?.name);
    requireField(po.id, "Purchase order", "line_items", po.f.line_items);
  }
  for (const bl of bls) {
    requireField(bl.id, "Bill of lading", "bl_number", bl.f.bl_number);
    requireField(bl.id, "Bill of lading", "cargo", bl.f.cargo);
    requireField(bl.id, "Bill of lading", "containers", bl.f.containers);
  }
  for (const invoice of freightInvoices) {
    requireField(invoice.id, "Freight invoice", "invoice_no", invoice.f.invoice_no);
    requireField(invoice.id, "Freight invoice", "bl_numbers", invoice.f.bl_numbers);
    requireField(invoice.id, "Freight invoice", "total_amount", invoice.f.total_amount);
  }

  for (const finding of crossCheck(docs)) {
    results.push(rule({
      rule_id: `legacy.${finding.field}`,
      category: /weight|volume|packages/.test(finding.field) ? "quantity" : /port/.test(finding.field) ? "route" : "identity",
      status: finding.severity === "red" ? "fail" : "review",
      severity: finding.severity === "red" ? "critical" : "warning",
      label: finding.field.replace(/_/g, " "), message: finding.message,
      doc_a: finding.doc_a, doc_b: finding.doc_b, field_a: finding.field,
      field_b: finding.field, value_a: finding.value_a, value_b: finding.value_b,
    }));
  }

  for (const po of pos) {
    const poRefs = refs([po.f.po_number]);
    for (const bl of bls) {
      const blPoRefs = refs(bl.f.purchase_order_refs);
      if (poRefs.size && blPoRefs.size) results.push(rule({
        rule_id: "identity.po_to_bl", category: "identity", status: overlap(poRefs, blPoRefs) ? "pass" : "fail",
        severity: "critical", label: "PO reference on B/L",
        message: overlap(poRefs, blPoRefs) ? "The B/L references this purchase order" : "The B/L purchase-order reference does not match",
        doc_a: po.id, doc_b: bl.id, field_a: "po_number", field_b: "purchase_order_refs",
        value_a: setText(poRefs), value_b: setText(blPoRefs),
      }));
    }
    for (const invoice of freightInvoices) {
      const invoicePoRefs = refs(invoice.f.purchase_order_refs);
      if (poRefs.size && invoicePoRefs.size) results.push(rule({
        rule_id: "identity.po_to_freight_invoice", category: "identity", status: overlap(poRefs, invoicePoRefs) ? "pass" : "fail",
        severity: "critical", label: "PO reference on freight invoice",
        message: overlap(poRefs, invoicePoRefs) ? "The freight invoice references this purchase order" : "The freight-invoice PO reference does not match",
        doc_a: po.id, doc_b: invoice.id, field_a: "po_number", field_b: "purchase_order_refs",
        value_a: setText(poRefs), value_b: setText(invoicePoRefs),
      }));

      if (po.f.buyer?.name && invoice.f.bill_to?.name) {
        const same = normalizeName(po.f.buyer.name) === normalizeName(invoice.f.bill_to.name);
        results.push(rule({
          rule_id: "party.buyer_to_bill_to", category: "party", status: same ? "pass" : "fail",
          severity: "critical", label: "Buyer and bill-to",
          message: same ? "PO buyer matches freight-invoice bill-to" : "PO buyer differs from freight-invoice bill-to",
          doc_a: po.id, doc_b: invoice.id, field_a: "buyer.name", field_b: "bill_to.name",
          value_a: po.f.buyer.name, value_b: invoice.f.bill_to.name,
        }));
      }

      if (po.f.currency && invoice.f.currency) {
        const same = ref(po.f.currency) === ref(invoice.f.currency);
        results.push(rule({
          rule_id: "amount.currency", category: "amount", status: same ? "pass" : "fail",
          severity: "critical", label: "Currency",
          message: same ? "PO and freight-invoice currencies match" : "PO and freight-invoice currencies differ",
          doc_a: po.id, doc_b: invoice.id, field_a: "currency", field_b: "currency",
          value_a: po.f.currency, value_b: invoice.f.currency,
        }));
      }

      if (po.f.freight_amount !== null && invoice.f.subtotal !== null &&
          (!po.f.currency || !invoice.f.currency || ref(po.f.currency) === ref(invoice.f.currency))) {
        const same = moneyClose(po.f.freight_amount, invoice.f.subtotal, policy);
        results.push(rule({
          rule_id: "amount.authorized_freight", category: "amount", status: same ? "pass" : "fail",
          severity: "critical", label: "Authorized freight amount",
          message: same ? "Freight subtotal is within the PO authorization" : "Freight subtotal exceeds or differs from the PO authorization",
          doc_a: po.id, doc_b: invoice.id, field_a: "freight_amount", field_b: "subtotal",
          value_a: String(po.f.freight_amount), value_b: String(invoice.f.subtotal),
          tolerance: { percent: policy.amount_percent, absolute: policy.amount_absolute, description: `±${policy.amount_percent}% or ±${policy.amount_absolute}, whichever is larger` },
        }));
      }
    }

    const evidenceLines = docs.flatMap((doc) => {
      if (doc.extraction.detected_type === "bill_of_lading" || doc.extraction.detected_type === "sea_waybill") return doc.extraction.fields.cargo;
      if (doc.extraction.detected_type === "packing_list" || doc.extraction.detected_type === "goods_receipt" || doc.extraction.detected_type === "commercial_invoice") return doc.extraction.fields.line_items;
      return [];
    });
    for (const [index, ordered] of po.f.line_items.entries()) {
      const matched = bestLine(ordered, evidenceLines);
      if (!matched) {
        results.push(rule({
          rule_id: `line.po.${index + 1}.presence`, category: "quantity", status: "review", severity: "warning",
          label: `PO line ${ordered.line_no ?? index + 1}`,
          message: "No sufficiently similar transported or received line was found",
          doc_a: po.id, doc_b: null, field_a: `line_items[${index}]`, field_b: null,
          value_a: ordered.product_code ?? ordered.description, value_b: null,
        }));
        continue;
      }
      const orderedQty = lineQuantity(ordered);
      const evidenceQty = lineQuantity(matched);
      if (orderedQty !== null && evidenceQty !== null) {
        const sameUnit = !ordered.uom || !matched.uom || ref(ordered.uom) === ref(matched.uom);
        const same = sameUnit && quantityClose(orderedQty, evidenceQty, policy);
        results.push(rule({
          rule_id: `line.po.${index + 1}.quantity`, category: "quantity", status: same ? "pass" : "review",
          severity: "warning", label: `PO line ${ordered.line_no ?? index + 1} quantity`,
          message: same ? "Ordered and transported/received quantities match" :
            !sameUnit ? "Units differ; quantity cannot be safely compared" : "Ordered and transported/received quantities differ",
          doc_a: po.id, doc_b: null, field_a: `line_items[${index}].quantity`, field_b: "matched_line.quantity",
          value_a: String(orderedQty), value_b: String(evidenceQty),
          tolerance: { percent: policy.quantity_percent, description: `±${policy.quantity_percent}%` },
        }));
      }
    }
  }

  for (const bl of bls) {
    const blRefs = refs([bl.f.bl_number]);
    const blContainers = refs(bl.f.containers.map((x) => x.container_no));
    for (const invoice of freightInvoices) {
      const invoiceBlRefs = refs(invoice.f.bl_numbers);
      if (blRefs.size && invoiceBlRefs.size) results.push(rule({
        rule_id: "identity.bl_to_freight_invoice", category: "identity", status: overlap(blRefs, invoiceBlRefs) ? "pass" : "fail",
        severity: "critical", label: "B/L reference on freight invoice",
        message: overlap(blRefs, invoiceBlRefs) ? "Freight invoice references this B/L" : "Freight-invoice B/L reference does not match",
        doc_a: bl.id, doc_b: invoice.id, field_a: "bl_number", field_b: "bl_numbers",
        value_a: setText(blRefs), value_b: setText(invoiceBlRefs),
      }));
      const invoiceContainers = refs(invoice.f.container_refs);
      if (blContainers.size && invoiceContainers.size) results.push(rule({
        rule_id: "logistics.containers", category: "logistics", status: overlap(blContainers, invoiceContainers) ? "pass" : "fail",
        severity: "critical", label: "Container reference",
        message: overlap(blContainers, invoiceContainers) ? "Freight invoice references a B/L container" : "Freight-invoice containers are not present on the B/L",
        doc_a: bl.id, doc_b: invoice.id, field_a: "containers", field_b: "container_refs",
        value_a: setText(blContainers), value_b: setText(invoiceContainers),
      }));
      if (bl.f.carrier_name && invoice.f.carrier?.name) {
        const same = normalizeName(bl.f.carrier_name) === normalizeName(invoice.f.carrier.name);
        results.push(rule({
          rule_id: "party.carrier", category: "party", status: same ? "pass" : "review", severity: "warning",
          label: "Carrier", message: same ? "B/L and invoice carrier match" : "Carrier names differ; review aliases or agent billing",
          doc_a: bl.id, doc_b: invoice.id, field_a: "carrier_name", field_b: "carrier.name",
          value_a: bl.f.carrier_name, value_b: invoice.f.carrier.name,
        }));
      }
    }
  }

  // Reconcile House B/Ls against their referenced Master B/L. This stays
  // deterministic: inferred hierarchy is never treated as a match.
  const masters = bls.filter((item) => item.f.bl_level === "master");
  const houses = bls.filter((item) => item.f.bl_level === "house");
  for (const house of houses) {
    const masterRef = ref(house.f.master_bl_number ?? null);
    const master = masterRef
      ? masters.find((item) => ref(item.f.bl_number) === masterRef)
      : null;
    results.push(rule({
      rule_id: `hierarchy.hbl.${house.id}.master_reference`,
      category: "identity",
      status: master ? "pass" : "review",
      severity: masterRef ? "warning" : "info",
      label: "House-to-master B/L reference",
      message: master
        ? "The House B/L references a Master B/L in this shipment"
        : masterRef
          ? "The referenced Master B/L is not attached to this shipment"
          : "The House B/L does not state a Master B/L reference",
      doc_a: house.id,
      doc_b: master?.id ?? null,
      field_a: "master_bl_number",
      field_b: master ? "bl_number" : null,
      value_a: house.f.master_bl_number ?? null,
      value_b: master?.f.bl_number ?? null,
    }));
    if (!master) continue;

    const masterContainers = refs(master.f.containers.map((item) => item.container_no));
    const houseContainers = refs(house.f.containers.map((item) => item.container_no));
    if (houseContainers.size && masterContainers.size) {
      const missing = [...houseContainers].filter((number) => !masterContainers.has(number));
      results.push(rule({
        rule_id: `hierarchy.hbl.${house.id}.containers`,
        category: "logistics",
        status: missing.length ? "fail" : "pass",
        severity: "critical",
        label: "House B/L containers on Master B/L",
        message: missing.length
          ? `House B/L container(s) absent from the Master B/L: ${missing.join(", ")}`
          : "Every House B/L container is present on the Master B/L",
        doc_a: house.id,
        doc_b: master.id,
        field_a: "containers",
        field_b: "containers",
        value_a: setText(houseContainers),
        value_b: setText(masterContainers),
      }));
    }
  }

  const counts = { pass: 0, fail: 0, review: 0, skipped: 0 };
  results.forEach((item) => counts[item.status]++);
  const complete = requirements.every((item) => item.present);
  const criticalFailures = results.filter((item) => item.status === "fail" && item.severity === "critical").length;
  const reviews = results.filter((item) => item.status === "review").length;
  const evaluated = counts.pass + counts.fail + counts.review;
  const score = complete && evaluated === 0 ? 50 : Math.max(0, Math.round((counts.pass / Math.max(1, evaluated)) * 100));
  const decision = !complete ? "incomplete" : criticalFailures ? "blocked" : reviews ? "review" : "matched";

  return {
    schema_version: "match-v1", decision, score, requirements, counts, rules: results,
    generated_at: now.toISOString(),
  };
}

export function matchFindings(result: ThreeWayMatchResult) {
  return result.rules.filter((item) => item.status === "fail" || item.status === "review").map((item) => ({
    severity: item.status === "fail" ? "red" as const : "amber" as const,
    field: item.rule_id,
    doc_a: item.doc_a,
    doc_b: item.doc_b,
    value_a: item.value_a,
    value_b: item.value_b,
    message: item.message,
    category: item.category,
    tolerance: item.tolerance ?? null,
  }));
}
