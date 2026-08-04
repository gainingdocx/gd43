import type { DeepContentMap } from "@/content/deep/types";

export const TRANSPORT_TEMPLATE_DEEP: DeepContentMap = {
  "bill-of-lading-template": {
    updated: "2026-08-04",
    keywords: [
      "bill of lading template",
      "free bill of lading form",
      "B/L data worksheet",
      "shipping instructions bill of lading",
      "bill of lading fields explained",
      "negotiable bill of lading",
      "telex release",
    ],
    quickAnswer: {
      heading: "What this worksheet is for",
      body:
        "This is a data worksheet, not a Bill of Lading. Only a carrier, NVOCC or authorised agent can issue a B/L, because the document is simultaneously a receipt for the goods, evidence of the contract of carriage and — when negotiable — a document of title. Use the worksheet to assemble complete, consistent particulars for submission as shipping instructions, and to check the carrier's draft before it is released.",
      bullets: [
        "Prepare shipping instructions accurately the first time",
        "Check a carrier draft field by field",
        "Keep B/L, invoice and packing list in agreement",
        "Download PDF, XLSX or DOCX for internal use",
      ],
    },
    sections: [
      {
        heading: "What a Bill of Lading actually does",
        paragraphs: [
          "A Bill of Lading performs three jobs at once, and confusion between them causes most of the trouble people have with it. It is a receipt confirming the carrier took the goods in the stated apparent order and condition. It is evidence of the contract of carriage between the shipper and the carrier. And where it is issued in negotiable form, it is a document of title — whoever lawfully holds the endorsed original can claim the cargo.",
          "That third function is why a B/L cannot be treated as an ordinary form. A negotiable original is worth the cargo it represents. Losing one, releasing cargo without one, or issuing more originals than intended are all serious events with financial and legal consequences, which is exactly why issuance is restricted to the carrier and its authorised agents.",
        ],
        callout: {
          tone: "warn",
          title: "This worksheet is not a transport document",
          body:
            "Completing it does not create a contract of carriage, does not evidence receipt of goods and confers no title. It exists so that the particulars you submit to the carrier are complete and internally consistent, and so that the draft you receive back can be checked systematically rather than skimmed.",
        },
      },
      {
        heading: "Field-by-field: what each box has to contain",
        paragraphs: [
          "Most B/L errors are not exotic — they are the same handful of fields, filled in from stale master data or copied from the previous shipment. Working through them deliberately once is faster than amending afterwards.",
        ],
        subsections: [
          {
            heading: "Parties",
            paragraphs: [
              "Use full legal names and registered addresses, matching the commercial invoice exactly. Abbreviations, trading names and 'c/o' addresses cause customs queries at destination and letter-of-credit discrepancies where a documentary credit governs payment.",
              "The consignee box determines who can claim the cargo, and its wording is a commercial decision, not a formatting one. A named consignee produces a straight, non-negotiable document. 'To order' or 'to order of shipper' produces a negotiable document requiring endorsement. 'To order of [bank]' puts the bank in control, which is what a documentary credit normally requires. Never silently normalise 'to order' to a named party — it changes who controls the goods.",
            ],
            bullets: [
              "Shipper: full legal name, address and, where required, tax or registration identifier",
              "Consignee: exact wording, including 'to order' or 'to order of' constructions",
              "Notify party: who receives the arrival notice, often the consignee's broker",
              "Second notify party where the buyer or bank requires one",
            ],
          },
          {
            heading: "Routing",
            paragraphs: [
              "Four separate place fields exist, and they are not synonyms. Place of receipt is where the carrier took custody, which on a door-to-door movement is inland. Port of loading is where the cargo went on the vessel. Port of discharge is where it comes off. Place of delivery is where the carrier's responsibility ends. On a port-to-port shipment the first and last may be blank; on a multimodal shipment all four differ and each has legal consequence.",
              "Record UN/LOCODEs alongside the names. Place names are duplicated within and across countries, transliterated inconsistently, and printed with and without diacritics; the five-character code removes all of that ambiguity.",
            ],
          },
          {
            heading: "Equipment and cargo",
            paragraphs: [
              "Every container needs its number, seal number, size and type, and the packages, gross weight and measurement attributed to it. Container numbers should be check-digit validated before submission, because a transposed digit here disconnects the shipment from the carrier's manifest and from every downstream customs filing.",
              "The goods description is the carrier's statement of what it received, made on the shipper's information. Keep it specific enough for customs — 'general merchandise', 'spare parts' and 'samples' invite examination — and consistent with the commercial invoice. Where a documentary credit governs, the description must match the credit's wording, which is frequently stricter than what customs needs.",
            ],
          },
          {
            heading: "Terms, dates and originals",
            paragraphs: [
              "Freight prepaid or collect follows from the Incoterm agreed in the sale contract, and a mismatch between the two is a genuine commercial exposure rather than a clerical slip. The shipped-on-board date is the date the goods were loaded and is the date a documentary credit cares about; the issue date may differ.",
              "The number of originals matters. A full set is conventionally three, and all three represent the same cargo — presenting any one of them entitles the holder to delivery, after which the others are void. Requesting more originals than you need multiplies the risk of one going astray.",
            ],
          },
        ],
      },
      {
        heading: "Original, sea waybill, telex release or express",
        paragraphs: [
          "Deciding how the cargo will be released is a decision to make before the document is issued, not after the vessel sails. Each option trades control against speed, and each fails differently.",
        ],
        table: {
          caption: "Release methods compared",
          columns: ["Method", "Document of title", "How cargo is released", "Use when"],
          rows: [
            ["Original negotiable B/L", "Yes", "Surrender of one original, endorsed as required", "Payment is not secured, or a documentary credit requires it"],
            ["Original straight B/L", "Generally no", "Delivery to the named consignee on identification", "The consignee is fixed and payment is secured"],
            ["Sea waybill", "No", "Consignee identifies itself; no document surrendered", "Trusted counterparties, intercompany moves, short sea legs"],
            ["Telex release", "Originals surrendered at origin", "Carrier's origin office authorises destination release", "Originals cannot reach destination in time"],
            ["Express release", "No originals issued", "Release to the named consignee on arrival", "Payment already received and speed matters"],
          ],
          note: "Once originals have been issued, switching to express release requires all originals to be returned to the carrier. Decide before issuance.",
        },
        callout: {
          tone: "info",
          title: "The short-sea problem",
          body:
            "On routes shorter than the courier transit for the documents, cargo routinely arrives before its originals. That is what telex release and sea waybills exist to solve. Planning the release method around the transit time — rather than discovering the problem at destination with demurrage accruing — is one of the most reliable savings available in ocean freight.",
        },
      },
      {
        heading: "Checking a carrier draft before it is released",
        paragraphs: [
          "The window between receiving the draft and the carrier releasing the final document is where errors are cheap to fix. After release, corrections require a formal amendment, frequently a fee, and sometimes the surrender and reissue of the whole set.",
        ],
        numbered: [
          "Compare party names and addresses character by character against the commercial invoice, not against memory.",
          "Confirm the consignee wording is exactly what the sale terms or the documentary credit require, including any 'to order of' construction.",
          "Check all four routing fields and their UN/LOCODEs against the booking confirmation.",
          "Validate every container number's check digit and confirm the seal numbers against the stuffing record.",
          "Reconcile package count, gross weight and measurement against the packing list, and confirm any printed total equals the sum of its lines.",
          "Confirm the goods description matches the invoice, and matches the credit wording where one applies.",
          "Check freight terms against the agreed Incoterm, and the shipped-on-board date against the actual loading.",
          "Confirm the number of originals and the release method are what you instructed.",
          "Check for any clause the carrier has added — a claused or 'unclean' B/L noting damage or shortage will usually be rejected under a documentary credit.",
        ],
      },
      {
        heading: "Common problems and how they get resolved",
        table: {
          caption: "Recurring B/L issues",
          columns: ["Problem", "Consequence", "Resolution"],
          rows: [
            ["Consignee named where 'to order' was required", "Bank cannot control the goods; credit discrepancy", "Carrier amendment before release, or reissue"],
            ["Container number transposed", "Manifest mismatch, customs hold, failed tracking", "Amendment; validate check digits before submission"],
            ["Weight disagrees with packing list", "Customs query and possible examination", "Correct the source document, then amend"],
            ["Description too generic", "Examination, classification dispute", "Specific description agreed with the broker"],
            ["Shipped-on-board date after credit latest shipment date", "Credit discrepancy; payment at buyer's discretion", "Cannot be back-dated; requires amendment to the credit"],
            ["Original lost in transit", "Cargo cannot be released against that set", "Letter of indemnity, usually bank-countersigned, at significant cost"],
            ["Claused B/L noting damage", "Rejected under most documentary credits", "Repack and re-tender, or seek buyer's waiver"],
          ],
        },
      },
    ],
    faqs: [
      {
        q: "Can I issue my own Bill of Lading with this template?",
        a: "No. A Bill of Lading is issued by the carrier, NVOCC or an authorised agent, because it evidences the carrier's receipt of goods and its contract of carriage — statements only the carrier can make. This worksheet assembles the particulars you submit to the carrier and lets you check the draft it returns.",
      },
      {
        q: "What is the difference between a negotiable and a straight Bill of Lading?",
        a: "A negotiable B/L is consigned 'to order' or 'to order of' a party and functions as a document of title: whoever lawfully holds the properly endorsed original can claim the cargo, and the document can be transferred by endorsement. A straight B/L names a specific consignee and is generally not transferable — delivery is made to that named party. The distinction is set entirely by the wording in the consignee box.",
      },
      {
        q: "How many original Bills of Lading are issued?",
        a: "Conventionally three, described as a full set of 3/3, though the number is stated on the document and can differ. All originals represent the same cargo: presenting any one entitles the holder to delivery, after which the others are void. Requesting more originals than you actually need increases the risk of one being lost or misused.",
      },
      {
        q: "What is a telex release?",
        a: "An arrangement where the shipper surrenders all originals to the carrier at origin, and the carrier's origin office authorises its destination office to release the cargo without an original being presented there. It solves the common problem of cargo arriving before the documents on short routes. It is not a document type — the B/L is still an original B/L; only the release mechanism has changed.",
      },
      {
        q: "What does 'to order' mean in the consignee box?",
        a: "That the B/L is negotiable and cargo will be released to whoever holds the properly endorsed original. 'To order of shipper' means the shipper controls release and must endorse the document to transfer it. 'To order of [bank]' puts the bank in control, which is what a documentary credit normally requires. Replacing any of these with a named consignee changes who controls the goods and should never be done without instruction.",
      },
      {
        q: "What is the difference between a Bill of Lading and a sea waybill?",
        a: "A sea waybill is a receipt and evidence of contract but is not a document of title. The named consignee takes delivery by identifying itself, with no document to surrender, which removes the risk of cargo waiting for paperwork. The trade-off is control: the shipper cannot use the document to withhold the goods, so a sea waybill suits trusted counterparties and intercompany moves rather than transactions where payment is unsecured.",
      },
      {
        q: "What makes a Bill of Lading 'clean'?",
        a: "The absence of any clause noting defective condition or packaging of the goods at the time the carrier received them. A B/L annotated with damage, shortage, staining or inadequate packing is 'claused' or 'unclean', and most documentary credits require a clean document — so a clause can prevent payment even when the underlying commercial deal is sound.",
      },
      {
        q: "What is the difference between the shipped-on-board date and the issue date?",
        a: "The shipped-on-board date is when the goods were actually loaded onto the vessel; the issue date is when the document was created. They are often the same but need not be, and where they differ it is the on-board date that documentary credits, insurance and many contractual deadlines key to. A B/L that only evidences receipt for shipment, without an on-board notation, is a materially weaker document.",
      },
      {
        q: "Can a Bill of Lading be amended after issue?",
        a: "Yes, but through the carrier and usually for a fee, and often only if the originals are returned. Some changes are straightforward before the vessel sails; changes after arrival, changes to the consignee on a negotiable document, and anything affecting the manifest can be difficult or refused outright. Checking the draft carefully is far cheaper than amending the original.",
      },
      {
        q: "What happens if an original Bill of Lading is lost?",
        a: "The carrier will not release cargo without one, and the usual remedy is a letter of indemnity — frequently required to be countersigned by a bank and secured for a multiple of the cargo value. It is expensive and slow. This is the practical argument for requesting only the number of originals you genuinely need and for using telex or express release where the commercial relationship allows it.",
      },
      {
        q: "Which fields must match the commercial invoice?",
        a: "Party names, goods description, references, package counts and weights at minimum. Where a documentary credit governs payment, the credit's own requirements are stricter than customs and must be met exactly — including wording that may look pedantic. Differences between the B/L and the invoice are among the most common causes of both customs queries and credit discrepancies.",
      },
      {
        q: "Can GainingDocx check a draft B/L against my other documents?",
        a: "Yes. Extracting the draft returns every field as structured data with container check digits recomputed and ports matched against UN/LOCODE. Grouping it with the commercial invoice and packing list for the same shipment compares parties, references, package counts, weights and descriptions across the set and reports the disagreements before you approve the draft.",
      },
    ],
    related: [
      { href: "/guides/how-to-read-a-bill-of-lading", label: "How to read a Bill of Lading", blurb: "Every field explained, with a review checklist for drafts and originals." },
      { href: "/bill-of-lading-parser", label: "Bill of Lading parser", blurb: "Extract and validate a draft or issued B/L automatically." },
      { href: "/templates/shipping-instructions-template", label: "Shipping instructions template", blurb: "The document you send the carrier to have the B/L prepared." },
      { href: "/tools/container-number-check", label: "Container number check", blurb: "Validate every equipment reference before the instructions go out." },
    ],
  },

  "shipping-instructions-template": {
    updated: "2026-08-04",
    keywords: [
      "shipping instructions template",
      "shipping instructions format word",
      "SI submission carrier",
      "bill of lading instructions",
      "SI cut off",
      "VGM submission",
      "shipping instruction sample",
    ],
    quickAnswer: {
      heading: "What shipping instructions do",
      body:
        "Shipping instructions are the shipper's written instruction to the carrier or forwarder telling it exactly how to prepare the transport document. They carry the parties, routing, equipment, cargo particulars, freight terms and requested B/L type. They must be submitted by the SI cut-off, which is earlier than the cargo cut-off and separate from the VGM cut-off.",
      bullets: [
        "Submitted against a confirmed booking",
        "Drives the carrier's draft B/L",
        "Must reach the carrier by the SI cut-off",
        "VGM is a separate, mandatory submission",
      ],
    },
    sections: [
      {
        heading: "Where shipping instructions sit in the export sequence",
        paragraphs: [
          "Shipping instructions are the hinge between the booking and the transport document. The booking secures space and equipment; the instructions tell the carrier what to print. Everything on the eventual Bill of Lading — every party, place, container, weight and clause — originates here, which is why an error in the instructions becomes an error on a legal document rather than an internal one.",
          "Submitting them well is largely about timing and completeness. Carriers work to a documentation cut-off that is earlier than the physical cargo cut-off, and a late or incomplete SI either delays the document or gets it produced from whatever information the carrier already holds — usually the booking, which is rarely complete enough.",
        ],
        table: {
          caption: "Export cut-offs and what each one governs",
          columns: ["Cut-off", "What is due", "Consequence of missing it"],
          rows: [
            ["SI / documentation cut-off", "Complete shipping instructions", "Draft B/L delayed or produced from booking data; late-SI fee common"],
            ["VGM cut-off", "Verified Gross Mass declaration", "Container cannot legally be loaded; almost always rolled"],
            ["Cargo / gate-in cut-off", "Full container physically at the terminal", "Container rolled to the next vessel"],
            ["Customs cut-off", "Export declaration accepted", "Container blocked from loading"],
            ["Advance manifest cut-off", "Filings such as AMS or ENS where required", "Loading refused; penalties possible"],
          ],
          note: "Cut-offs vary by carrier, port and service. Take them from the booking confirmation for the specific sailing rather than from a general rule.",
        },
      },
      {
        heading: "What complete instructions contain",
        paragraphs: [
          "Completeness is what separates instructions that produce a clean draft from instructions that produce a week of email. Include everything the carrier needs to fill every box, and state explicitly anything you do not want defaulted.",
        ],
        bullets: [
          "Booking number, and any shipper reference you want carried through to the document",
          "Shipper, consignee and notify party in full legal form, with the consignee wording exactly as required",
          "The four routing fields — place of receipt, port of loading, port of discharge, place of delivery — with UN/LOCODEs",
          "Container number, seal number, size and type for every unit, with the packages, gross weight and measurement attributed to each",
          "Verified Gross Mass per container and the method used to determine it",
          "Marks and numbers as they appear on the cargo",
          "Goods description at the specificity customs requires, and matching any documentary credit wording",
          "HS code where the carrier or destination requires it on the manifest",
          "Freight terms — prepaid or collect — and the payer where they differ",
          "Requested document type and release method, and the number of originals",
          "Any special clause, handling instruction or manifest note you need included",
          "A named contact and email for queries, so a question does not stall the document",
        ],
        callout: {
          tone: "warn",
          title: "Do not let the carrier default the consignee",
          body:
            "If the consignee box is ambiguous or omitted, it may be completed from the booking or from previous shipment history. On a negotiable document that determines who controls the cargo. State the exact wording, including any 'to order of' construction, and check it on the draft.",
        },
      },
      {
        heading: "Verified Gross Mass",
        paragraphs: [
          "Under the SOLAS Convention, a packed container may not be loaded onto a vessel unless the shipper has provided a Verified Gross Mass — the combined weight of cargo, packaging, dunnage and the container's own tare. It is a legal obligation on the shipper named on the Bill of Lading, not a courtesy to the carrier.",
          "Two methods are permitted: weighing the packed container on calibrated equipment, or weighing all packages and packing material and adding the tare weight using a documented and certified procedure. Estimating is not one of them. The declaration must identify the shipper, be signed by an authorised person, and reach the carrier and terminal by the VGM cut-off.",
        ],
        subsections: [
          {
            heading: "Where VGM goes wrong",
            paragraphs: [
              "Almost always in the arithmetic or the tare. The tare is stencilled on the container door and differs between boxes of the same nominal size; using a generic figure introduces an error of several hundred kilograms. Pallets, dunnage and securing material are cargo for VGM purposes and are frequently omitted.",
            ],
            bullets: [
              "Take the tare from the actual container, not from a table",
              "Include pallets, dunnage, lashing and packaging in the cargo weight",
              "Submit against the specific container number, not the booking as a whole",
              "Keep the weighing record — it is the evidence behind a signed declaration",
              "Reconcile VGM against the packing list gross weight and investigate any material gap",
            ],
          },
        ],
      },
      {
        heading: "Preparing instructions that produce a clean draft",
        numbered: [
          "Start from the booking confirmation and carry its references forward verbatim rather than retyping them.",
          "Take party details from the commercial invoice so the two documents agree from the outset.",
          "Validate every container number's check digit and confirm seals against the stuffing record before submitting.",
          "Reconcile packages, gross weight and measurement against the packing list, and confirm the per-container split adds to the shipment total.",
          "Compute and state VGM per container with the method used.",
          "Confirm the goods description satisfies customs and, where applicable, matches the documentary credit wording exactly.",
          "State the document type, release method and number of originals explicitly.",
          "Submit before the SI cut-off, then check the returned draft field by field rather than approving on sight.",
        ],
        callout: {
          tone: "check",
          title: "Reuse the record, not the file",
          body:
            "Copying last month's instructions and editing them is how stale consignees, old vessel names and previous container numbers reach live documents. Start from the current booking and the current invoice every time; the few minutes saved by copying are reliably repaid with interest in amendment fees.",
        },
      },
      {
        heading: "Formats and how carriers accept instructions",
        paragraphs: [
          "Carriers accept instructions through their own web portals, through EDI or INTTRA-style platforms, and by email in a document format. Portals validate as you type and produce fewer errors; email accepts anything, including incomplete instructions, and defers the errors to the draft stage.",
          "This worksheet produces a PDF for submission and record, an editable XLSX for teams that maintain instructions in a spreadsheet, and a DOCX where a carrier or customer requires a Word format. Whichever route you use, keep the submitted version — the instruction you sent is your evidence of what you asked for when a document turns out wrong.",
        ],
      },
    ],
    faqs: [
      {
        q: "What are shipping instructions?",
        a: "The shipper's written instruction to a carrier or forwarder setting out exactly how the transport document should be prepared: parties, routing, equipment, cargo particulars, weights, freight terms, requested document type and release method. They are submitted against a confirmed booking and are what the carrier's draft Bill of Lading is built from.",
      },
      {
        q: "What is the SI cut-off?",
        a: "The deadline by which complete shipping instructions must reach the carrier for a given sailing. It is earlier than the physical cargo cut-off — often a day or more — because the carrier needs time to produce the draft and file the manifest. Missing it typically means a delayed document, a late-SI fee, or a B/L produced from incomplete booking data.",
      },
      {
        q: "Are shipping instructions the same as a Bill of Lading?",
        a: "No. Shipping instructions are the shipper's instruction; the Bill of Lading is the carrier's document, evidencing its receipt of the goods and its contract of carriage. The instructions have no effect against third parties and confer no title. They matter because everything on the B/L comes from them.",
      },
      {
        q: "What is VGM and who is responsible for it?",
        a: "Verified Gross Mass is the total weight of a packed container including cargo, packaging, dunnage and the container tare. Under SOLAS it must be provided before the container can be loaded, and the responsibility rests on the shipper named on the Bill of Lading. It must be obtained by weighing — either the packed container, or all the contents plus the stencilled tare under a certified procedure — never estimated.",
      },
      {
        q: "Can I submit shipping instructions in Word format?",
        a: "It depends on the carrier. Most now prefer their own portal or an EDI channel, which validates entries as you go and produces materially fewer errors. Where a Word or Excel submission is accepted or required — common with forwarders and on some trades — this worksheet exports DOCX and XLSX alongside the PDF.",
      },
      {
        q: "What happens if I submit instructions late?",
        a: "Expect a late documentation fee, a delayed draft, and in the worst case a B/L produced from booking data alone — which will be missing the very details you needed to control. On trades with advance manifest requirements, a late SI can also make the filing deadline unachievable, which risks the container being refused loading.",
      },
      {
        q: "Which routing fields do I need to complete?",
        a: "All four that apply to the movement. Place of receipt and place of delivery describe where the carrier's custody begins and ends on a multimodal move; port of loading and port of discharge describe the sea leg. On a port-to-port shipment the first and last may be blank. Include UN/LOCODEs alongside the names — place names are ambiguous in a way codes are not.",
      },
      {
        q: "Do I need to state the HS code in shipping instructions?",
        a: "Increasingly yes. Many carriers require an HS code at manifest level, and some destinations mandate it for advance filings. Even where it is not required, providing it reduces the risk of a manifest query. Give the six-digit international heading at minimum, and the national extension where the destination requires it.",
      },
      {
        q: "How do I request a telex release or sea waybill?",
        a: "State it explicitly in the instructions, before the document is issued. The release method must be decided in advance: once originals have been printed and issued, switching to express release requires all originals to be returned to the carrier. State the document type, the release method and the number of originals as three separate, deliberate answers.",
      },
      {
        q: "What is the difference between the SI cut-off and the cargo cut-off?",
        a: "The SI cut-off is a documentation deadline — when your instructions must reach the carrier. The cargo cut-off is a physical deadline — when the full container must be inside the terminal. They are independent, and there is usually also a separate VGM cut-off and a customs cut-off. Missing any one of them can roll the container even if the others were met comfortably.",
      },
      {
        q: "Should the goods description match the commercial invoice exactly?",
        a: "It should be consistent, and where a documentary credit governs payment it must match the credit's wording exactly. Customs needs specificity — generic descriptions attract examination — while credits need literal compliance. Where the two pull in different directions, resolve it before submission with your broker and the bank rather than after the document is issued.",
      },
      {
        q: "Can GainingDocx generate shipping instructions from documents I already have?",
        a: "Yes. Where a booking confirmation, commercial invoice and packing list have been extracted for the same shipment, the reviewed data can be reused to prepare an editable shipping-instructions draft, so parties, routing, equipment and cargo particulars are carried across rather than retyped.",
      },
    ],
    related: [
      { href: "/guides/shipping-instructions-format-word-template", label: "Shipping instructions format guide", blurb: "Field-by-field guidance and a complete worked example in Word format." },
      { href: "/templates/bill-of-lading-template", label: "Bill of Lading data worksheet", blurb: "Check the draft the carrier returns against your instructions." },
      { href: "/booking-confirmation-parser", label: "Booking confirmation parser", blurb: "Extract references, routing, equipment and cut-offs from the booking." },
      { href: "/features/shipping-document-generation", label: "Document generation", blurb: "Reuse reviewed shipment data to prepare instruction drafts without retyping." },
    ],
  },

  "arrival-notice-template": {
    updated: "2026-08-04",
    keywords: [
      "arrival notice template",
      "cargo arrival notice format",
      "notice of arrival shipping",
      "arrival notice vs delivery order",
      "last free day",
      "import arrival notice",
      "carrier arrival notification",
    ],
    quickAnswer: {
      heading: "What an arrival notice does",
      body:
        "An arrival notice tells the consignee and notify party that a shipment has arrived or is about to arrive, and sets out the vessel, ETA, terminal, B/L and container references, the charges due and the free time available. It is a notification, not a release: cargo cannot be collected on an arrival notice alone, and the free-time clock it announces is usually already running.",
      bullets: [
        "Issued by the carrier, NVOCC or destination agent",
        "States charges due before release",
        "Announces free time and the last free day",
        "Does not authorise collection — that needs a delivery order",
      ],
    },
    sections: [
      {
        heading: "Why the arrival notice is the most time-critical document you receive",
        paragraphs: [
          "Every other import document can usually wait a day. The arrival notice cannot, because it starts a clock that costs money. By the time it reaches you, free time may already have begun, and each day between the notice landing in an inbox and somebody acting on it is a day removed from the collection window.",
          "The practical failure is almost never that the notice was wrong. It is that it arrived as an email attachment to a shared mailbox, was not read against the shipment file, and surfaced three days later when the demurrage had already started accruing. Treating arrival notice processing as a same-day task is the single highest-return habit in import operations.",
        ],
        callout: {
          tone: "warn",
          title: "Free time is usually already running",
          body:
            "Depending on the tariff, free time starts at discharge or at availability — both of which typically precede the notice reaching you. Read the last free day off the notice, diarise it immediately, and work backwards from it rather than forward from the day you happened to open the email.",
        },
      },
      {
        heading: "What a complete arrival notice contains",
        table: {
          caption: "Arrival notice fields and why each one matters",
          columns: ["Field", "Why it matters"],
          rows: [
            ["Issuer and notice number", "Identifies who to contact and gives the reference for any query or dispute"],
            ["B/L number", "The key that links the notice to your shipment file and to the customs entry"],
            ["Vessel and voyage", "Confirms the sailing; a change here means the ETA has moved"],
            ["ETA and actual arrival", "Drives every downstream deadline, including free time"],
            ["Port of discharge and terminal", "Determines which terminal appointment and which haulier you need"],
            ["Container numbers, sizes and types", "Must reconcile with the B/L and with your haulage booking"],
            ["Consignee and notify party", "Confirms the notice reached the right party and that the B/L consignee is correct"],
            ["Charges due", "What must be settled before release; check each line against the quotation"],
            ["Free time and last free day", "The deadline that determines whether demurrage is incurred"],
            ["Release requirements", "Whether an original B/L, telex release or express release governs"],
            ["Local agent contact", "Who actually releases the cargo and answers questions"],
          ],
        },
      },
      {
        heading: "Arrival notice, delivery order and release: three separate things",
        paragraphs: [
          "These are routinely confused, and the confusion costs free time. The arrival notice informs. The release is the carrier's decision that its conditions have been satisfied — the transport document surrendered or released, and charges paid. The delivery order is the instrument that authorises the terminal to hand the cargo over.",
          "You can hold an arrival notice and be unable to collect anything. That is the normal state of affairs until the release conditions are met, and the gap between notice and release is where most avoidable demurrage is generated.",
        ],
        table: {
          caption: "Which document does what",
          columns: ["Document", "Issued by", "Effect"],
          rows: [
            ["Arrival notice", "Carrier, NVOCC or destination agent", "Informs of arrival, charges and free time"],
            ["Carrier release", "Carrier", "Confirms the B/L has been surrendered or released and charges settled"],
            ["Customs release", "Customs authority", "Confirms the entry is cleared and the goods may move"],
            ["Delivery order", "Carrier or its agent", "Authorises the terminal to release cargo to a named party or haulier"],
            ["Equipment interchange receipt", "Terminal or depot", "Records condition and custody at the moment of handover"],
          ],
          note: "Both the carrier release and the customs release are normally required before a delivery order is issued. Either one outstanding blocks collection.",
        },
      },
      {
        heading: "Working an arrival notice the day it arrives",
        numbered: [
          "Match the notice to your shipment file by B/L number, and confirm the container references agree with the B/L and the packing list.",
          "Read the last free day and diarise it immediately, along with a working deadline at least two days earlier.",
          "Confirm the release requirement — original B/L, telex or express — and start whatever action it needs, since courier transit or bank release is usually the longest lead time.",
          "Check each charge line against the quotation and query anything undisclosed straight away rather than at payment.",
          "Confirm the customs entry is filed, or file it, and check whether any permit or certificate is outstanding.",
          "Book haulage and a terminal appointment against the actual terminal named on the notice, not the port generally.",
          "Confirm the terminal has released the container and that no hold — customs, carrier, terminal or line — remains against it.",
          "Escalate at 48 hours before the last free day if any of the above is unresolved.",
        ],
      },
      {
        heading: "Preparing an arrival notice as a forwarder or NVOCC",
        paragraphs: [
          "If you issue arrival notices to your own customers, the notice is your first opportunity to prevent a demurrage complaint that will later be aimed at you. Completeness and timing matter more than formatting.",
        ],
        bullets: [
          "Send it as early as the information allows, not when it is convenient — a notice sent two days before ETA is worth more than a perfect one sent on arrival",
          "State the last free day explicitly as a date, rather than leaving the consignee to derive it from a free-time allowance",
          "Itemise every charge with its basis, so nothing appears for the first time at payment",
          "State the release requirement plainly and say what the consignee must do next",
          "Name a person and a direct contact route, not a generic mailbox",
          "Reference the terminal, not just the port, so haulage can be booked correctly",
          "Send it to both the consignee and the notify party, and confirm receipt on high-value or time-critical cargo",
        ],
        callout: {
          tone: "info",
          title: "This worksheet is not an official carrier notice",
          body:
            "Use it to prepare a notice as a forwarder or agent, or to record and check the information on a notice you have received. Arrival, charges, free time and release conditions are established by the carrier, NVOCC, terminal or authorised destination agent — this data sheet organises the information rather than certifying it.",
        },
      },
    ],
    faqs: [
      {
        q: "What is an arrival notice?",
        a: "A notification from the carrier, NVOCC or destination agent that a shipment has arrived or is about to arrive, setting out the vessel and voyage, ETA, terminal, B/L and container references, the charges due before release and the free time available. It is informational — it does not authorise collection of the cargo.",
      },
      {
        q: "Is an arrival notice the same as a delivery order?",
        a: "No. The arrival notice tells you the cargo has arrived. The delivery order authorises the terminal to release it to a named party. Between the two sit the carrier release — which requires the transport document to be surrendered or released and charges to be settled — and the customs release. Holding an arrival notice does not entitle you to collect anything.",
      },
      {
        q: "When does free time start?",
        a: "It depends on the tariff, and the wording matters. Some tariffs run free time from discharge, others from the date the container is made available. On a shipment held for examination those dates can be days apart. Take the last free day from the notice where one is stated, but confirm it against the governing tariff or service contract, because the notice is the carrier's statement rather than the contract.",
      },
      {
        q: "Who receives the arrival notice?",
        a: "The notify party named on the Bill of Lading, and usually the consignee. This is exactly why the notify party field matters when the B/L is prepared: naming a customs broker or a destination office that actively monitors arrivals is materially better than naming a head-office address where the notice will sit unread.",
      },
      {
        q: "What should I do the day an arrival notice arrives?",
        a: "Match it to your shipment file, diarise the last free day with a working deadline two days earlier, confirm the release requirement and start any action it needs, check the charges against the quotation, confirm the customs entry is filed, and book haulage against the named terminal. Almost all avoidable demurrage is generated in the days between the notice arriving and someone acting on it.",
      },
      {
        q: "Can I dispute the charges shown on an arrival notice?",
        a: "Yes, and it is easier before payment than after. Compare each line against the quotation and the service contract, and query undisclosed charges immediately in writing. Be aware that the carrier will usually not release cargo while charges are outstanding, so an unresolved dispute can generate demurrage — which is why raising it the day the notice lands matters more than the merits of the argument.",
      },
      {
        q: "What is the last free day?",
        a: "The final day on which the container can be collected without incurring demurrage. It is derived from the free-time start event plus the allowance, under the tariff's counting convention — so it moves if the start event, the allowance or the convention differs from what you assumed. Take the stated date from the notice and reconcile it against your own calculation rather than trusting either alone.",
      },
      {
        q: "Does an arrival notice mean customs has cleared the shipment?",
        a: "No. The arrival notice is a carrier or agent communication about the transport leg. Customs clearance is a separate process with its own timeline, and cargo can sit under a customs hold with a perfectly valid carrier release in place. Both releases are needed before a delivery order will issue.",
      },
      {
        q: "What if the container numbers on the notice do not match my B/L?",
        a: "Query it immediately and do not proceed on the assumption that it is a typographical error. A mismatch may mean the notice relates to a different shipment, that containers were substituted, or that a reference was corrupted in a carrier system. Validate the check digits on both sets, and get written confirmation of which containers actually carry your cargo before booking haulage.",
      },
      {
        q: "Can an arrival notice be issued before the vessel arrives?",
        a: "Yes, and it usually should be. A pre-arrival notice sent several days before ETA gives the consignee time to arrange clearance, funds and haulage, and is far more useful than a notice sent on the day of discharge. Some carriers issue both a pre-arrival and a final arrival notice.",
      },
      {
        q: "What charges typically appear on an arrival notice?",
        a: "Destination terminal handling, documentation or delivery order fees, any collect ocean freight, container cleaning or maintenance charges where applicable, customs-related disbursements, and on LCL shipments deconsolidation and CFS handling. Demurrage and detention appear later, if incurred. Every line should be traceable to a quotation or a published tariff.",
      },
      {
        q: "Can GainingDocx track free time from an arrival notice automatically?",
        a: "Yes. Extracting an arrival notice captures the vessel, ETA, port, terminal, B/L and container references, charge lines and any printed free-time or last-free-day dates as structured fields on the shipment record — so the deadline becomes a tracked date rather than a line buried in a PDF.",
      },
    ],
    related: [
      { href: "/arrival-notice-parser", label: "Arrival notice parser", blurb: "Extract references, ETA, charges and free-time dates from carrier notices automatically." },
      { href: "/tools/demurrage-detention-calculator", label: "Demurrage and detention calculator", blurb: "Check the free time and charges the notice announces." },
      { href: "/templates/delivery-order-template", label: "Delivery order data sheet", blurb: "The instrument that actually authorises release at the terminal." },
      { href: "/guides/demurrage-detention-calculation-guide", label: "Demurrage and detention guide", blurb: "How free time is counted and how to audit a charge." },
    ],
  },

  "delivery-order-template": {
    updated: "2026-08-04",
    keywords: [
      "delivery order template",
      "delivery order shipping",
      "D/O format",
      "cargo release order",
      "delivery order vs bill of lading",
      "terminal release document",
      "import delivery order",
    ],
    quickAnswer: {
      heading: "What a delivery order does",
      body:
        "A delivery order authorises a terminal, depot or warehouse to release specified cargo to a named party. It is issued by the carrier or its agent once the transport document has been surrendered or released, charges are settled and customs has cleared the goods. It is the instrument that actually moves cargo out of the terminal — an arrival notice does not.",
      bullets: [
        "Issued after carrier and customs release",
        "Names who may collect and often which haulier",
        "Container-specific, with a validity period",
        "Not a document of title",
      ],
    },
    sections: [
      {
        heading: "Where the delivery order sits in the import chain",
        paragraphs: [
          "By the time a delivery order can be issued, several independent conditions must have been satisfied, and each of them is owned by a different party. The carrier needs its transport document back, or released; the carrier and its agent need their charges paid; customs needs the entry cleared and any hold lifted; the terminal needs no outstanding storage or block against the unit.",
          "This is why the delivery order is the point where import delays become visible. It is not that the D/O is slow to produce — it is that it cannot be produced while any one of those conditions is outstanding, and the party chasing it is often unaware which one is missing.",
        ],
        table: {
          caption: "Conditions that must be met before a delivery order issues",
          columns: ["Condition", "Owner", "Typical blocker"],
          rows: [
            ["Transport document surrendered or released", "Consignee and carrier", "Original B/L still with the bank or in transit"],
            ["Freight and destination charges settled", "Consignee", "Invoice disputed or payment not cleared"],
            ["Customs entry cleared", "Broker and customs", "Documentation query, examination, duty unpaid"],
            ["Regulatory holds lifted", "Relevant agency", "Health, agriculture, standards or security inspection"],
            ["Terminal charges settled", "Consignee or haulier", "Storage accrued and unpaid"],
            ["Container available", "Terminal", "Not yet discharged, or under a terminal block"],
          ],
        },
      },
      {
        heading: "What a delivery order contains",
        bullets: [
          "The issuing party and a unique delivery order number",
          "The transport document reference it releases against, usually the B/L or house B/L number",
          "The consignee, and the party authorised to take delivery where that differs",
          "The haulier or transport company nominated to collect, where the terminal requires it",
          "Container numbers, sizes and types, or a package description for loose cargo",
          "The terminal, depot or warehouse holding the cargo",
          "A validity period, after which the order lapses and must be reissued",
          "Empty container return location and any return deadline, on containerised imports",
          "Any conditions attached to release, such as an inspection to be completed first",
        ],
        callout: {
          tone: "info",
          title: "A delivery order is not a document of title",
          body:
            "It authorises release of specific cargo at a specific place to a specific party. It does not represent ownership, cannot be endorsed to transfer the goods, and does not replace the Bill of Lading. It is an operational instruction issued because the title question has already been resolved.",
        },
      },
      {
        heading: "Delivery order against the documents it is confused with",
        table: {
          caption: "Distinguishing the release documents",
          columns: ["Document", "Function", "Document of title?"],
          rows: [
            ["Bill of Lading", "Receipt, contract of carriage and, if negotiable, title", "Yes, when negotiable"],
            ["Arrival notice", "Notification of arrival, charges and free time", "No"],
            ["Delivery order", "Authorises the terminal to release cargo to a named party", "No"],
            ["Equipment interchange receipt", "Records equipment condition and custody at handover", "No"],
            ["Proof of delivery", "Evidences that the consignee received the goods", "No"],
          ],
        },
      },
      {
        heading: "Getting a delivery order without losing free time",
        numbered: [
          "Start the release process from the arrival notice, not from the delivery order request — the long lead times are upstream.",
          "Confirm which release method applies and, if an original B/L is required, track exactly where the originals are and who must endorse them.",
          "Settle freight and destination charges early enough for payment to clear, not on the day collection is planned.",
          "Confirm the customs entry is filed, accepted and free of holds, including any agency other than customs itself.",
          "Nominate the haulier to the carrier and terminal in advance where the terminal requires the collecting party to be named on the order.",
          "Check the validity period on the order as soon as it is issued, and book the terminal appointment inside it.",
          "Confirm the empty return location and deadline at the same time, because detention runs from collection whether or not anyone read that line.",
        ],
        callout: {
          tone: "warn",
          title: "An expired delivery order stops the truck",
          body:
            "Delivery orders carry a validity period, frequently short. A haulier arriving with an expired order will be turned away at the gate, the appointment slot is lost, and the free time carries on running. Check the expiry the moment the order is received and align the collection appointment to it.",
        },
      },
      {
        heading: "Using this data sheet",
        paragraphs: [
          "This worksheet organises the references, parties, equipment and release conditions that a delivery order depends on. It is useful in two directions: as a forwarder or agent preparing a release, and as a consignee assembling the information needed to request one and to check the order received.",
          "It is not an authorisation. Only the carrier, NVOCC or their authorised agent can release cargo, and only the terminal can hand it over. Completing this sheet does not create any entitlement to the goods.",
        ],
      },
    ],
    faqs: [
      {
        q: "What is a delivery order in shipping?",
        a: "A document issued by the carrier or its agent authorising a terminal, depot or warehouse to release specified cargo to a named party. It is issued once the transport document has been surrendered or released, charges are settled and customs has cleared the goods, and it is the instrument the terminal actually acts on when handing cargo over.",
      },
      {
        q: "What is the difference between a delivery order and a Bill of Lading?",
        a: "A Bill of Lading is a receipt, evidence of the contract of carriage and — when negotiable — a document of title that can be endorsed and transferred. A delivery order is an operational instruction to release specific cargo to a specific party at a specific place. The delivery order is issued because the title question has already been settled; it does not settle it.",
      },
      {
        q: "Who issues a delivery order?",
        a: "The carrier, NVOCC or their authorised destination agent. On an LCL or house shipment it is typically the forwarder that issued the house Bill of Lading. A consignee cannot issue one for itself, and a delivery order from a party without authority over the cargo will not be accepted by the terminal.",
      },
      {
        q: "What do I need before a delivery order can be issued?",
        a: "The transport document surrendered or released, all freight and destination charges settled, the customs entry cleared with no holds outstanding, any other regulatory clearance completed, and no terminal block against the container. Each condition is owned by a different party, which is why the practical answer to 'where is my D/O' is usually 'which of the five is missing'.",
      },
      {
        q: "How long is a delivery order valid?",
        a: "It carries a stated validity period, often short — a few days is common. An expired order will be refused at the terminal gate, costing the appointment and, if free time has run out, generating demurrage. Check the expiry on receipt and align the collection appointment to it rather than to your own schedule.",
      },
      {
        q: "Can a delivery order be transferred to someone else?",
        a: "No. It authorises release to the party it names, and terminals will not release against an order in another party's name. Where a different haulier or collecting party is needed, the order has to be amended or reissued by the party that issued it.",
      },
      {
        q: "Is an electronic delivery order valid?",
        a: "In most modern ports, yes — electronic release through a port community system or carrier portal is now the norm, and paper orders are the exception. The mechanism varies by port and carrier. Confirm which system your destination terminal uses, because a paper order presented at an electronic-release terminal will simply not work.",
      },
      {
        q: "Does a delivery order release the empty container obligation?",
        a: "No, and this is a common and expensive misunderstanding. Collecting the full container starts the detention clock. The delivery order frequently states the empty return location and deadline, and missing that line is how a shipment with clean demurrage still generates a detention invoice. Read the return terms at the same time as the collection terms.",
      },
      {
        q: "What is the difference between a delivery order and a release note?",
        a: "The terminology varies by market and by party. 'Release' commonly refers to the carrier's confirmation that its own conditions are satisfied; the 'delivery order' is what instructs the terminal to hand cargo over. Some ports and carriers use the terms interchangeably or merge them into a single electronic status. Establish what your specific destination means by each rather than assuming a universal definition.",
      },
      {
        q: "Can I collect cargo with only an arrival notice?",
        a: "No. An arrival notice is a notification of arrival, charges and free time. It confers no right to collect. Cargo is released only against a delivery order or its electronic equivalent, issued after the carrier and customs release conditions are met.",
      },
      {
        q: "What happens if cargo is released without a delivery order?",
        a: "It is a misdelivery, and a serious one. The terminal has handed goods to a party whose entitlement was never verified, and the carrier can face a claim from the lawful holder of the transport document — a claim that is generally not covered by the usual liability limits. This is why terminals are strict about release documentation even when everyone involved is confident about who owns the cargo.",
      },
      {
        q: "Can GainingDocx track the release conditions on my imports?",
        a: "Yes. Extracting the Bill of Lading and the arrival notice for a shipment creates a record carrying the references, charges, free time and release requirement, so the outstanding condition blocking release is visible against the shipment rather than reconstructed from an email thread.",
      },
    ],
    related: [
      { href: "/templates/arrival-notice-template", label: "Arrival notice data sheet", blurb: "The notification that starts the release process and the free-time clock." },
      { href: "/tools/demurrage-detention-calculator", label: "Demurrage and detention calculator", blurb: "Quantify the cost of a release delay before it becomes an invoice." },
      { href: "/bill-of-lading-parser", label: "Bill of Lading parser", blurb: "Extract the transport document that release is granted against." },
      { href: "/guides/how-to-read-a-bill-of-lading", label: "How to read a Bill of Lading", blurb: "Release type, originals and the wording that controls delivery." },
    ],
  },

  "air-waybill-template": {
    updated: "2026-08-04",
    keywords: [
      "air waybill template",
      "AWB format",
      "air waybill data worksheet",
      "MAWB template",
      "house air waybill format",
      "air waybill fields explained",
      "shipper letter of instruction air",
    ],
    quickAnswer: {
      heading: "What this worksheet is for",
      body:
        "An air waybill is issued by the airline or its authorised cargo agent, not by the shipper. This worksheet assembles the particulars an airline or forwarder needs — parties, routing, pieces, weights, rating, handling and declared values — so the AWB can be prepared accurately, and so the issued document can be checked against what you actually instructed.",
      bullets: [
        "Prepare complete AWB particulars before tender",
        "Keep pieces and weights consistent with the packing list",
        "Record declared values deliberately, not by default",
        "Download PDF, XLSX or DOCX for submission and record",
      ],
    },
    sections: [
      {
        heading: "What an air waybill is, and what it is not",
        paragraphs: [
          "The air waybill is the contract of carriage for an air shipment, a receipt for the goods, and the operational document that follows the cargo through handling, customs manifesting and delivery. It is issued in a set, conventionally three originals — one for the issuing carrier, one that travels with the cargo for the consignee, and one for the shipper as evidence of tender.",
          "Critically, an air waybill is never a document of title. Unlike a negotiable Bill of Lading, it cannot be endorsed and does not control who receives the goods — cargo is delivered to the named consignee on identification. This is why air shipments cannot be secured by the transport document the way ocean shipments can, and why payment terms for air freight are structured differently.",
        ],
        callout: {
          tone: "warn",
          title: "A shipper does not issue an air waybill",
          body:
            "Only the airline or an authorised cargo agent issues an AWB, on the carrier's document stock. A shipper provides the information — usually through a shipper's letter of instruction — and checks what comes back. This worksheet is that preparation and check, not the document itself.",
        },
      },
      {
        heading: "Field-by-field guidance",
        subsections: [
          {
            heading: "Parties and references",
            paragraphs: [
              "The shipper and consignee must be full legal entities with complete addresses and, importantly, contact telephone numbers. Air freight moves fast enough that a destination agent unable to reach the consignee within hours is a genuine operational problem, not an administrative one.",
              "Where the shipment is consolidated, the master air waybill shows the origin forwarder as shipper and the destination agent as consignee, while the house air waybill shows the real parties. Confusing the two levels produces customs entries filed against the wrong party.",
            ],
          },
          {
            heading: "Routing and flight",
            paragraphs: [
              "Airports are identified by three-letter IATA codes, and the routing box shows each leg with its carrier. Requested flight and date are exactly that — requested. Space on the specific flight is confirmed by the booking, and the AWB routing does not guarantee it.",
              "Where cargo transits a third country, check whether that transit creates its own documentary or security requirement. Some routings are documentarily more demanding than others for identical cargo.",
            ],
          },
          {
            heading: "Pieces, weights and rating",
            paragraphs: [
              "The AWB carries the number of pieces, the gross weight, the rate class, the chargeable weight, the rate and the total. Chargeable weight is the greater of actual and volumetric weight and is the figure the charges are computed on — it should be reconcilable from the dimensions on your packing list.",
              "Everything here must agree with the packing list. A piece count or gross weight that differs between the two is one of the most common reasons cargo is queried at acceptance, and it is entirely avoidable.",
            ],
            bullets: [
              "Number of pieces and RCP where the consignment is split",
              "Gross weight, and the unit — kilograms or pounds",
              "Rate class and any commodity item number",
              "Chargeable weight, reconcilable from dimensions and the applicable divisor",
              "Rate or charge, and the total for the line",
              "Nature and quantity of goods, including dimensions or volume",
            ],
          },
          {
            heading: "Declared values",
            paragraphs: [
              "Two separate declared value boxes appear on an air waybill and they do different things. Declared value for carriage determines the carrier's liability ceiling; declaring a value above the default attracts a valuation charge and raises the limit. Declared value for customs supports the import entry and should reflect the transaction value.",
              "Where no value is declared for carriage, 'NVD' — no value declared — is entered, and the carrier's liability is limited by the applicable convention. Under the Montreal Convention that limit for cargo is expressed in Special Drawing Rights per kilogram and is periodically revised, which means a high-value, low-weight shipment can be catastrophically under-covered by default. Decide this deliberately rather than letting it default, and confirm cargo insurance is in place either way.",
            ],
          },
          {
            heading: "Handling information",
            paragraphs: [
              "The handling box carries anything the carrier and handlers must know: temperature requirements, dangerous goods references, live animal or perishable notations, 'Cargo Aircraft Only' where the classification requires it, and any special stowage need. It is not a free-text field for commercial notes — anything written here becomes an operational instruction.",
            ],
          },
        ],
      },
      {
        heading: "Master and house air waybills",
        paragraphs: [
          "On a consolidation, one master air waybill covers the whole consignment tendered by the forwarder to the airline, and each underlying shipment travels under its own house air waybill. The two documents show different parties and serve different purposes, and customs entry at destination is generally filed at house level.",
          "Prepare the house document with the same rigour as the master. Because it is the document the consignee and the customs broker actually work from, an incomplete house AWB creates problems that the master's accuracy cannot fix.",
        ],
        table: {
          caption: "Master and house documents compared",
          columns: ["Aspect", "Master air waybill", "House air waybill"],
          rows: [
            ["Issued by", "Airline or its agent", "Freight forwarder or consolidator"],
            ["Shipper shown", "Origin forwarder", "The actual shipper"],
            ["Consignee shown", "Destination agent", "The actual consignee"],
            ["Number format", "11 digits with a modulus-7 check digit", "Forwarder-defined, often alphanumeric"],
            ["Charges shown", "Airline's charges to the forwarder", "Forwarder's charges to its customer"],
            ["Used for customs entry", "Manifest level", "Entry level in most jurisdictions"],
          ],
        },
      },
      {
        heading: "Preparing particulars that will not be queried at acceptance",
        numbered: [
          "Take pieces, gross weight and dimensions from the packed cargo, not from the order or the carton specification.",
          "Calculate chargeable weight at the divisor your contract specifies, and confirm it reconciles with the dimensions you are declaring.",
          "Write a goods description specific enough for customs — generic wording invites examination and delays clearance.",
          "State the declared value for carriage deliberately, and confirm cargo insurance separately rather than relying on carrier liability.",
          "Include full consignee contact details, including a telephone number that will be answered at destination.",
          "Record every special handling requirement in the handling box, including any dangerous goods reference and 'Cargo Aircraft Only' notation where applicable.",
          "Confirm the security status of the cargo and how it was achieved before tender, because it cannot be applied retrospectively.",
          "Check the issued AWB against this worksheet before the cargo departs, not after it arrives.",
        ],
      },
    ],
    faqs: [
      {
        q: "Can I issue my own air waybill?",
        a: "No. An air waybill is issued by the airline or an authorised cargo agent on the carrier's document stock. The shipper supplies the information — normally through a shipper's letter of instruction — and the carrier or agent completes and issues the document. This worksheet prepares those particulars and lets you check what is issued.",
      },
      {
        q: "Is an air waybill a document of title?",
        a: "No, and this is the fundamental difference from a negotiable Bill of Lading. An air waybill cannot be endorsed or transferred, and cargo is delivered to the named consignee on identification rather than against surrender of a document. Air shipments therefore cannot be secured through the transport document, which shapes how payment terms for air freight are structured.",
      },
      {
        q: "How many originals does an air waybill have?",
        a: "Conventionally three: one for the issuing carrier, one that travels with the cargo for the consignee, and one retained by the shipper as evidence of tender. Additional copies are produced for agents, handlers and customs, but they are copies rather than originals.",
      },
      {
        q: "What is the difference between declared value for carriage and for customs?",
        a: "Declared value for carriage sets the carrier's liability ceiling — declaring above the default attracts a valuation charge and raises the limit. Declared value for customs supports the import entry and should reflect the transaction value. They serve different audiences and are frequently different numbers; both boxes appear on the AWB and both should be completed deliberately.",
      },
      {
        q: "What does NVD mean on an air waybill?",
        a: "No Value Declared. It means the shipper has not declared a value for carriage, so the carrier's liability is limited by the applicable convention rather than by a declared amount. Under the Montreal Convention the cargo limit is expressed in Special Drawing Rights per kilogram and is periodically revised — which means a light, high-value shipment can be severely under-covered by default. Rely on cargo insurance rather than carrier liability.",
      },
      {
        q: "What is the difference between gross weight and chargeable weight on an AWB?",
        a: "Gross weight is what the shipment physically weighs including packaging. Chargeable weight is the billing figure — the greater of gross weight and volumetric weight, where volumetric weight is derived by dividing the cubic dimensions by the applicable divisor, typically 6,000 for general air cargo. Both appear in separate boxes, and the charges are computed on the chargeable figure.",
      },
      {
        q: "What is a shipper's letter of instruction?",
        a: "The shipper's written instruction to the forwarder or cargo agent authorising it to prepare the air waybill and handle the export. It records the parties, routing, pieces and weights, declared values, special handling requirements and any documents attached. It is the shipper's evidence of what it instructed, which is what matters when the issued AWB turns out to be wrong.",
      },
      {
        q: "Do master and house air waybills show the same parties?",
        a: "No. The master shows the origin forwarder as shipper and the destination agent as consignee, because it covers the consolidated consignment tendered to the airline. The house shows the actual shipper and consignee. Customs entry at destination is generally filed at house level, which is why the house document must be complete in its own right.",
      },
      {
        q: "What goes in the handling information box?",
        a: "Anything carriers and handlers must act on: temperature requirements, dangerous goods references and the 'Cargo Aircraft Only' notation where required, live animal and perishable notations, and special stowage needs. Treat it as an operational instruction rather than a notes field — anything written there will be acted on, and anything omitted will not.",
      },
      {
        q: "Why do my pieces and weight have to match the packing list?",
        a: "Because acceptance staff check them, customs check them, and the consignee checks them on receipt. A piece count or gross weight that differs between the AWB and the packing list is one of the most common reasons cargo is queried or refused at acceptance, and resolving it at the counter costs a flight. It is entirely avoidable by reconciling before tender.",
      },
      {
        q: "Can an air waybill be amended after issue?",
        a: "Minor corrections are possible through the issuing carrier or agent before departure, and become progressively harder once the cargo has moved and the manifest has been filed. Changes affecting the consignee, the routing or the declared values may require the document to be cancelled and reissued. Checking before departure is much cheaper than amending afterwards.",
      },
      {
        q: "Can GainingDocx check an issued AWB against my other documents?",
        a: "Yes. Extracting the air waybill returns parties, routing, pieces, gross and chargeable weights, rating and charge lines as structured fields, with the MAWB number check digit validated. Grouping it with the commercial invoice and packing list compares piece counts, weights, values and descriptions across the set and reports the differences.",
      },
    ],
    related: [
      { href: "/air-waybill-parser", label: "Air waybill parser", blurb: "Extract and validate MAWB and HAWB documents automatically." },
      { href: "/tools/air-waybill-number-check", label: "Air waybill number checker", blurb: "Validate the modulus-7 check digit on any Master Air Waybill number." },
      { href: "/tools/chargeable-weight-calculator", label: "Chargeable weight calculator", blurb: "Reconcile the rated weight before the AWB is issued." },
      { href: "/tools/air-cargo-document-checklist", label: "Air cargo document checklist", blurb: "Assemble the full document set the air waybill travels with." },
    ],
  },
};
