import type { DangerousGoodsItem, NormalizedExtraction } from "@/lib/ai/schemas/shared";
import type { ValidationResult } from "./types";

const DG_DOCUMENT_TYPES = new Set([
  "bill_of_lading",
  "sea_waybill",
  "air_waybill",
  "commercial_invoice",
  "packing_list",
  "booking_confirmation",
  "shipping_instructions",
  "shipper_letter_of_instruction",
  "dangerous_goods_declaration",
]);

export function supportsDangerousGoods(extraction: NormalizedExtraction): boolean {
  return DG_DOCUMENT_TYPES.has(extraction.detected_type);
}

export function dangerousGoodsOf(extraction: NormalizedExtraction): DangerousGoodsItem[] {
  if (!supportsDangerousGoods(extraction)) return [];
  const value = (extraction.fields as unknown as { dangerous_goods?: unknown }).dangerous_goods;
  return Array.isArray(value) ? value as DangerousGoodsItem[] : [];
}

export function normalizeUnNumber(value: string | null): string | null {
  if (!value) return null;
  const digits = value.toUpperCase().replace(/^UN[\s-]*/i, "").replace(/\D/g, "");
  return digits.length === 4 ? `UN${digits}` : null;
}

export function validateDangerousGoods(extraction: NormalizedExtraction): ValidationResult[] {
  const rows = dangerousGoodsOf(extraction);
  const results: ValidationResult[] = [];
  const seen = new Map<string, DangerousGoodsItem>();

  rows.forEach((row, index) => {
    const prefix = `dangerous_goods[${index}]`;
    const un = normalizeUnNumber(row.un_number);
    results.push({
      field: `${prefix}.un_number`,
      rule: "dangerous_goods.un_number",
      status: un ? "pass" : "fail",
      message: un ? `${un} has a valid four-digit UN number` : "UN number must contain exactly four digits",
      expected: "UN followed by four digits",
      actual: row.un_number ?? "",
    });

    if (row.aircraft_limitation === "forbidden") {
      results.push({
        field: `${prefix}.aircraft_limitation`,
        rule: "dangerous_goods.aircraft_limitation",
        status: "fail",
        message: "The declaration marks this item forbidden for air transport; stop and obtain qualified dangerous-goods review",
        actual: row.aircraft_limitation,
      });
    } else if (row.aircraft_limitation) {
      results.push({
        field: `${prefix}.aircraft_limitation`,
        rule: "dangerous_goods.aircraft_limitation",
        status: "pass",
        message: row.aircraft_limitation === "cargo_aircraft_only"
          ? "Cargo Aircraft Only limitation is printed for operational review"
          : "Aircraft limitation is printed for operational review",
        actual: row.aircraft_limitation,
      });
    }

    results.push({
      field: `${prefix}.proper_shipping_name`,
      rule: "dangerous_goods.proper_shipping_name_presence",
      status: row.proper_shipping_name?.trim() ? "pass" : "warn",
      message: row.proper_shipping_name?.trim()
        ? "A proper shipping name is printed for review"
        : "No proper shipping name was extracted; verify the declaration and source page",
      actual: row.proper_shipping_name ?? "",
    });

    results.push({
      field: `${prefix}.emergency_contact`,
      rule: "dangerous_goods.emergency_contact_presence",
      status: row.emergency_contact?.trim() ? "pass" : "warn",
      message: row.emergency_contact?.trim()
        ? "An emergency contact is printed for review"
        : "No emergency contact was extracted; confirm whether one is required on the applicable document",
      actual: row.emergency_contact ?? "",
    });

    const hazard = row.hazard_class?.trim() ?? "";
    const validHazard = /^(?:[1-8](?:\.[1-6])?|9)$/.test(hazard);
    results.push({
      field: `${prefix}.hazard_class`,
      rule: "dangerous_goods.hazard_class",
      status: validHazard ? "pass" : row.hazard_class ? "fail" : "warn",
      message: validHazard
        ? `Hazard class ${hazard} is structurally valid`
        : row.hazard_class
          ? "Hazard class must be class 1–9, optionally with a valid division"
          : "Dangerous-goods entry is missing its hazard class",
      actual: row.hazard_class ?? "",
    });

    const validPackingGroup = row.packing_group === null ||
      ["I", "II", "III"].includes(row.packing_group);
    results.push({
      field: `${prefix}.packing_group`,
      rule: "dangerous_goods.packing_group",
      status: validPackingGroup ? "pass" : "fail",
      message: validPackingGroup
        ? row.packing_group
          ? `Packing group ${row.packing_group} is valid`
          : "No packing group is printed (some dangerous goods do not require one)"
        : "Packing group must be I, II or III",
      actual: row.packing_group ?? "",
    });

    if (!un) return;
    const previous = seen.get(un);
    if (previous && (
      (previous.hazard_class && row.hazard_class && previous.hazard_class !== row.hazard_class) ||
      (previous.packing_group && row.packing_group && previous.packing_group !== row.packing_group)
    )) {
      results.push({
        field: prefix,
        rule: "dangerous_goods.duplicate_consistency",
        status: "fail",
        message: `${un} has conflicting hazard details within this document`,
      });
    } else if (!previous) {
      seen.set(un, row);
    }
  });
  return results;
}
