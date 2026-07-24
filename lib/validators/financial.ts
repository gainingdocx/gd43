import type { NormalizedExtraction } from "@/lib/ai/schemas/shared";
import type { ValidationResult } from "./types";

const close = (a: number, b: number) => Math.abs(a - b) <= Math.max(0.01, Math.abs(b) * 0.0001);

function checkSum(field: string, rule: string, printed: number | null, values: (number | null)[], label: string): ValidationResult[] {
  const known = values.filter((value): value is number => value !== null);
  if (printed === null || known.length === 0) return [];
  const calculated = known.reduce((sum, value) => sum + value, 0);
  const ok = close(calculated, printed);
  return [{
    field, rule, status: ok ? "pass" : "fail",
    message: ok ? `${label} matches its printed components` : `${label} is ${printed}, but printed components total ${calculated}`,
    expected: String(calculated), actual: String(printed),
  }];
}

export function financials(extraction: NormalizedExtraction): ValidationResult[] {
  if (extraction.detected_type === "purchase_order") {
    const f = extraction.fields;
    const out = checkSum("subtotal", "amounts.line_sum", f.subtotal, f.line_items.map((line) => line.amount), "PO subtotal");
    if (f.total_amount !== null && f.subtotal !== null) {
      const expected = f.subtotal - (f.discount_amount ?? 0) + (f.freight_amount ?? 0) + (f.tax_amount ?? 0);
      out.push(...checkSum("total_amount", "amounts.total", f.total_amount, [expected], "PO total"));
    }
    return out;
  }
  if (extraction.detected_type === "commercial_invoice") {
    const f = extraction.fields;
    const out = checkSum("subtotal", "amounts.line_sum", f.subtotal, f.line_items.map((line) => line.amount), "Invoice subtotal");
    if (f.total_amount !== null && f.subtotal !== null) {
      const expected = f.subtotal - (f.discount_amount ?? 0) + (f.freight_charge ?? 0) + (f.insurance ?? 0) + (f.tax_amount ?? 0);
      out.push(...checkSum("total_amount", "amounts.total", f.total_amount, [expected], "Invoice total"));
    }
    return out;
  }
  if (extraction.detected_type === "freight_invoice") {
    const f = extraction.fields;
    const out = checkSum("subtotal", "amounts.charge_sum", f.subtotal, f.charges.map((line) => line.amount), "Freight subtotal");
    if (f.total_amount !== null && f.subtotal !== null) {
      const expected = f.subtotal - (f.discount_amount ?? 0) + (f.tax_amount ?? 0);
      out.push(...checkSum("total_amount", "amounts.total", f.total_amount, [expected], "Freight invoice total"));
    }
    if (f.amount_due !== null && f.total_amount !== null) {
      out.push(...checkSum("amount_due", "amounts.due", f.amount_due, [f.total_amount - (f.amount_paid ?? 0)], "Amount due"));
    }
    return out;
  }
  if (extraction.detected_type === "goods_receipt") {
    const f = extraction.fields;
    if (f.total_received_quantity !== null && f.total_accepted_quantity !== null && f.total_rejected_quantity !== null) {
      return checkSum("total_received_quantity", "quantities.receipt", f.total_received_quantity,
        [f.total_accepted_quantity, f.total_rejected_quantity], "Received quantity");
    }
  }
  return [];
}
