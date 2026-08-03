// Shared extraction sub-types (BUILD_SPEC §M4). These are the app-facing
// shapes stored in documents.fields — every consumer (validators, exports,
// generation, UI) reads these, never the raw model output.

export type DetectedType =
  | "bill_of_lading"
  | "sea_waybill"
  | "commercial_invoice"
  | "purchase_order"
  | "freight_invoice"
  | "goods_receipt"
  | "packing_list"
  | "arrival_notice"
  | "booking_confirmation"
  | "shipping_instructions"
  | "certificate_of_origin"
  | "quotation"
  | "rate_confirmation"
  | "container_event"
  | "demurrage_detention_invoice"
  | "air_waybill"
  | "shipper_letter_of_instruction"
  | "dangerous_goods_declaration"
  | "air_cargo_manifest"
  | "cargo_security_declaration"
  | "other";

export const DETECTED_TYPES: DetectedType[] = [
  "bill_of_lading",
  "sea_waybill",
  "commercial_invoice",
  "purchase_order",
  "freight_invoice",
  "goods_receipt",
  "packing_list",
  "arrival_notice",
  "booking_confirmation",
  "shipping_instructions",
  "certificate_of_origin",
  "quotation",
  "rate_confirmation",
  "container_event",
  "demurrage_detention_invoice",
  "air_waybill",
  "shipper_letter_of_instruction",
  "dangerous_goods_declaration",
  "air_cargo_manifest",
  "cargo_security_declaration",
  "other",
];

export interface Party {
  name: string | null;
  address: string | null;
  city: string | null;
  postal_code: string | null;
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
  line_no: string | null;
  product_code: string | null;
  buyer_product_code: string | null;
  seller_product_code: string | null;
  description: string | null;
  hs_code: string | null;
  /** AI assistance only; never overwrites a code printed on the document. */
  hs_code_suggestion?: string | null;
  hs_suggestion_confidence?: "low" | "medium" | "high" | null;
  hs_suggestion_reason?: string | null;
  /** Destination-specific tariff indicator. Currently sourced from USITC HTS. */
  us_general_duty_rate?: string | null;
  marks: string | null;
  packages: number | null;
  package_type: string | null;
  quantity: number | null;
  uom: string | null;
  net_kg: number | null;
  gross_kg: number | null;
  volume_cbm: number | null;
  unit_price: number | null;
  amount: number | null;
  currency: string | null;
  tax_rate: number | null;
  tax_amount: number | null;
  discount_amount: number | null;
  country_of_origin: string | null;
  lot_no: string | null;
  /** Packing-list extras (null on other doc types). */
  cartons: number | null;
  dims: Dims | null;
  /** Air-cargo rating extras (null/absent on non-AWB documents). */
  chargeable_kg?: number | null;
  rate_class?: string | null;
  rate_charge?: number | null;
  commodity_item_no?: string | null;
}

