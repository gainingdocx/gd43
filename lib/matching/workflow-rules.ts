import type {
  AirCargoManifestFields, AirWaybillFields, CargoSecurityDeclarationFields, DangerousGoodsDeclarationFields,
  BillOfLadingFields, BookingConfirmationFields, CertificateOfOriginFields, CommercialInvoiceFields,
  FreightInvoiceFields, PackingListFields, QuotationFields, ShippingInstructionsFields,
  ShipperLetterOfInstructionFields, DangerousGoodsItem, LineItem,
} from "@/lib/ai/schemas/shared";
import type { ShipmentDoc } from "@/lib/validators";
import { normalizeContainerNo, normalizeName, normalizeText, similarity, withinTolerance } from "@/lib/validators";
import type { MatchRuleResult } from "./types";
import type { MatchPolicy } from "./engine";

type Located<T> = { id: string; f: T };
type Workflow = NonNullable<MatchRuleResult["workflow"]>;

function printable(value: unknown): string | null {
  if (value === null || value === undefined || value === "") return null;
  if (typeof value === "string" || typeof value === "number") return String(value);
  if (Array.isArray(value)) return value.map(printable).filter(Boolean).join(", ") || null;
  if (typeof value === "object") {
    const record = value as Record<string, unknown>;
    return printable(record.unlocode ?? record.name ?? record.container_no ?? null);
  }
  return null;
}

function canon(value: unknown): string | null {
  const text = printable(value);
  return text ? normalizeText(text).replace(/\s+/g, "") : null;
}

function compare(opts: {
  workflow: Workflow; rule: string; category: MatchRuleResult["category"]; severity: MatchRuleResult["severity"];
  label: string; a: Located<unknown>; b: Located<unknown>; fieldA: string; fieldB: string; valueA: unknown; valueB: unknown;
  equal?: (a: unknown, b: unknown) => boolean; mismatch?: string; questionedAmount?: number; questionedCurrency?: string | null;
}): MatchRuleResult | null {
  const a = printable(opts.valueA); const b = printable(opts.valueB);
  if (!a || !b) return null;
  const same = opts.equal ? opts.equal(opts.valueA, opts.valueB) : canon(opts.valueA) === canon(opts.valueB);
  return {
    workflow: opts.workflow, rule_id: `${opts.workflow}.${opts.rule}.${opts.a.id}.${opts.b.id}`,
    category: opts.category, status: same ? "pass" : opts.severity === "critical" ? "fail" : "review",
    severity: opts.severity, label: opts.label,
    message: same ? `${opts.label} matches across the connected documents` : opts.mismatch ?? `${opts.label} differs across the connected documents`,
    doc_a: opts.a.id, doc_b: opts.b.id, field_a: opts.fieldA, field_b: opts.fieldB, value_a: a, value_b: b,
    ...(same || !opts.questionedAmount ? {} : { questioned_amount: opts.questionedAmount, questioned_currency: opts.questionedCurrency ?? null }),
  };
}

function partyEqual(a: unknown, b: unknown) {
  const name = (value: unknown) => value && typeof value === "object" ? printable((value as { name?: unknown }).name) : printable(value);
  const av = name(a); const bv = name(b);
  return Boolean(av && bv && normalizeName(av) === normalizeName(bv));
}

function portEqual(a: unknown, b: unknown) {
  if (!a || !b || typeof a !== "object" || typeof b !== "object") return canon(a) === canon(b);
  const ap = a as { unlocode?: string | null; name?: string | null };
  const bp = b as { unlocode?: string | null; name?: string | null };
  return Boolean(ap.unlocode && bp.unlocode ? canon(ap.unlocode) === canon(bp.unlocode) : canon(ap.name) === canon(bp.name));
}

function refsEqual(a: unknown, b: unknown) {
  const list = (value: unknown) => (Array.isArray(value) ? value : [value]).map(canon).filter((x): x is string => Boolean(x));
  const av = new Set(list(a));
  return list(b).some((item) => av.has(item));
}

function containers(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.flatMap((item) => {
    const raw = typeof item === "string" ? item : item && typeof item === "object" ? (item as { container_no?: string | null }).container_no : null;
    const normalized = raw ? normalizeContainerNo(raw) : "";
    return normalized ? [normalized] : [];
  }).sort();
}

function containerEqual(a: unknown, b: unknown) {
  const av = containers(a); const bv = containers(b);
  return av.length > 0 && bv.length > 0 && av.length === bv.length && av.every((value, index) => value === bv[index]);
}

function containerOverlap(a: unknown, b: unknown) {
  const left = new Set(containers(a));
  return containers(b).some((container) => left.has(container));
}

function equipmentSummary(value: unknown) {
  if (!Array.isArray(value)) return null;
  const types = value.flatMap((item) => item && typeof item === "object" ? [canon((item as Record<string, unknown>).iso_type)] : []).filter((item): item is string => Boolean(item));
  if (!types.length) return null;
  const counts = new Map<string, number>();
  types.forEach((type) => counts.set(type, (counts.get(type) ?? 0) + 1));
  return [...counts].sort(([a], [b]) => a.localeCompare(b)).map(([type, count]) => `${count}x${type}`).join("; ");
}

function equipmentEqual(a: unknown, b: unknown) {
  const aContainers = containers(a); const bContainers = containers(b);
  if (aContainers.length && bContainers.length) return containerEqual(a, b);
  const aSummary = equipmentSummary(a); const bSummary = equipmentSummary(b);
  return Boolean(aSummary && bSummary && aSummary === bSummary);
}

function containerDetail(value: unknown, key: "seal_no" | "iso_type" | "packages" | "gross_kg" | "volume_cbm") {
  if (!Array.isArray(value)) return null;
  const rows = value.flatMap((item) => item && typeof item === "object" ? [{
    container: normalizeContainerNo(String((item as Record<string, unknown>).container_no ?? "")),
    value: printable((item as Record<string, unknown>)[key]),
  }] : []).filter((item) => item.container && item.value).sort((a, b) => a.container.localeCompare(b.container));
  return rows.length ? rows.map((item) => `${item.container}:${item.value}`).join("; ") : null;
}

function cargoText(value: unknown) {
  if (!Array.isArray(value)) return null;
  return value.map((item) => item && typeof item === "object" ? ["description", "marks", "hs_code"].map((key) => printable((item as Record<string, unknown>)[key])).filter(Boolean).join(" · ") : null).filter(Boolean).join(" | ") || null;
}

function lineCodes(item: Record<string, unknown>) {
  return [...new Set([item.product_code, item.buyer_product_code, item.seller_product_code].map(canon).filter((value): value is string => Boolean(value)))];
}

function descriptionScore(a: unknown, b: unknown) {
  const left = printable(a); const right = printable(b);
  if (!left || !right) return 0;
  const words = (value: string) => new Set(normalizeName(value).split(/\s+/).filter((word) => word.length > 2));
  const aw = words(left); const bw = words(right);
  const union = new Set([...aw, ...bw]);
  const overlap = union.size ? [...aw].filter((word) => bw.has(word)).length / union.size : 0;
  return Math.max(overlap, similarity(left, right));
}

