import { SEARCH_GUIDES } from "@/content/search-guides";

export interface GuideDefinition {
  slug: string;
  title: string;
  seoTitle?: string;
  description: string;
  readMinutes: number;
  sections: { heading: string; paragraphs: string[]; bullets?: string[] }[];
  faqs?: { q: string; a: string }[];
  sources?: { name: string; url: string; note: string }[];
  tool?: { href: string; label: string; title: string; description: string };
  updated?: string;
}

export const GUIDES: GuideDefinition[] = [
  ...SEARCH_GUIDES,
  {
    slug: "how-to-read-a-bill-of-lading",
    title: "How to Read a Bill of Lading: Fields, Terms & Checklist",
    description: "Learn how to read B/L parties, routing, containers, cargo, freight terms, dates, originals and release instructions.",
    readMinutes: 10,
    sections: [
      { heading: "Bill of Lading review in brief", paragraphs: ["Start with the B/L number, carrier and parties; verify the vessel, voyage and ports; reconcile containers, seals, packages and weights; then check dates, freight terms, release type and originals. Compare the document with the commercial invoice and packing list before approval."] },
      { heading: "Shipper, consignee and notify party", paragraphs: ["Confirm the legal names and addresses against the commercial invoice and booking. A consignee shown as “to order” affects control and endorsement of an original negotiable B/L, so it should never be silently normalized to a named receiver."], bullets: ["B/L number and carrier or SCAC", "Shipper legal name and address", "Consignee wording, including “to order”", "Notify party and contact details"] },
      { heading: "Vessel, voyage, port of loading and discharge", paragraphs: ["The vessel, voyage, port of loading (POL) and port of discharge (POD) define the contracted ocean movement. Use UN/LOCODE references where available because similarly named cities, terminals and transshipment points can cause routing errors."] },
      { heading: "Containers, seals, packages and weight", paragraphs: ["Check every container and seal against the packing list and stuffing record. Recompute ISO 6346 container check digits, then reconcile package count, gross weight, measurement and cargo description. A missing container or unexplained total difference needs review."] },
      { heading: "Freight terms, dates and release type", paragraphs: ["Review prepaid or collect freight terms, shipped-on-board and issue dates, the number of originals, and whether the document is an original B/L, sea waybill or subject to an express or telex-release process. These details affect payment and cargo release."] },
      { heading: "Common Bill of Lading errors", paragraphs: ["Frequent problems include misspelled party names, old booking references, transposed container digits, inconsistent ports, vague cargo descriptions, and package or weight totals that disagree with the packing list. Correct the source or obtain an authorized amendment rather than editing downstream copies independently."] },
      { heading: "Bill of Lading review checklist", paragraphs: ["Use this final check before approving a draft or using B/L data in another system."], bullets: ["Parties match the commercial documents", "Routing matches the booking", "Every container and seal is accounted for", "Packages and weights reconcile", "Dates and freight terms are plausible", "Release type and original count are understood"] },
    ],
  },
  {
    slug: "commercial-invoice-vs-packing-list",
    title: "Commercial Invoice vs Packing List: Differences & Checklist",
    description: "Compare the purpose, fields and customs role of a commercial invoice and export packing list, plus the data that should match.",
    readMinutes: 8,
    sections: [
      { heading: "Commercial invoice vs packing list in brief", paragraphs: ["A commercial invoice records the sale, customs value, currency and payment terms. A packing list records how the goods are physically packed, including cartons, dimensions and weights. Product identity, quantities, parties and shipment references should agree across both documents."] },
      { heading: "What a commercial invoice includes", paragraphs: ["The commercial invoice supports customs valuation and the commercial transaction. It normally identifies seller and buyer, invoice number and date, product descriptions, HS codes, country of origin, quantity, unit price, currency, line amount, charges, Incoterms and total value."] },
      { heading: "What an export packing list includes", paragraphs: ["The packing list describes the physical shipment rather than its price. It normally records marks and numbers, package type, carton or pallet count, product allocation, net and gross weight, dimensions, CBM and sometimes container or seal references."] },
      { heading: "Fields that should match", paragraphs: ["Compare shared facts at line and shipment level instead of checking only grand totals."], bullets: ["Seller, buyer and ship-to parties", "Invoice, PO and shipment references", "Product descriptions, SKUs and HS codes", "Quantities and units of measure", "Cartons, net weight and gross weight", "Container and routing references where printed"] },
      { heading: "Common discrepancies", paragraphs: ["Late packing changes, unit conversions, split shipments and copied references commonly create differences. Determine which document reflects the actual sale and which reflects the final physical packing, then correct or reissue the affected record through the responsible party."] },
      { heading: "Which document customs uses", paragraphs: ["Customs requirements differ by country and transaction, but the commercial invoice is generally central to value and classification while the packing list supports physical examination and package identification. Neither document replaces destination-specific filing requirements or broker advice."] },
      { heading: "Invoice and packing-list reconciliation checklist", paragraphs: ["Before tendering the documents, confirm that shared parties, products, quantities, references and weights agree and that any legitimate difference—such as a partial shipment—is clearly documented."] },
    ],
  },
  {
    slug: "iso-6346-container-number-check-digit",
    title: "ISO 6346 Container Check Digit: Formula & Example",
    description: "Understand the ISO 6346 container-number format, letter values, modulo-11 check digit calculation and validation limits.",
    readMinutes: 9,
    sections: [
      { heading: "ISO 6346 check digit in brief", paragraphs: ["An ISO 6346 container number contains a three-letter owner code, one equipment-category letter, a six-digit serial number and one check digit. The check digit is calculated by mapping letters to ISO values, applying powers-of-two weights and reducing the sum modulo 11."] },
      { heading: "Container number format", paragraphs: ["A typical freight-container identifier has eleven characters. The first three letters identify the owner code, the fourth is the equipment-category identifier—commonly U for freight containers—the next six digits are the serial, and the last digit is the check digit. Printed spaces are not part of the number."] },
      { heading: "Letter values and position weights", paragraphs: ["Letters use numeric values beginning with A=10 while skipping multiples of 11. Starting at the leftmost character, each value is multiplied by 2 raised to its zero-based position: 1, 2, 4, 8 and so on. Digits retain their numeric value."] },
      { heading: "Check digit formula step by step", paragraphs: ["Convert the first ten characters to values, multiply each by its position weight, add the products, and divide the sum by 11. The remainder becomes the check digit; a remainder of 10 is represented as 0."] },
      { heading: "Worked validation example", paragraphs: ["For an operational check, use the container-number validator on this site. It performs the same deterministic calculation, shows whether the printed final digit agrees, and proposes the expected full number when it does not."] },
      { heading: "What a failed or valid check digit means", paragraphs: ["A failure usually indicates a transcription or OCR error, so compare the number with the container door and source document. A passing digit confirms arithmetic structure only; it does not prove ownership, availability, physical condition, location or shipment status."] },
    ],
  },
  {
    slug: "how-to-calculate-cbm-for-shipping",
    title: "How to Calculate CBM for Shipping: Formula & Examples",
    description: "Calculate shipping CBM from centimetres, metres or inches for one or multiple carton sizes and avoid common conversion errors.",
    readMinutes: 8,
    sections: [
      { heading: "CBM calculation in brief", paragraphs: ["Multiply length × width × height after converting all dimensions to metres, then multiply by quantity. For centimetres, use (L × W × H × quantity) ÷ 1,000,000. Calculate each carton size separately and add the results."] },
      { heading: "CBM formula", paragraphs: ["For dimensions in metres, CBM = length × width × height × quantity. CBM measures shipment volume; it is not the same as gross weight, chargeable weight or guaranteed container loadability."] },
      { heading: "Calculate CBM from centimetres", paragraphs: ["For cartons measured in centimetres, multiply length, width, height and quantity, then divide by 1,000,000. Example: 50 cartons measuring 60 × 40 × 40 cm occupy 4.8 CBM."] },
      { heading: "Calculate CBM from inches", paragraphs: ["For inches, multiply cubic inches by 0.000016387064, then multiply by quantity. Keep all three dimensions in the same unit before converting."] },
      { heading: "Multiple-carton worked example", paragraphs: ["Calculate each size group separately. If 20 cartons occupy 1.2 CBM and another 10 cartons occupy 0.8 CBM, the shipment total is 2.0 CBM. Do not average different carton dimensions because averaging changes the calculated volume."] },
      { heading: "CBM and volumetric weight", paragraphs: ["Airlines and couriers may convert volume to a volumetric weight using a contracted divisor, then compare it with actual weight. Ocean LCL commonly uses a weight-or-measure basis. Use the applicable chargeable-weight or LCL calculator rather than treating CBM as kilograms."] },
      { heading: "CBM and container capacity", paragraphs: ["A container’s nominal cubic capacity is higher than practical usable space. Door clearance, carton orientation, pallets, dunnage, load distribution, payload and safe handling reduce what can be loaded. Use a carton-fit estimate as planning guidance, not a stowage guarantee."] },
      { heading: "Common CBM mistakes", paragraphs: ["The most common errors are mixing units, forgetting quantity, averaging unlike cartons, rounding each row too early, and assuming total CBM guarantees physical fit. Preserve precision until the final total and confirm the carrier’s measurement and rounding rules."] },
    ],
  },
];
