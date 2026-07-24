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
  const requirements = new Map(DEFAULT_REQUIREMENTS.map((item) => [item.requirement_key, item]));
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

