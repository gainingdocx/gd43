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
      "Ports matched to the current bundled UN/LOCODE 2025-1 maritime dataset",
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
        a: "The parser is in early access. Paid subscription checkout and final quotas are not live yet; see the pricing page for the planned offering.",
      },
    ],
  },
];
