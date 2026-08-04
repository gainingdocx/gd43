import type { DeepContentMap } from "@/content/deep/types";

export const AIR_INTAKE_FEATURE_DEEP: DeepContentMap = {
  "air-freight-document-automation": {
    updated: "2026-08-04",
    keywords: [
      "air freight document automation",
      "AWB processing software",
      "air cargo paperwork automation",
      "air export document workflow",
      "MAWB HAWB processing",
      "air freight document check",
      "e-AWB data preparation",
    ],
    quickAnswer: {
      heading: "What air document automation covers",
      body:
        "The whole air paperwork chain rather than a single air waybill: shipper's letter of instruction, master and house air waybills, commercial invoice, packing list, cargo manifest, dangerous goods declaration and security declaration — extracted into one shipment workspace, with air-specific checks on airport codes, AWB arithmetic, pieces and weights, and every finding linked back to its source page.",
      bullets: [
        "The full air document set, not just the AWB",
        "Airport, AWB and weight checks in code",
        "Email-in or batch intake",
        "Source-linked review before export",
      ],
    },
    sections: [
      {
        heading: "Air freight fails on the set, not the document",
        paragraphs: [
          "Air cargo moves fast enough that documentary problems become operational problems within hours. A piece count that disagrees between the packing list and the air waybill, a declared value that defaulted to NVD, a missing security status, a dangerous goods declaration whose AWB reference does not match — each of these stops a consignment at acceptance, and each is a comparison between two documents rather than a defect in one.",
          "Treating air cargo as a chain rather than a single upload is what makes those comparisons possible at all. The SLI records what the shipper instructed; the AWB records what the agent issued; the invoice and packing list record what is actually in the boxes; the manifest records what the consolidation claims. Agreement between them is the thing worth checking.",
        ],
      },
      {
        heading: "The document set",
        table: {
          caption: "Air documents and what each contributes",
          columns: ["Document", "Contributes", "Checked against"],
          rows: [
            ["Shipper's letter of instruction", "What the shipper instructed", "The issued air waybill"],
            ["Master air waybill", "Contract of carriage, routing, rating", "SLI, packing list, manifest, freight invoice"],
            ["House air waybill", "The underlying shipment's own contract", "Master totals and the manifest"],
            ["Commercial invoice", "Value, description, parties", "AWB declared value for customs, packing list"],
            ["Packing list", "Pieces, dimensions, weights", "AWB pieces, gross and chargeable weight"],
            ["Air cargo manifest", "Consolidation contents and totals", "Master AWB pieces and weight"],
            ["Dangerous goods declaration", "UN numbers, classes, packing, limitations", "AWB reference, route and DG annotation"],
            ["Cargo security declaration", "Security status and screening method", "AWB reference, pieces and weight covered"],
            ["Freight invoice", "What the movement was billed at", "AWB rated weight and charge lines"],
          ],
        },
      },
      {
        heading: "Air-specific validation",
        bullets: [
          "Master air waybill numbers split into prefix, serial and check digit, with the modulus-7 calculation run in code",
          "House references captured as printed and never forced through the airline formula",
          "Airport codes checked for three-letter IATA structure",
          "Gross weight and chargeable weight preserved as separate fields, with chargeable never below gross",
          "Chargeable weight recomputed from dimensions where the document supplies them",
          "Piece counts reconciled between the packing list, the AWB and the manifest",
          "Charge lines summed against printed weight-charge and total figures",
          "Declared value for carriage and for customs captured distinctly, with NVD recorded as an explicit state",
          "Master and house classification recorded only where the document states it",
        ],
        callout: {
          tone: "info",
          title: "Level is never guessed from number format",
          body:
            "An eleven-digit reference is probably a master air waybill, but a forwarder is free to number house documents the same way. Classification comes from what the document says about itself; where it says nothing, the level is recorded as unknown for review rather than assumed. Guessing here produces customs entries filed against the wrong party.",
        },
      },
      {
        heading: "For exporters without air cargo expertise",
        paragraphs: [
          "Air freight has a vocabulary problem as much as a process problem. An exporter shipping by air for the first time is asked for an SLI, a security status and a chargeable weight without necessarily being told what any of those are or who produces them.",
          "The air workspace starts from what you are trying to do rather than from a document type, and presents the required set in plain language — which documents you need, who issues each one, and what has to agree between them. The checklist tool covers the same ground for shipments that have not started yet.",
        ],
      },
      {
        heading: "What it does not do",
        bullets: [
          "It does not issue an air waybill or an e-AWB — the airline or authorised agent does",
          "It does not transmit anything to an airline, ground handler or customs system",
          "It does not certify dangerous goods compliance or replace acceptance review",
          "It does not verify a regulated agent's authorisation or grant security status",
          "It does not book capacity or confirm a flight",
          "It does not determine whether a charge was contractually agreed",
        ],
      },
    ],
    faqs: [
      {
        q: "Which air cargo documents are supported?",
        a: "Air waybills at master and house level, air shipper's letters of instruction, dangerous goods declarations, air cargo manifests, cargo security declarations, commercial invoices, packing lists, rate documents and freight invoices — extracted into one shipment workspace so they can be compared against each other.",
      },
      {
        q: "Does this issue an official e-AWB?",
        a: "No. It prepares, extracts and checks document data. Formal issuance and transmission remain with the airline, the authorised cargo agent or a connected cargo system. What it does is make sure the data going into that process is complete and internally consistent.",
      },
      {
        q: "Can exporters use it without air cargo expertise?",
        a: "Yes. The air workspace asks what you are trying to complete rather than which document you have, and presents the required document set in plain language — what each document is, who issues it and what has to agree across them. The air cargo document checklist covers the same ground for shipments still being planned.",
      },
      {
        q: "How is chargeable weight checked?",
        a: "Gross weight and chargeable weight are kept as separate fields, and where the document supplies dimensions the volumetric weight is recomputed at the applicable divisor and compared with the printed chargeable weight. Where dimensions are absent from the AWB, the packing list supplies them once both documents are grouped.",
      },
      {
        q: "Does it handle consolidations?",
        a: "Yes. Master and house documents plus the manifest can be grouped as one consignment, with house pieces and weights aggregated and compared against the master's declared totals. Houses listed on the manifest without a corresponding document — and documents without a manifest entry — are both reported.",
      },
      {
        q: "What happens with dangerous goods documents?",
        a: "Declaration evidence is extracted into a structured record and checked for completeness and consistency with the air waybill: signature and date presence, emergency contact, UN number and class structure, aircraft limitation, and whether the AWB carries the matching annotation. It is a pre-check for qualified personnel, not a compliance certificate.",
      },
      {
        q: "Can documents be forwarded by email rather than uploaded?",
        a: "Yes. Each account has a private intake address, so a shipment email with its attachments can be forwarded straight into the workspace without downloading and re-uploading each file. Documents arriving together are grouped, which is what enables the cross-document comparison.",
      },
      {
        q: "Does it check the security declaration?",
        a: "It extracts the status, screening method, issuer and timestamp as printed, matches the AWB reference and compares the pieces and weight covered against the consignment. It does not verify that a regulated agent holds a current authorisation, and it does not grant or authenticate security status — those belong to the responsible authority.",
      },
      {
        q: "How does it help with airline acceptance?",
        a: "Most acceptance refusals are documentary inconsistencies — pieces or weights that disagree between documents, a description too generic for customs, a DG declaration that does not match the packing, a missing signature. Catching those before the truck leaves is the difference between a correction and a lost flight.",
      },
      {
        q: "Can it reconcile the freight invoice against the AWB?",
        a: "Yes. Charge lines from the invoice are compared against the rated weight and charges shown on the air waybill, with duplicate and unsupported lines reported. Whether a charge was contractually agreed depends on your rate agreement, which you can add to the shipment for comparison.",
      },
      {
        q: "Does it work for imports as well as exports?",
        a: "Yes. The same documents and comparisons apply to inbound consignments, where the emphasis shifts toward checking what arrived against what was ordered and invoiced, and toward the charges on the destination invoice.",
      },
      {
        q: "What if my forwarder uses their own form layouts?",
        a: "Field models are built per document type rather than per layout, so an SLI on an unfamiliar forwarder's form or a house air waybill from a new partner extracts without setup. There are no templates to configure and nothing to update when a partner redesigns their paperwork.",
      },
    ],
    related: [
      { href: "/tools/air-cargo-document-checklist", label: "Air cargo document checklist", blurb: "Work out which documents your shipment actually needs before booking." },
      { href: "/air-waybill-parser", label: "Air waybill parser", blurb: "Extract MAWB and HAWB documents with check-digit validation." },
      { href: "/features/mawb-hawb-reconciliation", label: "MAWB and HAWB reconciliation", blurb: "Reconcile a consolidation's houses against the master." },
      { href: "/air-freight", label: "Air freight overview", blurb: "How the whole air workflow fits together, end to end." },
    ],
  },

  "mawb-hawb-reconciliation": {
    updated: "2026-08-04",
    keywords: [
      "MAWB HAWB reconciliation",
      "air consolidation check",
      "house air waybill totals",
      "master air waybill reconciliation",
      "air manifest reconciliation",
      "consolidation discrepancy",
      "air freight consolidation control",
    ],
    quickAnswer: {
      heading: "What reconciliation checks",
      body:
        "That the house air waybills, the cargo manifest and the master air waybill agree. House pieces and weights are aggregated and compared against the master's declared totals, parent references and routing are checked for consistency, and any house that appears on the manifest without a document — or the reverse — is reported.",
      bullets: [
        "House totals aggregated against the master",
        "Parent reference and route consistency",
        "Missing and orphan house documents identified",
        "Master and house level never inferred from format",
      ],
    },
    sections: [
      {
        heading: "Where consolidations drift",
        paragraphs: [
          "A consolidation is built under time pressure from documents produced by different parties at different moments. A house shipment is added after the manifest was printed, a weight is restated after re-weighing at the terminal, a house document is amended and the master is not, or a shipment is pulled from the build and its paperwork stays in the file.",
          "None of those are exotic, and none are visible from any single document. They surface at destination, when house-level customs entries fail to reconcile against the manifested consignment — by which point the cargo has landed and the cost of resolution has multiplied.",
        ],
        bullets: [
          "A house shipment added to the build after the manifest was produced",
          "A house shipment pulled from the build with its documents left in the set",
          "Weights restated after re-weighing without the master being updated",
          "A house air waybill amended while the manifest keeps the original figures",
          "Parent reference missing or wrong on a house document",
          "Routing on a house document inconsistent with the master's routing",
          "Duplicate house references from a co-loader's own sequence",
        ],
      },
      {
        heading: "The reconciliation",
        numbered: [
          "Identify master and house documents from what each document states about itself, not from the shape of its number.",
          "Confirm each house document carries a parent reference, and that the reference points at the master in the group.",
          "Aggregate pieces, gross weight and chargeable weight across every house document.",
          "Compare the aggregate against the master's declared pieces and gross weight.",
          "Compare both against the manifest's printed totals and against the manifest's own row sum.",
          "Report every house reference present on one side and absent on the other.",
          "Check origin and destination consistency between each house and the master.",
          "Present the non-reconciling records first, since the reconciling majority needs no attention.",
        ],
        callout: {
          tone: "check",
          title: "Work the exceptions, not the recount",
          body:
            "The point of automating this is not that a person could not add up forty house waybills — it is that under a closing flight, they will not. Reducing the task to a short list of non-reconciling records is what makes the check something that actually happens on every consolidation rather than on the ones that go wrong.",
        },
      },
      {
        heading: "Interpreting a difference",
        table: {
          caption: "What common reconciliation gaps usually mean",
          columns: ["Symptom", "Likely cause", "Action"],
          rows: [
            ["Aggregate weight a few kg below master", "Rounding accumulated across many house rows", "Confirm the tolerance and record it"],
            ["Aggregate weight materially below master", "A house shipment missing from the set", "Find the missing house document"],
            ["Aggregate weight materially above master", "A house included that did not travel, or a restated weight", "Confirm the build against the manifest"],
            ["House on manifest, no document", "Document not supplied, or supplied late", "Obtain it before the flight closes"],
            ["Document with no manifest entry", "Shipment pulled from the build, or manifest not reprinted", "Confirm whether the cargo actually travelled"],
            ["Parent reference missing", "House issued before the master was assigned", "Add the parent reference before tender"],
            ["Route differs between house and master", "House prepared for a different routing", "Confirm which routing is correct and amend"],
          ],
        },
      },
      {
        heading: "Why the master and house distinction has to be explicit",
        paragraphs: [
          "Master air waybill numbers follow the eleven-digit IATA structure with a modulus-7 check digit. House references are assigned by forwarders from their own sequences — any length, sometimes alphanumeric, frequently encoding branch or year. There is no reliable way to tell them apart by format, because a forwarder can and does number houses in eleven digits.",
          "Getting this wrong is not cosmetic. Customs entry at destination is generally filed at house level, so a house document misidentified as a master produces an entry filed against the wrong party and a consignment that will not clear. Classification therefore comes from explicit labels and printed parent references, and where a document states neither, the level is recorded as unknown for human review.",
        ],
      },
    ],
    faqs: [
      {
        q: "How does the system distinguish a MAWB from a HAWB?",
        a: "From explicit labels on the document and printed parent references. It does not guess from number format, because forwarders can and do number house documents in eleven digits. Where a document states neither its level nor a parent reference, the level is recorded as unknown for human review rather than assumed.",
      },
      {
        q: "Can multiple house air waybills be checked together?",
        a: "Yes — that is the point of the workflow. Printed piece, gross weight and chargeable weight totals from every house document are aggregated and compared against the master's declared figures and against the manifest, so the whole consolidation is reconciled in one pass.",
      },
      {
        q: "What does a weight difference between houses and master mean?",
        a: "A few kilograms across many houses is usually rounding. A material difference usually means a house shipment is missing from the set, a house was included that did not travel, or a weight was restated after re-weighing without the master being updated. All three are worth resolving before the flight rather than at destination.",
      },
      {
        q: "Does it identify missing house documents?",
        a: "Yes, in both directions. House references listed on the manifest with no corresponding document are reported, and so are documents in the set that do not appear on the manifest. They have different causes — one is usually a document not yet supplied, the other a shipment pulled from the build — and both matter.",
      },
      {
        q: "Are parent references checked?",
        a: "Yes. Each house document should carry a reference to the master it consolidates into, and that reference is checked against the master in the group. A missing parent reference usually means the house was issued before the master was assigned, and it needs adding before tender.",
      },
      {
        q: "Is routing compared between house and master?",
        a: "Yes. Origin and destination on each house document are compared against the master's routing. A house prepared for a different routing than the consolidation actually takes is a real problem — it typically means the shipment was moved between builds and its paperwork was not updated.",
      },
      {
        q: "Why does this matter at destination?",
        a: "Because customs entry on consolidated air freight is generally filed at house level against the manifested consignment. If the manifested totals do not match the sum of the house entries, the entries do not clear cleanly — and resolving that after the cargo has landed is materially harder and more expensive than fixing it at origin.",
      },
      {
        q: "Does it check chargeable weight as well as gross?",
        a: "Yes, where the documents state it. Chargeable weight is kept as a separate field from gross throughout, and both are aggregated independently — a consolidation can reconcile on gross weight and not on chargeable weight, which usually points at a rating difference rather than a cargo one.",
      },
      {
        q: "How many house waybills can be reconciled at once?",
        a: "There is no practical limit for a normal consolidation. Manifests running to many pages are reassembled and every row is extracted, which is precisely the case where manual reconciliation stops happening under time pressure.",
      },
      {
        q: "Does it work with co-loaded consolidations?",
        a: "Yes. Where a manifest references another forwarder's house numbers, those are captured as printed. The reconciliation logic — rows against totals, aggregate against master — is unchanged regardless of who assigned the house references, though duplicate references across co-loaders are flagged.",
      },
      {
        q: "Can I export the reconciliation?",
        a: "Yes. The reconciled set exports with the house rows intact and the findings alongside, which gives the consolidation an auditable record. That matters when a destination query arrives weeks later and the question is what the build actually contained.",
      },
      {
        q: "Does it transmit the manifest to the airline?",
        a: "No. It extracts, checks and exports reviewed data. Manifest transmission to an airline, ground handler or customs authority is a separate regulated process through its own channels.",
      },
    ],
    related: [
      { href: "/air-cargo-manifest-parser", label: "Air cargo manifest parser", blurb: "Extract the manifest rows the reconciliation runs against." },
      { href: "/air-waybill-parser", label: "Air waybill parser", blurb: "Extract master and house documents with check-digit validation." },
      { href: "/tools/air-waybill-number-check", label: "Air waybill number checker", blurb: "Validate master air waybill numbers in bulk." },
      { href: "/features/air-freight-document-automation", label: "Air freight document automation", blurb: "The wider air workflow this reconciliation sits inside." },
    ],
  },

  "airfreight-invoice-audit": {
    updated: "2026-08-04",
    keywords: [
      "airfreight invoice audit",
      "air freight billing check",
      "chargeable weight billing verification",
      "air cargo cost control",
      "freight audit software",
      "duplicate charge detection",
      "AWB invoice reconciliation",
    ],
    quickAnswer: {
      heading: "What the audit compares",
      body:
        "The quotation or rate agreement, the air waybill and the freight invoice, side by side. It checks that the billed weight matches the AWB chargeable weight, that the rate applied is the one quoted for that lane, and that every charge line is supported — flagging duplicates, unsupported charges, currency differences and route conflicts rather than only checking the total.",
      bullets: [
        "Billed weight against AWB chargeable weight",
        "Rate against the quotation you supply",
        "Duplicate and unsupported charge lines",
        "Questioned-amount reporting with evidence",
      ],
    },
    sections: [
      {
        heading: "Where air freight cost leaks",
        paragraphs: [
          "Air freight over-billing is rarely dramatic. It is a chargeable weight rated a few kilograms high, a fuel surcharge at a percentage nobody remembers agreeing, a terminal fee that appears on both the origin and destination invoice under different names, or a rate quoted for one lane applied to another. Each is small; across a year of shipments the aggregate is not.",
          "The reason these persist is that checking them requires holding three documents at once and reading them line by line — which under normal operational load simply does not happen. Automating the comparison is what turns an audit from an annual project into something that runs on every invoice.",
        ],
        bullets: [
          "Chargeable weight billed above the figure on the air waybill",
          "Volumetric divisor applied differently from the contracted one",
          "Rate break not applied where the next band would have cost less",
          "Fuel or security surcharge at a percentage other than the agreed basis",
          "The same service billed twice under two descriptions",
          "Charges for services never rendered — handling, storage, special service",
          "Currency conversion applied to a rate already quoted in local currency",
          "Minimum charge applied above a properly rated weight",
          "A lane rate applied to a routing it was not quoted for",
        ],
      },
      {
        heading: "How the three documents interlock",
        table: {
          caption: "What each document establishes",
          columns: ["Document", "Establishes", "Audit question"],
          rows: [
            ["Quotation or rate agreement", "What was agreed for this lane", "Is this rate the one that applies?"],
            ["Air waybill", "Pieces, gross weight, chargeable weight, rating", "Was the shipment rated on the right weight?"],
            ["Packing list", "Dimensions and actual weights", "Is the AWB chargeable weight itself correct?"],
            ["Freight invoice", "What is being billed, line by line", "Is every line supported and non-duplicated?"],
          ],
          note: "Without the quotation the audit can still find internal inconsistencies and duplicates, but it cannot confirm the rate — because the rate is private information only you hold.",
        },
      },
      {
        heading: "Running an audit",
        numbered: [
          "Add the rate agreement or quotation to the shipment so the comparison has an authority.",
          "Add the air waybill and the freight invoice; add the packing list too if you want the chargeable weight itself verified.",
          "Check the rated basis first — an error in chargeable weight scales through every weight-rated line.",
          "Work the questioned charges: duplicates first, then unsupported lines, then rate and surcharge differences.",
          "Verify surcharge percentages against the contracted basis rather than against the figure that looks familiar.",
          "Check whether a higher rate break would have produced a lower total, which reputable carriers apply automatically and not all do.",
          "Export the questioned-amount report and raise the specific lines in writing, inside the applicable dispute window.",
        ],
        callout: {
          tone: "warn",
          title: "Dispute the line, not the invoice",
          body:
            "Rejecting a whole invoice over one charge delays every legitimate line on it and frequently turns a billing question into a payment default. Identify the specific line, state the amount questioned, attach the evidence, and pay the undisputed remainder where the contract requires it.",
        },
      },
      {
        heading: "Private rates stay private",
        paragraphs: [
          "The audit knows your contracted rate only when you supply it. There is no rate database, no scraped benchmark and no inference from market averages — because a rate you negotiated is commercially sensitive, and a benchmark that is not your contract cannot tell you whether you were billed correctly.",
          "Without a quotation the audit still finds duplicate lines, arithmetic that does not compute, currency inconsistencies, route conflicts and billed weights that disagree with the air waybill. Those are internal contradictions and they do not need your rate to be visible.",
        ],
      },
    ],
    faqs: [
      {
        q: "Does the audit know my private contracted rate?",
        a: "Only when you provide the quotation or rate agreement. There is no rate database, no scraped benchmark and no inference from market averages. Without your rate the audit still finds duplicates, arithmetic errors, currency inconsistencies, route conflicts and weights that disagree with the air waybill — but it cannot tell you whether a rate was the agreed one.",
      },
      {
        q: "Can it calculate volumetric weight?",
        a: "Yes. Where the packing list supplies dimensions, volumetric weight is recomputed at the applicable divisor and compared with the chargeable weight printed on the air waybill and with the weight billed on the invoice. The free chargeable weight calculator runs the same calculation for a shipment that is not in the workspace.",
      },
      {
        q: "How are duplicate charges found?",
        a: "Within one invoice, by comparing charge descriptions and codes for lines that bill the same service twice. Across invoices — the more common case, where origin and destination invoices both carry the same fee under different names — by grouping both invoices to the same shipment, which is where that pattern actually lives.",
      },
      {
        q: "What is a questioned amount?",
        a: "A charge line the audit could not support: it duplicates another line, it has no counterpart in the quotation, its arithmetic does not compute, or it is rated on a weight that disagrees with the air waybill. Questioned amounts are reported with the reason and the evidence, so raising them is a matter of forwarding rather than reconstructing.",
      },
      {
        q: "Does it check surcharges?",
        a: "Surcharge lines are extracted separately with their basis, rate and amount, so a percentage-based surcharge can be checked against the base it should apply to and against the percentage your agreement specifies. Whether a surcharge was agreed at all is a question about your contract, which the audit compares against when you supply it.",
      },
      {
        q: "Can it check rate breaks?",
        a: "The rated weight and the rate applied are extracted as separate fields, which is what you need to test whether the next weight break would have produced a lower total. Reputable forwarders apply the lower of the two automatically; not all do, and it is a two-minute check that occasionally finds real money.",
      },
      {
        q: "What if the invoice references a shipment I do not have?",
        a: "That is itself a finding, and a significant one. An invoice whose air waybill reference does not match any shipment in the workspace is either for someone else's cargo, references a superseded document, or relates to a shipment nobody recorded. All three are worth resolving before payment.",
      },
      {
        q: "How quickly should air freight invoices be audited?",
        a: "On receipt rather than at payment. Dispute windows are often short and sometimes contractual, and a charge queried after the window has closed is generally payable regardless of merit. Auditing at receipt also means the operational people who remember the shipment are still available to answer questions about it.",
      },
      {
        q: "Does it work for forwarder invoices as well as airline invoices?",
        a: "Yes, and forwarder invoices are usually where the complexity is — they bundle airline charges with the forwarder's own services and third-party disbursements. The same line-level model applies, and disbursement lines are captured with whatever supporting reference is printed.",
      },
      {
        q: "Can I audit invoices in bulk?",
        a: "Yes. Invoices arriving by email intake are extracted and matched to their shipments automatically, so the audit runs as documents arrive rather than as a separate batch exercise. The questioned amounts across a period are then a report rather than a project.",
      },
      {
        q: "Does it tell me whether a charge is legitimate?",
        a: "It tells you what was billed, on what basis, at what rate, and whether any document supports it. Whether a charge was contractually agreed is a question about your agreement and what actually happened during the movement — the audit removes the data-gathering, not the judgement.",
      },
      {
        q: "What evidence does it produce for a dispute?",
        a: "A questioned-amount report showing each line, the reason it was questioned, and the source values from the air waybill, quotation and invoice that support the question. A dispute raised with that attached is answered very differently from one raised as an assertion.",
      },
    ],
    related: [
      { href: "/tools/chargeable-weight-calculator", label: "Chargeable weight calculator", blurb: "Verify the rated weight independently before disputing a line." },
      { href: "/freight-invoice-parser", label: "Freight invoice parser", blurb: "Extract charge lines from any freight invoice, air or ocean." },
      { href: "/air-waybill-parser", label: "Air waybill parser", blurb: "Extract the rating evidence the invoice must be traced to." },
      { href: "/guides/chargeable-weight-calculation-air-freight", label: "Chargeable weight guide", blurb: "Divisors, rate breaks and rounding explained in full." },
    ],
  },

  "air-dangerous-goods-readiness": {
    updated: "2026-08-04",
    keywords: [
      "dangerous goods document check",
      "DGD pre-check air cargo",
      "IATA DGR document review",
      "DG readiness air freight",
      "dangerous goods declaration validation",
      "UN number class check",
      "air DG acceptance preparation",
    ],
    quickAnswer: {
      heading: "What the pre-check does",
      body:
        "It extracts dangerous goods declaration evidence consistently and shows what is missing or contradictory before acceptance review begins: signature and date presence, emergency contact, UN number and hazard class structure, packing group, aircraft limitation, and consistency between the declaration, the air waybill and the shipper's letter of instruction. It supports qualified review; it does not replace it.",
      bullets: [
        "Presence and structure checks on every entry",
        "DGD-to-AWB reference and route consistency",
        "Cargo Aircraft Only and forbidden indicators surfaced",
        "Explicitly not a compliance certificate",
      ],
    },
    sections: [
      {
        heading: "Where this sits in a dangerous goods process",
        paragraphs: [
          "Air transport of dangerous goods is governed by the ICAO Technical Instructions, implemented commercially through the IATA Dangerous Goods Regulations. Classification, packing, marking, labelling, quantity limits, documentation, training and acceptance are all regulated, and acceptance is performed by trained personnel working through a formal checklist.",
          "This workflow occupies exactly one position in that process: the moment before the paperwork reaches acceptance. It makes missing signatures, absent emergency contacts, incomplete entries and AWB inconsistencies visible while they are still cheap to fix — because the same failures found at the acceptance counter cost a flight.",
        ],
        callout: {
          tone: "warn",
          title: "This is not an IATA DGR compliance certificate",
          body:
            "It does not classify substances, does not confirm that a packing instruction suits a given material, does not check quantity limits against the regulations, and does not account for state and operator variations. Every finding goes to a qualified dangerous goods specialist, and nothing here substitutes for trained acceptance personnel working to the current regulations.",
        },
      },
      {
        heading: "What is checked",
        table: {
          caption: "Pre-check coverage",
          columns: ["Area", "Check", "Nature of the check"],
          rows: [
            ["Execution", "Signatory name, title, place, date and signature presence", "Presence"],
            ["Emergency", "Emergency contact name and telephone number present", "Presence"],
            ["Entries", "UN or ID number four-digit structure with a proper shipping name alongside", "Structure"],
            ["Entries", "Hazard class or division against the valid set of identifiers", "Structure"],
            ["Entries", "Packing group present where the entry requires one", "Presence"],
            ["Entries", "Packing instruction and quantity present per entry", "Presence"],
            ["Limitation", "Aircraft limitation captured; Cargo Aircraft Only surfaced prominently", "Extraction"],
            ["Limitation", "Printed forbidden indication raised as a stop-level finding", "Extraction"],
            ["Cross-document", "AWB reference on the declaration matched to the air waybill", "Consistency"],
            ["Cross-document", "Shipper, consignee and airports consistent across DGD, AWB and SLI", "Consistency"],
            ["Cross-document", "Dangerous goods annotation present on the air waybill", "Consistency"],
          ],
          note: "Every check is presence, structure or consistency. None of them is a regulatory determination, because a document parser cannot make one.",
        },
      },
      {
        heading: "Why the checks are deliberately narrow",
        paragraphs: [
          "It would be technically straightforward to look up a UN number, find its assigned proper shipping name and class, and report a mismatch. It would also be dangerous, because the assignment depends on the regulations edition in force, on any applicable special provisions, and sometimes on the specific formulation being shipped — none of which is knowable from the declaration alone.",
          "A tool that appeared to validate classification would invite reliance it cannot support. The checks are therefore confined to what can be established with certainty from the document: is this field present, does this value have the right shape, do these two documents agree. Everything requiring judgement is presented to the person qualified to make it.",
        ],
      },
      {
        heading: "The failures this catches before acceptance",
        bullets: [
          "Declaration unsigned, or missing the signatory's name, title, place or date",
          "Emergency contact number absent",
          "An entry missing its packing group, packing instruction or quantity",
          "A UN number without a proper shipping name, or a malformed class identifier",
          "Aircraft limitation on the declaration inconsistent with the air waybill annotation",
          "Air waybill carrying no dangerous goods annotation where a declaration exists",
          "Declaration referencing an AWB number that does not match the consignment",
          "Shipper, consignee or airports differing between the DGD, AWB and SLI",
          "A printed forbidden indication that needs specialist attention immediately",
        ],
      },
      {
        heading: "How to use it in a workflow",
        numbered: [
          "Add the dangerous goods declaration, the air waybill and the shipper's letter of instruction to the shipment.",
          "Address stop-level findings first — a forbidden indication or an unsigned declaration blocks acceptance outright.",
          "Resolve presence failures next, since a missing emergency contact or packing instruction is a certain refusal.",
          "Review cross-document inconsistencies, which usually indicate one document was amended and another was not.",
          "Hand the complete, reviewed record to qualified dangerous goods personnel for the acceptance check the regulations require.",
          "Retain the reviewed record with the shipment, because dangerous goods documentation is routinely requested after the fact.",
        ],
      },
    ],
    faqs: [
      {
        q: "Is this an IATA DGR compliance certificate?",
        a: "No. It is a document pre-check that supports qualified review. It does not replace the current IATA Dangerous Goods Regulations, carrier and state variations, or trained acceptance personnel. Every finding is intended to reach a qualified specialist rather than to conclude anything on its own.",
      },
      {
        q: "What happens when a document says the item is forbidden?",
        a: "A printed forbidden aircraft limitation is raised as a stop-level finding and the workflow directs the user to qualified dangerous goods review. It is deliberately not treated as an ordinary field value, because it is the one indication on the document that should halt everything else.",
      },
      {
        q: "Does it verify that a UN number matches its proper shipping name?",
        a: "No, deliberately. That assignment depends on the regulations edition in force, applicable special provisions and sometimes the specific formulation — none of which is knowable from the declaration alone. Presenting a lookup as validation would invite reliance the check cannot support. Structure is verified; classification is not.",
      },
      {
        q: "What is actually checked then?",
        a: "Presence, structure and consistency. Presence: signature, date, emergency contact, packing group, packing instruction and quantity per entry. Structure: four-digit UN numbers with a proper shipping name alongside, valid hazard class identifiers. Consistency: that the declaration, air waybill and shipper's letter of instruction agree on references, parties, airports and the DG annotation.",
      },
      {
        q: "Why does the emergency contact matter so much?",
        a: "Because a missing or unmonitored emergency contact number is a routine acceptance refusal. What the check can confirm is that a number is present; what it cannot confirm is that the number will be answered throughout transport, which is the substantive requirement and remains a human confirmation.",
      },
      {
        q: "Does it check quantity limits?",
        a: "No. Quantity limits depend on the substance, the packing instruction, the aircraft type and any applicable variations, and getting that wrong has safety consequences. The declared quantity and the packing instruction are both extracted so a trained assessor can check them; the assessment itself is not automated.",
      },
      {
        q: "What are state and operator variations?",
        a: "Additional restrictions imposed by individual states or airlines beyond the base regulations — prohibiting substances that are otherwise acceptable, or imposing stricter limits. They vary by origin, transit and destination and change regularly, so they must be checked against current sources for the specific routing by someone qualified to read them.",
      },
      {
        q: "Does it check the air waybill annotation?",
        a: "Yes. Where a dangerous goods declaration is grouped with an air waybill, the presence of a dangerous goods reference on the AWB is checked, and the aircraft limitation is compared between the two documents. An AWB with no annotation where a declaration exists is a straightforward and common acceptance failure.",
      },
      {
        q: "Can it handle declarations with several entries?",
        a: "Yes. Each dangerous goods entry is extracted as its own structured record with its UN number, proper shipping name, class, subsidiary risk, packing group, quantity and packing instruction, and multi-page declarations are reassembled. Submit the complete set, since entries routinely run across a page break.",
      },
      {
        q: "Does it confirm the signatory holds current DG training?",
        a: "No. It confirms that a name, title, place, date and signature are present. Whether that person holds current dangerous goods training is verified through training records held by the shipper and checked at acceptance — it is not printed on the declaration in a machine-verifiable form.",
      },
      {
        q: "Does this cover sea freight dangerous goods?",
        a: "This workflow is built around the air dangerous goods declaration used under the IATA Dangerous Goods Regulations. Sea transport is governed by the IMDG Code with a different declaration format and different requirements, and a sea DG declaration is treated as a different document type rather than forced into the air model.",
      },
      {
        q: "Who should be using this?",
        a: "The person preparing or reviewing the documents before tender — typically an export coordinator or forwarder operations role — with every finding passed to qualified dangerous goods personnel. It is designed to make a specialist's review faster and better-informed, not to substitute for having one.",
      },
    ],
    related: [
      { href: "/dangerous-goods-declaration-parser", label: "Dangerous goods declaration parser", blurb: "Extract declaration evidence into a structured, reviewable record." },
      { href: "/tools/air-cargo-document-checklist", label: "Air cargo document checklist", blurb: "Assemble the full DG document set before booking." },
      { href: "/air-waybill-parser", label: "Air waybill parser", blurb: "Extract the AWB the declaration must be referenced on." },
      { href: "/accuracy-and-limitations", label: "Accuracy and limitations", blurb: "The explicit boundary of what these checks establish." },
    ],
  },

  "email-in-document-ingestion": {
    updated: "2026-08-04",
    keywords: [
      "email document intake",
      "forward shipping documents to software",
      "email in freight documents",
      "no upload document processing",
      "shipment email automation",
      "attachment processing logistics",
      "email to workspace freight",
    ],
    quickAnswer: {
      heading: "How email-in works",
      body:
        "Every signed-in account gets a private intake address. Forward a shipment email and its attachments go straight into your workspace — extracted, checked and grouped into a shipment record — with a reply carrying secure links to the result and a discrepancy PDF when the connected documents produce cross-document findings. Manual upload remains available alongside it.",
      bullets: [
        "Private, rotatable intake address per account",
        "Up to 20 attachments per message",
        "Automatic shipment grouping",
        "Reply with links and a discrepancy report",
      ],
    },
    sections: [
      {
        heading: "Documents already arrive by email",
        paragraphs: [
          "Freight paperwork moves through email. Suppliers send invoices and packing lists, carriers send booking confirmations and arrival notices, forwarders send drafts for approval. Adding a portal to that flow means downloading every attachment and re-uploading it somewhere else — pure handling with no value added, performed dozens of times a day.",
          "Email-in removes the round trip. Forwarding the message you already received puts its attachments into the workspace directly, which also preserves the natural grouping: documents that arrived together are usually documents about the same shipment.",
        ],
      },
      {
        heading: "What happens to a forwarded message",
        numbered: [
          "The message arrives at your private intake alias and the sender is checked against the account's expectations.",
          "Attachments are validated by file signature rather than by extension, so a file claiming to be a PDF but containing something else is rejected before processing.",
          "Supported attachments are saved to your workspace; unsupported ones are reported in the reply rather than silently dropped.",
          "Each document is classified, extracted and validated exactly as an uploaded document would be.",
          "Documents from the same message are grouped into a shipment record, and matched to an existing shipment where the references align.",
          "Cross-document checks run across the group, producing a discrepancy report where findings exist.",
          "The sender receives a reply with secure workspace links and, where applicable, the discrepancy PDF attached.",
        ],
        callout: {
          tone: "info",
          title: "The reply is the confirmation, not the answer",
          body:
            "It tells you what was accepted, what was not, and where to look. It does not assert that every extracted value is correct — automated extraction and checks support review, and operationally important values should still be confirmed against the source documents, which the links take you to.",
        },
      },
      {
        heading: "Limits and what is accepted",
        table: {
          caption: "Email intake constraints",
          columns: ["Constraint", "Limit"],
          rows: [
            ["Attachment formats", "PDF, JPG, PNG and WebP"],
            ["Attachments per message", "Up to 20"],
            ["Message size", "Within the 25 MiB intake limit"],
            ["Validation", "File signature checked, not just the extension"],
            ["Unsupported attachments", "Reported in the reply, not silently dropped"],
            ["Address", "One private alias per account, rotatable at any time"],
          ],
        },
      },
      {
        heading: "Treating the address as a credential",
        paragraphs: [
          "The intake address is private but it is not authenticated in the way a login is. Anyone who has it can place supported documents into that workspace. That is deliberate — it is what allows a colleague or a partner to forward directly without an account — and it means the address should be treated with the same care as any other operational credential.",
        ],
        bullets: [
          "Share it only with the team and partners who should be forwarding",
          "Do not publish it on a website, a signature block or a public-facing form",
          "Rotate it immediately if it is exposed or if someone with access leaves",
          "Review what has arrived periodically rather than assuming everything forwarded was intended",
          "Use manual upload where a document is sensitive enough that its route matters",
        ],
        callout: {
          tone: "warn",
          title: "Rotate the address if it leaks",
          body:
            "Rotation issues a new alias and retires the old one. Because the address is an intake route rather than an identity, a leaked address is a nuisance rather than an account compromise — but a nuisance that fills a workspace with other people's documents is still worth closing quickly.",
        },
      },
      {
        heading: "When to use email-in and when to upload",
        paragraphs: [
          "Email-in suits inbox-driven work: documents arriving continuously from many counterparties, where the alternative is downloading and re-uploading each one. Manual upload suits deliberate, one-off processing — a document you are already holding, or one you want to check before it enters the workspace.",
          "For higher-volume structured flows, neither is really the answer. An API or a system-to-system connection is better suited once documents are being produced by another system rather than sent by a person, and email should not be forced into that role.",
        ],
      },
    ],
    faqs: [
      {
        q: "Which email attachments are supported?",
        a: "PDF, JPG, PNG and WebP. One message can carry up to 20 attachments and must remain within the 25 MiB intake limit. Attachments are validated by file signature rather than extension, so a file whose contents do not match its claimed type is rejected before processing.",
      },
      {
        q: "Is this a second email inbox?",
        a: "No. It is a routing alias, not a mailbox. You keep using Gmail, Outlook or your operations mailbox exactly as before; forwarding to the alias places supported attachments directly into your signed-in workspace. There is nothing to check and no second inbox to maintain.",
      },
      {
        q: "Is the email-in address private?",
        a: "It is a private, account-specific address, but it is an intake route rather than an authenticated login. Anyone holding it can add supported documents to that workspace, so share it only with the intended forwarding team, keep it off public-facing pages, and rotate it if it is exposed.",
      },
      {
        q: "How do I rotate the address?",
        a: "From the email-in screen in your workspace. Rotation issues a new alias and retires the old one immediately, so anything sent to the previous address stops arriving. Do it whenever the address may have been exposed or when someone with access leaves the team.",
      },
      {
        q: "Why use email instead of requiring an API?",
        a: "Because email works immediately with the channel freight teams and their partners already use, with no integration project and no cooperation needed from the counterparty sending the document. Manual upload remains available, and API or TMS connections are the better fit once documents are being produced by systems rather than sent by people.",
      },
      {
        q: "Does email-in replace manual upload?",
        a: "No. It removes the download-and-re-upload round trip for inbox-based work, while single-document and batch upload remain available. Upload is still the right route for a document you are already holding, or one you want to look at before it enters the workspace.",
      },
      {
        q: "Are documents grouped into shipments automatically?",
        a: "Yes. Documents arriving in the same message are grouped, and the group is matched to an existing shipment where references align — B/L number, booking, invoice or container numbers. Grouping can be adjusted manually where a reference is missing or a shipment spans several messages.",
      },
      {
        q: "What does the reply contain?",
        a: "Confirmation of what was accepted and what was not, secure links into the workspace records, and — where the connected documents produced cross-document findings — a generated discrepancy PDF attached. Unsupported attachments are named in the reply rather than silently discarded.",
      },
      {
        q: "Does the reply guarantee every extracted value is correct?",
        a: "No. Automated extraction and checks support review; they do not replace it. Operationally important values — container numbers, weights, declared values, dates — should still be verified against the attached source documents, which is what the workspace links are for.",
      },
      {
        q: "What happens to attachments that cannot be processed?",
        a: "They are reported in the reply with the reason: unsupported format, failed signature validation, or exceeding the message limits. Nothing is dropped without being named, because a silently discarded arrival notice is exactly the failure that costs free time.",
      },
      {
        q: "Can several people forward to the same address?",
        a: "Yes, and that is a common pattern — an operations team all forwarding into one workspace. Everything arrives in the same account, so grouping and shipment matching work across the whole team's forwarding rather than being fragmented by who sent it.",
      },
      {
        q: "Is email-in available on the free plan?",
        a: "Email-in is a workspace feature that requires a signed-in account. Which plans include it and at what volume is set out on the pricing page; anonymous document parsing without an account remains available for a first document.",
      },
    ],
    related: [
      { href: "/app/email-in", label: "See your intake address", blurb: "Open the email-in screen in your workspace to get or rotate your alias." },
      { href: "/features/shipment-document-matching", label: "Shipment matching", blurb: "What happens to documents once they are grouped by a forwarded email." },
      { href: "/sample-discrepancy-report", label: "Sample discrepancy report", blurb: "See the report that comes back attached to the reply." },
      { href: "/security", label: "Security and data handling", blurb: "How intake is validated and how workspace data is isolated." },
    ],
  },
};
