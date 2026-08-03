export type CompletenessDocument = {
  doc_type: string;
  status: string;
  source_filename?: string | null;
};

export type ShipmentRequirement = {
  requirement_key: string;
  label: string;
  accepted_types: string[];
  required: boolean;
  filename_hint?: string | null;
};

export type RequirementResult = ShipmentRequirement & {
  state: "present" | "processing" | "missing" | "optional";
  matchingCount: number;
};

export const DEFAULT_REQUIREMENTS: ShipmentRequirement[] = [
  { requirement_key: "transport", label: "Transport document (B/L or AWB)", accepted_types: ["bill_of_lading", "sea_waybill", "air_waybill"], required: true },
  { requirement_key: "invoice", label: "Commercial invoice", accepted_types: ["commercial_invoice"], required: true },
  { requirement_key: "packing", label: "Packing list", accepted_types: ["packing_list"], required: true },
  { requirement_key: "origin", label: "Certificate of origin", accepted_types: ["certificate_of_origin", "other"], filename_hint: "certificate origin", required: false },
];

export const AIR_REQUIREMENTS: ShipmentRequirement[] = [
  { requirement_key: "air_sli", label: "Shipper's Letter of Instruction", accepted_types: ["shipper_letter_of_instruction"], required: false },
  { requirement_key: "air_dgd", label: "Dangerous Goods Declaration (when applicable)", accepted_types: ["dangerous_goods_declaration"], required: false },
  { requirement_key: "air_security", label: "Cargo Security Declaration (lane/party dependent)", accepted_types: ["cargo_security_declaration"], required: false },
  { requirement_key: "air_manifest", label: "Air cargo manifest (consolidations)", accepted_types: ["air_cargo_manifest"], required: false },
];

function normalized(value: string | null | undefined) {
  return (value ?? "").toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}

function matches(document: CompletenessDocument, requirement: ShipmentRequirement): boolean {
  if (!requirement.accepted_types.includes(document.doc_type)) return false;
  if (!requirement.filename_hint) return true;
  const name = normalized(document.source_filename);
  return normalized(requirement.filename_hint).split(" ").every((word) => name.includes(word));
}

export function assessCompleteness(
  documents: CompletenessDocument[],
  overrides: ShipmentRequirement[] = [],
): { results: RequirementResult[]; complete: number; required: number; percent: number } {
  const airShipment = documents.some((document) => [
    "air_waybill", "shipper_letter_of_instruction", "dangerous_goods_declaration", "air_cargo_manifest", "cargo_security_declaration",
  ].includes(document.doc_type));
  const base = airShipment ? [...DEFAULT_REQUIREMENTS, ...AIR_REQUIREMENTS] : DEFAULT_REQUIREMENTS;
  const requirements = new Map(base.map((item) => [item.requirement_key, item]));
  for (const override of overrides) requirements.set(override.requirement_key, override);
  const results = [...requirements.values()].map((requirement): RequirementResult => {
    const found = documents.filter((document) => matches(document, requirement));
    const present = found.filter((document) => document.status === "parsed").length;
    const processing = found.some((document) => ["uploaded", "parsing"].includes(document.status));
    return {
      ...requirement,
      matchingCount: found.length,
      state: present > 0 ? "present" : processing ? "processing" : requirement.required ? "missing" : "optional",
    };
  });
  const required = results.filter((item) => item.required).length;
  const complete = results.filter((item) => item.required && item.state === "present").length;
  return { results, required, complete, percent: required ? Math.round(complete / required * 100) : 100 };
}
