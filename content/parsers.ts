// Config for the 6 parser landing pages (BUILD_SPEC §M8). One shared page
// component renders these — content only here, no JSX.

import type { Faq } from "@/lib/seo/jsonld";

export interface ParserPage {
  slug: string;
  metaTitle: string;
  metaDescription: string;
  h1: string;
  intro: string[];
  extracted: string[];
  checks: string[];
  faqs: Faq[];
}

export const PARSER_PAGES: ParserPage[] = [
  {
    slug: "air-waybill-parser",
    metaTitle: "Air Waybill Parser — Extract MAWB & HAWB Data with AI",
    metaDescription: "Parse Air Waybills into editable shipper, consignee, airport, flight, piece, weight, rating and charge data with deterministic AWB-number validation.",
    h1: "Air Waybill Parser",
    intro: [
      "Upload a master or house Air Waybill and turn its routing, parties, handling and nature-and-quantity table into structured data. Every field remains editable before export.",
      "GainingDocx distinguishes explicitly labelled MAWB and HAWB references, validates the printed modulus-7 AWB check digit, and keeps gross and chargeable weight separate for invoice and packing-list review.",
    ],
    extracted: [
      "AWB, MAWB and HAWB numbers with airline prefix",
      "Shipper, consignee and issuing carrier agent",
      "Origin and destination airports, flight and issue details",
      "Pieces, gross weight, chargeable weight and cargo description",
      "Rate class, charge, declared values, handling and prepaid/collect totals",
    ],
    checks: [
      "IATA-style 3-digit prefix, 7-digit serial and modulus-7 check digit",
      "Printed total pieces and weights retained separately from line evidence",
      "Explicit master-versus-house classification without number-format guessing",
      "Editable review followed by XLSX, CSV, JSON or PDF export",
    ],
    faqs: [
      { q: "Does it parse both MAWB and HAWB documents?", a: "Yes. It records master and house references when they are explicitly printed and otherwise marks the level unknown for human review." },
      { q: "Does a valid check digit prove the shipment is genuine?", a: "No. It validates the number's arithmetic structure only; airline acceptance and shipment status require carrier confirmation." },
    ],
  },
  {
    slug: "bill-of-lading-parser",
    metaTitle: "Bill of Lading Parser — Extract B/L Data with AI",
    metaDescription:
      "Upload a Bill of Lading and get every field as structured data: B/L number, parties, ports, containers, weights. Validated with ISO 6346 and UN/LOCODE rules. First document free.",
    h1: "Bill of Lading Parser",
    intro: [
      "A Bill of Lading carries more than thirty structured fields, and most teams still retype them into spreadsheets and TMS systems by hand. GainingDocx reads the B/L for you — photographed at the terminal or dropped as a PDF — and returns every field as clean, structured data in under a minute.",
      "Unlike a plain OCR tool, every extracted value is then checked with deterministic maritime rules: container check digits are recomputed, port names are matched against the UN/LOCODE directory, and weight totals are added up. The AI reads; the rules decide.",
    ],
    extracted: [
      "B/L number, SCAC and carrier name",
      "Shipper, consignee (incl. TO ORDER) and notify party",
      "Vessel, voyage and IMO number",
      "Port of loading and discharge with UN/LOCODE",
      "Container numbers, seals, types, packages and weights",
      "Shipped-on-board and issue dates, freight terms, incoterm",
      "Cargo description lines, totals, number of originals and clauses",
    ],
    checks: [
      "ISO 6346 container check digits recomputed character by character",
      "IMO number checksum",
      "Ports matched to the current bundled UNECE UN/LOCODE maritime dataset",
      "Container gross weights summed against the printed total (±0.5%)",
      "Shipped-on-board vs issue-date window",
    ],
    faqs: [
      {
        q: "Does it work with photos taken on a phone?",
        a: "Yes. Pages are compressed on your device and parsed from camera photos, scans or PDFs. Straight or slightly skewed photos both work.",
      },
      {
        q: "What happens if a container number is misread or mistyped?",
        a: "Every container number's ISO 6346 check digit is recomputed in code. If the digit on the document doesn't match, the field is flagged red with the expected value, so you catch typos before they reach customs or the carrier.",
      },
      {
        q: "Can I export the parsed B/L to Excel?",
        a: "Yes — one click gives you an Excel workbook with Summary, Containers and Lines sheets, plus CSV, JSON and a branded PDF summary report.",
      },
      {
        q: "Is my document stored?",
        a: "Anonymous test parses are processed and held only in your browser. Signed-in documents are stored privately in your account, and you can delete everything at any time.",
      },
    ],
  },
  {
    slug: "commercial-invoice-parser",
    metaTitle: "Commercial Invoice Parser — Extract Invoice Data with AI",
    metaDescription:
      "Turn commercial invoices into structured data: seller, buyer, line items, HS codes, amounts and incoterms. Cross-check against the B/L and packing list. First document free.",
    h1: "Commercial Invoice Parser",
    intro: [
      "Commercial invoices drive customs entries, letters of credit and payment — and a single mistyped amount or HS code can hold a shipment at the border. GainingDocx extracts every line item, amount and party from your invoice as structured data you can trust.",
      "Once parsed, the invoice can be cross-checked against the Bill of Lading and packing list from the same shipment: mismatched buyers, differing incoterms or totals that don't add up surface as red and amber discrepancies.",
    ],
    extracted: [
      "Invoice number, date and PO number",
      "Seller and buyer with addresses and tax IDs",
      "Line items with description, HS code, quantity, unit price and amount",
      "Currency, subtotal, freight, insurance and total amount",
      "Incoterm, payment terms, L/C number and country of origin",
      "Bank details",
    ],
    checks: [
      "Gross ≥ net weight on every line that carries both",
      "Invoice date sanity (flagged when in the future)",
      "Cross-document: invoice totals vs packing list, incoterm vs B/L",
      "Duplicate invoice number detection across your documents",
    ],
    faqs: [
      {
        q: "Does the parser calculate totals itself?",
        a: "No — and that's deliberate. Values are copied exactly as printed. Deterministic rules then verify whether the printed lines add up to the printed total and flag the difference if they don't.",
      },
      {
        q: "Can it read invoices in other languages?",
        a: "The parser handles common trade-document layouts in English and mixed-language documents. Values are copied exactly as printed, so foreign party names survive untouched.",
      },
      {
        q: "Can I generate a packing list from the invoice?",
        a: "Yes. One click creates a packing list draft with every line mapped from the invoice — you edit, then download the PDF.",
      },
      {
        q: "How long does parsing take?",
        a: "Typically 15–30 seconds per page, streamed live so you see fields appear as they are read.",
      },
    ],
  },
  {
    slug: "packing-list-parser",
    metaTitle: "Packing List Parser — Extract Cartons, Weights & Dims with AI",
    metaDescription:
      "Parse packing lists into structured data: cartons, net/gross weights, dimensions and container references. Totals verified automatically. First document free.",
    h1: "Packing List Parser",
    intro: [
      "Packing lists are where the physical truth of a shipment lives: cartons, weights, dimensions, container loading. They are also the documents most often retyped into warehouse systems line by painful line. GainingDocx parses them in seconds.",
      "Every line's weights are checked (gross must exceed net), line sums are compared against printed totals, and container references are verified with the ISO 6346 check-digit algorithm.",
    ],
    extracted: [
      "Packing list number, date, invoice reference and PO number",
      "Seller and buyer",
      "Line items with cartons, packages, net kg, gross kg and CBM",
      "Per-line dimensions where printed",
      "Total cartons, net weight, gross weight and volume",
      "Container references",
    ],
    checks: [
      "Line gross ≥ net on every row",
      "Line sums vs printed totals (±0.5%)",
      "Total gross ≥ total net",
      "Container reference check digits (ISO 6346)",
      "Cross-document: container sets and totals vs the B/L",
    ],
    faqs: [
      {
        q: "My packing list has 40+ lines. Will it work?",
        a: "Yes — multi-page packing lists parse page by page, and every line lands in the Lines sheet of the Excel export.",
      },
      {
        q: "Does it verify the totals row?",
        a: "Yes. Line weights are summed in code and compared to the printed totals with a ±0.5% tolerance. A drift beyond that is flagged before anyone loads a container.",
      },
      {
        q: "Can I create an invoice from the packing list?",
        a: "Yes — the generator maps every line into a commercial invoice draft. Amounts stay blank (never invented); you fill in prices and download the PDF.",
      },
      {
        q: "What formats can I upload?",
        a: "PDF, JPG/JPEG, PNG, WebP, BMP and multi-page TIFF are supported. HEIC/HEIF also works when the device can decode it; otherwise export it as JPG. Pages are prepared client-side before upload.",
      },
    ],
  },
  {
    slug: "sea-waybill-parser",
    metaTitle: "Sea Waybill Parser — Extract Waybill Data with AI",
    metaDescription:
      "Parse sea waybills (express B/Ls) into structured data with deterministic validation of containers, ports and weights. First document free.",
    h1: "Sea Waybill Parser",
    intro: [
      "Sea waybills — express bills, straight consigned, no originals to surrender — carry the same operational data as a negotiable B/L, and cause the same retyping work. GainingDocx parses them with the same engine and the same deterministic checks.",
      "The parser detects the document type automatically, so waybills, seaway bills and telex-released B/Ls all land in the same structured shape your exports and cross-checks expect.",
    ],
    extracted: [
      "Waybill number and carrier",
      "Shipper, consignee and notify party",
      "Vessel, voyage, ports of loading and discharge",
      "Containers with seals, packages and weights",
      "Dates, freight terms and clauses",
    ],
    checks: [
      "ISO 6346 container check digits",
      "UN/LOCODE port matching",
      "Weight totals vs container sums",
      "Date plausibility windows",
    ],
    faqs: [
      {
        q: "How is a sea waybill different from a Bill of Lading?",
        a: "A sea waybill is not a document of title — cargo is released to the named consignee without surrendering originals. Operationally it carries the same data, which is why the same parser handles both.",
      },
      {
        q: "Will the parser know it's a waybill and not a B/L?",
        a: "Yes — document type detection runs in the same pass as extraction, and the detected type is stored with the parsed fields.",
      },
      {
        q: "Can I cross-check a waybill against the invoice?",
        a: "Yes — group them into a shipment and run Shipment Check to compare parties, containers, ports and totals.",
      },
      {
        q: "Is there a free trial?",
        a: "You can use the anonymous parser preview without an account. Paid subscription quotas are not live yet.",
      },
    ],
  },
  {
    slug: "arrival-notice-parser",
    metaTitle: "Arrival Notice Parser — Extract Arrival Data with AI",
    metaDescription:
      "Parse carrier arrival notices into structured data: vessel, ETA, containers, charges and pickup references — validated deterministically. First document free.",
    h1: "Arrival Notice Parser",
    intro: [
      "Arrival notices land in your inbox days before demurrage clocks start, and the details buried in them — container numbers, last free day, charges — are exactly the details you cannot afford to mistype. GainingDocx pulls them out as structured data.",
      "Container numbers on the notice are verified with the ISO 6346 check-digit algorithm, and port and vessel details can be cross-checked against the original Bill of Lading in the same shipment.",
    ],
    extracted: [
      "B/L reference and carrier",
      "Vessel, voyage and ports",
      "Container numbers and sizes",
      "Consignee and notify details",
      "Key dates printed on the notice",
    ],
    checks: [
      "Container check digits (ISO 6346)",
      "Port names vs UN/LOCODE",
      "Cross-document consistency with the B/L",
    ],
    faqs: [
      {
        q: "Arrival notices vary wildly by carrier. Does that matter?",
        a: "The parser is layout-agnostic — it reads the document like a human would, then structures what it finds. Unrecognized extras are preserved rather than dropped.",
      },
      {
        q: "Can it remind me before the last free day?",
        a: "Parsed dates are stored with the document. Automated LFD reminders are on the roadmap; today the Next Action engine surfaces the document for review.",
      },
      {
        q: "Can I match the notice to my B/L automatically?",
        a: "Documents sharing a B/L number are grouped into the same shipment automatically, ready for cross-checking.",
      },
      {
        q: "Do I need an account?",
        a: "Not for your first document — parse one free, then sign up to keep it.",
      },
    ],
  },
  {
    slug: "booking-confirmation-parser",
    metaTitle: "Booking Confirmation Parser — Extract Booking Data with AI",
    metaDescription:
      "Parse ocean booking confirmations into structured data: booking number, vessel, cut-offs, equipment and routing — ready to become Shipping Instructions. First document free.",
    h1: "Booking Confirmation Parser",
    intro: [
      "The booking confirmation is the first document in every ocean shipment's paper trail — and the source of truth for cut-offs, equipment and routing. GainingDocx extracts its fields so your team stops copying vessel names and cut-off dates by hand.",
      "Parsed bookings flow straight into the rest of the pipeline: generate a Shipping Instructions draft from the booking data, then cross-check the resulting B/L against it when the carrier issues it.",
    ],
    extracted: [
      "Booking number and carrier",
      "Vessel, voyage and routing",
      "Ports of loading and discharge",
      "Equipment type and quantity",
      "Cut-off and sailing dates printed on the confirmation",
    ],
    checks: [
      "Port names vs UN/LOCODE",
      "Date plausibility",
      "Cross-document consistency once the B/L arrives",
    ],
    faqs: [
      {
        q: "Can I turn a booking into Shipping Instructions?",
        a: "Yes — the generator maps parties, routing and equipment into an SI draft you edit and download as PDF.",
      },
      {
        q: "Will it read cut-off dates?",
        a: "Dates are extracted exactly as printed and checked for plausibility. Ambiguous formats are parsed day-first, the dominant convention on ocean documents.",
      },
      {
        q: "What if my confirmation is an email screenshot?",
        a: "Screenshots parse fine — compress happens automatically and the parser reads rendered text from images.",
      },
      {
        q: "How much does it cost?",
        a: "Start with 20 documents each month on Free. Pro includes 500 documents for one operator, while Team includes a five-seat shared workspace and 2,000 pooled documents. Both paid plans are monthly and managed through Paddle.",
      },
    ],
  },
  {
    slug: "purchase-order-parser",
    metaTitle: "Purchase Order Parser — Extract PO Lines for 3-Way Matching",
    metaDescription: "Extract purchase-order numbers, suppliers, delivery terms, line quantities, prices and totals for automated three-way matching.",
    h1: "Purchase Order Parser",
    intro: [
      "Purchase orders establish what was authorized: supplier, product, quantity, price, currency and delivery terms. GainingDocx captures header and line-level evidence so invoices are never approved from a total-only comparison.",
      "The parsed PO becomes the commercial baseline for matching against transport or receipt evidence and the supplier or freight invoice. Missing evidence stays incomplete; exact contradictions are blocked instead of averaged away.",
    ],
    extracted: [
      "PO number, issue date, buyer and supplier addresses",
      "Ship-to, bill-to, requested delivery date and transport terms",
      "Product code, description, quantity, UOM, unit price and line amount",
      "Currency, subtotal, discount, tax, freight and total",
      "Incoterm, payment terms and referenced contracts",
    ],
    checks: [
      "Line quantity × unit price versus printed line amount",
      "Line sums and charges versus printed PO total",
      "Exact PO-reference matching across invoices and transport documents",
      "Supplier, currency, quantity and line-level tolerance checks",
    ],
    faqs: [
      { q: "Does matching stop when the PO number disagrees?", a: "Yes. A contradictory PO reference is blocking evidence. The shipment cannot be marked matched until it is corrected or reviewed." },
      { q: "Can descriptions match when product codes are missing?", a: "Yes, but description-only matches are conservative and routed to review when the evidence is not strong enough for automatic approval." },
    ],
  },
  {
    slug: "freight-invoice-parser",
    metaTitle: "Freight Invoice Parser — Audit Rates, Charges & References",
    metaDescription: "Extract freight invoice references, routes, equipment, base freight, fuel and accessorial charges for automated audit and matching.",
    h1: "Freight Invoice Parser",
    intro: [
      "Freight invoices combine shipment references with base rates, fuel, terminal and accessorial charges. GainingDocx keeps every charge separate so an apparently correct grand total cannot hide an unsupported fee.",
      "Invoice evidence is matched to the PO and B/L, sea waybill or receipt using exact commercial references, container IDs, parties, currency and configured amount tolerances.",
    ],
    extracted: [
      "Invoice number, dates, carrier, bill-to party and currency",
      "B/L, booking, PO, shipment and container references",
      "Origin, destination, service and equipment details",
      "Charge code, description, quantity, rate, tax and amount per line",
      "Subtotal, tax, adjustments and amount due",
    ],
    checks: [
      "Charge-line arithmetic and printed subtotal reconciliation",
      "Currency and amount-tolerance enforcement",
      "B/L, booking, PO and container reference matching",
      "Unsupported or contradictory accessorials routed to review",
    ],
    faqs: [
      { q: "Does it merge all charges into one freight amount?", a: "No. Base freight, fuel, terminal and accessorial charges remain separate rows for auditability." },
      { q: "Can I verify LCL weight-or-measure billing?", a: "Yes. Use the LCL W/M calculator with CBM and gross weight from the shipment, then compare the estimate with the parsed charge lines." },
    ],
  },
  {
    slug: "goods-receipt-parser",
    metaTitle: "Goods Receipt Parser — Extract GRN Quantities for 3-Way Match",
    metaDescription: "Extract GRN and proof-of-receipt references, accepted and rejected quantities, dates and line items for three-way matching.",
    h1: "Goods Receipt Parser",
    intro: [
      "A goods receipt proves what physically arrived, not merely what was ordered or invoiced. GainingDocx extracts accepted, rejected and damaged quantities at line level so shortages cannot pass a total-only match.",
      "The receipt can serve as the third evidence role alongside the PO and invoice. For ocean workflows, a B/L or sea waybill can provide transport evidence while receipt documents confirm final acceptance.",
    ],
    extracted: [
      "Receipt or GRN number, receipt date, warehouse and receiver",
      "PO, invoice, shipment and B/L references",
      "Product code, description, received, accepted and rejected quantity",
      "UOM, lot, batch, serial, condition and damage notes",
    ],
    checks: [
      "Accepted plus rejected quantities versus received quantity",
      "Received quantities versus PO and invoice lines",
      "Exact PO and shipment-reference consistency",
      "Missing, damaged or over-received goods routed to review or blocked",
    ],
    faqs: [
      { q: "Can a shipment match without receipt evidence?", a: "No automatic approval is issued when a required evidence role is missing. The result remains incomplete." },
      { q: "Are damaged quantities preserved?", a: "Yes. Rejected and damaged quantities and notes are retained separately from accepted quantity." },
    ],
  },
  {
    slug: "shipper-letter-of-instruction-parser",
    metaTitle: "Air Shipper's Letter of Instruction Parser",
    metaDescription: "Extract air SLI parties, airports, flight request, pieces, weights, handling and dangerous-goods instructions for AWB checking.",
    h1: "Air Shipper's Letter of Instruction Parser",
    intro: [
      "Turn an exporter or forwarder air SLI into structured instructions before the Air Waybill is finalized.",
      "Connect the SLI to the AWB, commercial invoice and packing list to catch party, route, piece and weight differences before cargo tender.",
    ],
    extracted: ["Instruction and AWB references", "Shipper, consignee and issuing agent", "Origin, destination and requested flight", "Pieces, gross and expected chargeable weight", "Handling and dangerous-goods information", "Signature and date evidence"],
    checks: ["Airport-code format", "AWB reference arithmetic where applicable", "SLI-to-AWB party and route matching", "Piece and gross-weight reconciliation"],
    faqs: [
      { q: "Is this the same as ocean shipping instructions?", a: "No. The air SLI uses airports, flight requests, air handling and AWB references; it is classified separately." },
      { q: "Can it create an official AWB?", a: "No. It prepares and checks the source data; the airline or authorized issuing agent remains responsible for the official AWB." },
    ],
  },
  {
    slug: "dangerous-goods-declaration-parser",
    metaTitle: "Dangerous Goods Declaration Parser for Air Cargo",
    metaDescription: "Extract DGD AWB references, UN numbers, proper shipping names, classes, packing groups, quantities, limitations and signatures.",
    h1: "Air Dangerous Goods Declaration Parser",
    intro: [
      "Extract the printed evidence on an air Dangerous Goods Declaration into a reviewable record.",
      "Structural and cross-document checks help trained personnel find missing or conflicting data; they do not replace IATA DGR acceptance review.",
    ],
    extracted: ["AWB and declaration references", "Shipper, consignee and airport route", "UN number and proper shipping name", "Class, subsidiary risk and packing group", "Packing instruction, quantity and aircraft limitation", "Signatory, date and emergency contact"],
    checks: ["UN-number and hazard-class structure", "Signature and date presence", "Forbidden and Cargo Aircraft Only indicators", "DGD-to-AWB reference, route and dangerous-goods consistency"],
    faqs: [
      { q: "Does this certify dangerous-goods compliance?", a: "No. It is a pre-check and evidence tool for qualified dangerous-goods personnel." },
      { q: "Will forbidden cargo be flagged?", a: "Yes. A printed forbidden aircraft limitation becomes a stop-level finding for specialist review." },
    ],
  },
  {
    slug: "air-cargo-manifest-parser",
    metaTitle: "Air Cargo Manifest Parser & MAWB HAWB Reconciliation",
    metaDescription: "Extract air manifest flight, route, AWB references, pieces and weight totals for consolidation checking.",
    h1: "Air Cargo Manifest Parser",
    intro: [
      "Convert an air cargo manifest into structured flight, route and waybill evidence.",
      "Use it with the MAWB and HAWB set to find missing references and totals that do not reconcile.",
    ],
    extracted: ["Manifest number", "Airline, flight and date", "Origin and destination airports", "Master and house AWB references", "Shipment, piece and gross-weight totals", "Manifest cargo rows"],
    checks: ["Airport-code format", "AWB-number arithmetic where applicable", "Manifest-to-MAWB route matching", "Manifest and house-total reconciliation"],
    faqs: [
      { q: "Can it process a manifest containing many HAWBs?", a: "Yes. References and cargo rows are retained as a set for consolidation review." },
      { q: "Does it transmit the manifest to an airline or customs system?", a: "No. Current functionality extracts, checks and exports reviewed data." },
    ],
  },
  {
    slug: "cargo-security-declaration-parser",
    metaTitle: "Cargo Security Declaration Parser for Air Freight",
    metaDescription: "Extract air cargo security status, screening method, regulated agent, issuer, date, AWB references, pieces and weight.",
    h1: "Air Cargo Security Declaration Parser",
    intro: [
      "Extract security declaration evidence and connect it to the related Air Waybill.",
      "GainingDocx preserves printed codes exactly and flags missing review fields without claiming to grant or authenticate security status.",
    ],
    extracted: ["Declaration and AWB references", "Regulated agent", "Security status", "Screening method", "Issuer and issue date", "Piece and gross-weight totals"],
    checks: ["Required evidence presence", "AWB reference consistency", "Piece and weight comparison", "Source-linked human review"],
    faqs: [
      { q: "Does the parser verify a regulated-agent authorization?", a: "No. It extracts printed evidence; authorization must be confirmed with the responsible authority or approved system." },
      { q: "Are security codes interpreted automatically?", a: "No. They are preserved as printed for trained operational review." },
    ],
  },
];