function lineMatchScore(a: LineItem, b: LineItem) {
  const aCodes = lineCodes(a as unknown as Record<string, unknown>);
  const bCodes = new Set(lineCodes(b as unknown as Record<string, unknown>));
  if (aCodes.some((code) => bCodes.has(code))) return 1;
  const descriptions = descriptionScore(a.description, b.description);
  const hsMatches = Boolean(a.hs_code && b.hs_code && canon(a.hs_code) === canon(b.hs_code));
  if (hsMatches && descriptions >= 0.35) return Math.max(0.82, descriptions);
  if (descriptions >= 0.58) return descriptions;
  return 0;
}

const UOM: Record<string, { unit: string; factor: number }> = {
  EA: { unit: "EA", factor: 1 }, EACH: { unit: "EA", factor: 1 }, PC: { unit: "EA", factor: 1 }, PCS: { unit: "EA", factor: 1 }, PIECE: { unit: "EA", factor: 1 }, PIECES: { unit: "EA", factor: 1 },
  CTN: { unit: "CTN", factor: 1 }, CTNS: { unit: "CTN", factor: 1 }, CARTON: { unit: "CTN", factor: 1 }, CARTONS: { unit: "CTN", factor: 1 },
  PKG: { unit: "PKG", factor: 1 }, PKGS: { unit: "PKG", factor: 1 }, PACKAGE: { unit: "PKG", factor: 1 }, PACKAGES: { unit: "PKG", factor: 1 },
  KG: { unit: "KG", factor: 1 }, KGS: { unit: "KG", factor: 1 }, KILOGRAM: { unit: "KG", factor: 1 }, KILOGRAMS: { unit: "KG", factor: 1 },
  MT: { unit: "KG", factor: 1000 }, TONNE: { unit: "KG", factor: 1000 }, TONNES: { unit: "KG", factor: 1000 },
  LB: { unit: "KG", factor: 0.45359237 }, LBS: { unit: "KG", factor: 0.45359237 }, POUND: { unit: "KG", factor: 0.45359237 }, POUNDS: { unit: "KG", factor: 0.45359237 },
  CBM: { unit: "CBM", factor: 1 }, M3: { unit: "CBM", factor: 1 },
};

function normalizedUom(value: string | null | undefined) {
  if (!value) return null;
  const key = value.toUpperCase().replace(/[^A-Z0-9]/g, "");
  return UOM[key] ?? { unit: key, factor: 1 };
}

function summed(items: LineItem[], field: keyof LineItem) {
  const values = items.map((item) => item[field]).filter((value): value is number => typeof value === "number");
  return values.length === items.length && values.length > 0 ? values.reduce((total, value) => total + value, 0) : null;
}

function summedQuantity(items: LineItem[], targetUom: string | null) {
  if (!items.length || items.some((item) => typeof item.quantity !== "number")) return null;
  const target = normalizedUom(targetUom);
  const converted = items.map((item) => {
    const source = normalizedUom(item.uom);
    if (!target && !source) return item.quantity!;
    if (!target || !source || target.unit !== source.unit) return null;
    return item.quantity! * source.factor / target.factor;
  });
  return converted.every((value): value is number => typeof value === "number") ? converted.reduce((total, value) => total + value, 0) : null;
}

function quantityEqual(a: unknown, b: unknown, policy: MatchPolicy) {
  if (typeof a !== "number" || typeof b !== "number") return false;
  const allowance = Math.max(Math.abs(a), Math.abs(b)) * policy.quantity_percent / 100;
  return Math.abs(a - b) <= allowance;
}

function chargeKey(item: Record<string, unknown>) {
  return canon(item.charge_code ?? item.description);
}

function extendedCharge(item: { amount?: number | null; rate?: number | null; quantity?: number | null }) {
  if (typeof item.amount === "number") return item.amount;
  return typeof item.rate === "number" && typeof item.quantity === "number" ? item.rate * item.quantity : null;
}

function amountEqual(a: unknown, b: unknown, policy: MatchPolicy) {
  if (typeof a !== "number" || typeof b !== "number") return false;
  const tolerance = Math.max(policy.amount_absolute, Math.max(Math.abs(a), Math.abs(b)) * policy.amount_percent / 100);
  return Math.abs(a - b) <= tolerance;
}

function dgSummary(value: DangerousGoodsItem[]) {
  const rows = value.map((item) => [
    canon(item.un_number), canon(item.proper_shipping_name), canon(item.hazard_class), canon(item.packing_group),
  ].filter(Boolean).join(":" )).filter(Boolean).sort();
  return rows.length ? rows.join("; ") : null;
}

function dateOnly(value: unknown) {
  const printed = printable(value);
  return printed?.match(/\d{4}-\d{2}-\d{2}/)?.[0] ?? null;
}

function sameDate(a: unknown, b: unknown) {
  const left = dateOnly(a); const right = dateOnly(b);
  return Boolean(left && right && left === right);
}

function push(target: MatchRuleResult[], item: MatchRuleResult | null) { if (item) target.push(item); }

