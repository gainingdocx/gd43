export interface TemplateDefinition {
  slug: string;
  name: string;
  description: string;
  fields: { key: string; label: string; placeholder?: string; type?: "date" | "number" | "textarea" }[];
  faqs: { q: string; a: string }[];
}

const commonParties = [
  { key: "shipper", label: "Shipper / seller", type: "textarea" as const },
  { key: "consignee", label: "Consignee / buyer", type: "textarea" as const },
];

export const TEMPLATES: TemplateDefinition[] = [
  {
    slug: "bill-of-lading-template",
    name: "Bill of Lading Template",
    description: "Create a clean draft B/L with parties, routing, vessel and container details.",
    fields: [
      { key: "blNumber", label: "B/L number", placeholder: "GDOCX-001" }, ...commonParties,
      { key: "vessel", label: "Vessel and voyage" }, { key: "portLoad", label: "Port of loading" },
      { key: "portDischarge", label: "Port of discharge" }, { key: "container", label: "Container / seal number" },
      { key: "cargo", label: "Cargo description", type: "textarea" }, { key: "grossKg", label: "Gross weight (kg)", type: "number" },
    ],
    faqs: [{ q: "Is this a carrier-issued B/L?", a: "No. This is a draft template for preparing or checking shipping instructions. Only the carrier or its authorized agent issues the transport document." }],
  },
  {
    slug: "commercial-invoice-template",
    name: "Commercial Invoice Template",
    description: "Build an export invoice with line values, trade terms and automatic totals.",
    fields: [
      { key: "invoiceNumber", label: "Invoice number" }, { key: "date", label: "Invoice date", type: "date" }, ...commonParties,
      { key: "currency", label: "Currency", placeholder: "USD" }, { key: "incoterm", label: "Incoterm", placeholder: "FOB" },
      { key: "origin", label: "Country of origin" }, { key: "payment", label: "Payment terms" },
    ],
    faqs: [{ q: "Are totals calculated automatically?", a: "Yes. Quantity multiplied by unit price is calculated for each line and the invoice total updates immediately." }],
  },
  {
    slug: "packing-list-template",
    name: "Packing List Template",
    description: "List cartons, weights and dimensions with automatic weight and CBM totals.",
    fields: [
      { key: "packingNumber", label: "Packing list number" }, { key: "invoiceRef", label: "Invoice reference" }, ...commonParties,
      { key: "container", label: "Container number" }, { key: "notes", label: "Packing notes", type: "textarea" },
    ],
    faqs: [{ q: "How is CBM calculated?", a: "For dimensions in centimetres, CBM is length × width × height × quantity divided by 1,000,000." }],
  },
  {
    slug: "shipping-instructions-template",
    name: "Shipping Instructions Template",
    description: "Prepare consistent instructions for your carrier before B/L issuance.",
    fields: [
      { key: "booking", label: "Booking number" }, ...commonParties, { key: "notify", label: "Notify party", type: "textarea" },
      { key: "vessel", label: "Vessel and voyage" }, { key: "portLoad", label: "Port of loading" },
      { key: "portDischarge", label: "Port of discharge" }, { key: "marks", label: "Marks and numbers", type: "textarea" },
    ],
    faqs: [{ q: "Can I send this directly to a carrier?", a: "Yes, after reviewing the draft against the booking confirmation and your commercial documents." }],
  },
  {
    slug: "arrival-notice-template",
    name: "Arrival Notice Template",
    description: "Organize vessel arrival, pickup references, charges and free-time dates.",
    fields: [
      { key: "blNumber", label: "B/L number" }, { key: "carrier", label: "Carrier" }, { key: "consignee", label: "Consignee", type: "textarea" },
      { key: "vessel", label: "Vessel and voyage" }, { key: "eta", label: "Estimated arrival", type: "date" },
      { key: "port", label: "Discharge port / terminal" }, { key: "container", label: "Container number" }, { key: "freeDay", label: "Last free day", type: "date" },
    ],
    faqs: [{ q: "Who normally issues an arrival notice?", a: "The ocean carrier, NVOCC or destination agent normally issues it to the consignee or notify party." }],
  },
  {
    slug: "delivery-order-template",
    name: "Delivery Order Template",
    description: "Prepare release details for the terminal, depot or inland carrier.",
    fields: [
      { key: "orderNumber", label: "Delivery order number" }, { key: "blNumber", label: "B/L number" },
      { key: "releaseTo", label: "Release cargo to", type: "textarea" }, { key: "terminal", label: "Terminal / depot" },
      { key: "container", label: "Container number" }, { key: "validUntil", label: "Valid until", type: "date" },
      { key: "instructions", label: "Release instructions", type: "textarea" },
    ],
    faqs: [{ q: "Does this template release cargo?", a: "No. A valid delivery order must be authorized by the carrier or its agent. This template helps prepare and review the required data." }],
  },
];
