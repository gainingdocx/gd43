import type { DeepContentMap } from "@/content/deep/types";

export const OCEAN_PARSER_DEEP: DeepContentMap = {
  "bill-of-lading-parser": {
    updated: "2026-08-04",
    keywords: [
      "bill of lading OCR",
      "B/L data extraction",
      "extract bill of lading to excel",
      "bill of lading parser AI",
      "shipping document OCR",
      "container number validation OCR",
      "B/L to structured data",
    ],
    quickAnswer: {
      heading: "What a Bill of Lading parser extracts",
      body:
        "Upload a B/L as a PDF, scan or photo and every printed field comes back as structured data: the B/L number and carrier, all three parties, vessel and voyage, the four routing points, every container with its seal and weight, cargo lines, freight terms, dates, originals and clauses. Deterministic code then recomputes container check digits, matches ports against UN/LOCODE and adds up the weights.",
      bullets: [
        "30+ header fields plus container and cargo rows",
        "ISO 6346 check digits recomputed in code",
        "Ports matched to the bundled UN/LOCODE dataset",
        "Export to Excel, CSV, JSON or a PDF review report",
      ],
    },
    sections: [
      {
        heading: "Why Bills of Lading resist ordinary OCR",
        paragraphs: [
          "A Bill of Lading is not a form in the sense that a tax return is a form. Every carrier and NVOCC uses its own layout, and the same field appears in a different box, under a different label, in a different order on each one. 'Notify party' may be 'Notify address', 'Also notify' or an unlabelled third block under the consignee. Ports appear as names, as UN/LOCODEs, as both, or as a terminal name that is neither.",
          "Generic OCR returns the text on the page. What operations needs is the meaning: which block is the consignee, which of the four place fields this is, which container this weight belongs to. That mapping is what a document-specific parser does, and it is why extracting a B/L reliably is a different problem from reading a page.",
        ],
        bullets: [
          "Layouts differ by carrier, NVOCC, agent and even by trade lane",
          "Party blocks are free-text addresses with no fixed structure",
          "Cargo descriptions run across page breaks and continuation sheets",
          "Container tables may be a grid, a list, or embedded in the description block",
          "Weights appear per container, per line, as a total, or all three",
          "Scans are frequently faxed, stamped, signed over and skewed",
        ],
      },
      {
        heading: "The full field inventory",
        table: {
          caption: "What comes back as structured data",
          columns: ["Group", "Fields"],
          rows: [
            ["References", "B/L number, booking number, carrier name and SCAC, shipper's reference, service contract number"],
            ["Parties", "Shipper, consignee including 'to order' wording, notify party, second notify party, delivery agent"],
            ["Vessel", "Vessel name, voyage number, IMO number, flag where printed"],
            ["Routing", "Place of receipt, port of loading, port of discharge, place of delivery, transhipment port, each with UN/LOCODE where present"],
            ["Equipment", "Container number, seal number, size and type code, packages, gross weight, tare, measurement per unit"],
            ["Cargo", "Marks and numbers, package type and count, goods description lines, HS code where printed, net and gross weight, measurement"],
            ["Commercial", "Freight terms prepaid or collect, Incoterm, declared value, charge lines where shown"],
            ["Dates and issuance", "Shipped-on-board date, issue date, place of issue, number of originals, signature block"],
            ["Document character", "Original, sea waybill, copy or draft; release type; any clause or annotation added by the carrier"],
          ],
        },
      },
      {
        heading: "The checks that run after extraction",
        paragraphs: [
          "Reading is the AI's job; deciding is not. Once the values are on the page, deterministic code written in advance evaluates them, so every finding has a reproducible reason and, where one can be computed, an expected value.",
        ],
        bullets: [
          "ISO 6346 check digit recomputed character by character for every container number, with the expected full number shown on failure",
          "IMO number checksum validated where a vessel IMO is printed",
          "Every routing point matched against the bundled UN/LOCODE dataset, with an unrecognised code raising a warning rather than a failure",
          "Container gross weights summed and compared against the printed shipment total within tolerance",
          "Package counts totalled across containers and cargo lines and compared with the printed total",
          "Shipped-on-board date checked against the issue date for a plausible ordering",
          "Net weight checked against gross weight where both are printed",
          "Consignee wording preserved verbatim, so a 'to order' construction is never normalised to a named party",
        ],
        callout: {
          tone: "info",
          title: "Warnings and failures are deliberately separate",
          body:
            "A failed container check digit is arithmetic — it is either right or wrong. A port code the dataset does not contain may simply be legacy master data on an otherwise perfect document. Treating those the same produces a review queue nobody reads. Contradictions block; unknowns warn.",
        },
      },
      {
        heading: "What to compare the B/L against",
        paragraphs: [
          "A Bill of Lading can be internally perfect and still disagree with the shipment it describes. The comparisons below are where document review actually earns its keep, and they are what grouping documents into one shipment record enables.",
        ],
        table: {
          caption: "Cross-document checks worth running",
          columns: ["Compare with", "What to check", "Why it matters"],
          rows: [
            ["Commercial invoice", "Parties, goods description, references", "Divergence generates customs queries and letter-of-credit discrepancies"],
            ["Packing list", "Packages, gross weight, measurement, container allocation", "The B/L states what the carrier received; the packing list what was packed"],
            ["Booking confirmation", "Vessel, voyage, all four routing points, equipment", "Silent routing changes are a common source of arrival surprises"],
            ["Shipping instructions", "Every field you submitted", "Confirms the carrier transcribed your instruction correctly"],
            ["Arrival notice", "B/L number, containers, vessel", "A mismatch means the notice may relate to a different shipment"],
            ["Letter of credit", "Description, consignee, dates, originals, clean status", "Bank examination is literal and unforgiving"],
          ],
        },
      },
      {
        heading: "Practical extraction quality",
        paragraphs: [
          "Documents arrive in whatever condition the supply chain gave them. Photographs taken at a terminal, third-generation faxes, scans with a stamp across the container table — all of these are normal, and the honest answer is that quality varies with the source.",
          "The design response is not to claim perfect accuracy. It is to keep the source and the extracted value side by side, flag anything the deterministic checks cannot confirm, and make correction fast. A field a human confirms in two seconds is more valuable than a field a model guessed confidently.",
        ],
        bullets: [
          "Photograph the whole page square-on rather than cropping to the field you want",
          "Include continuation sheets — cargo descriptions and container tables routinely run over",
          "Prefer a native PDF over a scan of a print of a PDF where one exists",
          "Check container and weight fields first; they are the highest-value and the most error-prone",
          "Resolve a failed check digit against the source rather than accepting the proposed number blindly",
        ],
      },
    ],
    faqs: [
      {
        q: "What data can be extracted from a Bill of Lading?",
        a: "The B/L number, carrier and SCAC, shipper, consignee and notify party, vessel, voyage and IMO number, all four routing points with UN/LOCODEs, every container with its seal, size, type, packages, gross weight and measurement, cargo description lines, freight terms and Incoterm, shipped-on-board and issue dates, number of originals, and any clause the carrier has added.",
      },
      {
        q: "Does it work with photos taken on a phone?",
        a: "Yes. Pages are processed from camera photographs, scans or native PDFs. Straight and moderately skewed images both work. The practical advice is to photograph the whole page square-on with even lighting rather than cropping to a region, and to include every continuation sheet, because container tables and cargo descriptions frequently run over a page break.",
      },
      {
        q: "How are container numbers validated?",
        a: "Every container number found on the document is put through the ISO 6346 modulo-11 calculation in deterministic code, character by character. Where the computed check digit disagrees with the printed one, the field is flagged with the expected full number so a transcription error is visible before the data reaches a customs filing or a carrier system.",
      },
      {
        q: "Does the parser handle 'to order' Bills of Lading?",
        a: "Yes, and the wording is preserved exactly as printed. A consignee shown as 'to order', 'to order of shipper' or 'to order of [bank]' determines who controls the cargo, so it is never normalised into a named party. Where the document carries an endorsement, that is captured as printed.",
      },
      {
        q: "Can it tell the difference between a draft and an issued B/L?",
        a: "It captures the document character as printed — draft, original, copy, non-negotiable — along with the number of originals and the release type where those are stated. It reports what the document says about itself rather than inferring status, which matters because a draft and an original with identical content have very different legal effect.",
      },
      {
        q: "What happens if a port code is not recognised?",
        a: "It raises a warning for human review rather than failing the document. UN/LOCODE is revised twice a year, carrier and customer master data lags behind, and legacy codes circulate for years. An unrecognised code is far more often stale master data on a valid document than an actual error, so the correct response is to ask rather than to reject.",
      },
      {
        q: "Can I export the parsed B/L to Excel?",
        a: "Yes. Export produces an Excel workbook with separate Summary, Containers and Lines sheets, so the container and cargo detail stays in row form rather than being flattened. CSV, structured JSON and a PDF review report are also available.",
      },
      {
        q: "Does extraction check the B/L against my other documents?",
        a: "When documents are grouped as one shipment, yes. Parties, references, package counts, gross weights, container numbers, routing and descriptions are compared across the Bill of Lading, commercial invoice, packing list and any purchase order or booking, and the differences are reported as prioritised discrepancies rather than left for a manual side-by-side read.",
      },
      {
        q: "Can it detect a forged or altered Bill of Lading?",
        a: "No, and it should not be relied on for that. Validation detects internal inconsistency — a container number whose arithmetic fails, weights that do not add up, dates in an impossible order. It cannot authenticate an issuer or confirm that a carrier actually issued the document. Confirm existence and validity through the carrier's own systems.",
      },
      {
        q: "How long does a Bill of Lading take to extract?",
        a: "Typically well under a minute for a standard one- or two-page document, with fields appearing progressively as they are read rather than all at the end. Multi-page documents with long cargo descriptions and large container tables take proportionally longer, since every page is processed.",
      },
      {
        q: "Is my document stored?",
        a: "Anonymous test parses are processed without being retained against an account. Signed-in documents are stored privately in your workspace, where you can review, export and delete them at any time. Deletion removes the document and its extracted data.",
      },
      {
        q: "Does it support sea waybills and house Bills of Lading?",
        a: "Yes. Sea waybills have their own parser page and share most of the same field structure, and house documents issued by an NVOCC extract in the same way as carrier-issued Bills of Lading. Where a document is explicitly labelled as a house or master document, that classification is recorded rather than inferred from the number format.",
      },
    ],
    related: [
      { href: "/guides/how-to-read-a-bill-of-lading", label: "How to read a Bill of Lading", blurb: "Every field explained, with a review checklist for drafts and originals." },
      { href: "/tools/container-number-check", label: "Container number check", blurb: "Run the same ISO 6346 validation on a list of numbers without a document." },
      { href: "/templates/bill-of-lading-template", label: "Bill of Lading data worksheet", blurb: "Prepare B/L particulars before the carrier drafts the document." },
      { href: "/features/shipment-document-matching", label: "Shipment document matching", blurb: "Compare the B/L against the invoice, packing list and purchase order." },
    ],
  },

  "sea-waybill-parser": {
    updated: "2026-08-04",
    keywords: [
      "sea waybill parser",
      "sea waybill OCR",
      "express bill of lading extraction",
      "straight bill of lading data",
      "waybill vs bill of lading",
      "non-negotiable ocean document",
      "sea waybill fields",
    ],
    quickAnswer: {
      heading: "What a sea waybill parser extracts",
      body:
        "Sea waybills carry almost the same operational data as a Bill of Lading — parties, vessel, routing, containers, cargo, weights, dates and freight terms — but they are not documents of title. Extraction returns all of it as structured fields with container check digits recomputed and ports matched, and records the document's non-negotiable character explicitly.",
      bullets: [
        "Same operational fields as a B/L",
        "Non-negotiable character recorded",
        "Container and port validation applied",
        "Ready for matching against invoice and packing list",
      ],
    },
    sections: [
      {
        heading: "Why sea waybills exist",
        paragraphs: [
          "A sea waybill solves a specific and very common problem: on short routes, cargo arrives before its documents. A negotiable Bill of Lading must be physically presented before release, so a container that crosses in three days while its originals sit in a courier bag for five generates demurrage for no commercial reason at all.",
          "A sea waybill removes the document from the release path. It is still a receipt and still evidence of the contract of carriage, but the named consignee takes delivery by identifying itself rather than by surrendering paper. That makes it faster and simpler — and it removes the shipper's ability to withhold the goods, which is why it suits trusted counterparties and intercompany moves rather than transactions where payment is unsecured.",
        ],
        table: {
          caption: "Sea waybill against Bill of Lading",
          columns: ["Aspect", "Sea waybill", "Negotiable Bill of Lading"],
          rows: [
            ["Document of title", "No", "Yes"],
            ["Transferable by endorsement", "No", "Yes"],
            ["Release mechanism", "Consignee identifies itself", "Surrender of an endorsed original"],
            ["Originals to courier", "None required", "Full set, usually three"],
            ["Suits", "Intercompany, trusted buyers, short sea", "Unsecured payment, documentary credits, trading chains"],
            ["Risk if lost", "Minimal", "Significant — indemnity usually required"],
          ],
        },
        callout: {
          tone: "warn",
          title: "A sea waybill cannot secure payment",
          body:
            "Because the consignee takes delivery on identification, the shipper has no documentary control over the cargo once it sails. If payment is not already secured by other means, a sea waybill removes your last practical leverage. This is a commercial decision made at booking, and it should not be made for the sake of documentary convenience alone.",
        },
      },
      {
        heading: "Fields extracted",
        bullets: [
          "Waybill number, booking reference, carrier and SCAC",
          "Shipper, consignee and notify party, with the consignee always named rather than to order",
          "Vessel, voyage and IMO number where printed",
          "Place of receipt, port of loading, port of discharge and place of delivery with UN/LOCODEs",
          "Container numbers, seals, size and type codes, packages, gross weight and measurement per unit",
          "Marks and numbers, cargo description lines and any HS code printed",
          "Freight terms, Incoterm and any charge lines shown",
          "Shipped-on-board and issue dates, place of issue and signature evidence",
          "Any express release or straight-consignment annotation the carrier has added",
        ],
      },
      {
        heading: "Checks applied",
        paragraphs: [
          "The deterministic checks are the same family as those applied to a Bill of Lading, because the operational data is the same. What differs is the interpretation of the document's character.",
        ],
        bullets: [
          "ISO 6346 check digit recomputed for every container number, with the expected number shown on failure",
          "IMO checksum where a vessel IMO is printed",
          "Routing points matched against the bundled UN/LOCODE dataset",
          "Container gross weights summed against the printed shipment total",
          "Package counts reconciled across containers and cargo lines",
          "Date ordering checked between on-board and issue dates",
          "Non-negotiable character recorded as an explicit attribute rather than inferred",
        ],
      },
      {
        heading: "Where sea waybills go wrong in practice",
        paragraphs: [
          "The failure modes are different from a Bill of Lading, because the risks are different. Most problems trace back to a decision made at booking rather than to anything on the document.",
        ],
        bullets: [
          "A sea waybill issued where the sale terms actually required documentary control, leaving the seller unsecured",
          "The consignee named incorrectly, which cannot be resolved by endorsement the way a negotiable document can",
          "A change of consignee requested after issue, which the carrier may refuse or charge for",
          "A documentary credit requiring a Bill of Lading, presented with a waybill — an automatic discrepancy",
          "Assumption that no document means no release conditions, when freight and charges still gate delivery",
          "Confusion with an express-released Bill of Lading, which is a different instrument arriving at a similar outcome",
        ],
      },
    ],
    faqs: [
      {
        q: "What is a sea waybill?",
        a: "A non-negotiable ocean transport document that acts as a receipt for the goods and evidence of the contract of carriage, but not as a document of title. The named consignee takes delivery by identifying itself, with no original to surrender, which removes the risk of cargo waiting for paperwork on short routes.",
      },
      {
        q: "What is the difference between a sea waybill and a Bill of Lading?",
        a: "Control. A negotiable Bill of Lading is a document of title that can be endorsed and transferred, and cargo is released only against an original. A sea waybill cannot be endorsed and releases to the named consignee on identification. The waybill is faster and simpler; the Bill of Lading is what you use when payment is not already secured.",
      },
      {
        q: "Can a sea waybill be used under a letter of credit?",
        a: "Only if the credit expressly permits it. Credits commonly require a full set of originals of a negotiable Bill of Lading precisely because that gives the bank control of the goods. Presenting a sea waybill against a credit calling for a Bill of Lading is a straightforward discrepancy, and it will be rejected on its face.",
      },
      {
        q: "Is a sea waybill the same as an express release?",
        a: "They achieve a similar operational result by different means. A sea waybill is a distinct document type that is non-negotiable from the outset. An express release is a Bill of Lading issued with no originals printed, so there is nothing to surrender. Both remove the document from the release path; only one is a different document type.",
      },
      {
        q: "Can the consignee on a sea waybill be changed?",
        a: "Sometimes, at the carrier's discretion and usually before arrival, but there is no documentary mechanism for it the way endorsement works on a negotiable Bill of Lading. Some carriers permit a change of consignee on written instruction from the shipper; many charge for it and some refuse after certain milestones. Get the consignee right at booking.",
      },
      {
        q: "Does a sea waybill need to be surrendered at destination?",
        a: "No. That is the point of it. The named consignee identifies itself and takes delivery. Freight, destination charges and customs clearance still gate the release, so 'no document to surrender' does not mean 'no conditions to satisfy'.",
      },
      {
        q: "What data does the parser extract from a sea waybill?",
        a: "The waybill number and carrier, shipper, consignee and notify party, vessel, voyage and IMO, all four routing points with UN/LOCODEs, every container with its seal, size, packages, gross weight and measurement, cargo description lines, freight terms, dates and issuance details — the same operational field set as a Bill of Lading, with the non-negotiable character recorded explicitly.",
      },
      {
        q: "Are container numbers validated on a sea waybill?",
        a: "Yes, identically to a Bill of Lading. Every container number is put through the ISO 6346 modulo-11 calculation in code, and a mismatch between the computed and printed check digit is flagged with the expected number. Ports are matched against the bundled UN/LOCODE dataset in the same way.",
      },
      {
        q: "Can a sea waybill be matched against my invoice and packing list?",
        a: "Yes. Because the operational field set is the same, a sea waybill groups into a shipment record alongside the commercial invoice, packing list and purchase order, and the same cross-document comparison of parties, references, quantities, weights and containers applies.",
      },
      {
        q: "Do sea waybills carry the same liability terms as Bills of Lading?",
        a: "Broadly the carrier's standard terms apply either way, but the applicable convention and its treatment of non-negotiable documents varies by jurisdiction and by the terms on the reverse. Do not assume the liability position is identical; where cargo value is significant, read the carrier's terms and rely on cargo insurance rather than on carrier liability.",
      },
      {
        q: "When should I choose a sea waybill over a Bill of Lading?",
        a: "When payment is already secured or the parties are related, when the sea leg is shorter than document transit, and when the cargo will not be traded in transit. Choose a negotiable Bill of Lading when payment is unsecured, when a documentary credit governs, or when the goods may be sold while afloat.",
      },
      {
        q: "Does the parser distinguish a sea waybill from a Bill of Lading automatically?",
        a: "It classifies from what the document says about itself — the title, the non-negotiable statement and any express release annotation — rather than guessing from layout. Where the document does not clearly state its own character, the classification is marked for review instead of being assumed.",
      },
    ],
    related: [
      { href: "/bill-of-lading-parser", label: "Bill of Lading parser", blurb: "The negotiable counterpart, with the same field structure and checks." },
      { href: "/guides/how-to-read-a-bill-of-lading", label: "How to read a Bill of Lading", blurb: "Release types, originals and the wording that controls delivery." },
      { href: "/tools/container-number-check", label: "Container number check", blurb: "Validate equipment references from any ocean document." },
      { href: "/arrival-notice-parser", label: "Arrival notice parser", blurb: "The destination document that follows the waybill." },
    ],
  },

  "arrival-notice-parser": {
    updated: "2026-08-04",
    keywords: [
      "arrival notice parser",
      "arrival notice OCR",
      "extract free time from arrival notice",
      "last free day tracking",
      "import notice data extraction",
      "carrier notice charges",
      "arrival notice automation",
    ],
    quickAnswer: {
      heading: "What an arrival notice parser extracts",
      body:
        "Extraction turns a carrier or agent arrival notice into a structured record: B/L and booking references, vessel and voyage, ETA and actual arrival, port and terminal, every container, the consignee and notify party, each charge line, and any printed free-time or last-free-day date. The free-time date is the field that matters most, because it converts a PDF attachment into a tracked deadline.",
      bullets: [
        "Free time and last free day as structured dates",
        "Every charge line separately, not a total",
        "Containers validated and matched to the B/L",
        "Terminal captured, not just the port",
      ],
    },
    sections: [
      {
        heading: "The document that costs money when it is not read",
        paragraphs: [
          "Arrival notices are the highest-consequence routine document in import operations, and they are the one most likely to sit unread in a shared mailbox. By the time the notice arrives, free time is typically already running. Every day between delivery and action is a day removed from the collection window, and the cost of losing that window is demurrage measured in hundreds per container per day.",
          "The value of extracting an arrival notice is not saving keystrokes. It is converting a date buried in a PDF into a tracked field on a shipment record, so the deadline is visible to whoever is looking at the shipment rather than to whoever happened to open the email.",
        ],
        callout: {
          tone: "warn",
          title: "Extract the printed date, do not compute it",
          body:
            "Free time counting depends on the tariff's start event, its inclusive or exclusive convention, and its treatment of weekends and holidays. A parser that derived a last free day from an ETA and a free-day count would be guessing. What is extracted is what the notice actually printed; use the demurrage calculator against the governing contract to check it.",
        },
      },
      {
        heading: "Fields extracted",
        table: {
          caption: "Arrival notice field inventory",
          columns: ["Group", "Fields"],
          rows: [
            ["Notice", "Notice number, issue date, issuing carrier, NVOCC or destination agent, agent contact"],
            ["Shipment references", "B/L number, house B/L number, booking or manifest reference, customer reference"],
            ["Parties", "Consignee, notify party, and the broker where named"],
            ["Arrival", "Vessel, voyage, ETA, actual arrival or discharge date, port of discharge, terminal, place of delivery"],
            ["Equipment", "Container numbers, sizes and types, seal numbers where shown"],
            ["Cargo", "Packages, gross weight, measurement, goods description"],
            ["Charges", "Each charge line with its description, basis, amount and currency"],
            ["Free time", "Free days allowed, free-time start, last free day, empty return location and deadline where printed"],
            ["Release", "Release requirement — original, telex or express — and any outstanding condition stated"],
          ],
        },
      },
      {
        heading: "Checks applied",
        bullets: [
          "Container check digits recomputed under ISO 6346",
          "Container numbers compared against those on the Bill of Lading for the same shipment",
          "B/L reference matched to an existing shipment record where one exists",
          "Port of discharge matched against the bundled UN/LOCODE dataset",
          "Charge lines totalled and compared against any printed total",
          "Date ordering checked between ETA, arrival and last free day",
          "A last free day already in the past flagged prominently rather than recorded silently",
        ],
      },
      {
        heading: "Turning a notice into action",
        numbered: [
          "Extract the notice and match it to the shipment by B/L number, confirming the containers agree.",
          "Read the last free day into the shipment record and set a working deadline at least two days earlier.",
          "Check the release requirement and start whatever it needs — original documents and bank releases have the longest lead times.",
          "Compare each charge line against the quotation and raise any undisclosed charge immediately.",
          "Confirm the customs entry is filed and that no hold — customs, carrier, terminal or other agency — is outstanding.",
          "Book haulage and a terminal appointment against the terminal named on the notice, not the port generally.",
          "Note the empty return location and deadline at the same time, because detention starts at collection.",
        ],
      },
      {
        heading: "What makes arrival notices hard to read",
        paragraphs: [
          "Arrival notices are among the most heterogeneous documents in freight. They are generated by carriers, NVOCCs and destination agents, each with its own template, and many are essentially formatted emails rather than structured documents.",
        ],
        bullets: [
          "Charges are frequently a free-text block rather than a table, with abbreviations that vary by agent",
          "Free time may be stated as a date, as a number of days, as both, or not at all",
          "The same document may carry both a house and a master B/L reference without labelling which is which",
          "Terminal names are local shorthand that does not appear in any standard dataset",
          "Notices are often sent as an email body rather than an attachment, or as a screenshot of a portal",
          "Some notices cover several containers with different last free days, stated in a footnote",
        ],
      },
    ],
    faqs: [
      {
        q: "What data is extracted from an arrival notice?",
        a: "The notice number and issuer, B/L and booking references, consignee and notify party, vessel and voyage, ETA and arrival date, port of discharge and terminal, every container with size and seal, packages and weights, each charge line separately, and any printed free-time allowance, free-time start or last free day, plus the release requirement stated.",
      },
      {
        q: "Does it calculate the last free day for me?",
        a: "It extracts the last free day the notice prints. It does not compute one from an ETA and a free-day count, because free-time counting depends on the tariff's start event, its inclusive or exclusive convention and its treatment of weekends and holidays — all of which live in the contract rather than the notice. Use the demurrage calculator to check the printed date against the governing terms.",
      },
      {
        q: "Can it warn me before free time expires?",
        a: "Once the last free day is a structured field on the shipment record, it becomes a tracked date visible against the shipment rather than a line in a PDF. That is what makes an alert possible at all — the extraction is the prerequisite, and the deadline stops depending on whoever happened to open the email.",
      },
      {
        q: "Are the charges extracted as separate lines?",
        a: "Yes. Each charge is captured with its description, basis, amount and currency rather than as a single total, because a total cannot be audited. Charge blocks on arrival notices are frequently free text with agent-specific abbreviations, and lines that cannot be parsed confidently are surfaced for review rather than dropped.",
      },
      {
        q: "Does it match the arrival notice to my Bill of Lading?",
        a: "Yes, by B/L number and by container numbers. Where the notice references a shipment already in the workspace, it is linked automatically. A container appearing on the notice that is not on the B/L — or the reverse — is reported as a discrepancy, because it may mean the notice relates to a different shipment or that equipment was substituted.",
      },
      {
        q: "What if the arrival notice arrives as an email rather than a PDF?",
        a: "Many do, and they are handled the same way. Email intake accepts the message body as well as attachments, so a notice sent as formatted text is extracted rather than requiring somebody to save it as a file first. Forwarded chains and inline images are common and are processed as they arrive.",
      },
      {
        q: "Does the parser capture the terminal, not just the port?",
        a: "Yes, where the notice states it. The terminal is what haulage is booked against and what determines the appointment system you need, and a port-level record is not actionable. Terminal names are local shorthand with no standard dataset behind them, so they are captured as printed rather than normalised.",
      },
      {
        q: "Can it handle a notice covering several containers with different free time?",
        a: "Yes. Free-time information is captured per container where the notice differentiates, which happens more often than people expect — containers discharged from different vessels or held for examination frequently carry different last free days on the same notice, sometimes stated only in a footnote.",
      },
      {
        q: "Does an arrival notice tell me the cargo has been released?",
        a: "No, and the distinction matters. An arrival notice informs you of arrival, charges and free time. Release requires the transport document surrendered or released, charges settled and customs cleared, and collection requires a delivery order. Holding a notice confers no entitlement to the cargo.",
      },
      {
        q: "What if the charges on the notice were never quoted?",
        a: "Raise it in writing immediately rather than at payment. Extracting the charge lines makes the comparison against your quotation fast, and the practical reality is that the carrier will generally not release cargo while charges are outstanding — so an unresolved dispute accrues demurrage. Speed matters more than the merits.",
      },
      {
        q: "Can I export arrival notice data to my TMS?",
        a: "Yes. Reviewed data exports to Excel, CSV or structured JSON, and the JSON structure keeps container rows and charge lines as arrays rather than flattening them, so a downstream system receives the detail rather than a summary.",
      },
      {
        q: "Does it work with NVOCC and forwarder notices as well as carrier notices?",
        a: "Yes. NVOCC and destination-agent notices are the more variable of the two — frequently free-text, frequently carrying both house and master references — and are handled with the same field model. Where the document does not label which reference is house and which is master, that ambiguity is surfaced for review rather than guessed.",
      },
    ],
    related: [
      { href: "/tools/demurrage-detention-calculator", label: "Demurrage and detention calculator", blurb: "Check the free time and charges the notice announces against your contract." },
      { href: "/templates/arrival-notice-template", label: "Arrival notice data sheet", blurb: "Prepare or verify an arrival notice field by field." },
      { href: "/guides/demurrage-detention-calculation-guide", label: "Demurrage and detention guide", blurb: "How free time is counted and how to audit a charge." },
      { href: "/bill-of-lading-parser", label: "Bill of Lading parser", blurb: "The transport document the arrival notice references." },
    ],
  },

  "booking-confirmation-parser": {
    updated: "2026-08-04",
    keywords: [
      "booking confirmation parser",
      "ocean booking confirmation OCR",
      "extract cut off dates booking",
      "carrier booking data extraction",
      "SI cut off VGM cut off",
      "booking note shipping",
      "vessel schedule extraction",
    ],
    quickAnswer: {
      heading: "What a booking confirmation parser extracts",
      body:
        "A booking confirmation carries the deadlines that decide whether a container makes its vessel. Extraction captures the booking number, carrier, vessel and voyage, all routing points, the equipment committed, and every cut-off — documentation, VGM, cargo gate-in and customs — as structured dates rather than as text buried in a PDF.",
      bullets: [
        "Every cut-off as a separate date field",
        "Equipment type and quantity committed",
        "Empty pickup location and validity",
        "Routing that later documents must match",
      ],
    },
    sections: [
      {
        heading: "The booking confirmation is a deadline document",
        paragraphs: [
          "Everything else about a booking — the rate, the space, the equipment — is agreed before the confirmation arrives. What the confirmation adds is a set of hard deadlines, each owned by a different process, each capable of rolling the container on its own.",
          "Missing any one of them produces the same outcome: the container does not load. And because the deadlines fall on different days and belong to different teams — documentation, warehouse, customs — the failure mode is almost always that one of them was nobody's job.",
        ],
        table: {
          caption: "The cut-offs a booking confirmation sets",
          columns: ["Cut-off", "What is due", "Usually owned by"],
          rows: [
            ["Documentation / SI cut-off", "Complete shipping instructions submitted", "Documentation or customer service"],
            ["VGM cut-off", "Verified Gross Mass declared per container", "Warehouse or the shipper's operations"],
            ["Cargo / gate-in cut-off", "Full container physically inside the terminal", "Transport and warehouse"],
            ["Customs cut-off", "Export declaration accepted", "Broker or in-house customs"],
            ["Advance manifest cut-off", "Filings such as AMS or ENS where required", "Carrier or forwarder, on shipper data"],
            ["Reefer or hazardous cut-off", "Special-cargo approvals and documentation", "Specialist operations"],
          ],
          note: "Cut-offs are per sailing, not per lane. Take them from the specific confirmation rather than from a remembered rule of thumb.",
        },
      },
      {
        heading: "Fields extracted",
        bullets: [
          "Booking number, carrier, SCAC and any service contract or quotation reference",
          "Vessel name, voyage number and the service or string where named",
          "Place of receipt, port of loading, port of discharge, place of delivery and any transhipment port, with UN/LOCODEs",
          "ETD, ETA and the intended sailing schedule as printed",
          "Every cut-off date and time, with its label as printed and the timezone where stated",
          "Equipment committed: quantity, size and type codes",
          "Empty container pickup depot, release reference and validity period",
          "Commodity description, expected weight and any special-cargo notation",
          "Freight terms and any charges quoted on the confirmation",
          "Contact details for the booking desk and the equipment control desk",
        ],
      },
      {
        heading: "Checks applied",
        bullets: [
          "Routing points matched against the bundled UN/LOCODE dataset",
          "Cut-off dates checked for a plausible ordering against each other and against ETD",
          "A cut-off already in the past flagged prominently rather than recorded silently",
          "Equipment quantity and type compared against the shipping instructions when those are prepared",
          "Booking reference matched to any existing shipment record",
          "Routing compared against the Bill of Lading once issued, so a silent change is visible",
        ],
        callout: {
          tone: "check",
          title: "The booking is the baseline for everything after it",
          body:
            "Once the booking is a structured record, every later document can be compared against it. A Bill of Lading whose vessel, voyage or discharge port differs from the booking is either an amendment somebody agreed or a change nobody noticed — and telling those apart is the entire value of keeping the baseline.",
        },
      },
      {
        heading: "Working from an extracted booking",
        numbered: [
          "Confirm the routing and equipment match what you actually requested before doing anything else.",
          "Put every cut-off into the shipment record and work backwards from the earliest, not from the sailing date.",
          "Confirm who owns each cut-off, because they belong to different teams and an unowned deadline is a missed one.",
          "Arrange empty pickup inside the release validity — a lapsed release means a new one and a lost day.",
          "Prepare shipping instructions from the booking data rather than from a previous shipment.",
          "Reconcile the Bill of Lading draft against the booking when it arrives, field by field.",
        ],
      },
      {
        heading: "Common problems on booking confirmations",
        bullets: [
          "Cut-off times stated without a timezone, on a booking that spans several",
          "A vessel or voyage change issued as an amended confirmation that reads almost identically to the original",
          "Equipment type confirmed as standard when a high cube was requested, or the reverse",
          "Empty release validity shorter than the loading schedule allows",
          "Transhipment introduced or removed without the routing being flagged as changed",
          "Cut-offs brought forward at short notice around holidays and blank sailings",
          "Commodity description on the booking that will not support the goods description on the B/L",
        ],
      },
    ],
    faqs: [
      {
        q: "What is a booking confirmation?",
        a: "The carrier's confirmation that space and equipment have been allocated for a shipment on a specific sailing. It carries the booking number, vessel and voyage, routing, equipment committed, empty pickup details and — most importantly — the cut-off deadlines for documentation, VGM, cargo gate-in and customs.",
      },
      {
        q: "Which cut-offs matter and how do they differ?",
        a: "The documentation or SI cut-off is when complete shipping instructions must reach the carrier. The VGM cut-off is when the Verified Gross Mass declaration is due. The cargo or gate-in cut-off is when the full container must be inside the terminal. There is usually a separate customs cut-off, and on some trades an advance manifest cut-off. They fall on different days, belong to different teams, and any one of them can roll the container.",
      },
      {
        q: "Why extract cut-offs rather than just reading them?",
        a: "Because a date in a PDF is not a deadline anyone can see. As structured fields on the shipment record, cut-offs become visible to whoever is working the shipment and can be surfaced before they pass. The common failure is not that someone read the deadline wrong — it is that the deadline belonged to nobody.",
      },
      {
        q: "Does the parser handle amended booking confirmations?",
        a: "Yes, and this is one of the more valuable cases. Amended confirmations frequently look almost identical to the original, with a changed vessel, voyage or cut-off buried in an otherwise unchanged document. Extracting both and comparing them makes the change explicit rather than leaving it to be spotted by eye.",
      },
      {
        q: "What is extracted about equipment?",
        a: "The quantity, size and type codes committed, the empty pickup depot, the release reference and its validity period. The type code matters: a booking confirming standard 40ft equipment against a request for high cubes is a problem that surfaces at loading if it is not caught on the confirmation.",
      },
      {
        q: "Can the booking be compared against the Bill of Lading?",
        a: "Yes, and it should be. Grouping both into one shipment record compares vessel, voyage, all four routing points, equipment and references. A discharge port or vessel that differs between the two is either an amendment somebody agreed or a change nobody noticed, and distinguishing those is exactly why the baseline is worth keeping.",
      },
      {
        q: "Are cut-off timezones captured?",
        a: "Where they are stated, yes. Where they are not — which is common — the time is recorded as printed and the ambiguity is left visible rather than resolved by assumption. A cut-off stated as '18:00' on a booking involving three timezones is a genuine risk, and inventing a timezone would hide it.",
      },
      {
        q: "Does the parser work with forwarder booking notes as well as carrier confirmations?",
        a: "Yes. Forwarder and NVOCC booking notes carry the same information in more variable layouts, frequently as formatted email rather than a structured document. They extract into the same field model, with unlabelled or ambiguous references surfaced for review rather than assigned by guesswork.",
      },
      {
        q: "What happens if a cut-off has already passed when the document is extracted?",
        a: "It is flagged prominently rather than recorded as an ordinary date. A booking confirmation that arrives after one of its own cut-offs has passed is not unusual — amended confirmations and late releases both produce it — and it needs immediate attention rather than filing.",
      },
      {
        q: "Can I use the booking data to prepare shipping instructions?",
        a: "Yes, and it is the right place to start. Preparing instructions from the booking rather than from a previous shipment is what prevents stale vessel names, old container numbers and superseded consignees reaching a live transport document. Reviewed booking data can be reused directly into an instruction draft.",
      },
      {
        q: "Does it capture the transhipment port?",
        a: "Where the confirmation states one, yes. Transhipment materially affects transit time and risk, and a routing that gains or loses a transhipment between the booking and the Bill of Lading is a change worth noticing — particularly on lanes where the transhipment port has its own congestion or documentary requirements.",
      },
      {
        q: "How does this help with blank sailings and schedule changes?",
        a: "It does not predict them, but it makes them visible faster. When an amended confirmation arrives, comparing it against the stored original shows exactly what moved — vessel, voyage, ETD, or a cut-off brought forward — instead of requiring someone to read two near-identical PDFs side by side under time pressure.",
      },
    ],
    related: [
      { href: "/templates/shipping-instructions-template", label: "Shipping instructions template", blurb: "Prepare instructions from the booking rather than from last month's file." },
      { href: "/bill-of-lading-parser", label: "Bill of Lading parser", blurb: "Compare the issued transport document back against the booking baseline." },
      { href: "/tools/port-code-lookup", label: "UN/LOCODE port lookup", blurb: "Confirm the routing points named on the confirmation." },
      { href: "/features/shipment-document-matching", label: "Shipment document matching", blurb: "Track routing and equipment changes across the whole document set." },
    ],
  },
};