export function runFlagshipWorkflowRules(docs: ShipmentDoc[], policy: MatchPolicy): MatchRuleResult[] {
  const rules: MatchRuleResult[] = [];
  const bookings: Located<BookingConfirmationFields>[] = [];
  const sis: Located<ShippingInstructionsFields>[] = [];
  const bls: Located<BillOfLadingFields>[] = [];
  const invoices: Located<CommercialInvoiceFields>[] = [];
  const packing: Located<PackingListFields>[] = [];
  const origins: Located<CertificateOfOriginFields>[] = [];
  const rates: Located<QuotationFields>[] = [];
  const freight: Located<FreightInvoiceFields>[] = [];
  const arrivals: Array<Located<Record<string, unknown>>> = [];
  const events: Array<Located<Record<string, unknown>>> = [];
  const ddInvoices: Located<FreightInvoiceFields>[] = [];
  const airWaybills: Located<AirWaybillFields>[] = [];
  const airSlis: Located<ShipperLetterOfInstructionFields>[] = [];
  const dgds: Located<DangerousGoodsDeclarationFields>[] = [];
  const airManifests: Located<AirCargoManifestFields>[] = [];
  const securityDeclarations: Located<CargoSecurityDeclarationFields>[] = [];

  for (const doc of docs) {
    const item = { id: doc.id, f: doc.extraction.fields };
    switch (doc.extraction.detected_type) {
      case "booking_confirmation": bookings.push(item as Located<BookingConfirmationFields>); break;
      case "shipping_instructions": sis.push(item as Located<ShippingInstructionsFields>); break;
      case "bill_of_lading": case "sea_waybill": bls.push(item as Located<BillOfLadingFields>); break;
      case "commercial_invoice": invoices.push(item as Located<CommercialInvoiceFields>); break;
      case "packing_list": packing.push(item as Located<PackingListFields>); break;
      case "certificate_of_origin": origins.push(item as Located<CertificateOfOriginFields>); break;
      case "quotation": case "rate_confirmation": rates.push(item as Located<QuotationFields>); break;
      case "freight_invoice": freight.push(item as Located<FreightInvoiceFields>); break;
      case "arrival_notice": arrivals.push(item as unknown as Located<Record<string, unknown>>); break;
      case "container_event": events.push(item as unknown as Located<Record<string, unknown>>); break;
      case "demurrage_detention_invoice": ddInvoices.push(item as Located<FreightInvoiceFields>); break;
      case "air_waybill": airWaybills.push(item as Located<AirWaybillFields>); break;
      case "shipper_letter_of_instruction": airSlis.push(item as Located<ShipperLetterOfInstructionFields>); break;
      case "dangerous_goods_declaration": dgds.push(item as Located<DangerousGoodsDeclarationFields>); break;
      case "air_cargo_manifest": airManifests.push(item as Located<AirCargoManifestFields>); break;
      case "cargo_security_declaration": securityDeclarations.push(item as Located<CargoSecurityDeclarationFields>); break;
    }
  }

  const common = [
    ["booking_reference", "identity", "critical", "Booking reference", "booking_no", "booking_no", refsEqual],
    ["shipper", "party", "critical", "Shipper", "shipper", "shipper", partyEqual],
    ["vessel", "route", "warning", "Vessel", "vessel_name", "vessel_name", undefined],
    ["voyage", "route", "warning", "Voyage", "voyage_no", "voyage_no", undefined],
    ["port_of_load", "route", "critical", "Port of loading", "port_of_load", "port_of_load", portEqual],
    ["port_of_discharge", "route", "critical", "Port of discharge", "port_of_discharge", "port_of_discharge", portEqual],
    ["place_of_receipt", "route", "warning", "Place of receipt", "place_of_receipt", "place_of_receipt", undefined],
    ["place_of_delivery", "route", "warning", "Place of delivery", "place_of_delivery", "place_of_delivery", undefined],
    ["packages", "quantity", "warning", "Package total", "total_packages", "total_packages", undefined],
    ["gross_weight", "quantity", "warning", "Gross weight", "total_gross_kg", "total_gross_kg", (a: unknown, b: unknown) => typeof a === "number" && typeof b === "number" && withinTolerance(a, b)],
  ] as const;

  for (const booking of bookings) for (const si of sis) for (const [rule, category, severity, label, fieldA, fieldB, equal] of common) {
    push(rules, compare({ workflow: "export_document_check", rule: `booking_si.${rule}`, category, severity, label, a: booking, b: si, fieldA, fieldB, valueA: booking.f[fieldA], valueB: si.f[fieldB], equal }));
  }
  for (const booking of bookings) for (const bl of bls.filter((item) => item.f.document_stage === "draft")) {
    for (const [rule, category, severity, label, fieldA, fieldB, equal] of [
      ...common,
      ["equipment", "logistics", "critical", "Booked equipment", "equipment", "containers", equipmentEqual],
      ["commodity", "logistics", "warning", "Booked commodity", "commodity", "cargo", (a: unknown, b: unknown) => descriptionScore(a, cargoText(b)) >= 0.45],
    ] as const) push(rules, compare({ workflow: "export_document_check", rule: `booking_draft_bl.${rule}`, category, severity, label, a: booking, b: bl, fieldA, fieldB, valueA: booking.f[fieldA], valueB: bl.f[fieldB], equal }));
  }
  for (const si of sis) for (const bl of bls.filter((item) => item.f.document_stage === "draft")) {
    const pairs = [
      ...common.map(([rule, category, severity, label, , fieldB, equal]) => [rule, category, severity, label, fieldB, fieldB, equal] as const),
      ["consignee", "party", "critical", "Consignee", "consignee", "consignee", partyEqual] as const,
      ["notify", "party", "warning", "Notify party", "notify", "notify", partyEqual] as const,
      ["containers", "logistics", "critical", "Container numbers", "containers", "containers", containerEqual] as const,
      ["net_weight", "quantity", "warning", "Net weight", "total_net_kg", "total_net_kg", (a: unknown, b: unknown) => typeof a === "number" && typeof b === "number" && withinTolerance(a, b)] as const,
      ["volume", "quantity", "warning", "Cargo volume", "total_volume_cbm", "total_volume_cbm", (a: unknown, b: unknown) => typeof a === "number" && typeof b === "number" && withinTolerance(a, b)] as const,
      ["freight_terms", "logistics", "critical", "Freight terms", "freight_terms", "freight_terms", undefined] as const,
      ["release_type", "logistics", "warning", "Requested B/L release type", "requested_bl_type", "bl_type", undefined] as const,
    ];
    for (const [rule, category, severity, label, fieldA, fieldB, equal] of pairs) push(rules, compare({ workflow: "export_document_check", rule: `si_draft_bl.${rule}`, category, severity, label, a: si, b: bl, fieldA, fieldB, valueA: si.f[fieldA], valueB: bl.f[fieldB], equal }));
    for (const key of ["seal_no", "iso_type", "packages", "gross_kg", "volume_cbm"] as const) push(rules, compare({
      workflow: "export_document_check", rule: `si_draft_bl.container_${key}`, category: "logistics", severity: key === "seal_no" ? "critical" : "warning",
      label: `Container ${key.replace(/_/g, " ")}`, a: si, b: bl, fieldA: "containers", fieldB: "containers",
      valueA: containerDetail(si.f.containers, key), valueB: containerDetail(bl.f.containers, key),
    }));
    push(rules, compare({ workflow: "export_document_check", rule: "si_draft_bl.cargo_description", category: "logistics", severity: "warning", label: "Cargo description", a: si, b: bl, fieldA: "cargo", fieldB: "cargo", valueA: cargoText(si.f.cargo), valueB: cargoText(bl.f.cargo) }));
  }

  const drafts = bls.filter((item) => item.f.document_stage === "draft");
  const finals = bls.filter((item) => item.f.document_stage === "final");
  for (const draft of drafts) for (const final of finals) for (const spec of [
    ["reference", "identity", "critical", "B/L reference", "bl_number", "bl_number", refsEqual],
    ["shipper", "party", "critical", "Shipper", "shipper", "shipper", partyEqual],
    ["consignee", "party", "critical", "Consignee", "consignee", "consignee", partyEqual],
    ["notify", "party", "warning", "Notify party", "notify", "notify", partyEqual],
    ["vessel", "route", "warning", "Vessel", "vessel_name", "vessel_name", undefined],
    ["voyage", "route", "warning", "Voyage", "voyage_no", "voyage_no", undefined],
    ["port_of_load", "route", "critical", "Port of loading", "port_of_load", "port_of_load", portEqual],
    ["port_of_discharge", "route", "critical", "Port of discharge", "port_of_discharge", "port_of_discharge", portEqual],
    ["place_of_receipt", "route", "warning", "Place of receipt", "place_of_receipt", "place_of_receipt", undefined],
    ["place_of_delivery", "route", "warning", "Place of delivery", "place_of_delivery", "place_of_delivery", undefined],
    ["containers", "logistics", "critical", "Container numbers", "containers", "containers", containerEqual],
    ["packages", "quantity", "warning", "Package total", "total_packages", "total_packages", undefined],
    ["net_weight", "quantity", "warning", "Net weight", "total_net_kg", "total_net_kg", (a: unknown, b: unknown) => typeof a === "number" && typeof b === "number" && withinTolerance(a, b)],
    ["gross_weight", "quantity", "warning", "Gross weight", "total_gross_kg", "total_gross_kg", (a: unknown, b: unknown) => typeof a === "number" && typeof b === "number" && withinTolerance(a, b)],
    ["volume", "quantity", "warning", "Cargo volume", "total_volume_cbm", "total_volume_cbm", (a: unknown, b: unknown) => typeof a === "number" && typeof b === "number" && withinTolerance(a, b)],
    ["freight_terms", "logistics", "critical", "Freight terms", "freight_terms", "freight_terms", undefined],
    ["release_type", "logistics", "critical", "B/L release type", "bl_type", "bl_type", undefined],
    ["originals", "logistics", "warning", "Originals count", "originals_count", "originals_count", undefined],
    ["cargo", "logistics", "warning", "Cargo descriptions, marks and HS codes", "cargo", "cargo", (a: unknown, b: unknown) => descriptionScore(cargoText(a), cargoText(b)) >= 0.58],
  ] as const) {
    const [rule, category, severity, label, fieldA, fieldB, equal] = spec;
    push(rules, compare({ workflow: "export_document_check", rule: `draft_final.${rule}`, category, severity, label, a: draft, b: final, fieldA, fieldB, valueA: draft.f[fieldA], valueB: final.f[fieldB], equal }));
  }
  for (const draft of drafts) for (const final of finals) for (const key of ["seal_no", "iso_type", "packages", "gross_kg", "volume_cbm"] as const) push(rules, compare({ workflow: "export_document_check", rule: `draft_final.container_${key}`, category: "logistics", severity: key === "seal_no" ? "critical" : "warning", label: `Container ${key.replace(/_/g, " ")}`, a: draft, b: final, fieldA: "containers", fieldB: "containers", valueA: containerDetail(draft.f.containers, key), valueB: containerDetail(final.f.containers, key) }));

  for (const invoice of invoices) for (const list of packing) {
    const groups = new Map<number, Array<{ item: LineItem; index: number; score: number }>>();
    const unmatchedPacking: Array<{ item: LineItem; index: number }> = [];
    list.f.line_items.forEach((item, index) => {
      let best: { invoiceIndex: number; score: number } | null = null;
      for (let invoiceIndex = 0; invoiceIndex < invoice.f.line_items.length; invoiceIndex += 1) {
        const candidate = invoice.f.line_items[invoiceIndex];
        const score = lineMatchScore(candidate, item);
        if (score > 0 && (!best || score > best.score)) best = { invoiceIndex, score };
      }
      if (!best) unmatchedPacking.push({ item, index });
      else groups.set(best.invoiceIndex, [...(groups.get(best.invoiceIndex) ?? []), { item, index, score: best.score }]);
    });

    unmatchedPacking.forEach(({ item, index }) => rules.push({ workflow: "shipment_document_check", rule_id: `shipment_document_check.invoice_packing.missing_line.${invoice.id}.${list.id}.${index}`, category: "quantity", status: "review", severity: "warning", label: "Packing-list line", message: "Packing-list line has no reliable commercial-invoice SKU, HS-code or description match", doc_a: invoice.id, doc_b: list.id, field_a: "line_items", field_b: `line_items[${index}]`, value_a: null, value_b: printable(item.product_code ?? item.description) }));

    invoice.f.line_items.forEach((item, invoiceIndex) => {
      const matched = groups.get(invoiceIndex) ?? [];
      if (!matched.length) {
        rules.push({ workflow: "shipment_document_check", rule_id: `shipment_document_check.invoice_packing.invoice_line_missing.${invoice.id}.${list.id}.${invoiceIndex}`, category: "quantity", status: "review", severity: "warning", label: "Commercial-invoice line", message: "Commercial-invoice line has no reliable packing-list SKU, HS-code or description match", doc_a: invoice.id, doc_b: list.id, field_a: `line_items[${invoiceIndex}]`, field_b: "line_items", value_a: printable(item.product_code ?? item.description), value_b: null });
        return;
      }
      const packingItems = matched.map((entry) => entry.item);
      const packingIndexes = matched.map((entry) => entry.index);
      const key = canon(item.product_code ?? item.buyer_product_code ?? item.seller_product_code ?? item.description) ?? String(invoiceIndex + 1);
      const fieldB = (field: string) => packingIndexes.length === 1 ? `line_items[${packingIndexes[0]}].${field}` : "line_items";
      const label = printable(item.product_code ?? item.description) ?? `Line ${invoiceIndex + 1}`;
      const invoiceCodes = lineCodes(item as unknown as Record<string, unknown>);
      const packingCodes = [...new Set(packingItems.flatMap((line) => lineCodes(line as unknown as Record<string, unknown>)))];
      if (invoiceCodes.length && packingCodes.length) push(rules, compare({ workflow: "shipment_document_check", rule: `invoice_packing.${key}.sku_alias`, category: "identity", severity: "critical", label: `Line ${label} SKU/alias`, a: invoice, b: list, fieldA: `line_items[${invoiceIndex}].product_code`, fieldB: fieldB("product_code"), valueA: invoiceCodes, valueB: packingCodes, equal: refsEqual }));

      const packedQuantity = summedQuantity(packingItems, item.uom);
      push(rules, compare({ workflow: "shipment_document_check", rule: `invoice_packing.${key}.quantity`, category: "quantity", severity: "critical", label: `Line ${label} quantity`, a: invoice, b: list, fieldA: `line_items[${invoiceIndex}].quantity`, fieldB: fieldB("quantity"), valueA: item.quantity, valueB: packedQuantity, equal: (a, b) => quantityEqual(a, b, policy), mismatch: packedQuantity === null ? "Packing-list quantity UOM cannot be safely converted to the invoice UOM" : "Aggregated packing-list quantity differs from the commercial invoice" }));
      for (const field of ["packages", "cartons", "net_kg", "gross_kg", "volume_cbm"] as const) {
        const invoiceValue = field === "cartons" ? item.cartons ?? item.packages : item[field];
        const packedValue = field === "packages" ? summed(packingItems, "packages") ?? summed(packingItems, "cartons") : summed(packingItems, field);
        push(rules, compare({ workflow: "shipment_document_check", rule: `invoice_packing.${key}.${field}`, category: "quantity", severity: "warning", label: `Line ${label} ${field.replace(/_/g, " ")}`, a: invoice, b: list, fieldA: `line_items[${invoiceIndex}].${field}`, fieldB: fieldB(field), valueA: invoiceValue, valueB: packedValue, equal: (a, b) => quantityEqual(a, b, policy) }));
      }
      const packedHs = [...new Set(packingItems.map((line) => line.hs_code).filter((value): value is string => Boolean(value)))];
      push(rules, compare({ workflow: "shipment_document_check", rule: `invoice_packing.${key}.hs_code`, category: "identity", severity: "warning", label: `Line ${label} HS code`, a: invoice, b: list, fieldA: `line_items[${invoiceIndex}].hs_code`, fieldB: fieldB("hs_code"), valueA: item.hs_code, valueB: packedHs, equal: refsEqual }));
      const packedDescriptions = [...new Set(packingItems.map((line) => line.description).filter((value): value is string => Boolean(value)))];
      push(rules, compare({ workflow: "shipment_document_check", rule: `invoice_packing.${key}.description`, category: "identity", severity: "warning", label: `Line ${label} description`, a: invoice, b: list, fieldA: `line_items[${invoiceIndex}].description`, fieldB: fieldB("description"), valueA: item.description, valueB: packedDescriptions, equal: (a, b) => descriptionScore(a, b) >= 0.58 }));
      const packedMarks = [...new Set(packingItems.map((line) => line.marks).filter((value): value is string => Boolean(value)))];
      push(rules, compare({ workflow: "shipment_document_check", rule: `invoice_packing.${key}.marks`, category: "identity", severity: "warning", label: `Line ${label} marks`, a: invoice, b: list, fieldA: `line_items[${invoiceIndex}].marks`, fieldB: fieldB("marks"), valueA: item.marks, valueB: packedMarks, equal: refsEqual }));
      const packedAmount = summed(packingItems, "amount");
      push(rules, compare({ workflow: "shipment_document_check", rule: `invoice_packing.${key}.amount`, category: "amount", severity: "warning", label: `Line ${label} value`, a: invoice, b: list, fieldA: `line_items[${invoiceIndex}].amount`, fieldB: fieldB("amount"), valueA: item.amount, valueB: packedAmount, equal: (a, b) => amountEqual(a, b, policy) }));
    });
  }

  for (const origin of origins) for (const invoice of invoices) {
    for (const spec of [
      ["invoice_reference", "identity", "critical", "Invoice reference", "invoice_refs", "invoice_no", refsEqual],
      ["exporter", "party", "critical", "Exporter/seller", "exporter", "seller", partyEqual],
      ["consignee", "party", "warning", "Consignee/buyer", "consignee", "buyer", partyEqual],
      ["country_of_origin", "identity", "critical", "Country of origin", "country_of_origin", "country_of_origin", undefined],
    ] as const) {
      const [rule, category, severity, label, fieldA, fieldB, equal] = spec;
      push(rules, compare({ workflow: "shipment_document_check", rule: `origin_invoice.${rule}`, category, severity, label, a: origin, b: invoice, fieldA, fieldB, valueA: origin.f[fieldA], valueB: invoice.f[fieldB], equal }));
    }
  }

  for (const rate of rates) for (const booking of bookings) for (const [rule, category, severity, label, fieldA, fieldB, equal] of [
    ["booking_reference", "identity", "critical", "Rate booking reference", "booking_refs", "booking_no", refsEqual],
    ["carrier", "party", "critical", "Contracted carrier", "carrier", "carrier_name", partyEqual],
    ["port_of_load", "route", "critical", "Contracted port of loading", "port_of_load", "port_of_load", portEqual],
    ["port_of_discharge", "route", "critical", "Contracted port of discharge", "port_of_discharge", "port_of_discharge", portEqual],
    ["equipment", "logistics", "warning", "Contracted equipment", "equipment", "equipment", equipmentEqual],
  ] as const) push(rules, compare({ workflow: "freight_invoice_audit", rule: `rate_booking.${rule}`, category, severity, label, a: rate, b: booking, fieldA, fieldB, valueA: rate.f[fieldA], valueB: booking.f[fieldB], equal }));

  for (const booking of bookings) for (const invoice of freight) for (const [rule, category, severity, label, fieldA, fieldB, equal] of [
    ["reference", "identity", "critical", "Booking reference", "booking_no", "booking_refs", refsEqual],
    ["carrier", "party", "critical", "Carrier", "carrier_name", "carrier", partyEqual],
    ["vessel", "route", "warning", "Vessel", "vessel_name", "vessel_name", undefined],
    ["voyage", "route", "warning", "Voyage", "voyage_no", "voyage_no", undefined],
    ["port_of_load", "route", "critical", "Port of loading", "port_of_load", "port_of_load", portEqual],
    ["port_of_discharge", "route", "critical", "Port of discharge", "port_of_discharge", "port_of_discharge", portEqual],
    ["containers", "logistics", "critical", "Billed containers", "equipment", "container_refs", containerEqual],
  ] as const) push(rules, compare({ workflow: "freight_invoice_audit", rule: `booking_invoice.${rule}`, category, severity, label, a: booking, b: invoice, fieldA, fieldB, valueA: booking.f[fieldA], valueB: invoice.f[fieldB], equal }));

  for (const rate of rates) for (const invoice of freight) {
    push(rules, compare({ workflow: "freight_invoice_audit", rule: "rate_invoice.currency", category: "amount", severity: "critical", label: "Billing currency", a: rate, b: invoice, fieldA: "currency", fieldB: "currency", valueA: rate.f.currency, valueB: invoice.f.currency }));
    push(rules, compare({ workflow: "freight_invoice_audit", rule: "rate_invoice.subtotal", category: "amount", severity: "critical", label: "Agreed freight subtotal", a: rate, b: invoice, fieldA: "subtotal", fieldB: "subtotal", valueA: rate.f.subtotal, valueB: invoice.f.subtotal, equal: (a, b) => amountEqual(a, b, policy), mismatch: "Freight-invoice subtotal differs from the agreed rate", questionedAmount: rate.f.charges.length === 0 && invoice.f.charges.length === 0 && typeof rate.f.subtotal === "number" && typeof invoice.f.subtotal === "number" ? Math.max(0, invoice.f.subtotal - rate.f.subtotal) : undefined, questionedCurrency: invoice.f.currency }));
    const approved = new Set(rate.f.charges.map((charge) => canon(charge.charge_code ?? charge.description)).filter(Boolean));
    invoice.f.charges.forEach((charge, index) => {
      const code = canon(charge.charge_code ?? charge.description);
      if (code && approved.size && !approved.has(code)) rules.push({
        workflow: "freight_invoice_audit", rule_id: `freight_invoice_audit.unapproved_charge.${invoice.id}.${index}`,
        category: "amount", status: "review", severity: "warning", label: "Unapproved accessorial",
        message: "This freight-invoice charge is not present on the attached quotation/rate agreement",
        doc_a: rate.id, doc_b: invoice.id, field_a: "charges", field_b: `charges[${index}]`,
        value_a: [...approved].join(", "), value_b: printable(charge.charge_code ?? charge.description),
        questioned_amount: extendedCharge(charge) ?? undefined, questioned_currency: charge.currency ?? invoice.f.currency,
      });
      const agreedIndex = rate.f.charges.findIndex((item) => chargeKey(item as unknown as Record<string, unknown>) === code);
      const agreed = agreedIndex >= 0 ? rate.f.charges[agreedIndex] : null;
      if (agreed) for (const field of ["rate", "quantity", "amount", "currency", "tax_rate", "tax_amount"] as const) push(rules, compare({ workflow: "freight_invoice_audit", rule: `rate_invoice.charge_${index}.${field}`, category: "amount", severity: field.startsWith("tax_") ? "warning" : "critical", label: `${printable(charge.charge_code ?? charge.description) ?? `Charge ${index + 1}`} ${field.replace(/_/g, " ")}`, a: rate, b: invoice, fieldA: `charges[${agreedIndex}].${field}`, fieldB: `charges[${index}].${field}`, valueA: agreed[field], valueB: charge[field], equal: field === "currency" ? undefined : (a, b) => amountEqual(a, b, policy), mismatch: `${field.replace(/_/g, " ")} differs from the agreed charge line`, questionedAmount: field === "amount" && extendedCharge(agreed) !== null && extendedCharge(charge) !== null ? Math.max(0, extendedCharge(charge)! - extendedCharge(agreed)!) : undefined, questionedCurrency: charge.currency ?? invoice.f.currency }));
    });
  }

  for (const invoice of freight) {
    const seenCharges = new Map<string, number>();
    invoice.f.charges.forEach((charge, index) => {
      const signature = [chargeKey(charge as unknown as Record<string, unknown>), canon(charge.container_no), charge.amount, canon(charge.currency)].join("|");
      if (signature.replace(/\|/g, "")) {
        const previous = seenCharges.get(signature);
        if (previous !== undefined) rules.push({ workflow: "freight_invoice_audit", rule_id: `freight_invoice_audit.duplicate_charge.${invoice.id}.${index}`, category: "amount", status: "fail", severity: "critical", label: "Possible duplicate charge", message: "The same charge, container, amount and currency appear more than once on this invoice", doc_a: invoice.id, doc_b: invoice.id, field_a: `charges[${previous}]`, field_b: `charges[${index}]`, value_a: printable(invoice.f.charges[previous].description ?? invoice.f.charges[previous].charge_code), value_b: printable(charge.description ?? charge.charge_code), questioned_amount: extendedCharge(charge) ?? undefined, questioned_currency: charge.currency ?? invoice.f.currency });
        else seenCharges.set(signature, index);
      }
      if (charge.uom && /KG|CBM|W\/M|WEIGHT|VOLUME/i.test(charge.uom)) rules.push({ workflow: "freight_invoice_audit", rule_id: `freight_invoice_audit.basis_review.${invoice.id}.${index}`, category: "amount", status: "review", severity: "warning", label: "Weight/CBM charge basis", message: "Verify this measured charge basis against the B/L and packing-list totals", doc_a: invoice.id, doc_b: null, field_a: `charges[${index}].uom`, field_b: null, value_a: `${charge.quantity ?? "?"} ${charge.uom} @ ${charge.rate ?? "?"}`, value_b: null });
    });
    for (const bl of bls) {
      push(rules, compare({ workflow: "freight_invoice_audit", rule: "invoice_bl.reference", category: "identity", severity: "critical", label: "B/L reference", a: bl, b: invoice, fieldA: "bl_number", fieldB: "bl_numbers", valueA: bl.f.bl_number, valueB: invoice.f.bl_numbers, equal: refsEqual }));
      push(rules, compare({ workflow: "freight_invoice_audit", rule: "invoice_bl.containers", category: "logistics", severity: "critical", label: "Billed container count", a: bl, b: invoice, fieldA: "containers", fieldB: "container_refs", valueA: bl.f.containers, valueB: invoice.f.container_refs, equal: containerEqual }));
      invoice.f.charges.forEach((charge, index) => {
        const basis = normalizedUom(charge.uom);
        if (!basis || typeof charge.quantity !== "number" || !["KG", "CBM"].includes(basis.unit)) return;
        const expected = basis.unit === "KG" ? bl.f.total_gross_kg : bl.f.total_volume_cbm;
        const observed = charge.quantity * basis.factor;
        push(rules, compare({ workflow: "freight_invoice_audit", rule: `invoice_bl.billing_basis_${index}`, category: "amount", severity: "critical", label: `${basis.unit} billing basis`, a: bl, b: invoice, fieldA: basis.unit === "KG" ? "total_gross_kg" : "total_volume_cbm", fieldB: `charges[${index}].quantity`, valueA: expected, valueB: observed, equal: (a, b) => quantityEqual(a, b, policy), mismatch: `Billed ${basis.unit} basis differs from the transport-document total`, questionedAmount: extendedCharge(charge) ?? undefined, questionedCurrency: charge.currency ?? invoice.f.currency }));
      });
    }
  }
  for (let i = 0; i < freight.length; i += 1) for (let j = i + 1; j < freight.length; j += 1) {
    const a = freight[i]; const b = freight[j];
    if (a.f.invoice_no && b.f.invoice_no && canon(a.f.invoice_no) === canon(b.f.invoice_no)) rules.push({ workflow: "freight_invoice_audit", rule_id: `freight_invoice_audit.duplicate_invoice.${a.id}.${b.id}`, category: "amount", status: "fail", severity: "critical", label: "Duplicate freight invoice", message: "Two connected documents use the same freight-invoice number", doc_a: a.id, doc_b: b.id, field_a: "invoice_no", field_b: "invoice_no", value_a: a.f.invoice_no, value_b: b.f.invoice_no, questioned_amount: b.f.total_amount ?? b.f.amount_due ?? undefined, questioned_currency: b.f.currency });
  }

  for (const arrival of arrivals) {
    const arrivalContainers = arrival.f.containers;
    for (const event of events) push(rules, compare({ workflow: "arrival_free_time_control", rule: "arrival_event.container", category: "logistics", severity: "critical", label: "Container number", a: arrival, b: event, fieldA: "containers", fieldB: "container_no", valueA: arrivalContainers, valueB: [event.f.container_no], equal: containerOverlap }));
    for (const invoice of ddInvoices) {
      push(rules, compare({ workflow: "arrival_free_time_control", rule: "arrival_dd.bl", category: "identity", severity: "critical", label: "B/L reference", a: arrival, b: invoice, fieldA: "bl_number", fieldB: "bl_numbers", valueA: arrival.f.bl_number, valueB: invoice.f.bl_numbers, equal: refsEqual }));
      push(rules, compare({ workflow: "arrival_free_time_control", rule: "arrival_dd.containers", category: "logistics", severity: "critical", label: "D&D invoice containers", a: arrival, b: invoice, fieldA: "containers", fieldB: "container_refs", valueA: arrivalContainers, valueB: invoice.f.container_refs, equal: containerEqual }));
      const relevantEvents = events.filter((event) => !invoice.f.container_refs.length || containerOverlap(invoice.f.container_refs, [event.f.container_no]));
      const startEvent = relevantEvents.filter((event) => event.f.event_type === "available" || event.f.event_type === "discharged").sort((a, b) => String(a.f.event_timestamp).localeCompare(String(b.f.event_timestamp)))[0];
      const endEvent = relevantEvents.filter((event) => event.f.event_type === "empty_return" || event.f.event_type === "full_gate_out").sort((a, b) => String(b.f.event_timestamp).localeCompare(String(a.f.event_timestamp)))[0];
      if (startEvent) push(rules, compare({ workflow: "arrival_free_time_control", rule: "event_dd.period_start", category: "date", severity: "critical", label: "Charged period start", a: startEvent, b: invoice, fieldA: "event_timestamp", fieldB: "service_period_start", valueA: startEvent.f.event_timestamp, valueB: invoice.f.service_period_start, equal: sameDate }));
      if (endEvent) push(rules, compare({ workflow: "arrival_free_time_control", rule: "event_dd.period_end", category: "date", severity: "critical", label: "Charged period end", a: endEvent, b: invoice, fieldA: "event_timestamp", fieldB: "service_period_end", valueA: endEvent.f.event_timestamp, valueB: invoice.f.service_period_end, equal: sameDate }));
      const lastFreeDay = dateOnly(arrival.f.last_free_day); const billedStart = dateOnly(invoice.f.service_period_start);
      if (lastFreeDay && billedStart) rules.push({ workflow: "arrival_free_time_control", rule_id: `arrival_free_time_control.arrival_dd.last_free_day.${arrival.id}.${invoice.id}`, category: "date", status: billedStart > lastFreeDay ? "pass" : "fail", severity: "critical", label: "Last-free-day billing boundary", message: billedStart > lastFreeDay ? "The charged period begins after the printed last free day" : "The charged period begins on or before the printed last free day", doc_a: arrival.id, doc_b: invoice.id, field_a: "last_free_day", field_b: "service_period_start", value_a: lastFreeDay, value_b: billedStart });
    }
  }

  // Air export preparation: compare the shipper's instructions and commercial set to the AWB.
  for (const sli of airSlis) for (const awb of airWaybills) {
    for (const [rule, category, severity, label, fieldA, fieldB, equal] of [
      ["shipper", "party", "critical", "Shipper", "shipper", "shipper", partyEqual],
      ["consignee", "party", "critical", "Consignee", "consignee", "consignee", partyEqual],
      ["origin", "route", "critical", "Origin airport", "origin_airport", "origin_airport", undefined],
      ["destination", "route", "critical", "Destination airport", "destination_airport", "destination_airport", undefined],
      ["pieces", "quantity", "critical", "Piece total", "total_pieces", "total_pieces", (a: unknown, b: unknown) => quantityEqual(a, b, policy)],
      ["gross_weight", "quantity", "critical", "Gross weight", "total_gross_kg", "total_gross_kg", (a: unknown, b: unknown) => quantityEqual(a, b, policy)],
      ["chargeable_weight", "quantity", "warning", "Chargeable weight", "total_chargeable_kg", "total_chargeable_kg", (a: unknown, b: unknown) => quantityEqual(a, b, policy)],
    ] as const) push(rules, compare({ workflow: "air_export_readiness", rule: `sli_awb.${rule}`, category, severity, label, a: sli, b: awb, fieldA, fieldB, valueA: sli.f[fieldA], valueB: awb.f[fieldB], equal }));
  }

  for (const awb of airWaybills) for (const list of packing) {
    push(rules, compare({ workflow: "air_export_readiness", rule: "awb_packing.pieces", category: "quantity", severity: "critical", label: "AWB and packing-list pieces", a: awb, b: list, fieldA: "total_pieces", fieldB: "total_cartons", valueA: awb.f.total_pieces, valueB: list.f.total_cartons, equal: (a, b) => quantityEqual(a, b, policy) }));
    push(rules, compare({ workflow: "air_export_readiness", rule: "awb_packing.gross_weight", category: "quantity", severity: "critical", label: "AWB and packing-list gross weight", a: awb, b: list, fieldA: "total_gross_kg", fieldB: "total_gross_kg", valueA: awb.f.total_gross_kg, valueB: list.f.total_gross_kg, equal: (a, b) => quantityEqual(a, b, policy) }));
  }
  for (const awb of airWaybills) for (const invoice of invoices) {
    push(rules, compare({ workflow: "air_export_readiness", rule: "awb_invoice.shipper", category: "party", severity: "critical", label: "AWB shipper and invoice seller", a: awb, b: invoice, fieldA: "shipper", fieldB: "seller", valueA: awb.f.shipper, valueB: invoice.f.seller, equal: partyEqual }));
    push(rules, compare({ workflow: "air_export_readiness", rule: "awb_invoice.consignee", category: "party", severity: "warning", label: "AWB consignee and invoice buyer", a: awb, b: invoice, fieldA: "consignee", fieldB: "buyer", valueA: awb.f.consignee, valueB: invoice.f.buyer, equal: partyEqual }));
  }

  // Consolidation control: route and total reconciliation between master, house and manifest records.
  const masters = airWaybills.filter((item) => item.f.awb_type === "master");
  const houses = airWaybills.filter((item) => item.f.awb_type === "house");
  for (const master of masters) for (const house of houses) {
    push(rules, compare({ workflow: "air_consolidation_check", rule: "mawb_hawb.parent", category: "identity", severity: "critical", label: "Master AWB reference", a: master, b: house, fieldA: "awb_number", fieldB: "master_awb_number", valueA: master.f.awb_number, valueB: house.f.master_awb_number, equal: refsEqual }));
    push(rules, compare({ workflow: "air_consolidation_check", rule: "mawb_hawb.origin", category: "route", severity: "critical", label: "Origin airport", a: master, b: house, fieldA: "origin_airport", fieldB: "origin_airport", valueA: master.f.origin_airport, valueB: house.f.origin_airport }));
    push(rules, compare({ workflow: "air_consolidation_check", rule: "mawb_hawb.destination", category: "route", severity: "critical", label: "Destination airport", a: master, b: house, fieldA: "destination_airport", fieldB: "destination_airport", valueA: master.f.destination_airport, valueB: house.f.destination_airport }));
  }
  if (masters.length && houses.length) {
    const master = masters[0]; const evidence = houses[0];
    for (const [field, label] of [["total_pieces", "House piece totals"], ["total_gross_kg", "House gross-weight totals"], ["total_chargeable_kg", "House chargeable-weight totals"]] as const) {
      const values = houses.map((item) => item.f[field]);
      const total = values.every((value) => typeof value === "number") ? (values as number[]).reduce((sum, value) => sum + value, 0) : null;
      push(rules, compare({ workflow: "air_consolidation_check", rule: `mawb_hawb.${field}_sum`, category: "quantity", severity: "critical", label, a: master, b: evidence, fieldA: field, fieldB: field, valueA: master.f[field], valueB: total, equal: (a, b) => quantityEqual(a, b, policy), mismatch: `${label} do not reconcile to the Master Air Waybill` }));
    }
  }
  for (const manifest of airManifests) for (const master of masters) {
    push(rules, compare({ workflow: "air_consolidation_check", rule: "manifest_mawb.reference", category: "identity", severity: "critical", label: "Manifest Master AWB", a: manifest, b: master, fieldA: "awb_numbers", fieldB: "awb_number", valueA: manifest.f.awb_numbers, valueB: master.f.awb_number, equal: refsEqual }));
    push(rules, compare({ workflow: "air_consolidation_check", rule: "manifest_mawb.origin", category: "route", severity: "critical", label: "Manifest origin airport", a: manifest, b: master, fieldA: "origin_airport", fieldB: "origin_airport", valueA: manifest.f.origin_airport, valueB: master.f.origin_airport }));
    push(rules, compare({ workflow: "air_consolidation_check", rule: "manifest_mawb.destination", category: "route", severity: "critical", label: "Manifest destination airport", a: manifest, b: master, fieldA: "destination_airport", fieldB: "destination_airport", valueA: manifest.f.destination_airport, valueB: master.f.destination_airport }));
  }

  // Airfreight cost leakage: AWB references, route and chargeable basis against the invoice and rate evidence.
  for (const awb of airWaybills) for (const invoice of freight) {
    push(rules, compare({ workflow: "air_freight_invoice_audit", rule: "invoice_awb.reference", category: "identity", severity: "critical", label: "Billed AWB reference", a: awb, b: invoice, fieldA: "awb_number", fieldB: "awb_numbers", valueA: awb.f.awb_number, valueB: invoice.f.awb_numbers, equal: refsEqual }));
    push(rules, compare({ workflow: "air_freight_invoice_audit", rule: "invoice_awb.origin", category: "route", severity: "critical", label: "Billed origin airport", a: awb, b: invoice, fieldA: "origin_airport", fieldB: "origin_airport", valueA: awb.f.origin_airport, valueB: invoice.f.origin_airport }));
    push(rules, compare({ workflow: "air_freight_invoice_audit", rule: "invoice_awb.destination", category: "route", severity: "critical", label: "Billed destination airport", a: awb, b: invoice, fieldA: "destination_airport", fieldB: "destination_airport", valueA: awb.f.destination_airport, valueB: invoice.f.destination_airport }));
    push(rules, compare({ workflow: "air_freight_invoice_audit", rule: "invoice_awb.chargeable_weight", category: "amount", severity: "critical", label: "Billed chargeable weight", a: awb, b: invoice, fieldA: "total_chargeable_kg", fieldB: "total_chargeable_kg", valueA: awb.f.total_chargeable_kg, valueB: invoice.f.total_chargeable_kg, equal: (a, b) => quantityEqual(a, b, policy), mismatch: "The invoice chargeable weight differs from the AWB" }));
    invoice.f.charges.forEach((charge, index) => {
      const basis = normalizedUom(charge.uom);
      if (!basis || basis.unit !== "KG" || typeof charge.quantity !== "number") return;
      push(rules, compare({ workflow: "air_freight_invoice_audit", rule: `invoice_awb.kg_basis_${index}`, category: "amount", severity: "critical", label: "Airfreight kilogram billing basis", a: awb, b: invoice, fieldA: "total_chargeable_kg", fieldB: `charges[${index}].quantity`, valueA: awb.f.total_chargeable_kg, valueB: charge.quantity * basis.factor, equal: (a, b) => quantityEqual(a, b, policy), mismatch: "The billed kilogram basis differs from the AWB chargeable weight", questionedAmount: extendedCharge(charge) ?? undefined, questionedCurrency: charge.currency ?? invoice.f.currency }));
    });
  }
  for (const rate of rates) for (const awb of airWaybills) {
    push(rules, compare({ workflow: "air_freight_invoice_audit", rule: "rate_awb.origin", category: "route", severity: "critical", label: "Quoted origin airport", a: rate, b: awb, fieldA: "origin_airport", fieldB: "origin_airport", valueA: rate.f.origin_airport, valueB: awb.f.origin_airport }));
    push(rules, compare({ workflow: "air_freight_invoice_audit", rule: "rate_awb.destination", category: "route", severity: "critical", label: "Quoted destination airport", a: rate, b: awb, fieldA: "destination_airport", fieldB: "destination_airport", valueA: rate.f.destination_airport, valueB: awb.f.destination_airport }));
  }

  // Dangerous-goods and security document consistency. These checks support, but never replace, qualified acceptance review.
  for (const dgd of dgds) for (const awb of airWaybills) {
    push(rules, compare({ workflow: "dangerous_goods_document_check", rule: "dgd_awb.reference", category: "identity", severity: "critical", label: "DGD Air Waybill reference", a: dgd, b: awb, fieldA: "awb_numbers", fieldB: "awb_number", valueA: dgd.f.awb_numbers, valueB: awb.f.awb_number, equal: refsEqual }));
    push(rules, compare({ workflow: "dangerous_goods_document_check", rule: "dgd_awb.shipper", category: "party", severity: "critical", label: "Dangerous-goods shipper", a: dgd, b: awb, fieldA: "shipper", fieldB: "shipper", valueA: dgd.f.shipper, valueB: awb.f.shipper, equal: partyEqual }));
    push(rules, compare({ workflow: "dangerous_goods_document_check", rule: "dgd_awb.origin", category: "route", severity: "critical", label: "Dangerous-goods origin airport", a: dgd, b: awb, fieldA: "origin_airport", fieldB: "origin_airport", valueA: dgd.f.origin_airport, valueB: awb.f.origin_airport }));
    push(rules, compare({ workflow: "dangerous_goods_document_check", rule: "dgd_awb.destination", category: "route", severity: "critical", label: "Dangerous-goods destination airport", a: dgd, b: awb, fieldA: "destination_airport", fieldB: "destination_airport", valueA: dgd.f.destination_airport, valueB: awb.f.destination_airport }));
    push(rules, compare({ workflow: "dangerous_goods_document_check", rule: "dgd_awb.entries", category: "logistics", severity: "critical", label: "Dangerous-goods entries", a: dgd, b: awb, fieldA: "dangerous_goods", fieldB: "dangerous_goods", valueA: dgSummary(dgd.f.dangerous_goods), valueB: dgSummary(awb.f.dangerous_goods), mismatch: "UN number, proper shipping name, class or packing group differs between the DGD and AWB" }));
  }
  for (const security of securityDeclarations) for (const awb of airWaybills) {
    push(rules, compare({ workflow: "dangerous_goods_document_check", rule: "security_awb.reference", category: "identity", severity: "critical", label: "Security declaration AWB reference", a: security, b: awb, fieldA: "awb_numbers", fieldB: "awb_number", valueA: security.f.awb_numbers, valueB: awb.f.awb_number, equal: refsEqual }));
    push(rules, compare({ workflow: "dangerous_goods_document_check", rule: "security_awb.pieces", category: "quantity", severity: "warning", label: "Security declaration pieces", a: security, b: awb, fieldA: "total_pieces", fieldB: "total_pieces", valueA: security.f.total_pieces, valueB: awb.f.total_pieces, equal: (a, b) => quantityEqual(a, b, policy) }));
  }
  return rules;
}
