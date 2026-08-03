// Test-only fixture factories (imported by *.test.ts, never by app code).

import type {
  BillOfLadingFields,
  CommercialInvoiceFields,
  PurchaseOrderFields,
  FreightInvoiceFields,
  LineItem,
  Meta,
  NormalizedExtraction,
  PackingListFields,
} from "@/lib/ai/schemas/shared";

export const meta = (detected_type: Meta["detected_type"]): Meta => ({
  detected_type,
  confidence_flags: [],
  page_refs: {},
  prompt_version: "test",
  source_languages: ["en"],
});

export function makeLine(over: Partial<LineItem> = {}): LineItem {
  return {
    line_no: null, product_code: null, buyer_product_code: null, seller_product_code: null,
    description: null, hs_code: null, marks: null, packages: null,
    package_type: null, quantity: null, uom: null, net_kg: null, gross_kg: null, volume_cbm: null,
    unit_price: null, amount: null, currency: null, cartons: null,
    tax_rate: null, tax_amount: null, discount_amount: null, country_of_origin: null, lot_no: null,
    dims: null, ...over,
  };
}

export function makeBL(
  over: Partial<BillOfLadingFields> = {}
): NormalizedExtraction {
  return {
    detected_type: "bill_of_lading",
    fields: {
      bl_number: null, booking_no: null, shipper_reference: null,
      export_references: [], customs_reference: null, purchase_order_refs: [],
      lc_number: null, scac: null, carrier_name: null, shipper: null,
      consignee: null, notify: null, vessel_name: null, imo_number: null,
      voyage_no: null, port_of_load: null, port_of_discharge: null,
      place_of_receipt: null, place_of_delivery: null,
      shipped_on_board_date: null, issue_date: null, issue_place: null,
      freight_terms: null, incoterm: null, containers: [], cargo: [], cargo_raw_text: null,
      total_packages: null, total_net_kg: null, total_gross_kg: null, total_volume_cbm: null,
      originals_count: null, bl_type: null, clauses: [],
      dangerous_goods: [],
      _meta: meta("bill_of_lading"), ...over,
    },
  };
}

export function makeCI(
  over: Partial<CommercialInvoiceFields> = {}
): NormalizedExtraction {
  return {
    detected_type: "commercial_invoice",
    fields: {
      invoice_no: null, invoice_date: null, due_date: null, po_no: null,
      purchase_order_refs: [], bl_numbers: [], booking_refs: [], container_refs: [], seller: null,
      buyer: null, incoterm: null, currency: null, line_items: [],
      subtotal: null, discount_amount: null, freight_charge: null, insurance: null,
      tax_amount: null, total_amount: null, amount_due: null, payment_terms: null, lc_number: null,
      country_of_origin: null, bank_details: null,
      dangerous_goods: [],
      _meta: meta("commercial_invoice"), ...over,
    },
  };
}

export function makePO(over: Partial<PurchaseOrderFields> = {}): NormalizedExtraction {
  return { detected_type: "purchase_order", fields: {
    po_number: null, po_date: null, revision_no: null, contract_no: null,
    buyer: null, seller: null, bill_to: null, ship_to: null,
    requested_delivery_date: null, promised_delivery_date: null, shipping_method: null,
    incoterm: null, payment_terms: null, currency: null, line_items: [], subtotal: null,
    discount_amount: null, freight_amount: null, tax_amount: null, total_amount: null,
    approval_status: null, approved_by: null, notes: null, _meta: meta("purchase_order"), ...over,
  }};
}

export function makeFreightInvoice(over: Partial<FreightInvoiceFields> = {}): NormalizedExtraction {
  return { detected_type: "freight_invoice", fields: {
    invoice_no: null, invoice_date: null, due_date: null, carrier_invoice_ref: null,
    purchase_order_refs: [], bl_numbers: [], awb_numbers: [], booking_refs: [], shipment_refs: [], container_refs: [],
    carrier: null, bill_to: null, remit_to: null, vessel_name: null, voyage_no: null,
    port_of_load: null, port_of_discharge: null, origin_airport: null, destination_airport: null,
    total_chargeable_kg: null, service_period_start: null, service_period_end: null,
    currency: null, exchange_rate: null, charges: [], subtotal: null, discount_amount: null,
    tax_amount: null, total_amount: null, amount_paid: null, amount_due: null,
    payment_terms: null, payment_reference: null, bank_details: null,
    _meta: meta("freight_invoice"), ...over,
  }};
}

export function makePL(
  over: Partial<PackingListFields> = {}
): NormalizedExtraction {
  return {
    detected_type: "packing_list",
    fields: {
      pl_no: null, date: null, invoice_ref: null, po_no: null, seller: null,
      buyer: null, line_items: [], total_cartons: null, total_net_kg: null,
      total_gross_kg: null, total_volume_cbm: null, container_refs: [],
      dangerous_goods: [],
      _meta: meta("packing_list"), ...over,
    },
  };
}

export const party = (name: string) => ({
  name, address: null, city: null, postal_code: null, country: null, tax_id: null,
});

export const container = (
  container_no: string,
  gross_kg: number | null = null
) => ({
  container_no, seal_no: null, iso_type: null, packages: null,
  package_type: null, gross_kg, tare_kg: null, volume_cbm: null,
});
