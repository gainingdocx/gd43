import type { DeepContentMap } from "@/content/deep/types";

export const CORE_FEATURE_DEEP: DeepContentMap = {
  "shipping-document-data-extraction": {
    updated: "2026-08-04",
    keywords: [
      "shipping document data extraction",
      "logistics OCR software",
      "freight document automation",
      "AI document extraction shipping",
      "extract shipping data to excel",
      "document capture logistics",
      "trade document digitisation",
    ],
    quickAnswer: {
      heading: "How extraction works",
      body:
        "Upload or forward a shipping document and it is classified by type, then read against a field model built for that type. Values come back as named fields and structured rows — not page text — with the source page shown alongside so every value can be confirmed. Deterministic code then checks the arithmetic, references and relationships before anything is exported.",
      bullets: [
        "Document-specific field models, not one generic reader",
        "Line items and container rows preserved as rows",
        "Source and extracted value shown together",
        "Checks in code, not model confidence",
      ],
    },
    sections: [
      {
        heading: "The problem with retyping shipping data",
        paragraphs: [
          "A single container shipment generates a Bill of Lading, a commercial invoice, a packing list, a booking confirmation, an arrival notice and a freight invoice at minimum. The same twenty facts — parties, references, quantities, weights, ports — appear on all of them, and in most operations those facts are typed into a system between two and five times by different people.",
          "The cost is not only the typing. Each re-entry is an opportunity to introduce a difference, and a difference between documents is what generates customs queries, letter-of-credit discrepancies, payment holds and misdelivery. The value of extraction is less about speed and more about the same fact arriving in every system from one reading rather than five.",
        ],
      },
      {
        heading: "What happens to a document",
        numbered: [
          "The document is classified by type, because a packing list and a freight invoice need different field models and routing one to the other produces phantom and missing fields.",
          "Pages are read against the model for that type, mapping values to meaning rather than returning text — this block is the notify party, this table column is gross weight.",
          "Line items, container rows and charge lines are reconstructed as structured rows, including tables that run across page breaks.",
          "Deterministic checks run in code: check digits, port codes, arithmetic, weight relationships, date ordering.",
          "Findings are separated into contradictions and warnings, and ordered by what actually blocks a shipment rather than by page position.",
          "The reviewer confirms or corrects fields with the source page alongside, and the corrected record is what exports.",
        ],
        callout: {
          tone: "info",
          title: "Classification before extraction is not a detail",
          body:
            "A generic model asked to 'extract the fields' from an arrival notice will find something for every field it knows about, including fields the document does not contain. Choosing the field model first is what keeps a missing value reported as missing rather than filled in with the nearest plausible text on the page.",
        },
      },
      {
        heading: "Document types supported",
        table: {
          caption: "The document set covered",
          columns: ["Mode", "Documents"],
          rows: [
            ["Ocean transport", "Bill of Lading, sea waybill, booking confirmation, arrival notice"],
            ["Air transport", "Master and house air waybill, shipper's letter of instruction, air cargo manifest, dangerous goods declaration, cargo security declaration"],
            ["Commercial", "Commercial invoice, pro forma invoice, packing list, purchase order"],
            ["Financial", "Freight invoice, charge and rate documents"],
            ["Receiving", "Goods receipt, delivery note, proof of delivery"],
          ],
        },
      },
      {
        heading: "What extraction does not do",
        paragraphs: [
          "Being specific about the boundary is what makes the tool usable in a regulated workflow. Extraction reads and checks; it does not decide, certify or issue.",
        ],
        bullets: [
          "It does not authenticate a document or confirm that a carrier issued it",
          "It does not classify goods for customs, or issue a binding tariff opinion",
          "It does not certify dangerous goods compliance or replace acceptance review",
          "It does not issue transport documents — only a carrier or authorised agent can",
          "It does not file or transmit anything to a customs authority or carrier system",
          "It does not assess whether a commercial price or a charge was fair or agreed",
        ],
      },
      {
        heading: "Where the output goes",
        paragraphs: [
          "Extraction is only worth doing if the result leaves the tool. Reviewed records export as Excel workbooks with line items and container rows on their own sheets, as CSV for flat feeds, as structured JSON where array detail must survive, and as PDF review reports for a file or a customer.",
          "For teams pushing data onward, connector payloads carry the reviewed record into a downstream system, and the same data can be reused to generate a counterpart document draft rather than being typed again into a blank form.",
        ],
      },
    ],
    faqs: [
      {
        q: "Which shipping documents can be extracted?",
        a: "Bills of lading, sea waybills, booking confirmations and arrival notices for ocean; master and house air waybills, shipper's letters of instruction, cargo manifests, dangerous goods declarations and security declarations for air; and commercial invoices, pro forma invoices, packing lists, purchase orders, freight invoices and goods receipts across both modes.",
      },
      {
        q: "How is this different from a generic OCR tool?",
        a: "Generic OCR returns the text on the page. It does not know which address block is the consignee, which of four place fields it is looking at, or which weight belongs to which container. Extraction here classifies the document first, applies a field model built for that type, reconstructs line items as rows, and then validates the result with deterministic code rather than reporting a confidence score.",
      },
      {
        q: "Can the result be corrected before export?",
        a: "Yes, and it is designed to be. Extracted values stay next to the source page so a reviewer can confirm or correct anything. Exports are generated from the corrected record, not from the raw reading — so a correction made once is reflected in every format and every downstream handoff.",
      },
      {
        q: "Does it preserve line items?",
        a: "Yes. Invoice lines, cargo lines, container rows and charge lines are returned as structured rows, including tables that run across page breaks and continuation sheets. This matters because everything downstream is line-level: customs classifies per line, three-way matching compares per line, duty is calculated per line.",
      },
      {
        q: "How accurate is it?",
        a: "Accuracy varies with document quality, and no honest answer is a single percentage. What the design guarantees instead is that uncertainty is visible: deterministic checks flag anything the arithmetic cannot support, the source page sits beside every value, and warnings are distinguished from contradictions so review effort goes where it matters.",
      },
      {
        q: "What file formats can I submit?",
        a: "Native PDFs, scans and photographs including phone images, in PDF, JPG, PNG and WebP. Multi-page documents are processed page by page. Native files give better results than a scan of a printout, but terminal photographs and faxed copies are normal inputs rather than edge cases.",
      },
      {
        q: "Does it work with documents in other languages?",
        a: "Yes, for the languages the extraction layer supports, and field labels in those languages map to the same structured model. Values, party names and goods descriptions are preserved as written rather than translated, so the record matches the document a customs officer or carrier will be holding.",
      },
      {
        q: "How long does extraction take?",
        a: "Typically well under a minute per page, with fields appearing progressively rather than all at the end. Long documents — multi-page packing lists, consolidation manifests, invoices with hundreds of lines — take proportionally longer because every page is read.",
      },
      {
        q: "Can I process documents in bulk?",
        a: "Yes, through batch upload or by forwarding a whole shipment email to your private intake address. Documents arriving together are grouped into a shipment record, which is what enables the cross-document comparison rather than treating each file in isolation.",
      },
      {
        q: "Is my data used to train models?",
        a: "Your documents are processed to produce your result and stored privately in your workspace under your control. They are not shared between accounts, and you can export or delete them at any time — deletion removes the document together with its extracted data.",
      },
      {
        q: "Can extracted data be pushed into my TMS or ERP?",
        a: "Yes. Reviewed records export as structured JSON preserving the row arrays, and connector payloads carry the record into a downstream system so it does not have to be re-keyed. Excel and CSV remain available where a system takes a file rather than a feed.",
      },
      {
        q: "Do I need to configure templates for each carrier?",
        a: "No. The field models are built per document type rather than per carrier layout, which is what allows a Bill of Lading from an unfamiliar NVOCC to extract without setup. There is no template library to maintain and no rules to write when a supplier changes their invoice design.",
      },
    ],
    related: [
      { href: "/document-parsers", label: "All document parsers", blurb: "The full set of document-specific extractors, grouped by mode." },
      { href: "/features/maritime-document-validation", label: "Document validation", blurb: "The deterministic checks that run after every extraction." },
      { href: "/features/shipping-data-export", label: "Data export", blurb: "Move reviewed records into Excel, JSON or a downstream system." },
      { href: "/accuracy-and-limitations", label: "Accuracy and limitations", blurb: "What extraction and validation do and do not establish." },
    ],
  },

  "maritime-document-validation": {
    updated: "2026-08-04",
    keywords: [
      "shipping document validation",
      "container number validation software",
      "ISO 6346 validation",
      "IMO number checksum",
      "UN/LOCODE validation",
      "document data quality freight",
      "deterministic document checks",
    ],
    quickAnswer: {
      heading: "What validation adds after extraction",
      body:
        "Once values are read, deterministic code evaluates them: container check digits are recomputed under ISO 6346, IMO checksums verified, ports matched against UN/LOCODE, weights and package totals added up, invoice arithmetic recomputed, and date ordering checked. Every finding carries a reproducible reason and, where one can be calculated, the expected value.",
      bullets: [
        "Rules written in code, not model judgement",
        "Expected values shown for check-digit failures",
        "Contradictions separated from warnings",
        "The same input always produces the same result",
      ],
    },
    sections: [
      {
        heading: "Why confidence scores are not enough",
        paragraphs: [
          "A model can be entirely confident about a container number it read perfectly from a document where the number itself is wrong. Confidence measures how sure the reader is about the characters, not whether those characters describe something real. For operational data, that distinction is the whole problem.",
          "Deterministic validation answers a different question: given these characters, do they satisfy the rules that this kind of value must satisfy? A container check digit either matches its modulo-11 calculation or it does not. An invoice total either equals the sum of its lines or it does not. Those answers are reproducible, explainable and independent of how the value was read.",
        ],
        callout: {
          tone: "info",
          title: "The AI reads; the rules decide",
          body:
            "Extraction and validation are deliberately separate layers. That separation is what allows a finding to be explained — 'the expected check digit is 3, the document shows 8' is a sentence anyone can act on, and it does not change between runs.",
        },
      },
      {
        heading: "The checks that run",
        table: {
          caption: "Validation rules by category",
          columns: ["Category", "Check", "What a failure means"],
          rows: [
            ["Equipment", "ISO 6346 container check digit recomputed", "Transcription or OCR error, or a mis-marked container"],
            ["Vessel", "IMO number checksum", "Wrong or mistyped vessel identifier"],
            ["Location", "Routing points matched against UN/LOCODE", "Unrecognised code — often legacy data, occasionally an error"],
            ["Air", "Modulus-7 AWB check digit on master waybill numbers", "Mistyped or invented air waybill reference"],
            ["Weights", "Net weight against gross weight", "Columns transposed, or units mixed across rows"],
            ["Weights", "Container weights summed against printed total", "A container added or removed after the total was written"],
            ["Packages", "Package counts totalled across rows and containers", "Line added or removed without the total being updated"],
            ["Volume", "CBM recomputed from dimensions and package count", "Dimensions describing a pallet rather than a carton, or a unit error"],
            ["Financial", "Line amount = quantity × unit price; lines summed to totals", "An edited line, a hidden discount, or a genuine error"],
            ["Dates", "Ordering between on-board, issue, ETA and arrival dates", "Impossible sequence, or a document dated incorrectly"],
            ["Classification", "HS code structural plausibility", "Truncated or malformed code"],
            ["Terms", "Incoterm validated against the published rule set", "An invalid rule, or a maritime-only rule on containerised cargo"],
          ],
        },
      },
      {
        heading: "Contradictions, warnings and why the difference matters",
        paragraphs: [
          "A review queue that treats every finding as equally urgent gets ignored, and an ignored queue is worse than no queue at all. Findings are therefore graded by what the rule can actually establish.",
        ],
        subsections: [
          {
            heading: "Contradictions",
            paragraphs: [
              "Something on the document cannot be true. These are arithmetic and structural facts, and they are almost never false positives.",
            ],
            bullets: [
              "A container check digit that does not match its calculation",
              "Net weight exceeding gross weight",
              "A printed total that does not equal the sum of its lines",
              "A shipped-on-board date after the document's own issue date",
              "A chargeable weight below the gross weight on an air waybill",
            ],
          },
          {
            heading: "Warnings",
            paragraphs: [
              "Something could not be confirmed. These need a human to look, not to panic — and treating them as failures is how legitimate documents get rejected.",
            ],
            bullets: [
              "A port code the bundled dataset does not contain, which is frequently valid legacy data",
              "A weight total differing from the sum of lines by less than the tolerance",
              "An HS code that is structurally valid but shorter than the destination requires",
              "A field the document simply does not carry",
              "A value read from a region of the page with poor legibility",
            ],
          },
        ],
        callout: {
          tone: "warn",
          title: "Dataset misses warn, they never fail",
          body:
            "UN/LOCODE is revised twice a year and carrier master data lags behind for years. An unrecognised port code is far more often stale reference data on a perfectly valid document than an actual error. Rejecting on a dataset miss would fail real shipments to satisfy a lookup.",
        },
      },
      {
        heading: "What validation cannot establish",
        paragraphs: [
          "Every one of these rules operates on the document's internal consistency. None of them can reach outside the page.",
        ],
        bullets: [
          "It cannot confirm a document is genuine, or that the named carrier issued it",
          "It cannot confirm a container exists, is in service or holds the cargo described",
          "It cannot confirm a vessel sailed, a flight operated or a booking was made",
          "It cannot confirm a declared value reflects the real transaction",
          "It cannot confirm a classification is correct for the goods",
          "It cannot substitute for customs, carrier or bank verification",
        ],
      },
    ],
    faqs: [
      {
        q: "Are validation results generated by AI?",
        a: "No. The AI reads the document; deterministic code performs the checksum, arithmetic, date and reference checks. That separation is deliberate — it means every finding has a reproducible reason, the same input always produces the same result, and a finding can be explained in a sentence rather than justified by a confidence score.",
      },
      {
        q: "Can validation prove that a document is genuine?",
        a: "No. It detects internal inconsistencies and invalid references — arithmetic that fails, check digits that do not match, dates in an impossible order. It cannot authenticate an issuer, and it does not replace verification with the carrier, customs authority or bank. A perfectly fabricated document can pass every check.",
      },
      {
        q: "What happens when a check fails?",
        a: "The affected field is flagged with a plain-language explanation and, where one can be calculated, the expected value — so a failed container check digit shows the number the arithmetic implies. Findings are ordered by severity and grouped so the review queue reflects what blocks a shipment rather than the layout of the page.",
      },
      {
        q: "What is the difference between a warning and a failure?",
        a: "A failure means something on the document cannot be true — net weight above gross, a total that does not equal its lines, a check digit that does not compute. A warning means something could not be confirmed, most often a reference the bundled dataset does not contain. Failures are almost never false positives; warnings frequently resolve as legitimate.",
      },
      {
        q: "How are container numbers validated?",
        a: "Under ISO 6346: each of the first ten characters is converted to its numeric value, multiplied by 2 raised to its position, summed, and reduced modulo 11 — with a remainder of 10 written as 0. The result is compared against the printed check digit and the expected full number is shown when they disagree.",
      },
      {
        q: "Which reference datasets are used?",
        a: "A bundled UN/LOCODE snapshot for port and location codes, the ISO 6346 algorithm for container numbers, IMO checksum rules for vessels, the IATA modulus-7 scheme for master air waybill numbers, and the published Incoterms rule set. Datasets are snapshots rather than live queries, which is why a miss warns rather than fails.",
      },
      {
        q: "Can I add my own validation rules?",
        a: "Workflow rules let you express the checks your operation cares about — required document sets, tolerances, and which findings should block a handoff. The built-in deterministic checks cover the structural and arithmetic layer that applies to every shipment regardless of who is running it.",
      },
      {
        q: "Does validation slow down processing?",
        a: "Negligibly. The checks are arithmetic and lookups against bundled data, measured in milliseconds against extraction measured in seconds. The time cost is in reviewing findings, which is the point — and why grading them by severity matters more than the compute.",
      },
      {
        q: "What tolerance is applied to weight totals?",
        a: "A small percentage band, because printed totals are routinely rounded differently from their component lines and flagging every rounding difference would bury the real findings. Differences beyond the band are reported with both figures shown so the size of the gap is visible, not just the fact of it.",
      },
      {
        q: "Does validation check documents against each other?",
        a: "Field-level validation checks a document against itself. Cross-document comparison — parties, references, quantities and weights across the Bill of Lading, invoice, packing list and purchase order — is a separate layer that runs when documents are grouped as one shipment.",
      },
      {
        q: "Why not just reject documents that fail validation?",
        a: "Because many failures are in the source document rather than in the reading, and the correct response is usually to fix the source or query the issuer rather than to discard the record. Rejecting also removes the evidence you need to raise the query. Findings surface for a decision; they do not delete data.",
      },
      {
        q: "Are validation results included in exports?",
        a: "Yes. PDF review reports show the findings alongside the extracted values, and structured exports carry the validation state so a downstream system can see which fields were confirmed and which were flagged. That trail is what makes a later dispute answerable.",
      },
    ],
    related: [
      { href: "/tools/container-number-check", label: "Container number check", blurb: "Run the ISO 6346 validation on a list of numbers without a document." },
      { href: "/guides/iso-6346-container-number-check-digit", label: "ISO 6346 check digit guide", blurb: "The formula, letter values and a worked example." },
      { href: "/standards", label: "Standards and datasets", blurb: "Which reference data is bundled and how current each snapshot is." },
      { href: "/accuracy-and-limitations", label: "Accuracy and limitations", blurb: "The boundary between what is checked and what is claimed." },
    ],
  },

  "shipment-document-matching": {
    updated: "2026-08-04",
    keywords: [
      "three way matching",
      "PO invoice goods receipt matching",
      "shipment document reconciliation",
      "discrepancy detection freight",
      "invoice matching software",
      "cross document validation",
      "shipping document comparison",
    ],
    quickAnswer: {
      heading: "What matching compares",
      body:
        "Documents grouped as one shipment are compared field by field and line by line: parties, references, routing, container numbers, quantities, weights, currency, terms and totals. Differences become prioritised discrepancies, ordered by whether they delay clearance, block payment or affect delivery — rather than by which document they appeared on.",
      bullets: [
        "Header and line-level comparison",
        "Classic three-way plus transport evidence",
        "Every source value preserved, not merged",
        "Findings prioritised by operational impact",
      ],
    },
    sections: [
      {
        heading: "Individually correct, collectively wrong",
        paragraphs: [
          "Most document problems are not errors on a single page. Every document in a shipment can be internally valid and pass every structural check, while disagreeing with the others about what was shipped. That is the failure mode that generates customs holds, letter-of-credit rejections, payment disputes and misdeliveries.",
          "Comparing documents by eye is slow, tedious and unreliable, which means in practice it happens on exception rather than routinely — usually after the problem has already surfaced. The value of automated matching is that it happens on every shipment at the point the documents arrive, when the difference is still cheap to fix.",
        ],
      },
      {
        heading: "The comparisons that run",
        table: {
          caption: "What is compared across a shipment set",
          columns: ["Dimension", "Compared across", "Typical finding"],
          rows: [
            ["Parties", "Invoice, packing list, B/L, PO", "Consignee updated on one document only"],
            ["References", "All documents", "PO number changed late and not carried through"],
            ["Goods description", "Invoice, packing list, B/L", "Description written for customs on one, for the warehouse on the other"],
            ["Quantities", "PO, invoice, packing list, receipt", "Invoiced above received, or short shipment not reflected"],
            ["Unit prices", "PO, invoice", "Price variance beyond tolerance"],
            ["Weights", "Packing list, B/L or AWB, VGM", "Net above gross, or a total that does not reconcile"],
            ["Packages", "Packing list, B/L, arrival notice", "Package count differing between declared and carried"],
            ["Containers and seals", "Packing list, B/L, arrival notice", "A container on one document and not the other"],
            ["Routing", "Booking, B/L, arrival notice", "Discharge port changed without an agreed amendment"],
            ["Currency and terms", "PO, invoice", "Incoterm or currency differing from what was agreed"],
            ["Dates", "All documents", "Shipment date after a credit's latest shipment date"],
          ],
        },
      },
      {
        heading: "Three-way matching, extended",
        paragraphs: [
          "The classic three-way match compares purchase order, invoice and goods receipt: was it ordered, was it received, is the price agreed. It is a sound control and it is incomplete for international trade, because it never looks at what the carrier actually received.",
          "Adding the transport document closes that gap. A shipment can match perfectly across PO, invoice and receipt while the Bill of Lading shows a different consignee, a different package count or a weight that cannot be reconciled — which is exactly the situation where a payment goes out against goods that did not arrive as described.",
        ],
        bullets: [
          "Purchase order — the baseline of what was agreed",
          "Commercial invoice — what is being charged",
          "Goods receipt — what actually arrived and what was accepted",
          "Packing list — what was declared as packed",
          "Bill of Lading or air waybill — what the carrier received",
          "Freight invoice — what the movement was billed at",
        ],
        callout: {
          tone: "warn",
          title: "A missing document is not a pass",
          body:
            "Where a required evidence role is absent — no goods receipt, no packing list — the match reports as incomplete rather than approving by default. An approval issued without the evidence is an assumption dressed as a control, and it is the specific failure that over-billing relies on.",
        },
      },
      {
        heading: "Every source value is preserved",
        paragraphs: [
          "Matching does not merge documents into a single 'best' record. Each document keeps its own values, and the discrepancy records which document said what. That matters for two reasons: you need to know which party to raise the difference with, and you need to be able to show the evidence when you do.",
          "It also means correcting a document is a deliberate act against a specific source, rather than an edit to a merged record whose provenance has already been lost.",
        ],
      },
      {
        heading: "Working a discrepancy list",
        numbered: [
          "Start at the top — findings are ordered by operational impact, not by document or page order.",
          "For each finding, read both values and their sources before deciding which document is wrong.",
          "Correct at source: the party that issued the incorrect document has to reissue or amend it, not you downstream.",
          "Where a difference is legitimate — a partial shipment, an agreed substitution — record the reason so the same finding is not re-investigated next time.",
          "Escalate anything affecting a letter of credit before shipment, because a credit discrepancy after presentation puts payment at the buyer's discretion.",
          "Export the discrepancy report as evidence for the conversation with the counterparty.",
        ],
      },
    ],
    faqs: [
      {
        q: "What is three-way matching?",
        a: "Comparing the purchase order, the supplier invoice and the goods receipt before approving payment: was it ordered, was it received, and is the price as agreed. Any of the three failing should stop payment. In international trade it is worth extending to the transport document, which records what the carrier actually received.",
      },
      {
        q: "Which documents can be matched?",
        a: "Purchase orders, commercial invoices, packing lists, goods receipts, bills of lading, sea waybills, air waybills, booking confirmations, arrival notices and freight invoices. Any documents grouped as one shipment are compared; the more of the set present, the more comparisons are possible.",
      },
      {
        q: "How are documents grouped into a shipment?",
        a: "By shared references — B/L number, booking number, invoice number, purchase order, container numbers — found in the extracted data. Documents forwarded together by email are grouped automatically, and grouping can be adjusted manually where a reference is missing or a shipment spans several deliveries.",
      },
      {
        q: "Does matching change my documents?",
        a: "No. Each document keeps its own extracted values, and a discrepancy records which document stated what. Nothing is merged into a single record, because knowing which party to raise a difference with — and being able to show the evidence — depends on the provenance being preserved.",
      },
      {
        q: "How are discrepancies prioritised?",
        a: "By operational impact rather than by document order: what blocks customs clearance first, then what blocks payment, then what affects delivery, then informational differences. A twenty-item list ordered by page position gets ignored; the same list ordered by consequence gets worked.",
      },
      {
        q: "What tolerances are applied?",
        a: "Small bands on weights and amounts, because printed totals routinely round differently from their components and flagging every rounding difference buries the real findings. Where a variance exceeds the band, both figures and the size of the gap are shown so the decision is made on the number rather than on a binary flag.",
      },
      {
        q: "Can it match when the supplier uses different item codes?",
        a: "Yes. Line matching uses several signals — item code, description, quantity and price — rather than a single key, so a supplier's own part numbers can be matched against your item lines. Where the correspondence is genuinely ambiguous, the lines are reported unmatched for a human to resolve rather than paired on a weak similarity.",
      },
      {
        q: "What if a required document is missing?",
        a: "The match reports as incomplete rather than passing. This is deliberate: a three-way match that approves because the goods receipt was never uploaded is not a control at all. The missing evidence role is named so it is clear what is needed to complete the check.",
      },
      {
        q: "Does it check against a letter of credit?",
        a: "Where the credit's requirements are recorded, the documents can be compared against them — description wording, amount and currency, latest shipment date, consignee, required documents. Bank examination is literal, so catching a wording difference before presentation is materially cheaper than a discrepancy after.",
      },
      {
        q: "Can I export the discrepancy report?",
        a: "Yes, as a PDF discrepancy report showing each finding with both source values and the documents they came from. That report is what makes the conversation with a supplier, forwarder or carrier evidence-based rather than an assertion, and it is worth attaching to the shipment file whether or not the finding is disputed.",
      },
      {
        q: "How long does matching take?",
        a: "It runs as soon as the documents in a group have been extracted, so the discrepancy list is available within the same session rather than as a separate batch process. Adding a further document to an existing shipment re-runs the comparison against the whole set.",
      },
      {
        q: "Does it work for partial shipments?",
        a: "Yes, but the partial nature has to be visible. Where an invoice covers a full order and the packing list covers one of three shipments, the quantity difference is a legitimate one — recording the reason against the finding stops it being re-investigated on every subsequent document that arrives.",
      },
    ],
    related: [
      { href: "/sample-discrepancy-report", label: "Sample discrepancy report", blurb: "See what a completed cross-document check actually produces." },
      { href: "/purchase-order-parser", label: "Purchase order parser", blurb: "Extract the baseline that variances are measured against." },
      { href: "/goods-receipt-parser", label: "Goods receipt parser", blurb: "Capture accepted and rejected quantities for the third leg." },
      { href: "/guides/commercial-invoice-vs-packing-list", label: "Invoice vs packing list", blurb: "Exactly which fields have to agree between the two." },
    ],
  },

  "shipping-document-search": {
    updated: "2026-08-04",
    keywords: [
      "search shipping documents",
      "find shipment by container number",
      "B/L number search",
      "document retrieval logistics",
      "shipment record search",
      "freight document index",
      "search inside PDF shipping",
    ],
    quickAnswer: {
      heading: "How search works here",
      body:
        "Search runs against the structured values extracted from your documents, not against filenames. Type a container number, a B/L reference, an invoice number, a vessel or a party name and you get the documents and shipments that actually contain it — including references that appear only inside a PDF and nowhere in its filename.",
      bullets: [
        "Searches extracted field values, not filenames",
        "Results link to the document and its shipment",
        "Private to the signed-in account",
        "Works across every document type",
      ],
    },
    sections: [
      {
        heading: "The retrieval problem in freight operations",
        paragraphs: [
          "A carrier calls about container MSCU1234567. A customer asks about invoice 44821. A broker needs the packing list for a B/L nobody can name. In most operations, answering means opening a shared drive, guessing at folder conventions and opening PDFs until one of them contains the reference.",
          "The reference exists — it is printed on the document. It is simply not in the filename, and filenames are the only thing a file system can search. Extraction solves this incidentally: once values are structured, the reference becomes searchable, and the path from a question to the supporting evidence collapses from minutes to seconds.",
        ],
      },
      {
        heading: "What you can search by",
        table: {
          caption: "Searchable extracted values",
          columns: ["Category", "Examples"],
          rows: [
            ["Transport references", "B/L number, sea waybill number, master and house air waybill numbers, booking number"],
            ["Commercial references", "Invoice number, purchase order number, contract reference, customer reference"],
            ["Equipment", "Container number, seal number"],
            ["Parties", "Shipper, consignee, notify party, buyer, seller, carrier, agent"],
            ["Movement", "Vessel name, voyage, flight number, port of loading, port of discharge, airport codes"],
            ["Cargo", "Goods description text, SKU and part numbers, HS codes, marks"],
          ],
        },
      },
      {
        heading: "Results that carry context",
        paragraphs: [
          "A search result that is only a filename is barely better than the folder you started in. Results here connect the matched document to the shipment it belongs to, its review status and the other documents in the same group — so the answer to 'where is the packing list for this container' is one click rather than a second search.",
        ],
        bullets: [
          "The matching document, with the field the term was found in",
          "The shipment record it belongs to, and every other document in that group",
          "Review status, so you can tell a confirmed record from one still under review",
          "Any outstanding discrepancies on that shipment",
          "Direct links to export the record or open the source page",
        ],
      },
      {
        heading: "Legacy and non-standard references",
        paragraphs: [
          "Real reference data is messy. Container numbers appear with and without spaces, port codes appear in superseded forms, and party names are abbreviated differently on every document. Search that only matches exactly will fail on all of it.",
          "References are normalised for matching while the printed form is preserved on the record, so a container searched without spaces finds the document that printed it with them. Where legacy codes are known to alias to a current one, the alias is followed rather than returning nothing.",
        ],
        callout: {
          tone: "info",
          title: "Search is private to your account",
          body:
            "Workspace search covers your own documents only. It is not an internet index, documents are not shared between accounts, and nothing you upload becomes publicly discoverable. Deleting a document removes it from search along with its extracted data.",
        },
      },
    ],
    faqs: [
      {
        q: "What can I search for?",
        a: "Any extracted value: B/L and invoice numbers, booking and purchase order references, container and seal numbers, master and house air waybill numbers, shipper, consignee and notify party names, vessels, voyages, flights, ports and airports, goods descriptions, SKUs and HS codes.",
      },
      {
        q: "Does search require exact filenames?",
        a: "No. Search runs against structured document values, so the original filename is irrelevant. A reference printed inside a PDF but absent from its filename — which is the normal case — is found exactly as easily as one in the title.",
      },
      {
        q: "Are my documents publicly searchable?",
        a: "No. Workspace search is private to the signed-in account and is not an internet search index. Documents are not shared between accounts, and deleting a document removes it from search along with its extracted data.",
      },
      {
        q: "Can I find a container across several documents?",
        a: "Yes, and this is one of the more useful cases. A container number typically appears on the packing list, the Bill of Lading, the arrival notice and the freight invoice. Searching it returns every document that carries it, grouped by shipment, so the full paper trail for one box is visible at once.",
      },
      {
        q: "Does search handle formatting differences?",
        a: "Yes. References are normalised for matching while the printed form is preserved on the record, so a container number searched without spaces matches a document that printed it with them, and a code entered in lower case matches an upper-case original.",
      },
      {
        q: "What about legacy or superseded codes?",
        a: "Where a legacy code is known to correspond to a current one, the alias is followed rather than returning an empty result. This matters most for port codes, where superseded forms circulate in carrier and customer master data for years after the standard has moved on.",
      },
      {
        q: "Can I search inside goods descriptions?",
        a: "Yes. Description text from invoices, packing lists and transport documents is searchable, which is how you find a shipment when the only thing anyone remembers is what was in it. Partial terms work — you do not need the exact wording used on the document.",
      },
      {
        q: "Do search results show whether a shipment has problems?",
        a: "Yes. Results carry the review status and any outstanding discrepancies on the shipment, so a search that was really a question about whether something is clear to proceed is answered in the result rather than requiring the record to be opened.",
      },
      {
        q: "How current are search results?",
        a: "Documents become searchable once they have been extracted, which is normally within the same session as upload or email intake. Corrections made during review are reflected, so searching a corrected reference finds the document rather than only the original misreading.",
      },
      {
        q: "Can I search across shipments as well as documents?",
        a: "Yes. Results connect documents to their shipment record, and shipment-level attributes such as parties, routing and status are searchable in their own right — so you can find every shipment for a consignee as easily as a single document by reference.",
      },
      {
        q: "Is there an API for search?",
        a: "Reviewed data can be exported and pushed to a downstream system through connectors, where your own systems can index it alongside their existing records. For teams that want retrieval to happen in their TMS rather than here, that is generally the better pattern.",
      },
      {
        q: "What happens to search when I delete a document?",
        a: "It is removed from search immediately along with its extracted data. Deletion is genuine removal rather than hiding, which is also why an export taken before deletion is the right way to retain a record you may need later.",
      },
    ],
    related: [
      { href: "/features/shipping-document-data-extraction", label: "Document extraction", blurb: "The structured values that make search possible in the first place." },
      { href: "/features/shipment-document-matching", label: "Shipment matching", blurb: "Group documents so a search result carries its whole shipment." },
      { href: "/features/email-in-document-ingestion", label: "Email-in intake", blurb: "Get documents into the workspace without downloading and re-uploading." },
      { href: "/security", label: "Security and data handling", blurb: "How workspace data is isolated and what deletion removes." },
    ],
  },

  "shipping-data-export": {
    updated: "2026-08-04",
    keywords: [
      "export shipping data to excel",
      "shipping document CSV export",
      "structured JSON freight data",
      "TMS integration shipping documents",
      "document data handoff",
      "freight data export formats",
      "PDF review report shipping",
    ],
    quickAnswer: {
      heading: "What you can export",
      body:
        "Reviewed records export as multi-sheet Excel workbooks with summary, container and line-item sheets kept separate; as flat CSV for systems that take files; as structured JSON that preserves row arrays for integrations; and as branded PDF review reports. Every format is generated from the corrected record, so it carries your review rather than the raw reading.",
      bullets: [
        "Excel with rows on their own sheets",
        "CSV for flat operational handoff",
        "JSON preserving line and container arrays",
        "PDF review reports with findings included",
      ],
    },
    sections: [
      {
        heading: "Extraction only pays off at the handoff",
        paragraphs: [
          "Reading a document accurately is worth nothing if the result stays in the tool that read it. The value is realised when a container list lands in a spreadsheet, an invoice line array reaches an ERP, or a review report goes to a customer as evidence that the shipment was checked.",
          "The design principle throughout is that structure should survive. A packing list flattened into a single row of text has lost precisely the detail that made extracting it worthwhile, so exports keep line items, container rows and charge lines as rows.",
        ],
      },
      {
        heading: "Choosing a format",
        table: {
          caption: "Which export format suits which handoff",
          columns: ["Format", "Structure", "Best for"],
          rows: [
            ["Excel (XLSX)", "Multiple sheets: summary, containers, line items", "Spreadsheet work, sharing with people, audit files"],
            ["CSV", "One flat table per download", "Systems that ingest files, bulk loading, simple pipelines"],
            ["JSON", "Nested objects with row arrays preserved", "Integrations, APIs, anything that needs the full structure"],
            ["PDF review report", "Formatted document with findings alongside values", "Customers, brokers, carriers, and the shipment file"],
            ["Connector payload", "Structured push to a downstream system", "Continuous handoff without manual download"],
          ],
        },
      },
      {
        heading: "Exports carry your corrections, not the raw reading",
        paragraphs: [
          "This is a small design decision with a large consequence. Exports are generated from the current reviewed record, which means a correction made once during review is reflected in every format and every subsequent export.",
          "It also means an export is a snapshot of a reviewed state rather than of a machine reading. If a value was confirmed by a person, the export says so; if it was flagged and left unresolved, the export carries that too. That is what makes an exported record defensible rather than merely convenient.",
        ],
        bullets: [
          "Field corrections made during review are included",
          "Validation state travels with the record so a downstream system can see what was confirmed",
          "Outstanding findings are visible rather than silently dropped",
          "The source document remains linked, so an exported figure can be traced back",
        ],
      },
      {
        heading: "Discrepancy reports as customer-facing evidence",
        paragraphs: [
          "The PDF review report is not only an internal artefact. When a shipment has cross-document discrepancies, the report showing each finding with both source values and the documents they came from is what turns a conversation with a supplier, forwarder or carrier from an assertion into an evidenced request.",
          "Sharing it is also how a forwarder demonstrates that a check was performed. 'We reviewed the documents' and 'here is the report showing what was compared and what was found' land very differently with a customer whose shipment was held.",
        ],
      },
      {
        heading: "Getting data into your own systems",
        numbered: [
          "Decide whether the handoff is file-based or continuous — that choice determines format more than anything else.",
          "For file-based handoff, use Excel where people will work with the data and CSV where a system will ingest it.",
          "For integrations, use JSON so line-item and container arrays survive rather than being flattened.",
          "Map the fields you need once; the field model is stable per document type, so a mapping does not need maintaining per carrier or supplier.",
          "For continuous handoff, configure a connector to push reviewed records rather than exporting manually.",
          "Keep the PDF review report with the shipment file regardless of the machine handoff, because it is the human-readable evidence.",
        ],
      },
    ],
    faqs: [
      {
        q: "Which export formats are available?",
        a: "Excel workbooks with separate summary, container and line-item sheets; flat CSV; structured JSON preserving row arrays; and branded PDF review reports. Connector payloads are available for pushing reviewed records into a downstream system without a manual download.",
      },
      {
        q: "Are line items included?",
        a: "Yes, as rows rather than flattened text. Invoice lines, cargo lines, container rows and charge lines each get their own sheet in Excel and their own array in JSON, because the line-level detail is what made the extraction worth doing.",
      },
      {
        q: "Do exports include my corrections?",
        a: "Yes. Exports are generated from the current reviewed record, so a field corrected once during review appears corrected in every format and every subsequent export. Nothing exports from the raw reading.",
      },
      {
        q: "Do exports include validation findings?",
        a: "PDF review reports show findings alongside the extracted values. Structured exports carry the validation state so a downstream system can distinguish a confirmed field from a flagged one, which matters when the receiving system needs to know how much to trust an incoming record.",
      },
      {
        q: "Can I export several documents at once?",
        a: "Yes. Shipment-level export produces a combined record covering every document grouped into that shipment, which is normally what you want for a handoff — the container list, the invoice lines and the transport references in one file rather than four separate downloads.",
      },
      {
        q: "What is the difference between CSV and JSON here?",
        a: "CSV is one flat table, so nested structure has to be either split across files or lost. JSON preserves the nesting — a shipment containing containers containing packages — which is why it is the right choice for anything programmatic. Use CSV where a system takes files and JSON where it takes data.",
      },
      {
        q: "Can I share an export with a customer or carrier?",
        a: "Yes. The PDF review report is designed to be shared, and revocable share links let you give a specific person access to a record without them needing an account. Links can be revoked, which is what makes sharing safer than emailing a file that then exists forever.",
      },
      {
        q: "Are exports branded?",
        a: "PDF review reports carry your workspace branding on paid plans, so a report sent to a customer looks like your document rather than a third-party tool's. Free-plan exports carry a watermark.",
      },
      {
        q: "How do I push data to my TMS without downloading files?",
        a: "Connectors send the reviewed record to a downstream endpoint as a structured payload when a shipment reaches the state you specify. That removes the manual export step entirely and is the right pattern once volume makes downloading impractical.",
      },
      {
        q: "Does the export include a link back to the source document?",
        a: "Yes. Records carry a reference back to the source so an exported figure can be traced to the page it came from. That trail is what lets a question asked three months later be answered from the export rather than by re-reading a PDF.",
      },
      {
        q: "Can I choose which fields to export?",
        a: "Exports cover the full extracted field set for the document type, and field selection is applied at the receiving end for most integrations. Sending everything and filtering downstream is generally more robust than filtering at source, because a field you excluded is one you have to re-export to recover.",
      },
      {
        q: "What happens to exports if I delete a document?",
        a: "Files you have already downloaded are yours and are unaffected. Deleting a document removes it and its extracted data from the workspace, so a record you may need later should be exported before deletion rather than after.",
      },
    ],
    related: [
      { href: "/sample-discrepancy-report", label: "Sample discrepancy report", blurb: "See what an exported review report actually contains." },
      { href: "/features/shipping-document-generation", label: "Document generation", blurb: "Reuse reviewed data as a document draft rather than a data file." },
      { href: "/features/shipment-document-matching", label: "Shipment matching", blurb: "The cross-document findings that review reports carry." },
      { href: "/pricing", label: "Pricing", blurb: "Which export formats and branding options each plan includes." },
    ],
  },

  "shipping-document-generation": {
    updated: "2026-08-04",
    keywords: [
      "generate shipping documents",
      "create packing list from invoice",
      "shipping document draft software",
      "document reuse freight",
      "shipping instructions generation",
      "commercial invoice generator",
      "counterpart document creation",
    ],
    quickAnswer: {
      heading: "What generation does",
      body:
        "Reviewed data from one document populates an editable draft of a related document — an invoice into a packing list, a booking into shipping instructions — so shared facts are carried across rather than retyped. Everything generated is a working draft for human review, and nothing generated is a transport document, which only a carrier or authorised agent can issue.",
      bullets: [
        "Reuse reviewed facts across related documents",
        "Fully editable before download",
        "Document-specific field mapping",
        "Clear draft status and authority notices",
      ],
    },
    sections: [
      {
        heading: "The same facts, typed five times",
        paragraphs: [
          "Parties, references, routing, cargo descriptions, quantities and weights appear on nearly every document in a shipment. In most operations each document is prepared independently, which means those facts are typed repeatedly — and each retyping is a chance for the documents to start disagreeing with each other.",
          "Generation attacks the problem at its source. If the commercial invoice has already been reviewed and confirmed, the packing list should start from those facts rather than from a blank form. The point is not only speed; it is that documents built from a common reviewed record are consistent by construction rather than by luck.",
        ],
      },
      {
        heading: "What can be generated from what",
        table: {
          caption: "Practical generation paths",
          columns: ["From", "To", "What carries across"],
          rows: [
            ["Commercial invoice", "Packing list", "Parties, references, SKUs, descriptions, quantities, HS codes, origin"],
            ["Commercial invoice", "Pro forma invoice", "Parties, line items, terms, currency"],
            ["Packing list", "Container packing list", "Package rows, weights, dimensions, marks"],
            ["Booking confirmation", "Shipping instructions", "Booking reference, routing, vessel, equipment, cut-offs"],
            ["Booking + invoice + packing list", "Shipping instructions", "The full instruction set from three reviewed sources"],
            ["Shipper's letter of instruction", "Air waybill data worksheet", "Parties, routing, pieces, weights, declared values, handling"],
            ["Bill of Lading", "Arrival notice data sheet", "References, vessel, routing, containers, consignee"],
          ],
          note: "Availability depends on the source data present. A mapping only offers fields the source actually carried — it does not invent values to fill a form.",
        },
      },
      {
        heading: "Drafts, not issued documents",
        paragraphs: [
          "This boundary is not a disclaimer, it is a design constraint. Several documents in a shipment set can only be issued by a specific party: a Bill of Lading by a carrier, NVOCC or authorised agent; an air waybill by an airline or cargo agent; a certificate of origin by a chamber of commerce or an approved exporter under a scheme; a delivery order by the party controlling the cargo.",
          "What generation produces for those types is a data worksheet — a complete, checked set of particulars for submission or for checking the issued document against. For documents the shipper does issue in its own right, such as a commercial invoice or packing list, the output is a working draft the shipper completes and signs.",
        ],
        callout: {
          tone: "warn",
          title: "Nothing generated here is a transport document",
          body:
            "Generation does not issue a Bill of Lading, an air waybill, a certificate of origin or a delivery order, and completing a worksheet confers no rights against a carrier. The authority notices on each template state who must issue the real document — read them before sending anything to a counterparty.",
        },
      },
      {
        heading: "Working with a generated draft",
        numbered: [
          "Open the reviewed source document and choose a compatible output type.",
          "Check the mapped values — the mapping is deliberate but the source may have had a value you would state differently on the target document.",
          "Complete the fields the source could not supply, particularly declarations, signatures and any destination-specific statement.",
          "Adjust anything the target document treats differently: a goods description written for customs may need different wording under a documentary credit.",
          "Reconcile totals against the source before downloading, since the target document may total differently.",
          "Download as PDF for issue, or XLSX and DOCX where the counterparty needs an editable file.",
        ],
      },
      {
        heading: "Why consistency by construction matters",
        paragraphs: [
          "The most common cause of customs queries, credit discrepancies and payment holds is not a wrong document — it is two documents that describe the same shipment differently. Party names updated on one and not the other, quantities from a superseded order, a description rewritten for a different audience.",
          "Documents built from one reviewed record start consistent. That does not remove the need to check them — the target document may legitimately need different wording — but it changes the default from 'find the differences' to 'confirm the intended ones'.",
        ],
      },
    ],
    faqs: [
      {
        q: "Does generation issue an official Bill of Lading?",
        a: "No. Only a carrier, NVOCC or authorised agent can issue a transport document, because it evidences the carrier's receipt of goods and its contract of carriage. What is generated is a data worksheet carrying complete particulars for submission as shipping instructions and for checking the carrier's draft.",
      },
      {
        q: "Which documents can be generated?",
        a: "Packing lists, container packing lists, commercial and pro forma invoices, shipping instructions, air waybill data worksheets and arrival notice data sheets, depending on what the source data supports. Documents that only a specific authority can issue are produced as worksheets rather than as the document itself.",
      },
      {
        q: "Can I edit the generated document?",
        a: "Yes, fully. Mapped values are a starting point and every field remains editable before download. The target document frequently needs something the source did not carry — a declaration, a signature block, a destination-specific statement — so review is expected rather than optional.",
      },
      {
        q: "Does it invent values to fill empty fields?",
        a: "No. A mapping only offers fields the source document actually carried, and anything the source did not supply is left empty for you to complete. Filling a form with plausible-looking values would defeat the purpose of generating from reviewed data.",
      },
      {
        q: "What formats can I download?",
        a: "PDF for issue and record, XLSX where a team maintains the document in a spreadsheet, and DOCX where a carrier, customer or authority requires a Word format. Which formats apply depends on the document type.",
      },
      {
        q: "Can I generate shipping instructions from a booking?",
        a: "Yes, and it is one of the more valuable paths. Preparing instructions from the current booking rather than from last month's file is what prevents stale vessel names, superseded consignees and old container numbers reaching a live transport document — a common and expensive failure.",
      },
      {
        q: "Will generated documents be accepted by customs or a carrier?",
        a: "A commercial invoice or packing list you complete and sign is your document and is used exactly as any other would be. A worksheet for a document you cannot issue — a Bill of Lading, air waybill or certificate of origin — is for preparation and checking, and is not itself submitted as the document.",
      },
      {
        q: "Does generation keep documents consistent with each other?",
        a: "By construction, yes: documents built from one reviewed record start out agreeing on the facts they share. That changes the review task from finding differences to confirming the intended ones, which is a materially smaller job. It does not remove the need to review.",
      },
      {
        q: "Can I generate a document without a source document?",
        a: "Yes. Every template can be completed from scratch in the browser without any source document, which is the right route when you are preparing a document for a shipment that has not generated any paperwork yet.",
      },
      {
        q: "Are generated documents stored?",
        a: "Drafts prepared from a workspace record are stored with that shipment so they can be revisited, and template forms completed in the browser are designed to keep entries local while you work. Review any finished file before sharing it with a carrier, customer, broker or authority.",
      },
      {
        q: "Can generated data be pushed to another system instead of downloaded?",
        a: "Yes. Where a downstream system takes the data rather than a file, the reviewed record can be pushed through a connector in structured form. Generation and export are two routes out of the same reviewed record.",
      },
      {
        q: "What if the target document needs different wording than the source?",
        a: "Change it — that is what the edit step is for. A goods description written to satisfy customs may need different wording under a documentary credit, and a party name may be stated differently on a transport document than on an invoice. The mapping carries facts across; deciding how to state them on the target remains yours.",
      },
    ],
    related: [
      { href: "/templates", label: "All document templates", blurb: "Complete any template from scratch without a source document." },
      { href: "/templates/shipping-instructions-template", label: "Shipping instructions template", blurb: "The most common generation target, prepared from a booking." },
      { href: "/features/shipping-document-data-extraction", label: "Document extraction", blurb: "The reviewed source data that generation reuses." },
      { href: "/features/shipping-data-export", label: "Data export", blurb: "The other route out of a reviewed record." },
    ],
  },
};
