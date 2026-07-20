export type TemplateFieldType = "date" | "number" | "textarea" | "text";

export interface TemplateField {
  key: string;
  label: string;
  placeholder?: string;
  type?: TemplateFieldType;
  required?: boolean;
  section: string;
  help?: string;
}

export type TemplateLineKey =
  | "description" | "sku" | "hsCode" | "origin" | "marks"
  | "packageType" | "quantity" | "uom" | "cartons" | "packages"
  | "unitPrice" | "amount" | "netKg" | "grossKg"
  | "length" | "width" | "height" | "cbm"
  | "container" | "seal" | "status" | "charges";

export interface TemplateLineColumn {
  key: TemplateLineKey;
  label: string;
  type?: "number" | "text";
  width?: number;
}

export interface TemplateDefinition {
  slug: string;
  name: string;
  description: string;
  purpose: string;
  authorityNotice: string;
  fields: TemplateField[];
  lineTitle: string;
  lineColumns: TemplateLineColumn[];
  faqs: { q: string; a: string }[];
}

const party = (key: string, label: string, section = "Parties"): TemplateField => ({
  key, label, section, type: "textarea", required: true,
  placeholder: "Company name\nStreet address\nCity, postcode, country\nTax / registration ID",
});

const cargoCore: TemplateLineColumn[] = [
  { key: "description", label: "Goods description", width: 2.4 },
  { key: "hsCode", label: "HS code" },
  { key: "marks", label: "Marks & nos." },
  { key: "packageType", label: "Package type" },
  { key: "packages", label: "Packages", type: "number" },
  { key: "grossKg", label: "Gross kg", type: "number" },
  { key: "cbm", label: "CBM", type: "number" },
];

