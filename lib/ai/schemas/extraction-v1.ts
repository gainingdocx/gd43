// Provisional extraction envelope (v1). M4 replaces the inner `fields`
// definition with the full per-document-type schemas; the envelope
// (detected_type + fields + confidence_flags) is stable.

export type DetectedType =
  | "bill_of_lading"
  | "commercial_invoice"
  | "packing_list"
  | "other";

export const DETECTED_TYPES: DetectedType[] = [
  "bill_of_lading",
  "commercial_invoice",
  "packing_list",
  "other",
];

export interface ExtractionV1 {
  detected_type: DetectedType;
  confidence_flags: string[];
  fields: Record<string, unknown>;
}

const party = {
  type: ["object", "null"],
  properties: {
    name: { type: ["string", "null"] },
    address: { type: ["string", "null"] },
    city: { type: ["string", "null"] },
    country: { type: ["string", "null"] },
    tax_id: { type: ["string", "null"] },
  },
} as const;

const portRef = {
  type: ["object", "null"],
  properties: {
    name: { type: ["string", "null"] },
    unlocode: { type: ["string", "null"] },
  },
} as const;

// JSON Schema sent as response_format and referenced by the prompt.
export const EXTRACTION_JSON_SCHEMA = {
  name: "shipping_document_extraction",
  schema: {
    type: "object",
    required: ["detected_type", "fields"],
    properties: {
      detected_type: {
        type: "string",
        enum: DETECTED_TYPES,
        description: "The kind of shipping document shown in the images.",
      },
      confidence_flags: {
        type: "array",
        items: { type: "string" },
        description:
          "Names of fields whose values were hard to read or ambiguous.",
      },
      fields: {
        type: "object",
        properties: {
          // identifiers
          bl_number: { type: ["string", "null"] },
          invoice_no: { type: ["string", "null"] },
          pl_no: { type: ["string", "null"] },
          po_no: { type: ["string", "null"] },
          // parties (B/L naming and CI/PL naming both allowed)
          shipper: party,
          consignee: party,
          notify: party,
          seller: party,
          buyer: party,
          to_order: { type: ["boolean", "null"] },
          // voyage
          vessel_name: { type: ["string", "null"] },
          imo_number: { type: ["string", "null"] },
          voyage_no: { type: ["string", "null"] },
          port_of_load: portRef,
          port_of_discharge: portRef,
          place_of_receipt: { type: ["string", "null"] },
          place_of_delivery: { type: ["string", "null"] },
          // dates: copied EXACTLY as printed, never reformatted
          issue_date: { type: ["string", "null"] },
          shipped_on_board_date: { type: ["string", "null"] },
          invoice_date: { type: ["string", "null"] },
          // commercial
          freight_terms: { type: ["string", "null"], enum: ["prepaid", "collect", null] },
          incoterm: { type: ["string", "null"] },
          currency: { type: ["string", "null"] },
          total_amount: { type: ["number", "null"] },
          payment_terms: { type: ["string", "null"] },
          // totals as printed on the document (never computed)
          total_packages: { type: ["number", "null"] },
          total_gross_kg: { type: ["number", "null"] },
          total_net_kg: { type: ["number", "null"] },
          total_volume_cbm: { type: ["number", "null"] },
          containers: {
            type: "array",
            items: {
              type: "object",
              properties: {
                container_no: { type: ["string", "null"] },
                seal_no: { type: ["string", "null"] },
                iso_type: { type: ["string", "null"] },
                packages: { type: ["number", "null"] },
                package_type: { type: ["string", "null"] },
                gross_kg: { type: ["number", "null"] },
                tare_kg: { type: ["number", "null"] },
                volume_cbm: { type: ["number", "null"] },
              },
            },
          },
          line_items: {
            type: "array",
            items: {
              type: "object",
              properties: {
                description: { type: ["string", "null"] },
                hs_code: { type: ["string", "null"] },
                marks: { type: ["string", "null"] },
                packages: { type: ["number", "null"] },
                package_type: { type: ["string", "null"] },
                net_kg: { type: ["number", "null"] },
                gross_kg: { type: ["number", "null"] },
                volume_cbm: { type: ["number", "null"] },
                unit_price: { type: ["number", "null"] },
                amount: { type: ["number", "null"] },
                currency: { type: ["string", "null"] },
              },
            },
          },
        },
      },
    },
  },
} as const;

// Coerces a repaired model response into the envelope shape (throws if the
// response is not even an object with a fields object).
export function toExtractionV1(value: unknown): ExtractionV1 {
  if (value === null || typeof value !== "object" || Array.isArray(value)) {
    throw new Error("extraction is not an object");
  }
  const obj = value as Record<string, unknown>;
  const rawType = obj.detected_type;
  const detected_type: DetectedType = DETECTED_TYPES.includes(
    rawType as DetectedType
  )
    ? (rawType as DetectedType)
    : "other";
  const fields =
    obj.fields !== null &&
    typeof obj.fields === "object" &&
    !Array.isArray(obj.fields)
      ? (obj.fields as Record<string, unknown>)
      : null;
  if (!fields) throw new Error("extraction has no fields object");
  const confidence_flags = Array.isArray(obj.confidence_flags)
    ? obj.confidence_flags.filter((f): f is string => typeof f === "string")
    : [];
  return { detected_type, confidence_flags, fields };
}

// Critical fields per type (BUILD_SPEC §M3 step 4): if ≥3 are empty the
// router runs one escalation retry.
export function countEmptyCriticalFields(extraction: ExtractionV1): number {
  const f = extraction.fields;
  const get = (path: string): unknown =>
    path
      .split(".")
      .reduce<unknown>(
        (acc, key) =>
          acc !== null && typeof acc === "object"
            ? (acc as Record<string, unknown>)[key]
            : undefined,
        f
      );
  const empty = (v: unknown) =>
    v === null ||
    v === undefined ||
    v === "" ||
    (Array.isArray(v) && v.length === 0);

  const critical: Record<DetectedType, string[]> = {
    bill_of_lading: [
      "bl_number",
      "shipper.name",
      "consignee.name",
      "port_of_load.name",
      "port_of_discharge.name",
      "containers",
    ],
    commercial_invoice: [
      "invoice_no",
      "seller.name",
      "buyer.name",
      "currency",
      "total_amount",
      "line_items",
    ],
    packing_list: [
      "seller.name",
      "buyer.name",
      "total_gross_kg",
      "line_items",
    ],
    other: [],
  };

  return critical[extraction.detected_type].filter((p) => empty(get(p)))
    .length;
}
