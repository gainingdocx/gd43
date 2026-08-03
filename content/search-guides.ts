import type { GuideDefinition } from "@/content/guides";

export const SEARCH_GUIDES: GuideDefinition[] = [
  {
    slug: "demurrage-detention-calculation-guide",
    title: "Demurrage and Detention: Calculation, Free Time, Examples & Invoice Audit",
    seoTitle: "Demurrage Calculator & Detention Guide: Free Time, Charges",
    description: "Calculate demurrage and detention with free-time dates, tiered rates and worked examples. Audit invoices and understand the software features that prevent charges.",
    readMinutes: 18,
    updated: "2026-07-31",
    tool: {
      href: "/tools/demurrage-detention-calculator",
      label: "Calculate demurrage or detention",
      title: "Check your dates and charges",
      description: "Use the free calculator to choose demurrage, detention or combined D&D; define the day-count convention; enter free time and tiered rates; and export a calculation audit.",
    },
    sections: [
      {
        heading: "Demurrage and detention in plain English",
        paragraphs: [
          "Demurrage and detention are time-based container charges. They are related, but they normally apply to different parts of the container journey. Demurrage generally concerns a carrier container remaining inside a terminal, port or depot after the agreed free time. Detention generally concerns the customer holding the carrier’s container outside that location after free time. Some tariffs combine both periods into one continuous allowance.",
          "The practical question is not simply “How many days passed?” A reliable calculation must identify the correct charge, the contractual start event, the end event, the number and type of free days, whether the first day counts, whether weekends or holidays count, the equipment category, and the rate tier that applies to each chargeable day.",
        ],
        bullets: [
          "Import demurrage commonly runs from discharge or availability until the full container gates out.",
          "Import detention commonly runs from full-container gate-out until the empty container is returned.",
          "Export demurrage and detention use different milestones, often involving empty pickup, full gate-in and vessel loading.",
          "Terminal storage may be separate from carrier demurrage and must not be silently treated as the same charge.",
        ],
      },
      {
        heading: "Demurrage vs detention vs storage",
        paragraphs: [
          "Demurrage relates to use of carrier equipment while it remains inside the terminal or depot beyond free time. Detention relates to use of that equipment outside the terminal. Storage is compensation for occupying terminal or depot space and may be invoiced by the terminal, carrier or another party depending on the local arrangement.",
          "Names are not perfectly consistent across countries and contracts. A carrier may publish separate demurrage and detention schedules, a combined D&D schedule, or a schedule in which storage is separately billed. Always follow the definition in the tariff, service contract, booking confirmation or carrier terms that govern the shipment.",
        ],
      },
      {
        heading: "The demurrage calculation formula",
        paragraphs: [
          "For a simple single-rate tariff: chargeable days = counted elapsed days − free days, with a minimum of zero. Demurrage charge = chargeable days × daily demurrage rate. If the tariff is progressive, allocate the first block of chargeable days to tier 1, the next block to tier 2, and all later days to the final tier before adding fixed or administrative charges.",
          "Example: a container has 5 free calendar days. The applicable counted period is 12 days. Seven days are chargeable. If the first 3 chargeable days cost USD 75 per day and later days cost USD 125 per day, the time charge is (3 × 75) + (4 × 125) = USD 725. A separate USD 40 administration fee would produce an estimated total of USD 765.",
        ],
      },
      {
        heading: "How to calculate demurrage charges step by step",
        paragraphs: [
          "Start with evidence, not assumptions. Obtain the booking or service contract, carrier tariff, arrival notice, terminal availability record, gate event, empty-return receipt and invoice. Record the timezone and event wording because “discharged,” “available,” “free time starts” and “last free day” are not interchangeable.",
        ],
        bullets: [
          "Identify whether the invoice is demurrage, detention, combined D&D or terminal storage.",
          "Confirm the container number, size/type, import or export movement and applicable location.",
          "Find the contractual start and end events and their dates.",
          "Confirm whether the start date is included or excluded.",
          "Confirm calendar days, working days and any holiday treatment.",
          "Deduct the correct free-time allowance.",
          "Apply each progressive rate tier only to the days falling inside that tier.",
          "Add authorized fixed charges, taxes or administrative fees separately.",
          "Compare the calculation with the invoice and preserve the evidence used.",
        ],
      },
      {
        heading: "Free time and the last free day",
        paragraphs: [
          "Free time is the agreed period during which the relevant demurrage, detention, combined D&D or storage charge is not payable. It may come from the public tariff, a negotiated service contract, a spot booking or purchased additional free time. The last free day is the final counted day before the time-based rate begins.",
          "Do not calculate a last free day by adding a number to an ETA. ETA may change and may not be the contractual trigger. Use the actual event named in the governing terms—such as discharge, availability, full gate-out or empty pickup—and apply the stated calendar, working-day and inclusion rules.",
        ],
      },
      {
        heading: "Calendar days, working days and inclusive dates",
        paragraphs: [
          "Many carrier schedules count calendar days, including weekends and holidays. Other arrangements use working days or exclude specified non-working days. Some tariffs include both the start and end date; others begin counting on the following day. A one-day convention error can move a charge into a more expensive tier.",
          "A Monday–Friday calculator is not automatically a complete working-day calculator because local public holidays, terminal closures and force-majeure provisions may also matter. Treat the calculator as an audit worksheet and confirm exceptions from the governing source.",
        ],
      },
      {
        heading: "Worked detention-time example",
        paragraphs: [
          "Assume an import container gates out full on Friday 3 July and is returned empty on Monday 13 July. The contract excludes the gate-out day and counts Monday through Friday only. There are six counted weekdays: 6, 7, 8, 9, 10 and 13 July. With two free working days, four days are chargeable.",
          "If the first three chargeable days cost USD 50 each and later days cost USD 100, detention is (3 × 50) + (1 × 100) = USD 250. If the tariff instead uses inclusive calendar days, the answer is materially different. This is why the calculation should show its day basis and start-date convention.",
        ],
      },
      {
        heading: "How to audit a demurrage or detention invoice",
        paragraphs: [
          "Recalculate every billed container separately. Confirm that the invoice uses the correct contractual party, container, location, movement, event dates, free-time source, rate schedule and currency. Compare the invoice’s first and last charged day with terminal and carrier event evidence.",
          "For U.S. ocean transportation, the Federal Maritime Commission’s billing rule contains requirements concerning who may be billed, invoice timing, required information and the process for mitigation, refund or waiver requests. The legal position can evolve, so consult the current FMC materials and obtain professional advice for a live dispute.",
        ],
        bullets: [
          "Container number and bill of lading or booking reference",
          "Correct billed party and billing issuer",
          "Start and end dates with supporting event records",
          "Free days and any negotiated extension",
          "Calendar/working-day and inclusive/exclusive convention",
          "Equipment-specific tiered rates",
          "Duplicate terminal storage or overlapping invoices",
          "Mitigation, waiver or dispute contact and deadline",
        ],
      },
      {
        heading: "What good demurrage and detention software should provide",
        paragraphs: [
          "A calculator is useful for a single invoice. Operational D&D software should go further: centralize containers, capture carrier and terminal milestones, store free-time rules, calculate last free dates, alert teams before exposure begins, preserve evidence, support invoice reconciliation and show patterns by carrier, port, customer and responsible workflow.",
          "Competitor platforms emphasize real-time container visibility, at-risk alerts, exception workflows, charge estimates, evidence management, collaboration and analytics. Those capabilities matter because preventing a charge is normally more valuable than calculating it after an invoice arrives.",
        ],
        bullets: [
          "Container-level event timeline and source evidence",
          "Separate and combined free-time rules",
          "Configurable calendar, holiday and inclusive-date logic",
          "Tiered rates by carrier, port, equipment and movement",
          "Alerts before last free day and before each rate increase",
          "Owner, task and exception status",
          "Invoice matching, dispute package and audit export",
          "Cost and root-cause analytics",
        ],
      },
      {
        heading: "How to reduce demurrage and detention",
        paragraphs: [
          "Prevention begins before arrival. Confirm document cutoffs, customs readiness, payment and original-document or release requirements. Arrange drayage capacity and delivery appointments early. Track discharge, availability, holds and last free day. Confirm the empty-return location because depots can change, and retain screenshots or messages if a valid return appointment is unavailable.",
          "After each exception, record the cause instead of treating the charge as an isolated finance item. Repeated costs may point to late documents, customs delays, unavailable appointments, warehouse congestion, incorrect free-time master data or poor handoffs between operations and transport providers.",
        ],
      },
      {
        heading: "Common demurrage calculation mistakes",
        paragraphs: [
          "Typical errors include starting from ETA instead of the tariff event, confusing demurrage with detention, applying one free-time allowance to separate charges, ignoring combined D&D terms, excluding weekends without authority, using the wrong equipment rate, calculating all days at the highest tier, and overlooking purchased or negotiated free time.",
          "Another frequent error is relying on a calculator without saving inputs. An audit should show the exact dates, rules, rates and source documents used so another person can reproduce the result.",
        ],
      },
    ],
    faqs: [
      { q: "How is demurrage calculated?", a: "Count the days between the contractual start and end events using the tariff’s date convention, deduct free time, allocate the remaining days across the applicable rate tiers and add authorized fixed charges." },
      { q: "What is the difference between demurrage and detention?", a: "Demurrage generally applies while a carrier container remains inside a terminal or depot beyond free time; detention generally applies while it remains outside in the customer’s possession. Governing terms control." },
      { q: "Do weekends count in demurrage calculations?", a: "They often do when a tariff uses calendar days, but not every contract is the same. Confirm the carrier tariff or service contract and any local holiday rules." },
      { q: "What is a detention time calculator?", a: "It counts the applicable period outside the terminal, deducts detention free time and applies the agreed daily rate tiers. A useful calculator also discloses its start-date and working-day assumptions." },
      { q: "Can demurrage and detention be combined?", a: "Yes. Some tariffs provide one combined free-time period covering both the inside-terminal and outside-terminal portions of the container cycle." },
      { q: "Is the calculator a carrier invoice?", a: "No. It is an independent audit estimate. The booking, tariff, contract, event evidence and applicable law determine the payable amount." },
    ],
    sources: [
      { name: "Maersk — What is demurrage and detention?", url: "https://www.maersk.com/logistics-explained/transportation-and-freight/2023/08/28/what-is-demurrage-detention-in-shipping-for-buyers", note: "Carrier explanation of demurrage, detention and free time." },
      { name: "Maersk — Detention and demurrage terms", url: "https://terms.maersk.com/dnd", note: "Carrier definitions for free time, storage, separate and combined D&D." },
      { name: "Federal Maritime Commission — D&D billing rule", url: "https://www.fmc.gov/articles/fmc-publishes-final-rule-on-detention-and-demurrage-billing-practices/", note: "U.S. regulatory overview of billing, timing and dispute requirements." },
      { name: "Beacon — Demurrage and detention visibility", url: "https://beacon.com/solutions/demurrage-and-detention", note: "Competitor workflow reference for alerts, dwell visibility and root-cause analysis." },
      { name: "FourKites — Ocean visibility", url: "https://www.fourkites.com/platform/ocean-freight-visibility/", note: "Competitor workflow reference for exposure monitoring and exception prioritization." },
    ],
  },
  {
    slug: "chargeable-weight-calculation-air-freight",
    title: "Chargeable Weight Calculator Guide: Air Freight, Volumetric Weight & Examples",
    seoTitle: "Chargeable Weight Calculator Guide: Air Freight Formula",
    description: "Learn how to calculate air-freight and courier chargeable weight in kg or lb, choose the correct divisor, handle multiple packages, rounding and invoice checks.",
    readMinutes: 14,
    updated: "2026-07-31",
    tool: {
      href: "/tools/chargeable-weight-calculator",
      label: "Use the chargeable weight calculator",
      title: "Calculate every package line",
      description: "Compare actual and volumetric weight per package group, apply air-cargo, express or custom divisors, choose rounding, estimate freight and export a CSV audit.",
    },
    sections: [
      { heading: "What is chargeable weight?", paragraphs: ["Chargeable weight is the weight used to rate a shipment. For air freight and express parcels, it is generally the higher of actual gross weight and volumetric (dimensional) weight under the carrier’s tariff. The comparison protects the carrier from pricing a large, lightweight shipment only by its scale weight.", "Actual weight is measured on a scale and should include the complete shipping unit, packaging and pallet where applicable. Volumetric weight converts the external space occupied by that shipping unit into an equivalent weight. Chargeable weight is the billable result after applying the tariff’s comparison and rounding rules."] },
      { heading: "Air-freight chargeable weight formula", paragraphs: ["For dimensions in centimetres under a 6,000 cm³/kg factor: volumetric kg = length × width × height × pieces ÷ 6,000. Then compare the volumetric result with actual gross kg. The higher value is chargeable, subject to the airline or forwarder’s rounding and minimum rules.", "The IATA knowledge hub describes division of cubic centimetres by 6,000 as a general air-cargo rule. A contract or carrier tariff can specify another factor, so the entered divisor must come from the quote or rate agreement rather than from a search result alone."] },
      { heading: "Express courier formula: divisor 5,000", paragraphs: ["Many express services use a 5,000 cm³/kg factor. Because the divisor is lower, the same carton produces a higher volumetric weight than it would at 6,000. A carton measuring 80 × 50 × 40 cm has 160,000 cm³ of volume: 26.67 kg at divisor 6,000 but 32 kg at divisor 5,000.", "Do not label every 5,000 calculation “DHL,” “FedEx” or “UPS” without checking the actual service and contract. Divisors, unit systems, rounding, minimums and special-shape rules can vary by product and market."] },
      { heading: "Chargeable weight in inches and pounds", paragraphs: ["For an imperial tariff expressed in cubic inches per pound, divide cubic inches by the stated factor. Common reference factors are 166 in³/lb for general air cargo and 139 in³/lb for express, but the governing tariff controls.", "Do not divide cubic inches by a metric divisor such as 6,000. Convert the dimensions or use a calculator that keeps the divisor basis explicit. Mixing units can understate or overstate the result dramatically."] },
      { heading: "Worked example where actual weight wins", paragraphs: ["Five cartons measure 50 × 40 × 40 cm and weigh 30 kg each. Their total actual weight is 150 kg. At divisor 6,000, volumetric weight is (50 × 40 × 40 × 5) ÷ 6,000 = 66.67 kg. The chargeable weight before tariff rounding is therefore 150 kg because actual weight is higher."] },
      { heading: "Worked example where volumetric weight wins", paragraphs: ["Three cartons measure 80 × 60 × 60 cm and weigh 10 kg each. Total actual weight is 30 kg. At divisor 6,000, volumetric weight is (80 × 60 × 60 × 3) ÷ 6,000 = 144 kg. The shipment is charged at 144 kg before any tariff rounding because the space-based result is higher."] },
      { heading: "Multiple package sizes and line-by-line rating", paragraphs: ["When cartons differ, enter each size group separately. Calculate quantity, actual total and volumetric total for that group, then apply the comparison and rounding method required by the tariff. Some rates compare and round at shipment total; others rate pieces or lines separately. The enhanced GainingDocx calculator exposes line results so an invoice can be reproduced.", "Avoid averaging unlike dimensions. Average length × average width × average height does not necessarily equal the total physical volume of the original cartons."] },
      { heading: "Rounding and minimum chargeable weight", paragraphs: ["Rounding can apply to dimensions, each package, each cargo line or the final shipment total. For example, a tariff may round dimensions up to whole centimetres and chargeable weight up to the next 0.5 kg or whole kilogram. Apply rounding in the same order as the tariff.", "A minimum chargeable weight or minimum freight charge can still control even when the dimensional calculation is correct. The free calculator estimates rate × chargeable weight but does not infer undocumented minimums or surcharges."] },
      { heading: "Air chargeable weight vs ocean LCL W/M", paragraphs: ["Ocean LCL commonly uses weight or measure revenue tons rather than the air-freight dimensional divisor. Under a common W/M basis, compare CBM with metric tons and apply the higher revenue-ton figure, subject to the quote’s minimum and rounding rules. Use the separate LCL freight calculator for that calculation.", "Do not divide ocean CBM by 6,000 or apply a courier factor to LCL freight unless the actual contract explicitly says so."] },
      { heading: "How to audit a freight invoice", paragraphs: ["Compare the invoice against the final packing list and measured cargo. Check package count, external dimensions, gross weight, unit system, divisor, rounding point, currency, rate, minimums and surcharges. If the forwarder remeasured the cargo, request the measurement record and identify whether pallet dimensions or overhang changed the result."], bullets: ["Confirm dimensions are external packed dimensions.", "Include pallets and packaging in actual weight.", "Use the tariff’s divisor and unit basis.", "Reproduce per-line or shipment-level rounding.", "Check the billed rate and minimum freight charge.", "Save an export of the calculation with the source documents."] },
      { heading: "Ways to reduce chargeable weight", paragraphs: ["Reduce unused space without compromising cargo protection. Right-size cartons, remove unnecessary void fill, redesign inner packs, avoid pallet overhang and compare consolidation arrangements. Recalculate before approving a packaging change because a smaller carton can reduce volumetric weight even when actual weight stays the same.", "For dense cargo, packaging reductions may not change chargeable weight because actual weight remains higher. Operational safety, product damage risk and handling requirements take priority over dimensional savings."] },
      { heading: "Common chargeable-weight mistakes", paragraphs: ["The most common mistakes are choosing the wrong divisor, mixing centimetres with inches, omitting quantity, using net rather than gross weight, ignoring pallets, averaging package sizes, comparing only grand totals when the tariff rates per line, and overlooking rounding or minimum charges.", "A useful calculator should show the divisor, actual weight, volumetric weight, chargeable result and rounding assumption instead of displaying a single unexplained number."] },
    ],
    faqs: [
      { q: "How do I calculate chargeable weight?", a: "Calculate volumetric weight with the contracted divisor, compare it with actual gross weight, and use the higher result before applying the tariff’s rounding and minimum rules." },
      { q: "What is the air-freight volumetric divisor?", a: "6,000 cm³/kg is a common general air-cargo factor. Express services often use 5,000 cm³/kg. Always confirm the actual carrier or forwarder tariff." },
      { q: "What is the formula in inches?", a: "For an imperial tariff, divide cubic inches by the stated in³/lb factor—commonly 166 for general air cargo or 139 for express—then compare with actual pounds." },
      { q: "Should I calculate each carton separately?", a: "Group cartons with identical dimensions and actual weight. Whether comparison and rounding occur per line or at shipment level depends on the tariff, so preserve line details." },
      { q: "Is chargeable weight the same as gross weight?", a: "No. Gross weight is the measured packed weight. Chargeable weight is the billable result after comparing gross weight with volumetric weight." },
    ],
    sources: [
      { name: "IATA — Air cargo tariffs and rules", url: "https://www.iata.org/en/publications/newsletters/iata-knowledge-hub/air-cargo-tariffs-and-rules-what-you-need-to-know/", note: "Primary industry explanation of actual versus volumetric weight and the general 6,000 rule." },
      { name: "Freightos — Chargeable and volumetric weight calculator", url: "https://www.freightos.com/freight-resources/chargeable-and-volumetric-weight-calculator-freightos/", note: "Competitor reference for multimodal chargeable-weight education." },
      { name: "The Loadsheet — Air chargeable weight calculator", url: "https://www.theloadsheet.com/", note: "Competitor reference for line items, rate estimation, rounding and downloadable results." },
    ],
  },
  {
    slug: "shipping-instructions-format-word-template",
    title: "Shipping Instructions Format for Word: Complete Field Guide & Free Template",
    seoTitle: "Shipping Instructions Format Word: Free DOCX Template",
    description: "Download and complete a shipping-instructions Word format with shipper, consignee, routing, container, cargo, freight and bill-of-lading instructions.",
    readMinutes: 15,
    updated: "2026-07-31",
    tool: {
      href: "/templates/shipping-instructions-template",
      label: "Open the Word shipping-instructions template",
      title: "Prepare shipping instructions online",
      description: "Complete the structured worksheet, validate the fields and download an editable DOCX, XLSX or PDF for carrier submission and draft B/L checking.",
    },
    sections: [
      { heading: "What are shipping instructions?", paragraphs: ["Shipping instructions are the shipper’s structured directions to a carrier, NVOCC or freight forwarder for preparing a bill of lading, sea waybill or related transport record. They connect the commercial and packing documents with the booking and tell the documentation team exactly how parties, routing, cargo and freight terms should appear.", "The instructions are not themselves a carrier-issued bill of lading. After submission, the shipper should review the carrier’s draft and request corrections before the documentation cutoff."] },
      { heading: "What a good Word format should contain", paragraphs: ["A useful shipping-instructions Word format should be editable, clearly sectioned and detailed enough to prevent follow-up emails. It should distinguish booking references, document type, parties, routing, equipment, marks, packages, cargo description, weight, measurement, freight terms, declarations and the submitter’s contact details."], bullets: ["Booking number and shipper reference", "Requested original B/L, sea waybill or electronic/release arrangement", "Shipper, consignee and notify party", "Place of receipt, load port, discharge port and place of delivery", "Vessel/voyage where known", "Container, seal, size/type and verified gross mass details", "Marks, package count/type, cargo description, gross weight and measurement", "Freight prepaid/collect and invoice party where required", "Special clauses, manifest or destination instructions", "Submission contact, date and version"] },
      { heading: "Booking and document-type fields", paragraphs: ["Start with the carrier booking number because it anchors the instruction to the reserved movement. State the requested transport-document type using the carrier’s available options, such as original bill of lading, sea waybill or electronic bill. Do not use “telex release” as a casual synonym for every non-original process; release procedures and terminology differ.", "Include shipper or purchase-order references only where the carrier permits them to appear. Version the file or state that it supersedes an earlier submission so changes are not merged incorrectly."] },
      { heading: "Shipper, consignee and notify-party format", paragraphs: ["Enter the complete legal name and address for each party, including country and required contact or registration details. Preserve special consignment wording such as “to order” exactly when authorized; it can affect control and endorsement of an original negotiable bill of lading.", "Do not copy parties blindly from an old shipment. Compare the current commercial invoice, sales terms, letter of credit and destination requirements. Confirm whether personal contact details are required on the transport document or only in the carrier’s submission system."] },
      { heading: "Routing and port information", paragraphs: ["Shipping instructions should agree with the booking confirmation for place of receipt, port of loading, port of discharge and place of delivery. Use standardized location codes where practical, but retain the readable location name. A transshipment port is not automatically the contractual port of discharge.", "If the carrier prepopulates vessel and voyage, verify rather than overwrite them from an outdated booking copy. Late operational changes may require a new vessel/voyage while other B/L particulars remain the same."] },
      { heading: "Container, seal and VGM details", paragraphs: ["List every container separately with the complete ISO 6346 number, seal, size/type and any required verified gross mass reference. Validate container-number check digits and reconcile the equipment list with the packing list and stuffing record.", "Do not confuse cargo gross weight with VGM. VGM is the verified gross mass of the packed container under the applicable SOLAS process, while the B/L cargo weight describes the goods and packaging according to the document’s basis."] },
      { heading: "Marks, packages and cargo description", paragraphs: ["State marks and numbers, number and kind of packages, and a clear cargo description. Totals should reconcile with the packing list. Avoid vague descriptions such as “general cargo” where a more accurate description is required, and do not insert unsupported legal or dangerous-goods declarations.", "Show weight and measurement in the units requested by the carrier. Calculate CBM by package group when dimensions differ and preserve the source calculation. HS codes, country of origin and manifest data may be required for particular trades but should be verified by the responsible party."] },
      { heading: "Freight terms, Incoterms and charges", paragraphs: ["State whether ocean freight is prepaid or collect according to the booking and commercial arrangement. Incoterms allocate responsibilities between seller and buyer but do not automatically determine every carrier invoice field, so do not substitute an Incoterm for explicit freight-payment instructions.", "Where the carrier asks for an invoice party or charge code, use the contracted account and confirm local-charge responsibility separately. Never add cargo value to a bill of lading instruction unless required and authorized."] },
      { heading: "How to prepare shipping instructions step by step", paragraphs: ["Use the booking confirmation as the route and carrier reference, the commercial invoice for commercial parties and goods, and the packing list for package, weight and measurement details. Populate the template, reconcile totals, validate equipment numbers, obtain internal approval and submit before the carrier’s documentation cutoff."], bullets: ["Open the current booking and carrier instructions.", "Copy party data from approved current documents.", "Reconcile cargo lines with the final packing list.", "Validate container and seal details.", "Confirm B/L type, freight terms and release instructions.", "Review sensitive or destination-specific data.", "Save a dated version and submit through the carrier’s required channel.", "Compare the draft B/L with the submitted version and request corrections promptly."] },
      { heading: "Shipping-instructions example", paragraphs: ["Example: Booking ABC12345; requested sea waybill; shipper and consignee with full addresses; notify party same as consignee; place of receipt ICD Tughlakabad; port of loading Mundra; port of discharge Rotterdam; one 40-foot high-cube container with validated number and seal; 800 cartons of stainless-steel kitchenware; gross weight and CBM matching the packing list; freight prepaid; draft contact documentation@example.com.", "The example illustrates structure only. A real submission must use the carrier’s accepted names, codes, cargo wording, customs references and cutoffs."] },
      { heading: "Common shipping-instruction errors", paragraphs: ["Frequent errors include party names copied from a prior shipment, consignee wording that conflicts with payment documents, routing that differs from the booking, incomplete notify-party details, transposed container digits, package totals that do not match the packing list, net weight entered as gross weight, incorrect prepaid/collect selection and late amendments without version control.", "The best prevention is a field-by-field comparison between the submitted instructions, commercial invoice, packing list and booking, followed by a second comparison against the carrier-issued draft."] },
      { heading: "Word, Excel or online carrier submission?", paragraphs: ["Word is convenient for a readable editable instruction sheet. Excel is stronger for many cargo lines and arithmetic. Carrier portals and electronic data connections reduce rekeying when available. The right format is the one accepted for the shipment, but a structured internal worksheet remains useful as the approved source of truth.", "The GainingDocx template can be completed in the browser and downloaded as DOCX, XLSX or PDF. It is designed as a preparation and checking worksheet, not as a substitute for a carrier’s official submission requirement."] },
    ],
    faqs: [
      { q: "Can I download shipping instructions in Word format?", a: "Yes. The GainingDocx shipping-instructions template can be completed online and downloaded as an editable DOCX, as well as XLSX or PDF." },
      { q: "Are shipping instructions the same as a bill of lading?", a: "No. Shipping instructions are submitted to the carrier or forwarder so it can prepare the draft transport document. The carrier-issued bill of lading or sea waybill is the transport document." },
      { q: "Who prepares shipping instructions?", a: "The shipper/exporter or its authorized forwarder normally prepares them using the booking, commercial invoice, packing list and approved trade instructions." },
      { q: "When should shipping instructions be submitted?", a: "Before the carrier’s documentation cutoff shown for the booking. Earlier submission allows time for validation and draft corrections." },
      { q: "What must be checked on the draft B/L?", a: "Compare parties, routing, document type, containers, seals, marks, package totals, cargo description, weight, measurement, freight terms and release details with the approved instructions." },
    ],
    sources: [
      { name: "Hapag-Lloyd — Shipping Instructions user guide", url: "https://www.hapag-lloyd.com/en/online-business/olb-user-guide/documents/shipping-instructions-user-guide.html", note: "Carrier workflow and field reference for creating and reviewing shipping instructions." },
      { name: "Hapag-Lloyd — North America shipping-instruction guidelines", url: "https://www.hapag-lloyd.com/content/dam/website/downloads/detention_demurrage/CustomerNEWS_Shipping_Instructions_Guidelines_for_North_America_reminder.pdf", note: "Carrier guidance on required booking, B/L party and cargo information." },
      { name: "Maersk — Shipping Instruction format", url: "https://www.maersk.com/~/media_sc9/maersk/local-information/files/asia-pacific/vietnam/export/shipping-instruction-format.pdf", note: "Carrier-provided example format used as a field-coverage reference." },
      { name: "Smartsheet — Bill of lading templates", url: "https://www.smartsheet.com/bill-of-lading-templates", note: "Competitor reference for Word/Excel/PDF logistics template presentation." },
    ],
  },
];
