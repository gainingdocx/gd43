import type { FreightMode } from "@/lib/freight/mode";

const AIR_DOCUMENTS = new Set([
  "air_waybill",
  "shipper_letter_of_instruction",
  "dangerous_goods_declaration",
  "air_cargo_manifest",
  "cargo_security_declaration",
]);

const OCEAN_DOCUMENTS = new Set([
  "bill_of_lading",
  "sea_waybill",
  "arrival_notice",
  "booking_confirmation",
  "shipping_instructions",
  "container_event",
  "demurrage_detention_invoice",
]);

export type QuestionedAmount = {
  questioned_amount: number | string | null;
  questioned_currency: string | null;
};

/** Infer a shipment mode from its evidence without pretending shared trade
 * documents (invoice, packing list, origin certificate) prove a mode. */
export function inferShipmentMode(documentTypes: string[]): FreightMode {
  const hasAir = documentTypes.some((type) => AIR_DOCUMENTS.has(type));
  const hasOcean = documentTypes.some((type) => OCEAN_DOCUMENTS.has(type));
  if (hasAir && !hasOcean) return "air";
  if (hasOcean && !hasAir) return "ocean";
  return "multimodal";
}

/** Keep currencies separate: adding USD and EUR into a single exposure number
 * would look precise while being operationally misleading. */
export function aggregateQuestionedAmounts(items: QuestionedAmount[]) {
  const totals: Record<string, number> = {};
  for (const item of items) {
    const amount = Number(item.questioned_amount);
    if (!Number.isFinite(amount) || amount <= 0) continue;
    const currency = item.questioned_currency?.trim().toUpperCase() || "UNSPECIFIED";
    totals[currency] = (totals[currency] ?? 0) + amount;
  }
  return Object.entries(totals)
    .map(([currency, amount]) => ({ currency, amount }))
    .sort((a, b) => b.amount - a.amount);
}

export function percent(part: number, whole: number) {
  if (whole <= 0) return 0;
  return Math.max(0, Math.min(100, Math.round((part / whole) * 100)));
}
