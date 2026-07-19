// Test-only fixture factories (imported by *.test.ts, never by app code).

import type {
  BillOfLadingFields,
  CommercialInvoiceFields,
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
});

export function makeLine(over: Partial<LineItem> = {}): LineItem {
  return {
    description: null, hs_code: null, marks: null, packages: null,
    package_type: null, net_kg: null, gross_kg: null, volume_cbm: null,
    unit_price: null, amount: null, currency: null, cartons: null,
    dims: null, ...over,
  };
}

export function makeBL(
  over: Partial<BillOfLadingFields> = {}
): NormalizedExtraction {
  return {
    detected_type: "bill_of_lading",
    fields: {
      bl_number: null, scac: null, carrier_name: null, shipper: null,
      consignee: null, notify: null, vessel_name: null, imo_number: null,
      voyage_no: null, port_of_load: null, port_of_discharge: null,
      place_of_receipt: null, place_of_delivery: null,
      shipped_on_board_date: null, issue_date: null, issue_place: null,
      freight_terms: null, incoterm: null, containers: [], cargo: [],
      total_packages: null, total_gross_kg: null, total_volume_cbm: null,
      originals_count: null, bl_type: null, clauses: [],
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
      invoice_no: null, invoice_date: null, po_no: null, seller: null,
      buyer: null, incoterm: null, currency: null, line_items: [],
      subtotal: null, freight_charge: null, insurance: null,
      total_amount: null, payment_terms: null, lc_number: null,
      country_of_origin: null, bank_details: null,
      _meta: meta("commercial_invoice"), ...over,
    },
  };
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
      _meta: meta("packing_list"), ...over,
    },
  };
}

export const party = (name: string) => ({
  name, address: null, city: null, country: null, tax_id: null,
});

export const container = (
  container_no: string,
  gross_kg: number | null = null
) => ({
  container_no, seal_no: null, iso_type: null, packages: null,
  package_type: null, gross_kg, tare_kg: null, volume_cbm: null,
});