export const TEMPLATES: TemplateDefinition[] = [
  {
    slug: "bill-of-lading-template",
    name: "Bill of Lading Data Worksheet",
    description: "Prepare complete B/L particulars for carrier instructions and draft checking.",
    purpose: "A shipper-side data worksheet for submitting shipping instructions or checking a carrier draft B/L.",
    authorityNotice: "This worksheet is not a Bill of Lading and does not evidence title, receipt or carriage. Only a carrier, NVOCC or authorized agent may issue the transport document.",
    fields: [
      { key: "blNumber", label: "B/L number (if assigned)", section: "References" },
      { key: "booking", label: "Booking number", section: "References", required: true },
      { key: "exportReference", label: "Exporter / customer reference", section: "References" },
      { key: "blType", label: "Requested B/L type", section: "References", placeholder: "Original / Sea Waybill / Telex release" },
      { key: "originals", label: "Number of originals", section: "References", type: "number" },
      party("shipper", "Shipper"), party("consignee", "Consignee"), party("notify", "Notify party"),
      { key: "carrier", label: "Carrier / NVOCC", section: "Routing" },
      { key: "placeReceipt", label: "Place of receipt", section: "Routing" },
      { key: "vessel", label: "Vessel", section: "Routing", required: true },
      { key: "voyage", label: "Voyage", section: "Routing" },
      { key: "portLoad", label: "Port of loading / UN/LOCODE", section: "Routing", required: true },
      { key: "portDischarge", label: "Port of discharge / UN/LOCODE", section: "Routing", required: true },
      { key: "placeDelivery", label: "Place of delivery", section: "Routing" },
      { key: "freightTerms", label: "Freight terms", section: "Terms", placeholder: "Prepaid / Collect" },
      { key: "onBoardDate", label: "Requested shipped-on-board date", section: "Terms", type: "date" },
      { key: "issuePlace", label: "Place of issue", section: "Terms" },
      { key: "issueDate", label: "Issue date", section: "Terms", type: "date" },
      { key: "containers", label: "Container / seal / type details", section: "Equipment", type: "textarea" },
      { key: "clauses", label: "Requested clauses and special instructions", section: "Declarations", type: "textarea" },
      { key: "signatory", label: "Prepared by / contact details", section: "Declarations", type: "textarea", required: true },
    ],
    lineTitle: "Marks, packages and cargo particulars",
    lineColumns: cargoCore,
    faqs: [{ q: "Is this a carrier-issued B/L?", a: "No. It is a detailed data worksheet for shipping instructions and carrier draft checking. The final B/L must be issued by the carrier, NVOCC or authorized agent." }],
  },
  {
    slug: "commercial-invoice-template",
    name: "Commercial Invoice",
    description: "Create a customs-ready export invoice with item values, HS codes, charges and declarations.",
    purpose: "A commercial invoice working document for customs clearance and buyer settlement. Destination-specific rules still apply.",
    authorityNotice: "The exporter is responsible for valuation, classification, origin and destination-specific declarations. Review with the broker or carrier before filing.",
    fields: [
      { key: "invoiceNumber", label: "Invoice number", section: "Invoice", required: true },
      { key: "date", label: "Invoice date", section: "Invoice", type: "date", required: true },
      { key: "poNumber", label: "Purchase order / contract", section: "Invoice" },
      { key: "exportReference", label: "Exporter reference", section: "Invoice" },
      party("seller", "Seller / exporter"), party("buyer", "Buyer"), party("consignee", "Consignee / ship-to"),
      { key: "currency", label: "Invoice currency (ISO code)", section: "Trade terms", placeholder: "USD", required: true },
      { key: "incoterm", label: "Incoterm and named place", section: "Trade terms", placeholder: "FOB Nhava Sheva, Incoterms 2020", required: true },
      { key: "payment", label: "Payment terms", section: "Trade terms" },
      { key: "origin", label: "Country of origin", section: "Trade terms", required: true },
      { key: "destination", label: "Country of final destination", section: "Trade terms" },
      { key: "mode", label: "Mode of transport", section: "Shipment" },
      { key: "carrierVessel", label: "Carrier / vessel / voyage", section: "Shipment" },
      { key: "portLoad", label: "Port of loading", section: "Shipment" },
      { key: "portDischarge", label: "Port of discharge", section: "Shipment" },
      { key: "freight", label: "Freight charge", section: "Charges", type: "number" },
      { key: "insurance", label: "Insurance", section: "Charges", type: "number" },
      { key: "otherCharges", label: "Other charges", section: "Charges", type: "number" },
      { key: "declaration", label: "Exporter declaration / destination control statement", section: "Certification", type: "textarea" },
      { key: "signatory", label: "Authorized name, title and signature", section: "Certification", type: "textarea", required: true },
    ],
    lineTitle: "Invoice line items",
    lineColumns: [
      { key: "description", label: "Full goods description", width: 2.2 }, { key: "sku", label: "SKU / part no." },
      { key: "hsCode", label: "HS code" }, { key: "origin", label: "Origin" },
      { key: "quantity", label: "Qty", type: "number" }, { key: "uom", label: "UOM" },
      { key: "unitPrice", label: "Unit price", type: "number" }, { key: "amount", label: "Line amount", type: "number" },
      { key: "netKg", label: "Net kg", type: "number" }, { key: "grossKg", label: "Gross kg", type: "number" },
    ],
    faqs: [{ q: "Are totals calculated automatically?", a: "Yes. Line amounts and freight, insurance and other charges are included in the invoice total. You remain responsible for the declared customs value." }],
  },
  {
    slug: "packing-list-template",
    name: "Export Packing List",
    description: "Create a case-level packing list with package, weight, dimension and CBM totals.",
    purpose: "A packing list for cargo identification, handling and customs comparison against the commercial invoice.",
    authorityNotice: "Package counts, marks, net/gross weights and dimensions must match the physically packed cargo and the commercial invoice.",
    fields: [
      { key: "packingNumber", label: "Packing list number", section: "References", required: true },
      { key: "date", label: "Packing list date", section: "References", type: "date", required: true },
      { key: "invoiceRef", label: "Commercial invoice number", section: "References", required: true },
      { key: "poNumber", label: "Purchase order / contract", section: "References" },
      party("seller", "Seller / exporter"), party("buyer", "Buyer"), party("consignee", "Consignee / ship-to"),
      { key: "mode", label: "Mode of transport", section: "Shipment" },
      { key: "carrierVessel", label: "Carrier / vessel / voyage", section: "Shipment" },
      { key: "portLoad", label: "Port of loading", section: "Shipment" },
      { key: "portDischarge", label: "Port of discharge", section: "Shipment" },
      { key: "container", label: "Container number", section: "Equipment" },
      { key: "seal", label: "Seal number", section: "Equipment" },
      { key: "notes", label: "Packing / handling notes", section: "Certification", type: "textarea" },
      { key: "signatory", label: "Prepared by / authorized signature", section: "Certification", type: "textarea", required: true },
    ],
    lineTitle: "Packages and contents",
    lineColumns: [
      { key: "marks", label: "Marks & package nos." }, { key: "packageType", label: "Package type" },
      { key: "cartons", label: "Packages", type: "number" }, { key: "description", label: "Contents", width: 2.2 },
      { key: "sku", label: "SKU / part no." }, { key: "hsCode", label: "HS code" },
      { key: "quantity", label: "Item qty", type: "number" }, { key: "netKg", label: "Net kg", type: "number" },
      { key: "grossKg", label: "Gross kg", type: "number" }, { key: "length", label: "L cm", type: "number" },
      { key: "width", label: "W cm", type: "number" }, { key: "height", label: "H cm", type: "number" },
      { key: "cbm", label: "CBM", type: "number" },
    ],
    faqs: [{ q: "How is CBM calculated?", a: "For centimetres, each row uses length × width × height × packages ÷ 1,000,000. You can also override the row CBM when dimensions describe a whole lot rather than each package." }],
  },
  {
    slug: "shipping-instructions-template",
    name: "Shipping Instructions",
    description: "Submit complete, consistent B/L instructions to the carrier or forwarder.",
    purpose: "Shipper instructions used by a carrier or forwarder to prepare the draft transport document.",
    authorityNotice: "Submit by the carrier cut-off and verify the carrier-issued draft. This document itself is not a Bill of Lading.",
    fields: [
      { key: "booking", label: "Booking number", section: "References", required: true },
      { key: "exportReference", label: "Shipper reference", section: "References" },
      { key: "blType", label: "Requested B/L type / release", section: "References", placeholder: "Original / Sea Waybill / Telex release" },
      party("shipper", "Shipper"), party("consignee", "Consignee"), party("notify", "Notify party"),
      { key: "carrier", label: "Carrier / NVOCC", section: "Routing" },
      { key: "placeReceipt", label: "Place of receipt", section: "Routing" },
      { key: "vessel", label: "Vessel", section: "Routing" }, { key: "voyage", label: "Voyage", section: "Routing" },
      { key: "portLoad", label: "Port of loading / UN/LOCODE", section: "Routing", required: true },
      { key: "portDischarge", label: "Port of discharge / UN/LOCODE", section: "Routing", required: true },
      { key: "placeDelivery", label: "Place of delivery", section: "Routing" },
      { key: "freightTerms", label: "Freight prepaid / collect", section: "Terms", required: true },
      { key: "incoterm", label: "Incoterm and named place", section: "Terms" },
      { key: "containers", label: "Container, seal, size/type and VGM", section: "Equipment", type: "textarea" },
      { key: "marks", label: "Marks and numbers", section: "Cargo", type: "textarea" },
      { key: "clauses", label: "Special clauses / handling / manifest instructions", section: "Cargo", type: "textarea" },
      { key: "contact", label: "Submission contact and email", section: "Certification", type: "textarea", required: true },
    ],
    lineTitle: "Cargo declaration",
    lineColumns: cargoCore,
    faqs: [{ q: "Can I send this directly to a carrier?", a: "Yes, after checking it against the booking, invoice, packing list and carrier-specific submission requirements." }],
  },
  {
    slug: "arrival-notice-template",
    name: "Arrival Notice Data Sheet",
    description: "Prepare or verify arrival, terminal, charge and free-time information.",
    purpose: "A destination-side data sheet for preparing or checking an arrival notice.",
    authorityNotice: "This data sheet is not an official carrier notice. Arrival, charges and free time must be confirmed by the carrier, NVOCC, terminal or authorized destination agent.",
    fields: [
      { key: "noticeNumber", label: "Notice number", section: "Notice" },
      { key: "issueDate", label: "Issue date", section: "Notice", type: "date" },
      { key: "issuer", label: "Carrier / NVOCC / destination agent", section: "Notice", type: "textarea", required: true },
      { key: "blNumber", label: "B/L number", section: "Shipment", required: true },
      { key: "booking", label: "Booking / manifest reference", section: "Shipment" },
      { key: "consignee", label: "Consignee", section: "Parties", type: "textarea", required: true },
      { key: "notify", label: "Notify party", section: "Parties", type: "textarea" },
      { key: "vessel", label: "Vessel", section: "Arrival", required: true }, { key: "voyage", label: "Voyage", section: "Arrival" },
      { key: "eta", label: "ETA", section: "Arrival", type: "date", required: true },
      { key: "port", label: "Discharge port / UN/LOCODE", section: "Arrival", required: true },
      { key: "terminal", label: "Terminal / CFS / depot", section: "Arrival", required: true },
      { key: "availability", label: "Cargo availability / discharge status", section: "Release" },
      { key: "freeDay", label: "Last free day", section: "Release", type: "date" },
      { key: "pickupReference", label: "Pickup / release reference", section: "Release" },
      { key: "currency", label: "Charge currency", section: "Charges", placeholder: "USD" },
      { key: "freightCharges", label: "Freight due", section: "Charges", type: "number" },
      { key: "terminalCharges", label: "Terminal / destination charges", section: "Charges", type: "number" },
      { key: "otherCharges", label: "Other charges", section: "Charges", type: "number" },
      { key: "payment", label: "Payment and release instructions", section: "Release", type: "textarea" },
      { key: "contact", label: "Destination contact", section: "Notice", type: "textarea", required: true },
    ],
    lineTitle: "Equipment / cargo status",
    lineColumns: [
      { key: "container", label: "Container" }, { key: "seal", label: "Seal" },
      { key: "packageType", label: "Package type" }, { key: "packages", label: "Packages", type: "number" },
      { key: "grossKg", label: "Gross kg", type: "number" }, { key: "status", label: "Status / location", width: 2 },
    ],
    faqs: [{ q: "Who normally issues an arrival notice?", a: "The ocean carrier, NVOCC or authorized destination agent. Use this sheet to prepare or verify the data, not to impersonate an issuer." }],
  },
  {
    slug: "delivery-order-template",
    name: "Delivery Order Data Sheet",
    description: "Prepare and verify the authorized cargo-release particulars required by a terminal or depot.",
    purpose: "A controlled data sheet for an authorized carrier or agent to prepare a delivery order, or for a consignee to verify one.",
    authorityNotice: "This data sheet does not release cargo. Only the carrier, NVOCC or authorized agent can issue a valid delivery order after surrender/release, payment and customs conditions are satisfied.",
    fields: [
      { key: "orderNumber", label: "Delivery order number", section: "Authorization", required: true },
      { key: "issueDate", label: "Issue date", section: "Authorization", type: "date", required: true },
      { key: "issuer", label: "Issuing carrier / NVOCC / agent", section: "Authorization", type: "textarea", required: true },
      { key: "blNumber", label: "B/L number", section: "Shipment", required: true },
      { key: "booking", label: "Manifest / booking reference", section: "Shipment" },
      { key: "consignee", label: "Consignee", section: "Parties", type: "textarea", required: true },
      { key: "releaseTo", label: "Release cargo to", section: "Parties", type: "textarea", required: true },
      { key: "carrier", label: "Ocean carrier", section: "Shipment" },
      { key: "vesselVoyage", label: "Vessel / voyage", section: "Shipment" },
      { key: "terminal", label: "Terminal / CFS / depot", section: "Release", required: true },
      { key: "pickupReference", label: "Pickup / PIN / release reference", section: "Release" },
      { key: "validFrom", label: "Valid from", section: "Release", type: "date" },
      { key: "validUntil", label: "Valid until", section: "Release", type: "date", required: true },
      { key: "customsRef", label: "Customs release / entry reference", section: "Compliance" },
      { key: "conditions", label: "Release conditions and instructions", section: "Compliance", type: "textarea", required: true },
      { key: "signatory", label: "Authorized signatory / authentication", section: "Authorization", type: "textarea", required: true },
    ],
    lineTitle: "Authorized equipment / cargo release",
    lineColumns: [
      { key: "container", label: "Container / unit", width: 1.4 }, { key: "seal", label: "Seal" },
      { key: "packageType", label: "Package type" }, { key: "packages", label: "Packages", type: "number" },
      { key: "grossKg", label: "Gross kg", type: "number" }, { key: "status", label: "Release status / depot", width: 2 },
    ],
    faqs: [{ q: "Does this template release cargo?", a: "No. It is a preparation and verification sheet. A valid delivery order requires authorization from the carrier or its agent and satisfaction of release conditions." }],
  },
];
