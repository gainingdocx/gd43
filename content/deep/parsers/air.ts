import type { DeepContentMap } from "@/content/deep/types";

export const AIR_PARSER_DEEP: DeepContentMap = {
  "air-waybill-parser": {
    updated: "2026-08-04",
    keywords: [
      "air waybill OCR",
      "AWB data extraction",
      "MAWB HAWB parser",
      "extract air waybill to excel",
      "air freight document automation",
      "chargeable weight extraction",
      "airline document scanning",
    ],
    quickAnswer: {
      heading: "What an air waybill parser extracts",
      body:
        "The AWB number with its airline prefix and check digit, shipper, consignee and issuing agent, origin and destination airports, flight and routing, pieces, gross weight, chargeable weight, rate class and every charge line, plus handling information and declared values. Master and house references are recorded separately when the document labels them, and the modulus-7 check digit is validated in code.",
      bullets: [
        "MAWB check digit validated deterministically",
        "Gross and chargeable weight kept separate",
        "Charge lines extracted individually",
        "Master and house level never guessed",
      ],
    },
    sections: [
      {
        heading: "The air waybill is a rating document as much as a transport document",
        paragraphs: [
          "Unlike a Bill of Lading, an air waybill carries the commercial rating on its face: rate class, chargeable weight, rate, charge, and the split between weight charges, valuation charges and other charges due to the carrier or agent. That makes it the primary evidence in any air freight billing dispute, and it means extracting it well requires the charge structure to survive intact.",
          "It also means the weight fields matter more than on any other transport document. Gross weight and chargeable weight are different numbers doing different jobs, and collapsing them — or letting one overwrite the other — destroys the ability to check whether the shipment was rated correctly.",
        ],
      },
      {
        heading: "Field inventory",
        table: {
          caption: "Air waybill extraction",
          columns: ["Group", "Fields"],
          rows: [
            ["References", "AWB number with airline prefix, serial and check digit; master and house references where labelled; shipper's and agent's file references"],
            ["Parties", "Shipper, consignee, issuing carrier's agent with IATA code where printed, and the accounting information block"],
            ["Routing", "Airport of departure, requested routing with each leg's carrier and destination, airport of destination, flight number and date"],
            ["Cargo", "Number of pieces, RCP, gross weight and unit, rate class, commodity item number, chargeable weight, nature and quantity of goods including dimensions"],
            ["Rating", "Rate or charge, total per line, weight charge, valuation charge, tax, other charges due to carrier and due to agent, prepaid and collect totals"],
            ["Values", "Declared value for carriage, declared value for customs, amount of insurance"],
            ["Handling", "Handling information, special service requests, dangerous goods references, temperature instructions, 'Cargo Aircraft Only' notation"],
            ["Execution", "Signature of shipper or agent, signature of issuing carrier, place and date of execution"],
          ],
        },
      },
      {
        heading: "Checks applied",
        bullets: [
          "AWB number split into prefix, serial and check digit, with the modulus-7 calculation performed in code",
          "Master and house classification recorded only where the document states it, never inferred from number format",
          "Airport codes checked for three-letter IATA structure",
          "Gross weight and chargeable weight preserved as separate fields, with chargeable never below gross",
          "Charge lines recomputed and summed against printed weight-charge and total figures",
          "Prepaid and collect totals reconciled against the charge lines they represent",
          "Piece count compared against the packing list where both are grouped in one shipment",
          "Declared value fields captured distinctly, with NVD recorded as an explicit state rather than an empty value",
        ],
        callout: {
          tone: "warn",
          title: "House references are not validated with the airline formula",
          body:
            "The modulus-7 check applies to eleven-digit airline Master Air Waybill numbers. House references are assigned by forwarders from their own sequences, may contain letters and vary in length. Running the airline calculation against them produces failures that mean nothing, so house references are captured as printed and checked only for internal consistency.",
        },
      },
      {
        heading: "Reconciling an air shipment",
        paragraphs: [
          "The air waybill sits between the commercial documents and the invoice, and it is where inconsistencies between them become visible.",
        ],
        table: {
          caption: "What to compare the AWB against",
          columns: ["Compare with", "What to check"],
          rows: [
            ["Packing list", "Pieces, gross weight, dimensions — and whether the chargeable weight is reconcilable from them"],
            ["Commercial invoice", "Parties, goods description, declared value for customs"],
            ["Shipper's letter of instruction", "Every particular you instructed, including declared values and handling"],
            ["Freight invoice", "Rated weight, rate, surcharges and the charges due to carrier and agent"],
            ["House air waybills", "That the master's piece and weight totals equal the sum of the houses"],
            ["Dangerous goods declaration", "AWB reference, route, and the DG annotation on the waybill itself"],
          ],
        },
      },
      {
        heading: "Practical notes on air waybill documents",
        bullets: [
          "AWB forms are dense and frequently faxed or photocopied, so the rating block is often the least legible part of the page",
          "Handwritten amendments over printed rating are common and are captured as visible rather than resolved silently",
          "The nature and quantity of goods box frequently carries dimensions in free text, which is where chargeable weight can be reconciled from",
          "Consolidation manifests and house waybills may arrive as a stapled set — submit the whole set so the relationship survives",
          "Neutral air waybill stock used by forwarders still carries an airline prefix, so a valid check digit does not mean the airline issued it",
        ],
      },
    ],
    faqs: [
      {
        q: "Does it parse both master and house air waybills?",
        a: "Yes. Master and house references are recorded separately when the document explicitly labels them. Where the document does not state the level, it is marked unknown for human review rather than guessed — an eleven-digit reference is probably a MAWB, but forwarders are free to number house documents in an eleven-digit sequence.",
      },
      {
        q: "How is the AWB number validated?",
        a: "The eleven digits are split into the three-digit airline prefix, the seven-digit serial and the check digit, and the serial is divided by seven in deterministic code. The remainder must equal the printed check digit. House references are not subjected to this calculation because they follow no common standard.",
      },
      {
        q: "Does a valid check digit prove the shipment is genuine?",
        a: "No. The check digit is derived from the number itself, so a structurally valid AWB number can be produced in seconds. It confirms internal consistency of eleven digits and nothing about booking, tender, flight or cargo. Confirm existence through the carrier's own systems.",
      },
      {
        q: "Are gross weight and chargeable weight kept separate?",
        a: "Yes, always. They are different numbers doing different jobs — gross is what the shipment physically weighs, chargeable is the greater of gross and volumetric and is what the charges are computed on. Collapsing them makes it impossible to check whether the shipment was rated correctly, which is one of the main reasons to extract an AWB at all.",
      },
      {
        q: "Can the charges be checked against my rate?",
        a: "Charge lines are extracted individually with their rate, basis and amount, and the weight charge, valuation charge, tax and other charges due to carrier and agent are kept distinct. That puts the comparison against your contracted rate within reach; the contract itself remains the authority for whether a charge was agreed.",
      },
      {
        q: "What is captured about declared values?",
        a: "Declared value for carriage and declared value for customs are captured as separate fields, together with any amount of insurance. Where NVD — no value declared — is entered, that is recorded as an explicit state rather than as an empty field, because 'no value declared' is a deliberate choice with liability consequences, not missing data.",
      },
      {
        q: "Does it capture dangerous goods and handling information?",
        a: "Yes, as printed. Handling information, special service requests, temperature instructions, dangerous goods references and any 'Cargo Aircraft Only' notation are extracted verbatim. These are operational instructions, so they are preserved rather than normalised, and a DG reference on the AWB is checked against the dangerous goods declaration when both are grouped.",
      },
      {
        q: "Can it reconcile a consolidation?",
        a: "Yes, when the master air waybill and its house air waybills are grouped as one consignment. Piece counts and gross weights from every house document are summed and compared against the master's totals, and a house that appears on the manifest but has no document — or the reverse — is reported.",
      },
      {
        q: "Do handwritten amendments cause problems?",
        a: "They are common on air waybills and are captured as visible amendments rather than silently resolved. Where a handwritten figure overwrites a printed one, both are surfaced for review, because deciding which governs is a judgement about who made the change and when — not something a parser should decide.",
      },
      {
        q: "Can the chargeable weight be verified from the document?",
        a: "Often, yes. Dimensions are frequently printed in the nature and quantity of goods box, which allows the volumetric weight to be recomputed at the applicable divisor and compared against the printed chargeable weight. Where dimensions are absent, the packing list supplies them once both documents are grouped.",
      },
      {
        q: "What export formats are available?",
        a: "Excel with separate summary and charge-line sheets, CSV, structured JSON preserving the charge array, and a PDF review report. The charge lines are what make air freight cost analysis possible across shipments, so they are kept as rows rather than flattened.",
      },
      {
        q: "Does it work with express carrier documents?",
        a: "Integrator waybills use proprietary formats and tracking numbers rather than IATA air waybill structure, so the modulus-7 validation does not apply to them. Where an integrator document is submitted, the parties, pieces, weights and charges are still extracted; the AWB-specific checks are simply not run against a number that was never in that format.",
      },
    ],
    related: [
      { href: "/tools/air-waybill-number-check", label: "Air waybill number checker", blurb: "Validate MAWB check digits in bulk without a document." },
      { href: "/tools/chargeable-weight-calculator", label: "Chargeable weight calculator", blurb: "Recompute the rated weight from dimensions and divisor." },
      { href: "/features/mawb-hawb-reconciliation", label: "MAWB and HAWB reconciliation", blurb: "Reconcile a consolidation's house documents against the master." },
      { href: "/templates/air-waybill-template", label: "Air waybill data worksheet", blurb: "Prepare AWB particulars before tendering cargo." },
    ],
  },

  "shipper-letter-of-instruction-parser": {
    updated: "2026-08-04",
    keywords: [
      "shipper's letter of instruction parser",
      "SLI extraction air freight",
      "air export instruction document",
      "SLI to AWB check",
      "export instruction OCR",
      "forwarder instruction parsing",
      "SLI format",
    ],
    quickAnswer: {
      heading: "What an SLI parser extracts",
      body:
        "The shipper's written instruction to its forwarder or cargo agent: parties, origin and destination airports, requested flight and routing, pieces and gross weight, expected chargeable weight, declared values, handling and dangerous goods instructions, documents attached, and the signature and date. It is the baseline the issued air waybill should be checked against.",
      bullets: [
        "The instruction, not the transport document",
        "Declared values captured as instructed",
        "Handling and DG instructions preserved",
        "Compared field by field against the AWB",
      ],
    },
    sections: [
      {
        heading: "Why the SLI is worth extracting",
        paragraphs: [
          "The shipper's letter of instruction is the shipper's evidence of what it asked for. When an air waybill turns out to show the wrong consignee, the wrong declared value or a missing handling instruction, the SLI is the document that establishes whether the error originated with the shipper or with the agent.",
          "That evidential role only works if the SLI is retrievable and comparable. As a PDF in an email thread it proves nothing quickly; as a structured record sitting beside the issued air waybill, it makes the comparison a two-minute check rather than an argument.",
        ],
        callout: {
          tone: "info",
          title: "An SLI is not an air waybill",
          body:
            "It authorises the forwarder or agent to prepare and issue the air waybill on the shipper's behalf. It carries no contract of carriage, evidences no receipt of goods, and confers no rights against the airline. Its value is entirely as an instruction and as evidence of that instruction.",
        },
      },
      {
        heading: "Field inventory",
        table: {
          caption: "SLI extraction",
          columns: ["Group", "Fields"],
          rows: [
            ["References", "Instruction number and date, shipper's reference, AWB number where already assigned, booking reference"],
            ["Parties", "Shipper, consignee, notify party, issuing agent or forwarder, and any third-party billing instruction"],
            ["Routing", "Airport of departure, airport of destination, requested carrier, requested flight and date, routing preferences"],
            ["Cargo", "Pieces, package type, gross weight, dimensions, expected chargeable weight, commodity description, HS code where stated"],
            ["Values", "Declared value for carriage, declared value for customs, insurance requested"],
            ["Terms", "Freight prepaid or collect, Incoterm, charges to be borne by which party"],
            ["Handling", "Special handling requests, temperature requirements, dangerous goods information, security status claimed"],
            ["Documents", "Documents attached or to follow, export declaration reference, certificates listed"],
            ["Execution", "Authorised signatory, title, date and contact details"],
          ],
        },
      },
      {
        heading: "Checks applied",
        bullets: [
          "Airport codes checked for three-letter IATA structure",
          "AWB reference arithmetic validated where a master number is already assigned",
          "Pieces and gross weight compared against the packing list where both are grouped",
          "Expected chargeable weight recomputed from stated dimensions and compared with the figure instructed",
          "Declared value fields captured distinctly, with an absent value recorded as absent rather than as zero",
          "Signature and date presence checked, since an unsigned instruction is not an instruction",
          "SLI-to-AWB comparison of parties, routing, pieces, weights and declared values once both documents are grouped",
        ],
      },
      {
        heading: "Comparing the SLI to the issued air waybill",
        paragraphs: [
          "This is the comparison that makes the SLI worth having. Run it before the cargo departs, because an air waybill is far easier to amend before the manifest is filed than afterwards.",
        ],
        numbered: [
          "Confirm shipper, consignee and notify party match the instruction exactly, including address detail.",
          "Confirm the airports and requested routing were followed, and that any change was agreed rather than substituted.",
          "Compare pieces and gross weight, and check that chargeable weight is consistent with the dimensions instructed.",
          "Confirm declared value for carriage was entered as instructed — a default NVD where a value was instructed is a liability exposure.",
          "Confirm declared value for customs matches the commercial invoice.",
          "Confirm every handling instruction reached the handling information box, especially temperature and dangerous goods notations.",
          "Confirm freight terms and the charge allocation match what was instructed.",
        ],
      },
      {
        heading: "Ocean shipping instructions are a different document",
        paragraphs: [
          "An air SLI and an ocean shipping instruction serve the same function — a shipper telling an intermediary how to prepare the transport document — but they are not interchangeable. The air version uses airports, flight requests, air handling categories and AWB references; the ocean version uses ports, vessels, containers, VGM and B/L references.",
          "They are classified separately for that reason. A document routed to the wrong model produces fields that do not exist and misses fields that do, which is why classification happens before extraction rather than after.",
        ],
      },
    ],
    faqs: [
      {
        q: "What is a shipper's letter of instruction?",
        a: "A written instruction from the shipper to its freight forwarder or cargo agent, authorising them to prepare and issue the air waybill and handle the export. It records the parties, routing, pieces and weights, declared values, handling requirements, freight terms and documents attached, and it is signed by an authorised person.",
      },
      {
        q: "Is an SLI the same as an air waybill?",
        a: "No. The SLI is the shipper's instruction; the air waybill is the carrier's document, evidencing the contract of carriage and receipt of the goods. The SLI has no effect against the airline and confers no rights. Its value is as an instruction and, later, as evidence of what was instructed.",
      },
      {
        q: "Why extract the SLI if it is not the transport document?",
        a: "Because it is the baseline. When an air waybill shows the wrong consignee, a default declared value or a missing handling instruction, the SLI establishes whether the error originated with the shipper or the agent. As a structured record beside the AWB, that comparison takes minutes; as a PDF in an email thread it takes an afternoon.",
      },
      {
        q: "Is this the same as ocean shipping instructions?",
        a: "No, and they are classified separately. The air SLI uses airports, flight requests, air handling categories and AWB references. Ocean shipping instructions use ports, vessels, container numbers, VGM and Bill of Lading references. Routing a document to the wrong model produces missing and phantom fields, so classification precedes extraction.",
      },
      {
        q: "Can it check the SLI against the issued air waybill?",
        a: "Yes, when both are grouped as one shipment. Parties, routing, pieces, gross weight, declared values and handling instructions are compared field by field, and any divergence is reported. Running this before departure matters, because amending an air waybill after the manifest is filed is materially harder.",
      },
      {
        q: "Does it capture declared values?",
        a: "Yes, with declared value for carriage and declared value for customs kept separate, and an absent value recorded as absent rather than as zero. This distinction matters: an SLI instructing a declared value against an AWB showing NVD is a real liability exposure, and it is only visible if both documents preserve the field properly.",
      },
      {
        q: "Are dangerous goods instructions extracted?",
        a: "Yes, as printed. Where the SLI references dangerous goods, that reference is captured and checked against the dangerous goods declaration and the air waybill annotation when those documents are grouped. The parser records evidence for trained personnel; it does not assess DG compliance.",
      },
      {
        q: "Does it check whether the SLI is signed?",
        a: "Signature and date presence are checked, because an unsigned instruction is not an instruction and will not serve as evidence later. Where a signature block is empty or a date is missing, that is flagged rather than passed over.",
      },
      {
        q: "Can it create an official air waybill?",
        a: "No. Only the airline or an authorised cargo agent can issue an air waybill, on the carrier's document stock. The workspace prepares and checks the source data, and can generate an editable draft worksheet, but the official document remains the issuing party's responsibility.",
      },
      {
        q: "What if the forwarder uses its own SLI form?",
        a: "That is the normal case — SLI forms are forwarder-specific and vary considerably. Extraction maps whatever labels the form uses onto the same structured model, so instructions from different forwarders become comparable. Fields the form does not carry are recorded as absent rather than inferred.",
      },
      {
        q: "Can the SLI be used to prepare an air waybill worksheet?",
        a: "Yes. Reviewed SLI data can populate an air waybill data worksheet, so parties, routing, pieces, weights, declared values and handling instructions carry across rather than being retyped — which is also what keeps the two documents consistent.",
      },
      {
        q: "Does the parser handle SLIs sent as email text?",
        a: "Yes. Many shippers send instructions in an email body rather than on a form, and email intake accepts the message content directly. The same field model applies, with fields not stated recorded as absent so it is clear what the instruction did and did not cover.",
      },
    ],
    related: [
      { href: "/air-waybill-parser", label: "Air waybill parser", blurb: "Extract the document the instruction produces, then compare the two." },
      { href: "/templates/air-waybill-template", label: "Air waybill data worksheet", blurb: "Prepare complete AWB particulars from the instruction." },
      { href: "/tools/air-cargo-document-checklist", label: "Air cargo document checklist", blurb: "Confirm which documents the instruction should list as attached." },
      { href: "/features/air-freight-document-automation", label: "Air freight document automation", blurb: "Handle the whole air document set in one workspace." },
    ],
  },

  "dangerous-goods-declaration-parser": {
    updated: "2026-08-04",
    keywords: [
      "dangerous goods declaration parser",
      "DGD extraction air cargo",
      "IATA DGR document OCR",
      "UN number extraction",
      "shipper's declaration dangerous goods",
      "packing instruction extraction",
      "DG document check",
    ],
    quickAnswer: {
      heading: "What a DGD parser extracts",
      body:
        "The declaration's AWB reference, shipper and consignee, airports, and for each entry the UN number, proper shipping name, class and subsidiary risk, packing group, packing instruction, quantity and type of packing, and the aircraft limitation — plus the signatory, date and emergency contact. It is a structured record for trained personnel to review, not a compliance determination.",
      bullets: [
        "Per-entry UN number, class and packing group",
        "Packing instruction and aircraft limitation captured",
        "Signature, date and emergency contact checked for presence",
        "Cross-checked against the air waybill",
      ],
    },
    sections: [
      {
        heading: "What this parser is and is not",
        paragraphs: [
          "Air transport of dangerous goods is governed by the ICAO Technical Instructions, implemented commercially through the IATA Dangerous Goods Regulations. Acceptance is performed by trained personnel working through a formal acceptance checklist, and the consequences of getting it wrong are safety consequences rather than commercial ones.",
          "This parser extracts the printed evidence on a declaration into a structured, reviewable record and runs structural and cross-document checks. It is a pre-check that helps trained people find missing or conflicting data faster. It does not classify dangerous goods, does not determine whether a packing instruction is correct for the substance, and does not replace acceptance review by qualified personnel.",
        ],
        callout: {
          tone: "warn",
          title: "Not a substitute for DGR acceptance review",
          body:
            "No automated tool should be treated as certifying dangerous goods compliance. Classification, packing, marking, labelling, quantity limits, state and operator variations and acceptance all require trained personnel working to the current regulations. Use this to catch missing and contradictory data before that review, not instead of it.",
        },
      },
      {
        heading: "Field inventory",
        table: {
          caption: "Dangerous goods declaration extraction",
          columns: ["Group", "Fields"],
          rows: [
            ["References", "Air waybill number, declaration reference, page numbering where the declaration runs to several pages"],
            ["Parties", "Shipper, consignee, and the airport of departure and destination"],
            ["Transport detail", "Aircraft limitation — passenger and cargo aircraft, or cargo aircraft only — and shipment type"],
            ["Per entry", "UN or ID number, proper shipping name, class or division, subsidiary risk, packing group, quantity and type of packing, packing instruction, authorisation reference"],
            ["Handling", "Additional handling information, overpack indications, all-packed-in-one statements"],
            ["Emergency", "Emergency contact name and telephone number"],
            ["Execution", "Name and title of signatory, place and date, signature presence"],
          ],
        },
      },
      {
        heading: "Structural and cross-document checks",
        paragraphs: [
          "The checks are deliberately narrow: presence, structure and consistency. They do not attempt to evaluate whether a classification is correct, because that requires the substance, the regulations and a trained assessor.",
        ],
        bullets: [
          "UN number checked for four-digit structure and the presence of a proper shipping name alongside it",
          "Hazard class or division checked against the valid set of class identifiers",
          "Packing group checked for a valid value where the entry requires one",
          "Aircraft limitation captured, with a 'Cargo Aircraft Only' indication surfaced prominently",
          "A printed forbidden indication raised as a stop-level finding for specialist review",
          "Emergency contact presence checked, since its absence is a routine acceptance failure",
          "Signature, name, title, place and date presence checked",
          "AWB reference on the declaration matched against the air waybill, including route consistency",
          "Dangerous goods annotation on the AWB checked for presence when a declaration is grouped with it",
        ],
      },
      {
        heading: "Where declarations fail acceptance",
        paragraphs: [
          "Handling agents refuse dangerous goods consignments for a narrow and predictable set of reasons. Most are documentary and most would be caught by a careful read — which is exactly what a structured pre-check makes faster.",
        ],
        bullets: [
          "Missing or unsigned declaration, or a signatory whose training reference is absent or expired",
          "Emergency contact number missing, or a number that will not be answered for the duration of transport",
          "Packing instruction inconsistent with the quantity or packaging described",
          "Quantity exceeding the limit for the aircraft type indicated",
          "Proper shipping name that does not correspond to the UN number given",
          "Subsidiary risk omitted where the entry requires it",
          "Air waybill not annotated to reference the declaration",
          "Aircraft limitation on the declaration inconsistent with the AWB annotation",
          "Overpack used without the required overpack statement and markings",
          "State or operator variation not accounted for on the origin, transit or destination",
        ],
      },
      {
        heading: "Using the extracted record",
        numbered: [
          "Submit the whole declaration including continuation pages, since multi-entry declarations frequently run over.",
          "Review the stop-level findings first — forbidden indications and missing signatures block acceptance outright.",
          "Confirm every entry has a UN number, proper shipping name, class, packing group where required, and packing instruction.",
          "Check the aircraft limitation against the intended routing and confirm the AWB carries the matching annotation.",
          "Confirm the emergency contact will actually be reachable throughout transport, not just during office hours.",
          "Hand the reviewed record to qualified dangerous goods personnel for the acceptance check that the regulations require.",
        ],
      },
    ],
    faqs: [
      {
        q: "Does this certify dangerous goods compliance?",
        a: "No, and it must not be used that way. It extracts the printed evidence on a declaration into a structured record and runs structural and consistency checks. Classification, packing, marking, labelling, quantity limits, variations and acceptance all require trained personnel working to the current ICAO Technical Instructions and IATA Dangerous Goods Regulations.",
      },
      {
        q: "What data is extracted from a dangerous goods declaration?",
        a: "The air waybill reference, shipper and consignee, airports, aircraft limitation, and for each entry the UN or ID number, proper shipping name, class or division, subsidiary risk, packing group, quantity and type of packing, packing instruction and any authorisation — plus the emergency contact, signatory name and title, place and date.",
      },
      {
        q: "Will forbidden cargo be flagged?",
        a: "Yes. A printed forbidden aircraft limitation is raised as a stop-level finding requiring specialist review rather than being recorded as an ordinary field value. The same applies to a 'Cargo Aircraft Only' indication, which is surfaced prominently because it constrains the routing.",
      },
      {
        q: "Does it check that the packing instruction is correct?",
        a: "No. Whether a packing instruction is correct for a given substance, quantity and packaging is a regulatory determination requiring the current regulations and a trained assessor. The parser checks that a packing instruction is present and captures it, and flags internal inconsistencies it can detect structurally.",
      },
      {
        q: "Is the UN number validated?",
        a: "Structurally — four digits with a proper shipping name alongside. Whether that UN number is the correct classification for the substance being shipped is not something a document parser can determine, and treating structural validity as classification validity would be dangerous. The check catches typographical and omission errors, nothing more.",
      },
      {
        q: "Does it check the declaration against the air waybill?",
        a: "Yes, when both are grouped. The AWB reference on the declaration is matched, the route is compared, and the presence of a dangerous goods annotation on the air waybill is checked. A declaration whose AWB reference does not match, or an AWB carrying no DG annotation where a declaration exists, is reported.",
      },
      {
        q: "What about the emergency contact number?",
        a: "Its presence is checked, because a missing emergency contact is a routine acceptance failure. What the parser cannot check is whether the number will actually be answered for the duration of transport, which is the substantive requirement — that remains a human confirmation.",
      },
      {
        q: "Can it handle multi-entry declarations?",
        a: "Yes. Each dangerous goods entry is extracted as its own structured row with its UN number, name, class, packing group, quantity and packing instruction, and multi-page declarations with continuation sheets are reassembled. Submit the whole set, because entries frequently run across a page break.",
      },
      {
        q: "Does it handle IMDG declarations for sea freight?",
        a: "This parser is built for the air dangerous goods declaration used under the IATA Dangerous Goods Regulations. Sea transport uses the IMDG Code with a different declaration format and different requirements. A sea DG declaration submitted here would be classified as a different document type rather than forced into the air model.",
      },
      {
        q: "Is the signatory's training verified?",
        a: "No. The parser captures the signatory's name, title, place and date and checks their presence. Whether that person holds current dangerous goods training is verified through training records held by the shipper and checked at acceptance — it is not something printed on the declaration in a machine-verifiable form.",
      },
      {
        q: "What are state and operator variations?",
        a: "Additional restrictions imposed by individual states or by individual airlines, over and above the base regulations. They can prohibit substances that are otherwise acceptable, or impose stricter quantity limits. They vary by origin, transit and destination and change regularly, which is why they must be checked against current sources for the specific routing rather than assumed.",
      },
      {
        q: "How should this fit into a DG workflow?",
        a: "As a pre-check. Extract and review the structured record to catch missing signatures, absent emergency contacts, incomplete entries and AWB inconsistencies before the consignment reaches acceptance — where those same failures cost a flight. Then hand the reviewed record to qualified personnel for the acceptance check the regulations require.",
      },
    ],
    related: [
      { href: "/features/air-dangerous-goods-readiness", label: "Air dangerous goods readiness", blurb: "Check DG evidence against the air waybill and packing before tender." },
      { href: "/tools/air-cargo-document-checklist", label: "Air cargo document checklist", blurb: "Assemble the full DG document set before booking." },
      { href: "/air-waybill-parser", label: "Air waybill parser", blurb: "Extract the AWB the declaration must be referenced on." },
      { href: "/accuracy-and-limitations", label: "Accuracy and limitations", blurb: "What the extraction and validation layers do and do not establish." },
    ],
  },

  "air-cargo-manifest-parser": {
    updated: "2026-08-04",
    keywords: [
      "air cargo manifest parser",
      "consolidation manifest extraction",
      "house manifest OCR",
      "MAWB HAWB reconciliation",
      "flight manifest data",
      "air consolidation totals",
      "cargo manifest automation",
    ],
    quickAnswer: {
      heading: "What an air cargo manifest parser extracts",
      body:
        "The manifest number, airline, flight and date, origin and destination airports, the master air waybill it covers, and every house air waybill listed with its shipper, consignee, pieces, weight and description. Manifest totals are recomputed from the rows and compared against the master's declared pieces and weight.",
      bullets: [
        "Every house waybill row extracted individually",
        "Totals recomputed, not trusted",
        "Reconciled against the MAWB",
        "Missing and orphan references reported",
      ],
    },
    sections: [
      {
        heading: "The manifest is where a consolidation reconciles or does not",
        paragraphs: [
          "A consolidation works only if three things agree: the master air waybill's declared pieces and weight, the manifest listing the house shipments, and the house air waybills themselves. When they disagree, the difference is either a document that was not manifested, a shipment that did not travel, or a weight that was restated somewhere along the chain.",
          "Reconciling that by hand across forty house waybills is exactly the kind of task that gets skipped when a flight is closing. Extracting the manifest as structured rows makes the arithmetic automatic and turns the reconciliation into a list of exceptions rather than a full recount.",
        ],
      },
      {
        heading: "Field inventory",
        table: {
          caption: "Air cargo manifest extraction",
          columns: ["Group", "Fields"],
          rows: [
            ["Manifest", "Manifest number, issue date, issuing agent or airline, page numbering"],
            ["Flight", "Airline, flight number, flight date, aircraft registration where shown"],
            ["Route", "Airport of departure, airport of destination, transit points where listed"],
            ["Master reference", "Master air waybill number, and the consolidation identifier where separate"],
            ["House rows", "House air waybill number, shipper, consignee, destination, pieces, gross weight, chargeable weight where shown, nature of goods, special handling codes"],
            ["Totals", "Total shipments, total pieces, total gross weight, and any declared volume"],
          ],
        },
      },
      {
        heading: "Checks applied",
        bullets: [
          "House row pieces summed and compared against the printed manifest total",
          "House row gross weights summed and compared against the printed total",
          "Manifest totals compared against the master air waybill's declared pieces and gross weight",
          "Master air waybill number validated with the modulus-7 check digit",
          "Airport codes checked for three-letter IATA structure",
          "Manifest route compared against the master air waybill routing",
          "House references present on the manifest but with no corresponding document reported, and the reverse",
          "Duplicate house references within one manifest flagged",
        ],
        callout: {
          tone: "check",
          title: "Weight differences are rarely rounding",
          body:
            "A manifest total that differs from the master by a few kilograms is usually rounding across many house rows. A difference of tens or hundreds of kilograms is usually a house shipment that was added, removed or restated after the manifest was produced — and that is worth finding before the flight rather than at destination when the entries do not clear.",
        },
      },
      {
        heading: "Reconciling a consolidation",
        numbered: [
          "Extract the manifest and confirm the master air waybill reference and route match the MAWB itself.",
          "Check the row count against the number of house air waybills you hold.",
          "Compare the recomputed pieces and weight totals against both the printed manifest totals and the master's declared figures.",
          "Investigate every house reference that appears on one side but not the other.",
          "Where totals differ, work down the rows rather than adjusting the total — the difference is almost always one or two rows, not spread evenly.",
          "Confirm special handling codes on the manifest are reflected on the corresponding house documents and on the master.",
          "Export the reconciled set so the consolidation has an auditable record.",
        ],
      },
      {
        heading: "Practical notes",
        bullets: [
          "Manifests are frequently long, printed at small type and reproduced several times before they reach you — submit the cleanest copy available",
          "Continuation pages are the norm rather than the exception; submit the whole set or the totals will not reconcile",
          "House reference formats vary by forwarder and are captured as printed rather than normalised",
          "A manifest is an operational document, not a customs filing — it does not transmit anything to an airline or authority",
          "Special handling codes are preserved verbatim because their interpretation is operational and jurisdiction-specific",
        ],
      },
    ],
    faqs: [
      {
        q: "What is an air cargo manifest?",
        a: "A document listing every shipment carried under a consolidation or on a flight, with each house air waybill's shipper, consignee, pieces, weight and description, together with the totals. It is the operational record that links the master air waybill to the individual shipments travelling under it.",
      },
      {
        q: "Can it process a manifest containing many house air waybills?",
        a: "Yes. Every house row is extracted as a structured record with its own reference, parties, pieces and weight, and multi-page manifests with continuation sheets are reassembled. Submit the whole set — a manifest missing its continuation pages will not reconcile against the master.",
      },
      {
        q: "Are the totals checked?",
        a: "Yes. Pieces and gross weights are summed from the house rows and compared against the printed manifest totals, and those totals are then compared against the master air waybill's declared pieces and weight. Both comparisons matter, because a manifest can be internally consistent and still disagree with the MAWB.",
      },
      {
        q: "What does a weight difference between manifest and MAWB mean?",
        a: "A few kilograms is usually rounding accumulated across many house rows. Tens or hundreds of kilograms usually means a house shipment was added, removed or restated after the manifest was produced. It is worth resolving before the flight, because a mismatch typically surfaces at destination when house entries fail to clear against the manifested totals.",
      },
      {
        q: "Does it identify missing house air waybills?",
        a: "Yes. House references listed on the manifest with no corresponding document in the shipment record are reported, and so is the reverse — a house document you hold that does not appear on the manifest. Both are real problems, and they have different causes.",
      },
      {
        q: "Is the master air waybill number validated?",
        a: "Yes, with the modulus-7 check digit calculation, split into prefix, serial and check digit. House references are captured as printed and checked for duplication within the manifest, but not put through the airline formula, because forwarder-assigned house numbers follow no common standard.",
      },
      {
        q: "Does it transmit the manifest to an airline or customs system?",
        a: "No. Current functionality extracts, checks and exports reviewed data. It does not file, transmit or lodge anything with an airline, ground handler or customs authority. Manifest transmission is a separate regulated process with its own channels.",
      },
      {
        q: "Can it check special handling codes?",
        a: "Codes are captured verbatim and compared for presence across the manifest, the master air waybill and the house documents when those are grouped. Their interpretation is operational and jurisdiction-specific, so they are preserved as printed rather than translated or expanded, which would risk changing their meaning.",
      },
      {
        q: "What if the manifest is a poor-quality copy?",
        a: "Manifests are frequently printed small and reproduced several times before reaching you, which is the hardest case for any extraction. Rows that cannot be read confidently are surfaced for review rather than filled in, and the recomputed totals will show the gap — which is itself a useful signal that a row was not read.",
      },
      {
        q: "Does it work for co-load and back-to-back consolidations?",
        a: "The same field model applies. Where a consolidation involves a co-loader, the manifest may reference another forwarder's house numbers, and those are captured as printed. The reconciliation logic — rows against totals, totals against master — is unchanged regardless of who assigned the house references.",
      },
      {
        q: "Can I export the house rows for analysis?",
        a: "Yes. Rows export to Excel or CSV with each house shipment as a record, and to structured JSON preserving the array. This is what makes consolidation-level analysis possible — average shipment size, weight utilisation against the master, and which lanes consistently under-fill.",
      },
      {
        q: "How does this help at destination?",
        a: "Destination customs entries are generally filed at house level against the manifested consignment. A manifest reconciled at origin means the house entries at destination will match the manifested pieces and weight, which removes one of the more common causes of clearance delays on consolidated air freight.",
      },
    ],
    related: [
      { href: "/features/mawb-hawb-reconciliation", label: "MAWB and HAWB reconciliation", blurb: "Reconcile house documents against the master consignment automatically." },
      { href: "/air-waybill-parser", label: "Air waybill parser", blurb: "Extract the master and house documents the manifest lists." },
      { href: "/tools/air-waybill-number-check", label: "Air waybill number checker", blurb: "Validate master air waybill numbers in bulk." },
      { href: "/features/air-freight-document-automation", label: "Air freight document automation", blurb: "Handle consolidations end to end in one workspace." },
    ],
  },

  "cargo-security-declaration-parser": {
    updated: "2026-08-04",
    keywords: [
      "cargo security declaration parser",
      "consignment security declaration",
      "air cargo security status",
      "known consignor documentation",
      "regulated agent declaration",
      "screening method record",
      "secure supply chain evidence",
    ],
    quickAnswer: {
      heading: "What a security declaration parser extracts",
      body:
        "The declaration and air waybill references, the regulated agent or issuing party, the security status claimed, the screening method applied where cargo was screened, the issuer, date and time, and the pieces and gross weight covered. Printed codes are preserved exactly as written, because their meaning is jurisdiction-specific and interpreting them would change it.",
      bullets: [
        "Security status and screening method captured verbatim",
        "AWB reference matched and pieces reconciled",
        "Issuer and timestamp recorded as evidence",
        "No authorisation is verified or granted",
      ],
    },
    sections: [
      {
        heading: "What the document does and what this parser does",
        paragraphs: [
          "Air cargo entering the secure supply chain must carry a known security status before it can be loaded. That status comes from the shipper's own accreditation as a known or account consignor, from screening performed by a regulated agent, or from another approved method — and it must be documented, with an unbroken chain of custody from the point security was applied.",
          "This parser extracts what the declaration states into a structured record and checks it against the air waybill. It does not verify that a regulated agent holds a current authorisation, does not confirm that a screening method was appropriate, and does not grant or authenticate security status. Those are matters for the responsible authority and the approved systems that hold the authorisation data.",
        ],
        callout: {
          tone: "warn",
          title: "Security status cannot be applied retrospectively",
          body:
            "Once the chain of custody is broken, the status is gone and the cargo must be secured or screened again. This is why a declaration with a missing issuer, an implausible timestamp or a broken reference to the air waybill is worth catching immediately rather than at acceptance — by then the practical options have narrowed to rescreening.",
        },
      },
      {
        heading: "Field inventory",
        table: {
          caption: "Security declaration extraction",
          columns: ["Group", "Fields"],
          rows: [
            ["References", "Declaration reference, air waybill number, house references where the declaration covers house shipments"],
            ["Issuing party", "Regulated agent or issuing entity, its identifier as printed, and the responsible person named"],
            ["Status", "Security status claimed, and the grounds stated for it"],
            ["Screening", "Screening method or methods applied, and any exemption cited"],
            ["Consignment", "Pieces, gross weight, package type, and the description covered by the declaration"],
            ["Chain of custody", "Point at which security was applied, sealing or tamper-evidence references, receiving party"],
            ["Execution", "Issue date and time, place, and signature or authentication evidence"],
          ],
        },
      },
      {
        heading: "Checks applied",
        bullets: [
          "Required evidence presence: status, method or grounds, issuer, date and time",
          "Air waybill reference matched against the AWB, with the modulus-7 check digit validated where the reference is a master number",
          "Pieces and gross weight compared against the air waybill and packing list where those are grouped",
          "Issue timestamp checked for plausibility against the air waybill execution and flight date",
          "Printed status and method codes preserved verbatim rather than interpreted",
          "A declaration covering fewer pieces than the air waybill declares reported as a coverage gap",
          "Missing issuer identifier or unsigned declaration flagged as an evidence failure",
        ],
      },
      {
        heading: "Why codes are preserved rather than interpreted",
        paragraphs: [
          "Security status and screening method codes look like a small controlled vocabulary, and they are — but a different one in each jurisdiction, revised on its own schedule, with codes that occasionally look identical while meaning different things.",
          "Expanding a code into a description would mean asserting an interpretation the parser cannot guarantee, in a domain where a wrong interpretation has safety consequences. The codes are therefore captured exactly as printed and presented to trained operational personnel, who read them against the regime that actually applies to the routing.",
        ],
      },
      {
        heading: "Fitting security evidence into an air workflow",
        numbered: [
          "Confirm the security status was applied before the cargo left the secured area, not after — the timestamp is the evidence.",
          "Match the declaration to the air waybill by reference and confirm the pieces and weight covered match the consignment.",
          "Confirm the issuing party is one you can evidence as authorised, through the responsible authority or approved system.",
          "Check that any tamper-evident sealing referenced on the declaration matches what is physically on the cargo.",
          "Where the declaration covers a consolidation, confirm every house shipment is within its coverage.",
          "Retain the declaration with the shipment record, since security evidence is routinely requested after the fact.",
        ],
      },
    ],
    faqs: [
      {
        q: "What is a cargo security declaration?",
        a: "A record of the security status of air cargo and how that status was achieved — whether the cargo was secured by an accredited consignor, screened by a regulated agent, or handled under another approved method — together with the issuing party, the time it was applied and the consignment it covers. The exact form and name vary by jurisdiction.",
      },
      {
        q: "Does the parser verify a regulated agent authorisation?",
        a: "No. It extracts the printed evidence, including the agent's identifier as written. Whether that agent holds a current authorisation must be confirmed with the responsible authority or through the approved system that holds authorisation data. A parser cannot and should not assert regulatory status.",
      },
      {
        q: "Are security codes interpreted automatically?",
        a: "No, deliberately. Status and screening method codes are jurisdiction-specific, revised independently, and occasionally identical across regimes while meaning different things. Expanding them would mean asserting an interpretation the parser cannot guarantee in a domain where errors have safety consequences, so they are preserved exactly as printed for trained review.",
      },
      {
        q: "What data is extracted?",
        a: "The declaration and air waybill references, the regulated agent or issuing entity and its identifier, the security status claimed and the grounds stated, the screening method applied or exemption cited, pieces and gross weight covered, chain-of-custody and sealing references, and the issue date, time, place and signature evidence.",
      },
      {
        q: "Does it check the declaration against the air waybill?",
        a: "Yes, when both are grouped. The AWB reference is matched with its check digit validated, and the pieces and gross weight covered by the declaration are compared against those on the air waybill. A declaration covering fewer pieces than the consignment contains is reported as a coverage gap.",
      },
      {
        q: "Why does the timestamp matter?",
        a: "Because security status cannot be applied retrospectively. Once the chain of custody is broken, the status is lost and the cargo must be secured or screened again. A declaration issued after the cargo left the secured area, or bearing a timestamp inconsistent with the air waybill and flight, is a genuine problem rather than a clerical one.",
      },
      {
        q: "Can it tell me whether cargo is compliant?",
        a: "No. It records what the declaration states and checks it for internal completeness and consistency with the air waybill. Whether a consignment meets the security requirements applicable to its routing is a determination for trained personnel working to the regime in force at origin, transit and destination.",
      },
      {
        q: "Does it handle declarations covering consolidations?",
        a: "Yes. Where a declaration references house shipments, those references are captured and can be checked against the house documents and the manifest when they are grouped. A house shipment inside the consolidation that falls outside the declaration's coverage is reported.",
      },
      {
        q: "What if the declaration is unsigned or missing an issuer?",
        a: "Both are flagged as evidence failures rather than as missing optional fields. A security declaration without an identifiable issuer and an authentication is not evidence of anything, and it will not survive an acceptance check or a later audit.",
      },
      {
        q: "Are security requirements the same in every country?",
        a: "No. Regimes differ by jurisdiction in their terminology, their accepted screening methods, their accreditation schemes and their documentation requirements, and cargo transiting a third country may face that country's requirements as well. Requirements for the specific routing must be confirmed with the forwarder, the operating carrier and the relevant authority.",
      },
      {
        q: "Should the security declaration be retained after the flight?",
        a: "Yes. Security evidence is routinely requested after the fact, in audits and investigations that can occur long after the consignment moved. Keeping the declaration attached to the shipment record — rather than in an email folder — is what makes producing it straightforward when it is asked for.",
      },
      {
        q: "Does this replace an acceptance check?",
        a: "No. It is a pre-check that makes missing and inconsistent evidence visible before the consignment reaches acceptance, where the same failures cost a flight. The acceptance check itself is performed by trained personnel against the applicable regulations, and nothing here substitutes for it.",
      },
    ],
    related: [
      { href: "/tools/air-cargo-document-checklist", label: "Air cargo document checklist", blurb: "Confirm which security evidence your scenario actually requires." },
      { href: "/air-waybill-parser", label: "Air waybill parser", blurb: "Extract the AWB the declaration is matched against." },
      { href: "/features/air-freight-document-automation", label: "Air freight document automation", blurb: "Keep security evidence attached to the shipment record." },
      { href: "/security", label: "Security and data handling", blurb: "How GainingDocx stores and protects the documents you upload." },
    ],
  },
};