export interface ChargeLine {
  line_no: string | null;
  charge_code: string | null;
  description: string | null;
  container_no: string | null;
  bl_number: string | null;
  quantity: number | null;
  uom: string | null;
  rate: number | null;
  amount: number | null;
  currency: string | null;
  tax_rate: number | null;
  tax_amount: number | null;
  prepaid_collect: "prepaid" | "collect" | null;
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

export interface DangerousGoodsItem {
  un_number: string | null;
  proper_shipping_name: string | null;
  technical_name?: string | null;
  hazard_class: string | null;
  subsidiary_risk: string | null;
  packing_group: "I" | "II" | "III" | null;
  packing_instruction?: string | null;
  quantity_and_type_of_packing?: string | null;
  net_quantity?: number | null;
  net_quantity_unit?: string | null;
  aircraft_limitation?: "passenger_and_cargo" | "cargo_aircraft_only" | "forbidden" | "unknown" | null;
  marine_pollutant: boolean | null;
  flash_point_c: number | null;
  emergency_contact: string | null;
}

export interface TranslationBundle {
  target_language: string;
  target_language_name: string;
  translated_fields: Record<string, string>;
  generated_at: string;
}

export interface Meta {
  detected_type: DetectedType;
  confidence_flags: string[];
  /** field name -> 1-based page number the value was read from */
  page_refs: Record<string, number>;
  /** Exact printed text supporting each populated top-level field. */
  source_evidence?: Record<string, { page: number; quote: string; bbox?: [number, number, number, number] }>;
  prompt_version: string;
  /** BCP-47/ISO language codes identified from printed document text. */
  source_languages: string[];
  /** Optional, user-requested translations keyed by editable field path. */
  translation?: TranslationBundle;
}

export interface BillOfLadingFields {
  bl_number: string | null;
  bl_level?: "master" | "house" | "unknown" | null;
  master_bl_number?: string | null;
  house_bl_number?: string | null;
  booking_no: string | null;
  shipper_reference: string | null;
  export_references: string[];
  customs_reference: string | null;
  purchase_order_refs: string[];
  lc_number: string | null;
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
  cargo_raw_text: string | null;
  total_packages: number | null;
  total_net_kg: number | null;
  total_gross_kg: number | null;
  total_volume_cbm: number | null;
  originals_count: number | null;
  bl_type: "original" | "seaway" | "telex" | null;
  document_stage?: "draft" | "final" | "unknown" | null;
  clauses: string[];
  dangerous_goods: DangerousGoodsItem[];
  _meta: Meta;
}

export interface CommercialInvoiceFields {
  invoice_no: string | null;
  invoice_date: string | null;
  po_no: string | null;
  purchase_order_refs: string[];
  bl_numbers: string[];
  booking_refs: string[];
  container_refs: string[];
  seller: Party | null;
  buyer: Party | null;
  incoterm: string | null;
  currency: string | null;
  line_items: LineItem[];
  subtotal: number | null;
  discount_amount: number | null;
  freight_charge: number | null;
  insurance: number | null;
  tax_amount: number | null;
  total_amount: number | null;
  amount_due: number | null;
  due_date: string | null;
  payment_terms: string | null;
  lc_number: string | null;
  country_of_origin: string | null;
  bank_details: string | null;
  dangerous_goods: DangerousGoodsItem[];
  _meta: Meta;
}

export interface PurchaseOrderFields {
  po_number: string | null;
  po_date: string | null;
  revision_no: string | null;
  contract_no: string | null;
  buyer: Party | null;
  seller: Party | null;
  bill_to: Party | null;
  ship_to: Party | null;
  requested_delivery_date: string | null;
  promised_delivery_date: string | null;
  shipping_method: string | null;
  incoterm: string | null;
  payment_terms: string | null;
  currency: string | null;
  line_items: LineItem[];
  subtotal: number | null;
  discount_amount: number | null;
  freight_amount: number | null;
  tax_amount: number | null;
  total_amount: number | null;
  approval_status: string | null;
  approved_by: string | null;
  notes: string | null;
  _meta: Meta;
}

export interface FreightInvoiceFields {
  invoice_no: string | null;
  invoice_date: string | null;
  due_date: string | null;
  carrier_invoice_ref: string | null;
  purchase_order_refs: string[];
  bl_numbers: string[];
  awb_numbers: string[];
  booking_refs: string[];
  shipment_refs: string[];
  container_refs: string[];
  carrier: Party | null;
  bill_to: Party | null;
  remit_to: Party | null;
  vessel_name: string | null;
  voyage_no: string | null;
  port_of_load: PortRef | null;
  port_of_discharge: PortRef | null;
  origin_airport: string | null;
  destination_airport: string | null;
  total_chargeable_kg: number | null;
  service_period_start: string | null;
  service_period_end: string | null;
  currency: string | null;
  exchange_rate: number | null;
  charges: ChargeLine[];
  subtotal: number | null;
  discount_amount: number | null;
  tax_amount: number | null;
  total_amount: number | null;
  amount_paid: number | null;
  amount_due: number | null;
  payment_terms: string | null;
  payment_reference: string | null;
  bank_details: string | null;
  _meta: Meta;
}

export interface GoodsReceiptFields {
  receipt_no: string | null;
  receipt_date: string | null;
  purchase_order_refs: string[];
  delivery_note_refs: string[];
  bl_numbers: string[];
  container_refs: string[];
  supplier: Party | null;
  receiver: Party | null;
  delivery_location: string | null;
  line_items: LineItem[];
  total_received_quantity: number | null;
  total_accepted_quantity: number | null;
  total_rejected_quantity: number | null;
  total_packages: number | null;
  total_gross_kg: number | null;
  received_by: string | null;
  notes: string | null;
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
  dangerous_goods: DangerousGoodsItem[];
  _meta: Meta;
}

export interface ArrivalNoticeFields {
  notice_no: string | null;
  issue_date: string | null;
  bl_number: string | null;
  booking_no: string | null;
  carrier_name: string | null;
  agent: Party | null;
  consignee: Party | null;
  notify: Party | null;
  vessel_name: string | null;
  voyage_no: string | null;
  port_of_discharge: PortRef | null;
  terminal: string | null;
  eta: string | null;
  availability_date: string | null;
  last_free_day: string | null;
  pickup_reference: string | null;
  currency: string | null;
  freight_due: number | null;
  terminal_charges: number | null;
  other_charges: number | null;
  total_charges: number | null;
  payment_instructions: string | null;
  containers: ContainerRow[];
  _meta: Meta;
}

export interface BookingConfirmationFields {
  booking_no: string | null;
  carrier_name: string | null;
  shipper: Party | null;
  service_contract_no: string | null;
  vessel_name: string | null;
  voyage_no: string | null;
  port_of_load: PortRef | null;
  port_of_discharge: PortRef | null;
  place_of_receipt: string | null;
  place_of_delivery: string | null;
  etd: string | null;
  eta: string | null;
  documentation_cutoff: string | null;
  vgm_cutoff: string | null;
  cargo_cutoff: string | null;
  si_cutoff: string | null;
  equipment: ContainerRow[];
  commodity: string | null;
  total_packages: number | null;
  total_gross_kg: number | null;
  special_instructions: string | null;
  dangerous_goods: DangerousGoodsItem[];
  _meta: Meta;
}

export interface ShippingInstructionsFields {
  si_number: string | null;
  booking_no: string | null;
  bl_number: string | null;
  shipper_reference: string | null;
  shipper: Party | null;
  consignee: (Party & { to_order: boolean | null }) | null;
  notify: Party | null;
  carrier_name: string | null;
  vessel_name: string | null;
  voyage_no: string | null;
  port_of_load: PortRef | null;
  port_of_discharge: PortRef | null;
  place_of_receipt: string | null;
  place_of_delivery: string | null;
  containers: ContainerRow[];
  cargo: LineItem[];
  cargo_raw_text: string | null;
  total_packages: number | null;
  total_net_kg: number | null;
  total_gross_kg: number | null;
  total_volume_cbm: number | null;
  freight_terms: "prepaid" | "collect" | null;
  requested_bl_type: "original" | "seaway" | "telex" | null;
  originals_count: number | null;
  dangerous_goods: DangerousGoodsItem[];
  _meta: Meta;
}

export interface CertificateOfOriginFields {
  certificate_no: string | null;
  issue_date: string | null;
  invoice_refs: string[];
  bl_numbers: string[];
  exporter: Party | null;
  consignee: Party | null;
  country_of_origin: string | null;
  destination_country: string | null;
  transport_details: string | null;
  certification_body: string | null;
  line_items: LineItem[];
  total_packages: number | null;
  total_gross_kg: number | null;
  _meta: Meta;
}

export interface QuotationFields {
  quotation_no: string | null;
  rate_agreement_no: string | null;
  booking_refs: string[];
  awb_numbers: string[];
  valid_from: string | null;
  valid_to: string | null;
  carrier: Party | null;
  customer: Party | null;
  port_of_load: PortRef | null;
  port_of_discharge: PortRef | null;
  origin_airport: string | null;
  destination_airport: string | null;
  total_chargeable_kg: number | null;
  place_of_receipt: string | null;
  place_of_delivery: string | null;
  equipment: ContainerRow[];
  currency: string | null;
  charges: ChargeLine[];
  free_time_demurrage_days: number | null;
  free_time_detention_days: number | null;
  subtotal: number | null;
  tax_amount: number | null;
  total_amount: number | null;
  _meta: Meta;
}

export interface ContainerEventFields {
  container_no: string | null;
  event_type: "discharged" | "available" | "full_gate_out" | "empty_return" | "full_gate_in" | "other" | null;
  event_timestamp: string | null;
  timezone: string | null;
  location: string | null;
  terminal: string | null;
  port: PortRef | null;
  bl_number: string | null;
  booking_no: string | null;
  vessel_name: string | null;
  voyage_no: string | null;
  source_system: string | null;
  _meta: Meta;
}

export interface AirWaybillFields {
  awb_number: string | null;
  awb_type: "master" | "house" | "unknown" | null;
  master_awb_number: string | null;
  house_awb_number: string | null;
  airline_name: string | null;
  airline_prefix: string | null;
  shipper: Party | null;
  consignee: Party | null;
  issuing_carrier_agent: Party | null;
  origin_airport: string | null;
  destination_airport: string | null;
  flight_no: string | null;
  flight_date: string | null;
  issue_date: string | null;
  issue_place: string | null;
  currency: string | null;
  charge_code: string | null;
  declared_value_carriage: string | null;
  declared_value_customs: string | null;
  insurance_amount: number | null;
  handling_information: string | null;
  line_items: LineItem[];
  total_pieces: number | null;
  total_gross_kg: number | null;
  total_chargeable_kg: number | null;
  total_prepaid: number | null;
  total_collect: number | null;
  dangerous_goods: DangerousGoodsItem[];
  _meta: Meta;
}

export interface ShipperLetterOfInstructionFields {
  instruction_no: string | null;
  awb_numbers: string[];
  shipper: Party | null;
  consignee: Party | null;
  issuing_carrier_agent: Party | null;
  origin_airport: string | null;
  destination_airport: string | null;
  requested_flight_no: string | null;
  requested_flight_date: string | null;
  incoterm: string | null;
  currency: string | null;
  handling_information: string | null;
  line_items: LineItem[];
  total_pieces: number | null;
  total_gross_kg: number | null;
  total_chargeable_kg: number | null;
  dangerous_goods: DangerousGoodsItem[];
  signatory_name: string | null;
  signed_date: string | null;
  _meta: Meta;
}

export interface DangerousGoodsDeclarationFields {
  declaration_reference: string | null;
  awb_numbers: string[];
  shipper: Party | null;
  consignee: Party | null;
  origin_airport: string | null;
  destination_airport: string | null;
  handling_information: string | null;
  dangerous_goods: DangerousGoodsItem[];
  signatory_name: string | null;
  signed_date: string | null;
  emergency_contact: string | null;
  _meta: Meta;
}

export interface AirCargoManifestFields {
  manifest_no: string | null;
  awb_numbers: string[];
  airline_name: string | null;
  flight_no: string | null;
  flight_date: string | null;
  origin_airport: string | null;
  destination_airport: string | null;
  line_items: LineItem[];
  total_shipments: number | null;
  total_pieces: number | null;
  total_gross_kg: number | null;
  _meta: Meta;
}

export interface CargoSecurityDeclarationFields {
  declaration_reference: string | null;
  awb_numbers: string[];
  regulated_agent: Party | null;
  security_status: string | null;
  screening_method: string | null;
  issued_by: string | null;
  issue_date: string | null;
  total_pieces: number | null;
  total_gross_kg: number | null;
  _meta: Meta;
}

/** Unrecognized sea-cargo document: raw model fields preserved as-is. */
export interface OtherDocFields {
  raw: Record<string, unknown>;
  _meta: Meta;
}

export type NormalizedExtraction =
  | { detected_type: "bill_of_lading"; fields: BillOfLadingFields }
  | { detected_type: "sea_waybill"; fields: BillOfLadingFields }
  | { detected_type: "commercial_invoice"; fields: CommercialInvoiceFields }
  | { detected_type: "purchase_order"; fields: PurchaseOrderFields }
  | { detected_type: "freight_invoice"; fields: FreightInvoiceFields }
  | { detected_type: "goods_receipt"; fields: GoodsReceiptFields }
  | { detected_type: "packing_list"; fields: PackingListFields }
  | { detected_type: "arrival_notice"; fields: ArrivalNoticeFields }
  | { detected_type: "booking_confirmation"; fields: BookingConfirmationFields }
  | { detected_type: "shipping_instructions"; fields: ShippingInstructionsFields }
  | { detected_type: "certificate_of_origin"; fields: CertificateOfOriginFields }
  | { detected_type: "quotation"; fields: QuotationFields }
  | { detected_type: "rate_confirmation"; fields: QuotationFields }
  | { detected_type: "container_event"; fields: ContainerEventFields }
  | { detected_type: "demurrage_detention_invoice"; fields: FreightInvoiceFields }
  | { detected_type: "air_waybill"; fields: AirWaybillFields }
  | { detected_type: "shipper_letter_of_instruction"; fields: ShipperLetterOfInstructionFields }
  | { detected_type: "dangerous_goods_declaration"; fields: DangerousGoodsDeclarationFields }
  | { detected_type: "air_cargo_manifest"; fields: AirCargoManifestFields }
  | { detected_type: "cargo_security_declaration"; fields: CargoSecurityDeclarationFields }
  | { detected_type: "other"; fields: OtherDocFields };
