// Shared extraction sub-types (BUILD_SPEC §M4). These are the app-facing
// shapes stored in documents.fields — every consumer (validators, exports,
// generation, UI) reads these, never the raw model output.

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

export interface Party {
  name: string | null;
  address: string | null;
  city: string | null;
  country: string | null;
  tax_id: string | null;
}

export interface PortRef {
  name: string | null;
  unlocode: string | null;
}

/** Reserved for validators/unit handling (spec sub-type). */
export interface Weight {
  value: number | null;
  unit: string | null;
}

export interface Dims {
  l: number | null;
  w: number | null;
  h: number | null;
  unit: string | null;
}

export interface LineItem {
  description: string | null;
  hs_code: string | null;
  marks: string | null;
  packages: number | null;
  package_type: string | null;
  net_kg: number | null;
  gross_kg: number | null;
  volume_cbm: number | null;
  unit_price: number | null;
  amount: number | null;
  currency: string | null;
  /** Packing-list extras (null on other doc types). */
  cartons: number | null;
  dims: Dims | null;
}

export interface ContainerRow {
  container_no: string | null;
  seal_no: string | null;
  iso_type: string | null;
  packages: number | null;
  package_type: string | null;
  gross_kg: number | null;
  tare_kg: number | null;
  volume_cbm: number | null;
}

export interface Meta {
  detected_type: DetectedType;
  confidence_flags: string[];
  /** field name -> 1-based page number the value was read from */
  page_refs: Record<string, number>;
  prompt_version: string;
}

export interface BillOfLadingFields {
  bl_number: string | null;
  scac: string | null;
  carrier_name: string | null;
  shipper: Party | null;
  consignee: (Party & { to_order: boolean | null }) | null;
  notify: Party | null;
  vessel_name: string | null;
  imo_number: string | null;
  voyage_no: string | null;
  port_of_load: PortRef | null;
  port_of_discharge: PortRef | null;
  place_of_receipt: string | null;
  place_of_delivery: string | null;
  shipped_on_board_date: string | null;
  issue_date: string | null;
  issue_place: string | null;
  freight_terms: "prepaid" | "collect" | null;
  incoterm: string | null;
  containers: ContainerRow[];
  cargo: LineItem[];
  total_packages: number | null;
  total_gross_kg: number | null;
  total_volume_cbm: number | null;
  originals_count: number | null;
  bl_type: "original" | "seaway" | "telex" | null;
  clauses: string[];
  _meta: Meta;
}

export interface CommercialInvoiceFields {
  invoice_no: string | null;
  invoice_date: string | null;
  po_no: string | null;
  seller: Party | null;
  buyer: Party | null;
  incoterm: string | null;
  currency: string | null;
  line_items: LineItem[];
  subtotal: number | null;
  freight_charge: number | null;
  insurance: number | null;
  total_amount: number | null;
  payment_terms: string | null;
  lc_number: string | null;
  country_of_origin: string | null;
  bank_details: string | null;
  _meta: Meta;
}

export interface PackingListFields {
  pl_no: string | null;
  date: string | null;
  invoice_ref: string | null;
  po_no: string | null;
  seller: Party | null;
  buyer: Party | null;
  line_items: LineItem[];
  total_cartons: number | null;
  total_net_kg: number | null;
  total_gross_kg: number | null;
  total_volume_cbm: number | null;
  container_refs: string[];
  _meta: Meta;
}

/** Unrecognized sea-cargo document: raw model fields preserved as-is. */
export interface OtherDocFields {
  raw: Record<string, unknown>;
  _meta: Meta;
}

export type NormalizedExtraction =
  | { detected_type: "bill_of_lading"; fields: BillOfLadingFields }
  | { detected_type: "commercial_invoice"; fields: CommercialInvoiceFields }
  | { detected_type: "packing_list"; fields: PackingListFields }
  | { detected_type: "other"; fields: OtherDocFields };
