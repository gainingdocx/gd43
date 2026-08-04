import type { DeepTable } from "@/content/deep/types";
import { REFERENCE_GUIDES } from "@/content/guides/reference";
import { SEARCH_GUIDES } from "@/content/search-guides";

export interface GuideSection {
  heading: string;
  /** Optional: some sections lead straight into a table or a checklist. */
  paragraphs?: string[];
  bullets?: string[];
  table?: DeepTable;
}

export interface GuideDefinition {
  slug: string;
  title: string;
  seoTitle?: string;
  description: string;
  readMinutes: number;
  sections: GuideSection[];
  faqs?: { q: string; a: string }[];
  sources?: { name: string; url: string; note: string }[];
  tool?: { href: string; label: string; title: string; description: string };
  /** Search terms this guide is written to satisfy; surfaced as meta keywords. */
  keywords?: string[];
  /** Internal links rendered under the article body. */
  related?: { href: string; label: string; blurb: string }[];
  updated?: string;
}

export const GUIDES: GuideDefinition[] = [
  ...SEARCH_GUIDES,
  ...REFERENCE_GUIDES,
  {
    slug: "how-to-read-a-bill-of-lading",
    title: "How to Read a Bill of Lading: Fields, Terms & Checklist",
    description: "Learn how to read B/L parties, routing, containers, cargo, freight terms, dates, originals and release instructions.",
    readMinutes: 12,
    updated: "2026-08-04",
    keywords: [
      "how to read a bill of lading",
      "bill of lading fields explained",
      "B/L meaning shipping",
      "shipped on board date",
      "to order bill of lading",
      "clean bill of lading",
      "bill of lading checklist",
    ],
    tool: {
      href: "/bill-of-lading-parser",
      label: "Extract a B/L automatically",
      title: "Read every field without retyping it",
      description:
        "Upload a Bill of Lading to get every field as structured data, with container check digits recomputed, ports matched against UN/LOCODE and weights totalled against the printed figures.",
    },
    sections: [
      { heading: "Bill of Lading review in brief", paragraphs: ["Start with the B/L number, carrier and parties; verify the vessel, voyage and ports; reconcile containers, seals, packages and weights; then check dates, freight terms, release type and originals. Compare the document with the commercial invoice and packing list before approval.", "A Bill of Lading does three jobs at once: it is a receipt for the goods, evidence of the contract of carriage, and — when issued in negotiable form — a document of title. That third function is why it cannot be treated as an ordinary form and why only a carrier, NVOCC or authorised agent can issue one."] },
      { heading: "Shipper, consignee and notify party", paragraphs: ["Confirm the legal names and addresses against the commercial invoice and booking. A consignee shown as “to order” affects control and endorsement of an original negotiable B/L, so it should never be silently normalized to a named receiver.", "The notify party is who receives the arrival notice. Naming a party that actively monitors arrivals — a destination broker or office — rather than a head-office address is one of the cheapest ways to avoid demurrage on imports."], bullets: ["B/L number and carrier or SCAC", "Shipper legal name and address", "Consignee wording, including “to order” and “to order of” constructions", "Notify party and contact details", "Second notify party where a buyer or bank requires one"] },
      { heading: "Vessel, voyage, port of loading and discharge", paragraphs: ["The vessel, voyage, port of loading (POL) and port of discharge (POD) define the contracted ocean movement. Use UN/LOCODE references where available because similarly named cities, terminals and transshipment points can cause routing errors.", "Four separate place fields exist and they are not synonyms. Place of receipt is where the carrier took custody, which on a door-to-door movement is inland. Place of delivery is where its responsibility ends. On a port-to-port shipment the first and last may be blank; on a multimodal movement all four differ and each has legal consequence."], table: { caption: "The four routing fields", columns: ["Field", "Meaning", "Blank when"], rows: [["Place of receipt", "Where the carrier took custody, often inland", "The movement is port to port"], ["Port of loading", "Where cargo was loaded on the vessel", "Never — this is the core field"], ["Port of discharge", "Where cargo comes off the vessel", "Never — this is the core field"], ["Place of delivery", "Where the carrier's responsibility ends", "The movement is port to port"]] } },
      { heading: "Containers, seals, packages and weight", paragraphs: ["Check every container and seal against the packing list and stuffing record. Recompute ISO 6346 container check digits, then reconcile package count, gross weight, measurement and cargo description. A missing container or unexplained total difference needs review.", "The seal number is evidence, not decoration: it proves the container was not opened in transit, and a mismatch at delivery is a cargo security event rather than a clerical one."] },
      { heading: "Freight terms, dates and release type", paragraphs: ["Review prepaid or collect freight terms, shipped-on-board and issue dates, the number of originals, and whether the document is an original B/L, sea waybill or subject to an express or telex-release process. These details affect payment and cargo release.", "The shipped-on-board date is when the goods were actually loaded; the issue date is when the document was created. They are often the same and need not be — and where they differ, documentary credits, insurance and contractual deadlines key to the on-board date."] },
      { heading: "Clauses and clean status", paragraphs: ["A clean Bill of Lading carries no clause noting defective condition of the goods or their packaging at the time of receipt. A document annotated with damage, shortage, staining or inadequate packing is claused, and most documentary credits require a clean document — so a clause added by the carrier can prevent payment even when the underlying transaction is sound.", "Read any carrier annotation carefully before approving a draft. Once the document is released with a clause on it, removing it requires the carrier's agreement and, usually, evidence that the condition was misdescribed."] },
      { heading: "Common Bill of Lading errors", paragraphs: ["Frequent problems include misspelled party names, old booking references, transposed container digits, inconsistent ports, vague cargo descriptions, and package or weight totals that disagree with the packing list. Correct the source or obtain an authorized amendment rather than editing downstream copies independently."] },
      { heading: "Bill of Lading review checklist", paragraphs: ["Use this final check before approving a draft or using B/L data in another system."], bullets: ["Parties match the commercial documents character for character", "Consignee wording is exactly what the sale terms or credit require", "Routing matches the booking, with UN/LOCODEs confirmed", "Every container and seal is accounted for and check digits validate", "Packages and weights reconcile against the packing list", "Goods description is specific enough for customs and matches any credit wording", "Dates and freight terms are plausible and consistent with the Incoterm", "Release type and original count are what you instructed", "No unexpected carrier clause has been added"] },
    ],
    faqs: [
      { q: "What are the three functions of a Bill of Lading?", a: "It is a receipt confirming the carrier took the goods in the stated apparent order and condition; it is evidence of the contract of carriage; and where issued in negotiable form it is a document of title, meaning whoever lawfully holds the properly endorsed original can claim the cargo." },
      { q: "What does 'to order' mean in the consignee box?", a: "That the B/L is negotiable and cargo will be released to whoever holds the properly endorsed original. 'To order of shipper' means the shipper controls release; 'to order of [bank]' puts the bank in control, which is what a documentary credit normally requires. Replacing any of these with a named consignee changes who controls the goods." },
      { q: "How many original Bills of Lading are issued?", a: "Conventionally three, described as a full set of 3/3, though the number is stated on the document. All originals represent the same cargo: presenting any one entitles the holder to delivery, after which the others are void. Request only the number you actually need — every extra original is another that can be lost." },
      { q: "What is the difference between the shipped-on-board date and the issue date?", a: "The on-board date is when the goods were loaded onto the vessel; the issue date is when the document was created. Documentary credits, insurance and many contractual deadlines key to the on-board date, and a B/L evidencing only receipt for shipment, without an on-board notation, is a materially weaker document." },
      { q: "What makes a Bill of Lading 'clean'?", a: "The absence of any clause noting defective condition of the goods or their packaging when the carrier received them. A document annotated with damage, shortage or inadequate packing is claused, and most credits require a clean document — so a clause can prevent payment even when the commercial deal is sound." },
      { q: "Can a Bill of Lading be amended after issue?", a: "Yes, through the carrier and usually for a fee, and often only if the originals are returned. Changes before the vessel sails are generally straightforward; changes after arrival, changes to the consignee on a negotiable document, and anything affecting the manifest can be difficult or refused. Checking the draft is far cheaper." },
      { q: "What is the difference between a Bill of Lading and a sea waybill?", a: "A sea waybill is a receipt and evidence of contract but not a document of title. The named consignee takes delivery by identifying itself, with nothing to surrender. It is faster and simpler, and it removes the shipper's ability to withhold the goods — so it suits trusted counterparties rather than unsecured transactions." },
      { q: "Which B/L fields must match the commercial invoice?", a: "Party names, goods description, references, package counts and weights at minimum. Where a documentary credit governs, the credit's requirements are stricter than customs and must be met exactly. Differences between the B/L and the invoice are a leading cause of both customs queries and credit discrepancies." },
      { q: "What happens if a container number on the B/L is wrong?", a: "The shipment disconnects from its own record trail: customs entries reference a container the manifest does not contain, tracking returns nothing, and delivery orders can be issued against the wrong box. Validate every check digit before the instructions go out, because correcting an issued B/L is far harder than correcting a draft." },
      { q: "Who can issue a Bill of Lading?", a: "The carrier, NVOCC or an authorised agent — because the document makes statements about the carrier's receipt of goods and its contract of carriage that only the carrier can make. A shipper provides the particulars through shipping instructions and checks the draft that comes back." },
    ],
    related: [
      { href: "/bill-of-lading-parser", label: "Bill of Lading parser", blurb: "Extract and validate a draft or issued B/L automatically." },
      { href: "/templates/bill-of-lading-template", label: "B/L data worksheet", blurb: "Prepare complete particulars before the carrier drafts the document." },
      { href: "/guides/telex-release-vs-original-bill-of-lading", label: "Telex release vs originals", blurb: "How each release method works and when to choose it." },
      { href: "/tools/container-number-check", label: "Container number check", blurb: "Validate every equipment reference before submission." },
    ],
  },
  {
    slug: "commercial-invoice-vs-packing-list",
    title: "Commercial Invoice vs Packing List: Differences & Checklist",
    description: "Compare the purpose, fields and customs role of a commercial invoice and export packing list, plus the data that should match.",
    readMinutes: 10,
    updated: "2026-08-04",
    keywords: [
      "commercial invoice vs packing list",
      "difference between invoice and packing list",
      "export packing list purpose",
      "customs invoice requirements",
      "packing list fields",
      "shipping document differences",
    ],
    tool: {
      href: "/templates/packing-list-template",
      label: "Build a packing list",
      title: "Create a packing list that reconciles",
      description:
        "Case-level rows with marks, package counts, net and gross weight, dimensions and CBM — with totals calculated from the lines so they always agree with the detail.",
    },
    sections: [
      { heading: "Commercial invoice vs packing list in brief", paragraphs: ["A commercial invoice records the sale, customs value, currency and payment terms. A packing list records how the goods are physically packed, including cartons, dimensions and weights. Product identity, quantities, parties and shipment references should agree across both documents.", "They describe the same shipment from two angles — financial and physical — and the discipline that matters is reconciling them against each other rather than preparing each in isolation."] },
      { heading: "What a commercial invoice includes", paragraphs: ["The commercial invoice supports customs valuation and the commercial transaction. It normally identifies seller and buyer, invoice number and date, product descriptions, HS codes, country of origin, quantity, unit price, currency, line amount, charges, Incoterms and total value.", "It is the document customs reads most closely, because it asserts the three facts that determine duty: what the goods are, where they come from and what they are worth."] },
      { heading: "What an export packing list includes", paragraphs: ["The packing list describes the physical shipment rather than its price. It normally records marks and numbers, package type, carton or pallet count, product allocation, net and gross weight, dimensions, CBM and sometimes container or seal references.", "It carries no prices, and it should not. It travels to warehouses, hauliers and receiving staff who have no business seeing commercial terms, and adding values both defeats that separation and creates a second statement of value for customs to compare."] },
      { heading: "Fields that should match", paragraphs: ["Compare shared facts at line and shipment level instead of checking only grand totals."], table: { caption: "What must agree, and why divergence happens", columns: ["Field", "Must match", "Common cause of divergence"], rows: [["Seller, buyer, consignee", "Exactly", "One document updated from new master data, the other copied forward"], ["Invoice and PO references", "Exactly", "Late change of PO not carried through"], ["SKU or part numbers", "Exactly", "Different internal systems producing each document"], ["Quantity per line", "Exactly", "Partial shipment invoiced in full, or short pack not reflected"], ["HS code", "Exactly", "Classification revised on one document only"], ["Country of origin", "Exactly", "Multi-origin shipment summarised on one document"], ["Net and gross weight", "Where the invoice states them", "Estimated on one, weighed on the other"]] } },
      { heading: "Common discrepancies", paragraphs: ["Late packing changes, unit conversions, split shipments and copied references commonly create differences. Determine which document reflects the actual sale and which reflects the final physical packing, then correct or reissue the affected record through the responsible party.", "The single most reliable defect signal is a printed total that does not equal the sum of its lines. It almost always means a line was added, removed or edited after the total was written, and it is worth checking on every document you receive from a third party."] },
      { heading: "Which document customs uses", paragraphs: ["Customs requirements differ by country and transaction, but the commercial invoice is generally central to value and classification while the packing list supports physical examination and package identification. Neither document replaces destination-specific filing requirements or broker advice.", "In practice both are read together: an examiner selecting case 7 of 40 for inspection uses the packing list to know what should be inside, and the invoice to know what it should be worth."] },
      { heading: "Invoice and packing-list reconciliation checklist", paragraphs: ["Before tendering the documents, confirm that shared parties, products, quantities, references and weights agree and that any legitimate difference—such as a partial shipment—is clearly documented."], bullets: ["Parties identical on both documents", "References carried through consistently", "Line quantities and SKUs matching", "HS codes and origin consistent", "Net weight never exceeding gross weight", "Totals equal to the sum of their lines on both documents", "Case numbering unbroken and matching the marks on the cargo", "Any partial shipment stated explicitly rather than implied"] },
    ],
    faqs: [
      { q: "Can I use one document instead of two?", a: "No, and combining them causes problems in both directions. Customs expects a valuation document and a physical description; warehouses and hauliers need the packing detail without the prices; and a single document showing both goes to parties who should not see commercial terms. Prepare both and reconcile them." },
      { q: "Should the packing list show prices?", a: "No. Values belong on the commercial invoice. A packing list carrying prices travels to parties with no business seeing commercial terms, and creates a second statement of value for customs to compare against the invoice — which is a discrepancy waiting to happen." },
      { q: "What is the difference between net and gross weight?", a: "Net weight is the goods alone, excluding all packaging. Gross weight is the goods plus packaging, pallets and dunnage as presented for carriage. The difference is tare. Customs generally uses net where duty is weight-based; carriers rate on gross and use it for the VGM declaration." },
      { q: "Who prepares each document?", a: "The seller issues the commercial invoice, because it records the sale. The shipper or the party that physically packed the goods produces the packing list, because it describes what was actually packed rather than what was ordered. A packing list generated from a purchase order is a statement of intent, not of fact." },
      { q: "Which document does customs value goods from?", a: "The commercial invoice, in almost every jurisdiction, because valuation is based on the price actually paid or payable. The packing list supports physical examination and package identification, and is what an examiner reads when selecting and opening a specific case." },
      { q: "What if the packing list total does not match the sum of its lines?", a: "A line was added, removed or edited after the total was written. Recompute from the lines and correct the total at source rather than adjusting a line to fit. It is one of the most common defects in real shipping documents and one of the most reliable indicators the document was edited without being rechecked." },
      { q: "Do both documents need to be signed?", a: "It depends on the destination and, where payment runs through a documentary credit, on the credit's requirements — which are frequently stricter than customs. Signing the invoice is more commonly required than signing the packing list, but always identify who prepared each document so a query goes to a person rather than a mailbox." },
      { q: "How should partial shipments be handled?", a: "Make the partial nature explicit on both documents and reference the total order quantity. A packing list showing only what shipped, against an invoice covering a full order, produces a quantity variance that looks like an error. Stating the relationship removes the query before it is raised." },
      { q: "Does the packing list need to match the Bill of Lading?", a: "The gross weight and package count should reconcile. The B/L states what the carrier received based on the shipper's declaration, and a difference between the two is a discrepancy customs will notice and a credit will reject. Resolve it before the transport document is issued." },
      { q: "Can these documents be checked automatically?", a: "Yes. Extracting both into structured data lets the shared fields be compared line by line — SKUs, quantities, HS codes, origin and weights — and lets each document's printed totals be recomputed from its own lines. Both checks find real errors routinely." },
    ],
    related: [
      { href: "/templates/commercial-invoice-template", label: "Commercial invoice template", blurb: "Build a customs-ready invoice with the fields in the right places." },
      { href: "/templates/packing-list-template", label: "Export packing list template", blurb: "Case-level rows with totals calculated from the detail." },
      { href: "/commercial-invoice-parser", label: "Commercial invoice parser", blurb: "Extract line items and totals from invoices you receive." },
      { href: "/features/shipment-document-matching", label: "Document matching", blurb: "Compare both documents automatically and see the differences." },
    ],
  },
  {
    slug: "iso-6346-container-number-check-digit",
    title: "ISO 6346 Container Check Digit: Formula & Example",
    description: "Understand the ISO 6346 container-number format, letter values, modulo-11 check digit calculation and validation limits.",
    readMinutes: 10,
    updated: "2026-08-04",
    keywords: [
      "ISO 6346 check digit",
      "container number check digit formula",
      "container number validation",
      "container number format",
      "modulo 11 container",
      "container owner code BIC",
    ],
    tool: {
      href: "/tools/container-number-check",
      label: "Validate container numbers",
      title: "Check up to 100 numbers at once",
      description:
        "Paste a list of container numbers to see which pass, which fail, and the expected full number for every failure — then export the result as a CSV audit.",
    },
    sections: [
      { heading: "ISO 6346 check digit in brief", paragraphs: ["An ISO 6346 container number contains a three-letter owner code, one equipment-category letter, a six-digit serial number and one check digit. The check digit is calculated by mapping letters to ISO values, applying powers-of-two weights and reducing the sum modulo 11."] },
      { heading: "Container number format", paragraphs: ["A typical freight-container identifier has eleven characters. The first three letters identify the owner code, the fourth is the equipment-category identifier—commonly U for freight containers—the next six digits are the serial, and the last digit is the check digit. Printed spaces are not part of the number."], table: { caption: "The four parts of a container number", columns: ["Part", "Characters", "Example", "Meaning"], rows: [["Owner code", "3 letters", "CSQ", "The registered owner or principal operator, allocated through the BIC"], ["Equipment category", "1 letter", "U", "U = freight container, J = related equipment, Z = trailers and chassis"], ["Serial number", "6 digits", "305438", "Assigned by the owner; carries no meaning about size, type or age"], ["Check digit", "1 digit", "3", "Calculated from the other ten characters"]] } },
      { heading: "Letter values and position weights", paragraphs: ["Letters use numeric values beginning with A=10 while skipping multiples of 11. Starting at the leftmost character, each value is multiplied by 2 raised to its zero-based position: 1, 2, 4, 8 and so on. Digits retain their numeric value.", "The skip is deliberate: it prevents two different letters producing the same remainder and cancelling each other out in the sum. The doubling weights make the checksum sensitive to both a wrong character and two characters swapped — the two mistakes humans and OCR engines actually make."], table: { caption: "ISO 6346 letter values", columns: ["Letters", "Values"], rows: [["A B C D E F G H I", "10, 12, 13, 14, 15, 16, 17, 18, 19"], ["J K L M N O P Q R", "20, 21, 23, 24, 25, 26, 27, 28, 29"], ["S T U V W X Y Z", "30, 31, 32, 34, 35, 36, 37, 38"]], note: "The gaps after K, U and before J are where the multiples of 11 have been skipped." } },
      { heading: "Check digit formula step by step", paragraphs: ["Convert the first ten characters to values, multiply each by its position weight, add the products, and divide the sum by 11. The remainder becomes the check digit; a remainder of 10 is represented as 0.", "That last case is the single most common bug in home-made validators. Modulo 11 can return 10, which needs two characters, so the standard maps it to 0 — the one place where a valid check digit does not equal the raw remainder."] },
      { heading: "Worked validation example", paragraphs: ["CSQU3054383 is the example used in the standard itself. Converting and weighting gives products of 13, 60, 112, 256, 48, 0, 320, 512, 768 and 4096, totalling 6185. Dividing 6185 by 11 gives 562 with a remainder of 3, so the expected check digit is 3 — which matches the printed final digit."], table: { caption: "Step by step for CSQU3054383", columns: ["Position", "Character", "Value", "Weight", "Product"], rows: [["1", "C", "13", "1", "13"], ["2", "S", "30", "2", "60"], ["3", "Q", "28", "4", "112"], ["4", "U", "32", "8", "256"], ["5", "3", "3", "16", "48"], ["6", "0", "0", "32", "0"], ["7", "5", "5", "64", "320"], ["8", "4", "4", "128", "512"], ["9", "3", "3", "256", "768"], ["10", "8", "8", "512", "4096"], ["Sum", "—", "—", "—", "6185"]], note: "6185 ÷ 11 = 562 remainder 3 → check digit 3." } },
      { heading: "What a failed or valid check digit means", paragraphs: ["A failure usually indicates a transcription or OCR error, so compare the number with the container door and source document. A passing digit confirms arithmetic structure only; it does not prove ownership, availability, physical condition, location or shipment status.", "Because the check digit is calculated from the number itself, anyone can invent a structurally valid container number in seconds. Container validation is a data-quality control, never a fraud control."] },
    ],
    faqs: [
      { q: "What is the ISO 6346 check digit formula?", a: "Check digit = (Σ character value × 2^position) mod 11, using zero-based positions 0 to 9 for the first ten characters, with letter values starting at A=10 and skipping every multiple of 11, and with a remainder of 10 written as 0." },
      { q: "Why does a remainder of 10 become 0?", a: "The check character must fit in one digit. Modulo 11 can return 10, which needs two characters, so the standard maps that single case to 0. It is the one place where a valid check digit does not equal the raw remainder, and the most common bug in home-made validators." },
      { q: "Why do most container numbers have U as the fourth letter?", a: "It is the equipment category identifier, and U is assigned to freight containers — the overwhelming majority of equipment on a Bill of Lading. J marks detachable freight-container-related equipment such as a clip-on generator, and Z marks trailers and chassis." },
      { q: "Can a container serial number contain letters?", a: "No. Under ISO 6346 the six-character serial is numeric. A reference with letters after the category identifier is probably a booking number, an equipment interchange receipt number or an internal reference, and should not be validated with this formula." },
      { q: "Does a valid check digit prove the container exists?", a: "No. The digit is derived from the number itself, so a structurally valid number can be fabricated instantly. It confirms that eleven characters are internally consistent — nothing about ownership, existence, condition, location or what is inside." },
      { q: "What should I do when a check digit fails?", a: "Confirm you have all eleven characters, then compare the document against a photograph of the container door — scanned paperwork frequently turns 8 into B, 0 into O, 5 into S and 1 into I. If the door plate and document genuinely agree and the arithmetic still fails, report it to the carrier rather than editing the reference yourself." },
      { q: "Is the size and type code covered by the check digit?", a: "No. The four-character size and type code beside the number is a separate ISO 6346 field and is not part of the checksum. Reading it is still worth doing: a B/L listing 45G1 equipment against a 20ft freight rate deserves a second look." },
      { q: "How reliable is the modulo-11 check?", a: "Considerably more reliable than a modulus-7 scheme like the one used for air waybill numbers. The positional doubling weights make it sensitive to both substituted and transposed characters, which are the errors that actually occur when numbers are keyed or scanned." },
      { q: "Who allocates container owner codes?", a: "Owner codes are allocated centrally through the Bureau International des Conteneurs. The prefix is a strong hint about the operator — most are recognisable to anyone in ocean freight — but this validation does not query the registry, so do not infer ownership or liability from a prefix alone." },
      { q: "When should container numbers be validated?", a: "At the point the number first enters your system — the stuffing report or the shipping instruction — so an error never propagates. A container reference that does not exist on the carrier's manifest is a common cause of customs mismatch holds, and correcting a filed entry costs far more than checking a list." },
    ],
    related: [
      { href: "/tools/container-number-check", label: "Container number check", blurb: "Validate up to 100 numbers and export a CSV audit." },
      { href: "/bill-of-lading-parser", label: "Bill of Lading parser", blurb: "Validate every container on a B/L automatically during extraction." },
      { href: "/guides/shipping-container-types-and-sizes", label: "Container types and sizes", blurb: "What the size and type code beside the number means." },
      { href: "/templates/container-packing-list-template", label: "Container packing list", blurb: "Allocate cargo to validated container and seal numbers." },
    ],
  },
  {
    slug: "how-to-calculate-cbm-for-shipping",
    title: "How to Calculate CBM for Shipping: Formula & Examples",
    description: "Calculate shipping CBM from centimetres, metres or inches for one or multiple carton sizes and avoid common conversion errors.",
    readMinutes: 10,
    updated: "2026-08-04",
    keywords: [
      "how to calculate CBM",
      "CBM formula shipping",
      "cubic meter calculation cartons",
      "CBM from centimetres",
      "CBM to kg conversion",
      "shipping volume calculation",
    ],
    tool: {
      href: "/tools/cbm-calculator",
      label: "Calculate CBM",
      title: "Total every carton group at once",
      description:
        "Add each carton size with its quantity and weight in mm, cm, m or inches, get the shipment total volume and gross weight, and export an auditable CSV calculation.",
    },
    sections: [
      { heading: "CBM calculation in brief", paragraphs: ["Multiply length × width × height after converting all dimensions to metres, then multiply by quantity. For centimetres, use (L × W × H × quantity) ÷ 1,000,000. Calculate each carton size separately and add the results."] },
      { heading: "CBM formula", paragraphs: ["For dimensions in metres, CBM = length × width × height × quantity. CBM measures shipment volume; it is not the same as gross weight, chargeable weight or guaranteed container loadability."], table: { caption: "Unit conversions to cubic metres", columns: ["Input unit", "Conversion", "Example", "Result"], rows: [["Metres", "L × W × H", "1.2 × 0.8 × 1.0 m", "0.960 CBM"], ["Centimetres", "÷ 1,000,000", "120 × 80 × 100 cm", "0.960 CBM"], ["Millimetres", "÷ 1,000,000,000", "1200 × 800 × 1000 mm", "0.960 CBM"], ["Inches", "× 0.000016387064", "47.24 × 31.50 × 39.37 in", "0.960 CBM"], ["Feet", "× 0.028316846592", "3.94 × 2.62 × 3.28 ft", "0.960 CBM"]], note: "The same box in five units. If your five answers differ, a conversion is wrong — this is the fastest way to find it." } },
      { heading: "Calculate CBM from centimetres", paragraphs: ["For cartons measured in centimetres, multiply length, width, height and quantity, then divide by 1,000,000. Example: 50 cartons measuring 60 × 40 × 40 cm occupy 4.8 CBM.", "The division by a million is the step people drop when working quickly, and the resulting answer is wrong by six orders of magnitude — which at least makes it obvious."] },
      { heading: "Calculate CBM from inches", paragraphs: ["For inches, multiply cubic inches by 0.000016387064, then multiply by quantity. Keep all three dimensions in the same unit before converting."] },
      { heading: "Multiple-carton worked example", paragraphs: ["Calculate each size group separately. If 20 cartons occupy 1.2 CBM and another 10 cartons occupy 0.8 CBM, the shipment total is 2.0 CBM. Do not average different carton dimensions because averaging changes the calculated volume.", "Averaging 60 × 40 × 50 and 80 × 60 × 40 to 70 × 50 × 45 and multiplying by thirty cartons gives 4.725 CBM against a true 4.320 — nearly ten per cent high, and impossible to reconcile when the consolidator measures the cargo."] },
      { heading: "CBM and volumetric weight", paragraphs: ["Airlines and couriers may convert volume to a volumetric weight using a contracted divisor, then compare it with actual weight. Ocean LCL commonly uses a weight-or-measure basis. Use the applicable chargeable-weight or LCL calculator rather than treating CBM as kilograms."], table: { caption: "What one cubic metre is billed as", columns: ["Basis", "Divisor", "1 CBM equals"], rows: [["General air cargo", "6,000 cm³/kg", "167 kg"], ["International express", "5,000 cm³/kg", "200 kg"], ["European road groupage", "3,000 cm³/kg", "333 kg"], ["Ocean LCL, weight or measure", "—", "1,000 kg"]], note: "The same cubic metre of the same cargo, priced four different ways. There is no universal CBM-to-kilogram conversion." } },
      { heading: "CBM and container capacity", paragraphs: ["A container’s nominal cubic capacity is higher than practical usable space. Door clearance, carton orientation, pallets, dunnage, load distribution, payload and safe handling reduce what can be loaded. Use a carton-fit estimate as planning guidance, not a stowage guarantee.", "Plan on 80 to 85 per cent of nominal capacity for floor-loaded cartons, and less again for palletised cargo where the pallet consumes height on every layer."] },
      { heading: "Common CBM mistakes", paragraphs: ["The most common errors are mixing units, forgetting quantity, averaging unlike cartons, rounding each row too early, and assuming total CBM guarantees physical fit. Preserve precision until the final total and confirm the carrier’s measurement and rounding rules.", "One more worth naming: measuring the flat carton specification rather than the packed article. Cartons packed tight bulge, and the consolidator measures what arrives, not what was specified."] },
    ],
    faqs: [
      { q: "What is the CBM formula?", a: "CBM = length × width × height × quantity, with all dimensions in metres. From centimetres, multiply the three dimensions and the quantity then divide by 1,000,000. From inches, multiply cubic inches by 0.000016387064. Calculate each carton size separately and add the group totals." },
      { q: "How many kg is 1 CBM?", a: "It depends entirely on the pricing basis. Ocean LCL treats 1 CBM as 1,000 kg. General air cargo treats it as 167 kg at the 6,000 divisor, express couriers as 200 kg at 5,000, and European road groupage as 333 kg. There is no universal conversion — always state which basis you mean." },
      { q: "Should I use internal or external carton dimensions?", a: "External, always. The carrier, consolidator or handling agent measures the outside of the package as presented, including bulge from tight packing, banding and protruding features. Internal dimensions describe what fits inside the box and are irrelevant to freight measurement." },
      { q: "How do I calculate CBM for pallets?", a: "Measure the loaded pallet as one unit: footprint length × footprint width × total height including the pallet. A 1.20 × 0.80 m EUR pallet loaded to 1.55 m overall is 1.488 CBM. Do not sum the cartons and ignore the pallet — you will understate by 10 to 20 per cent." },
      { q: "Can I average carton sizes to save time?", a: "No. Averaging unlike dimensions changes the calculated volume, usually upward, and produces a figure that cannot be reconciled against the packing list. Calculate each group and add the results." },
      { q: "Does CBM tell me if my cargo fits in a container?", a: "It tells you whether it might. Nominal capacity assumes a perfect rectangular fill that no real load achieves. Plan on 80 to 85 per cent for floor-loaded cartons and less for palletised cargo, then confirm the payload limit separately — dense cargo runs out of weight before space." },
      { q: "Why is the consolidator's CBM higher than mine?", a: "Because they measure the cargo as it arrives, to the outermost point: pallets add height, shrink wrap adds width, overhang counts, and tightly packed cartons bulge beyond their printed dimensions. A 10 to 20 per cent difference on palletised cargo is normal; a larger gap is worth querying." },
      { q: "How many decimal places should CBM have?", a: "Carry full precision through the calculation and round once at the end, conventionally to three decimal places. Rounding each row first pushes the error consistently in one direction across a long packing list." },
      { q: "What is the difference between CBM and volumetric weight?", a: "CBM measures space. Volumetric weight is a billing figure derived from that space by dividing by a contractual divisor, so light bulky cargo pays for the room it occupies. One CBM is always one CBM; its volumetric weight depends on whose tariff you are under." },
      { q: "Does CBM include the pallet?", a: "For freight measurement, yes — the pallet is part of the article presented for carriage and the carrier measures the loaded unit. For a packing list describing what is inside the shipment you may show carton volume separately, but the freight figure is the loaded pallet." },
    ],
    related: [
      { href: "/tools/cbm-calculator", label: "CBM calculator", blurb: "Total every carton group and export an auditable calculation." },
      { href: "/tools/chargeable-weight-calculator", label: "Chargeable weight calculator", blurb: "Convert volume into an air freight billing weight." },
      { href: "/tools/container-load-calculator", label: "Container load calculator", blurb: "Turn a CBM total into a realistic carton count." },
      { href: "/guides/lcl-vs-fcl-shipping", label: "LCL vs FCL", blurb: "How volume decides which ocean product is cheaper." },
    ],
  },
];
