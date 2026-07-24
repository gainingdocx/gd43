# GainingDocx strategic SEO and on-page content plan

Audit date: 23 July 2026  
Scope: all 50 URLs in the live XML sitemap, including the homepage, 10 parser pages, 6 feature pages, 11 templates, 9 tools, 4 guides, 4 hubs, and company/legal pages.

## Executive verdict

GainingDocx already has the right SEO architecture. The site has a dedicated URL for almost every meaningful product capability and search intent. All 50 sitemap URLs returned HTTP 200, had one H1, a self-referencing canonical, and no `noindex` directive during this audit.

The problem is not a lack of pages. It is that many pages use generic repeated headings and very short descriptions where the search result expects a specific answer, formula, comparison, example, or downloadable format. The highest traffic opportunity is the free-tool and template layer. Parser pages are lower-volume but higher-value conversion pages. Guides should connect the two.

Priority order:

1. Rewrite the nine tool pages and four guides around exact task intent.
2. Retitle the eleven template pages around “free + document + template + format,” while preserving the important legal distinction between a worksheet/draft and a carrier- or authority-issued document.
3. Strengthen the homepage around “AI shipping document parser” and “logistics document OCR.”
4. Position the matching feature around the established term “three-way matching: PO, invoice and goods receipt,” not “PO vs invoice vs BOL.”
5. Add proof: real screenshots, sample outputs, supported formats, measured processing time, security facts, and tested accuracy. Do not publish invented percentages or unsupported claims.

## Important corrections to the supplied strategy

- The site has **50 indexable URLs**, not six pages.
- There is no `/tools/bill-of-lading-generator`. The live product offers a **Bill of Lading data worksheet/template**, and the site correctly states that an authorized carrier/NVOCC/agent issues the transport document.
- There is no combined “ISO and IMO validator” tool. There is a batch ISO 6346 container-number checker; IMO checksum validation exists inside document validation.
- The container tool estimates **identical-carton orthogonal fit**. It is not currently a pallet planner, mixed-SKU optimizer, or 3D load planner. Copy must not claim those functions.
- The parser says **15–30 seconds per page**. Do not publish “under three seconds.”
- “Three-way matching” conventionally means **purchase order + invoice + goods receipt**, as reflected in current search results and software documentation. B/L/invoice/packing-list comparison is a separate logistics reconciliation use case.
- `<meta name="keywords">` does not create rankings and should not be a workstream.
- FAQ structured data can help machines understand a page, but Google generally limits FAQ rich results to authoritative government and health sites. Do not forecast FAQ snippets as a likely result.
- Avoid unverified claims such as “domain-trained,” “99% accurate,” “encrypted at rest,” “never used for training,” or “compliant BOL.” Publish only claims supported by the actual implementation and policies.

## Demand model

Exact monthly search volumes are not publicly verifiable without a configured Google Keyword Planner, Ahrefs, Semrush, or similar account. The tiers below are therefore strategic relative-demand tiers based on current SERP depth, query language used by ranking pages, and the maturity of competing results—not fabricated volume numbers.

| Tier | Search intent | GainingDocx targets |
|---|---|---|
| A: broad/high traffic | Immediate free task or downloadable document | CBM calculator, HS code finder, chargeable/volumetric weight calculator, container load calculator, bill of lading template, commercial invoice template, packing list template |
| B: strong task demand | Specialist shipping calculation or lookup | container check digit calculator, UN/LOCODE lookup, demurrage calculator, LCL freight calculator, pro forma invoice template, certificate of origin template, air waybill template |
| C: high commercial intent | Software buyer wants automation | bill of lading OCR/parser, freight document OCR, commercial invoice parser, packing list extraction, air waybill OCR, freight invoice OCR, three-way matching |
| D: narrow specialist intent | Specific workflow/document | arrival notice parser/template, booking confirmation parser, sea waybill parser, goods receipt parser, shipping mark generator, shipping instructions template |

## Sitewide content rules

Use the primary phrase once in the title, H1, opening 100 words, one descriptive H2, and a relevant internal-link anchor. Do not repeat it mechanically.

Every tool page should contain:

1. The working calculator above the fold.
2. A one-sentence definition and formula.
3. A worked example with actual numbers.
4. Inputs, units, assumptions, rounding, and limitations.
5. A task-specific FAQ.
6. Links to the most relevant guide, parser, and template.

Every parser page should contain:

1. “OCR,” “data extraction,” “PDF,” and “structured data” naturally in the opening.
2. A real sample document and sample output table/JSON.
3. Supported file types and document variants.
4. Extracted fields grouped by header, parties, routing, cargo, and totals.
5. Validation rules and their limits.
6. Output formats, processing-time wording, privacy facts, and a visible trial CTA.

Every template page should contain:

1. “Free [document] template” and the available formats.
2. A preview and immediate browser form/download action.
3. “What to include,” “How to fill it out,” and a field checklist.
4. A specific authority notice—not a vague compliance claim.
5. Links to its matching parser and related calculator.

Every guide should provide a 40–60 word direct answer immediately below the H1, then examples, tables, mistakes, and links to the exact tool/template/parser. The current guides are too brief and structurally similar to compete with mature explanatory results.

## Exact homepage recommendation

**Title:** AI Shipping Document Parser & Freight Document OCR | GainingDocx

**Meta description:** Extract and validate data from Bills of Lading, commercial invoices, packing lists, air waybills and other freight documents. Review results and export to Excel, CSV or JSON.

**H1:** AI Shipping Document Parser for Freight and Logistics

**Opening copy:**

> Turn Bills of Lading, commercial invoices, packing lists, air waybills and other shipping PDFs or images into reviewed, structured data. GainingDocx combines AI document extraction with rule-based checks for container numbers, ports, weights, dates and totals—then lets your team correct and export the result.

**Recommended H2 sequence:**

- Extract Data from Bills of Lading, Invoices and Packing Lists
- Validate Shipping Data with Deterministic Checks
- Match Purchase Orders, Invoices and Goods Receipts
- Compare B/L, Invoice and Packing List Data
- Export Reviewed Shipping Data to Excel, CSV and JSON
- Free Freight Calculators and Shipping Document Templates
- How GainingDocx Works
- Frequently Asked Questions

Replace the generic hero CTA with **“Parse a Shipping Document Free.”** Keep “No sign-up” only if it is consistently true. Reconcile every count: the current source variously says 7 calculators, 9 tools, 9 document types, and 10 parsers.

## Parser-page content map

The title, H1, opening, and H2s below are ready to implement. Retain the existing accurate field/check lists underneath the new sections.

### `/bill-of-lading-parser`

- **Primary query:** bill of lading parser; secondary: bill of lading OCR, extract data from bill of lading PDF
- **Title:** Bill of Lading OCR & AI Data Extraction | GainingDocx
- **Meta:** Extract B/L numbers, parties, ports, containers, seals, cargo lines, weights and dates from Bill of Lading PDFs or images. Review and export structured data.
- **H1:** AI Bill of Lading Parser and OCR
- **Opening:** Upload a Bill of Lading PDF, scan or photo and extract shipment data into editable fields and cargo lines. GainingDocx checks ISO 6346 container numbers, port references, IMO checksums and printed totals before export.
- **H2s:** Bill of Lading Data You Can Extract; B/L OCR for PDFs, Scans and Photos; Container, Port and Weight Validation; Export B/L Data to Excel, CSV or JSON; Bill of Lading Parser FAQ

### `/air-waybill-parser`

- **Primary query:** air waybill OCR; secondary: AWB parser, MAWB data extraction, HAWB data extraction
- **Title:** Air Waybill OCR & AWB Data Extraction | GainingDocx
- **Meta:** Extract MAWB and HAWB numbers, parties, airports, pieces, weights, routing and charges from air waybill PDFs and images. Review and export the result.
- **H1:** Air Waybill OCR and AI AWB Parser
- **Opening:** Convert master and house air waybills into reviewed, structured data. Extract AWB references, shipper and consignee details, routing, pieces, gross and chargeable weight, handling instructions, rates and charges.
- **H2s:** MAWB and HAWB Fields Extracted; Air Waybill Number Validation; Extract AWB Tables from PDF or Image; Export Air Waybill Data; Air Waybill OCR FAQ

### `/commercial-invoice-parser`

- **Primary query:** commercial invoice parser; secondary: commercial invoice OCR, invoice data extraction
- **Title:** Commercial Invoice OCR & Data Extraction | GainingDocx
- **Meta:** Extract seller, buyer, invoice number, HS codes, line items, quantities, prices, currency, Incoterms and totals from commercial invoice PDFs or images.
- **H1:** AI Commercial Invoice Parser and OCR
- **Opening:** Extract customs and trade data from commercial invoices without retyping each line. Review seller and buyer details, HS codes, quantities, unit prices, charges, currency, Incoterms and invoice totals before export or matching.
- **H2s:** Commercial Invoice Fields and Line Items Extracted; Invoice OCR for Scanned PDFs and Images; Validate Amounts, Weights and References; Match Invoice, PO and Goods Receipt Data; Commercial Invoice Parser FAQ

### `/packing-list-parser`

- **Primary query:** packing list data extraction; secondary: packing list OCR, packing list parser
- **Title:** Packing List OCR & Line-Item Data Extraction | GainingDocx
- **Meta:** Extract cartons, package marks, SKUs, quantities, dimensions, net weight, gross weight and CBM from packing list PDFs, scans and photos.
- **H1:** Packing List OCR and AI Data Extraction
- **Opening:** Turn multi-page packing lists into editable package and cargo rows. GainingDocx extracts carton counts, marks, product lines, dimensions, net and gross weight, CBM and container references, then checks printed totals.
- **H2s:** Packing List Fields Extracted; Extract Cartons, Dimensions, Weight and CBM; Reconcile Packing List Totals; Compare Packing List, Invoice and B/L Data; Packing List OCR FAQ

### `/freight-invoice-parser`

- **Primary query:** freight invoice OCR; secondary: freight invoice parser, freight invoice audit automation
- **Title:** Freight Invoice OCR, Data Extraction & Audit | GainingDocx
- **Meta:** Extract shipment references, base freight, fuel, terminal and accessorial charges from freight invoices. Check line arithmetic and match supporting records.
- **H1:** Freight Invoice OCR and Charge-Line Extraction
- **Opening:** Extract every freight charge as a separate, reviewable line instead of relying on a grand total. Capture invoice, B/L, booking and container references, route, equipment, rates, taxes and accessorial charges for audit and matching.
- **H2s:** Freight Invoice Fields and Charges Extracted; Audit Base Freight, Fuel and Accessorials; Match Freight Invoices to Shipment References; Export Freight Invoice Data; Freight Invoice OCR FAQ

### `/purchase-order-parser`

- **Primary query:** purchase order OCR; secondary: PO parser, purchase order data extraction
- **Title:** Purchase Order OCR & PO Line-Item Extraction | GainingDocx
- **Meta:** Extract PO numbers, suppliers, product lines, quantities, unit prices, currency, delivery terms and totals for review and three-way invoice matching.
- **H1:** Purchase Order OCR and AI PO Parser
- **Opening:** Convert purchase order PDFs and images into structured header and line-item data. Capture supplier, delivery, quantity, price, currency and Incoterm evidence for invoice and goods-receipt matching.
- **H2s:** Purchase Order Fields Extracted; Extract PO Line Items from PDF; Validate PO Amounts and References; Use PO Data for Three-Way Matching; Purchase Order OCR FAQ

### `/goods-receipt-parser`

- **Primary query:** goods receipt OCR; secondary: GRN parser, goods receipt note data extraction
- **Title:** Goods Receipt OCR & GRN Data Extraction | GainingDocx
- **Meta:** Extract GRN references, receipt dates, PO numbers, accepted and rejected quantities, item lines and signatures for invoice three-way matching.
- **H1:** Goods Receipt and GRN OCR Parser
- **Opening:** Extract goods-receipt evidence from GRNs, warehouse receipts and proof-of-receipt documents. Capture PO references, dates, item lines, accepted quantities, rejected quantities and exceptions for three-way matching.
- **H2s:** Goods Receipt and GRN Fields Extracted; Accepted vs Rejected Quantity Capture; Match GRN, PO and Invoice Lines; Export Receipt Data; Goods Receipt OCR FAQ

### `/sea-waybill-parser`

- **Primary query:** sea waybill parser; secondary: sea waybill OCR, express bill data extraction
- **Title:** Sea Waybill OCR & Data Extraction | GainingDocx
- **Meta:** Extract parties, vessels, ports, containers, cargo, weights, dates and freight terms from sea waybill PDFs and images, with shipping-data checks.
- **H1:** AI Sea Waybill Parser and OCR
- **Opening:** Extract operational shipping data from sea waybills, express bills and straight-consigned ocean documents. Review parties, routing, containers, cargo, weights, dates and freight terms in one structured record.
- **H2s:** Sea Waybill Fields Extracted; Sea Waybill vs Bill of Lading; Validate Containers, Ports and Totals; Export Sea Waybill Data; Sea Waybill Parser FAQ

### `/arrival-notice-parser`

- **Primary query:** arrival notice OCR; secondary: arrival notice parser, extract container arrival notice data
- **Title:** Arrival Notice OCR & Shipping Data Extraction | GainingDocx
- **Meta:** Extract B/L references, vessel, ETA, port, containers, consignee, charges and printed free-time dates from carrier arrival notices.
- **H1:** Arrival Notice OCR and Data Extraction
- **Opening:** Turn carrier arrival notices into reviewed shipment records. Extract B/L references, vessel and voyage, ETA, port, container numbers, consignee details, printed charges and free-time dates before planning pickup.
- **H2s:** Arrival Notice Fields Extracted; Capture ETA, Containers and Free-Time Dates; Match an Arrival Notice to the B/L; Review Demurrage and Detention Inputs; Arrival Notice OCR FAQ

### `/booking-confirmation-parser`

- **Primary query:** booking confirmation OCR; secondary: shipping booking parser, ocean booking data extraction
- **Title:** Shipping Booking Confirmation OCR & Parser | GainingDocx
- **Meta:** Extract booking number, carrier, vessel, voyage, ports, equipment, cut-offs and sailing dates from ocean booking confirmations.
- **H1:** Ocean Booking Confirmation OCR Parser
- **Opening:** Extract the routing, equipment and deadline data inside ocean booking confirmations. Capture booking numbers, carrier, vessel and voyage, ports, container requirements, cut-offs and sailing dates for downstream shipping instructions.
- **H2s:** Booking Confirmation Fields Extracted; Capture Cut-Offs, Equipment and Routing; Create Shipping Instructions from Booking Data; Match Booking and B/L References; Booking Confirmation OCR FAQ

## Feature-page content map

### `/features/shipping-document-data-extraction`

- **Target:** shipping document OCR, logistics document data extraction, freight document automation
- **Title:** AI Shipping Document OCR & Data Extraction Software
- **H1:** AI Data Extraction for Shipping and Freight Documents
- **Opening:** Extract structured fields and line items from Bills of Lading, invoices, packing lists, air waybills and related logistics documents. Review every result before exporting it to Excel, CSV, JSON or a downstream system.
- **H2s:** Shipping Documents Supported; Fields and Line Items Extracted; PDF, Scan and Photo Processing; Human Review Before Export; Shipping Document OCR FAQ

### `/features/maritime-document-validation`

- **Target:** shipping document validation, container number validation, logistics data validation
- **Title:** Shipping Document Validation & Maritime Data Checks
- **H1:** Validate Shipping Document Data After OCR
- **Opening:** Check extracted container numbers, IMO numbers, ports, dates, weights, package totals and financial arithmetic with reproducible rules. Validation identifies internal inconsistencies; it does not authenticate the issuer.
- **H2s:** ISO 6346 and IMO Checksum Validation; Port and UN/LOCODE Checks; Weight, Package and Amount Reconciliation; What Validation Can and Cannot Prove; Shipping Data Validation FAQ

### `/features/shipment-document-matching`

- **Target:** three-way matching software, PO invoice goods receipt matching, shipping document reconciliation
- **Title:** Three-Way Matching for PO, Invoice & Goods Receipt
- **H1:** Three-Way Document Matching and Shipment Reconciliation
- **Opening:** Compare purchase orders, invoices and goods receipts at header and line level, then reconcile transport evidence across Bills of Lading, packing lists and freight invoices. GainingDocx preserves each source value and reports discrepancies for review.
- **H2s:** PO, Invoice and Goods Receipt Three-Way Matching; B/L, Invoice and Packing List Reconciliation; Fields and Tolerances Compared; Review Quantity, Price, Weight and Reference Mismatches; Three-Way Matching FAQ

### `/features/shipping-document-search`

- **Target:** shipping document management, search shipping documents, container document search
- **Title:** Search Shipping Documents by B/L, Invoice or Container
- **H1:** Search Shipping Records by Extracted Data
- **Opening:** Find private workspace records by B/L number, invoice number, container, vessel, party or port—even when that reference appears only inside the original PDF.
- **H2s:** Search by Shipment Reference; Find Every Document for a Container; Search Extracted Data Instead of Filenames; Private Shipping Record Search; Shipping Document Search FAQ

### `/features/shipping-data-export`

- **Target:** extract PDF data to Excel, shipping document to Excel, OCR to JSON
- **Title:** Export Shipping Document Data to Excel, CSV & JSON
- **H1:** Export Reviewed Shipping Data to Excel, CSV and JSON
- **Opening:** Move reviewed document fields, container rows and cargo line items into usable files. Export corrections—not raw OCR text—to Excel workbooks, CSV, structured JSON or PDF review reports.
- **H2s:** Convert Shipping Documents to Excel; Export Cargo Lines and Containers to CSV; Structured JSON for Integrations; What Each Export Contains; Shipping Data Export FAQ

### `/features/shipping-document-generation`

- **Target:** shipping document generator, commercial invoice generator, packing list generator
- **Title:** Generate Shipping Document Drafts from Reviewed Data
- **H1:** Create Shipping Document Drafts Without Retyping Data
- **Opening:** Reuse reviewed shipment data to prepare editable commercial invoices, packing lists and shipping-instruction drafts. Generated files remain working drafts for human review and formal issuance where required.
- **H2s:** Generate a Packing List from Invoice Data; Prepare a Commercial Invoice Draft; Create Shipping Instructions from Booking Data; Review Before Download or Issuance; Shipping Document Generation FAQ

## Tool-page content map

### `/tools/cbm-calculator`

- **Primary query:** CBM calculator; secondary: cubic meter calculator, shipping CBM calculator
- **Title:** Free CBM Calculator for Shipping | Multiple Cartons
- **Meta:** Calculate shipment CBM from carton dimensions and quantity in mm, cm, metres or inches. Add multiple box sizes, total gross weight and export CSV.
- **H1:** Free CBM Calculator for Shipping
- **Opening:** Calculate cubic metres for one carton or a mixed shipment. Add each box size, choose the unit, enter quantity and weight, and get total CBM and gross weight instantly.
- **H2s:** How to Calculate CBM; CBM Formula for cm, Metres and Inches; Worked CBM Example for Multiple Cartons; CBM vs Container Capacity; CBM Calculator FAQ
- **Direct-answer block:** `CBM = length (m) × width (m) × height (m) × quantity. For centimetres, divide L × W × H × quantity by 1,000,000.`

### `/tools/container-load-calculator`

- **Primary query:** container load calculator; secondary: how many boxes fit in a 20ft container, 40ft container calculator
- **Title:** Free Container Load Calculator for 20ft & 40ft Cartons
- **Meta:** Estimate how many identical cartons fit in 20GP, 40GP, 40HC or 45HC containers. Compare six rotations, internal space and payload limits.
- **H1:** Container Load Calculator for Carton Fit
- **Opening:** Estimate identical-carton capacity for 20ft, 40ft and high-cube containers. The calculator tests six box rotations and compares dimensional fit with payload capacity.
- **H2s:** How Many Boxes Fit in a 20ft or 40ft Container?; Container Internal Dimensions Used; Carton Rotation and Payload Method; Calculator Limits: Pallets, Mixed SKUs and Safe Stowage; Container Load Calculator FAQ
- **Do not claim:** pallets, visual utilization, mixed cargo, 3D planning, or operational loading optimization until those functions exist.

### `/tools/chargeable-weight-calculator`

- **Primary query:** chargeable weight calculator; secondary: volumetric weight calculator, air freight dimensional weight calculator
- **Title:** Air Freight Chargeable & Volumetric Weight Calculator
- **Meta:** Compare actual and volumetric weight for multiple packages using air freight, express courier or a custom DIM divisor. Metric and imperial options.
- **H1:** Air Freight Chargeable Weight Calculator
- **Opening:** Calculate volumetric weight and compare it with actual gross weight to find the chargeable weight. Add multiple package groups and choose the air-cargo, express-courier or contracted custom divisor.
- **H2s:** What Is Chargeable Weight?; Air Freight Volumetric Weight Formula; 6000 vs 5000 DIM Divisor; Worked Chargeable Weight Example; Chargeable Weight Calculator FAQ
- **Accuracy note:** Describe 6000 and 5000 as common defaults, not universal “IATA” or carrier rules. The contracted tariff controls.

### `/tools/container-number-check`

- **Primary query:** container number check; secondary: ISO 6346 check digit calculator, container number validator
- **Title:** ISO 6346 Container Number Check Digit Calculator
- **Meta:** Validate up to 100 shipping container numbers with the ISO 6346 check digit calculation. Find errors, see the expected number and export CSV.
- **H1:** ISO 6346 Container Number Validator
- **Opening:** Paste one or up to 100 container numbers to verify their ISO 6346 structure and check digit. Invalid results show the expected full number for review and CSV export.
- **H2s:** Check a Shipping Container Number; ISO 6346 Container Number Format; How the Check Digit Is Calculated; What a Valid Check Digit Does Not Prove; Container Number Checker FAQ

### `/tools/port-code-lookup`

- **Primary query:** port code lookup; secondary: UN/LOCODE lookup, seaport code finder
- **Title:** UN/LOCODE Port Code Lookup | Search by Port or Code
- **Meta:** Search maritime locations by port name or five-character UN/LOCODE. Find the country and location code used in shipping and trade records.
- **H1:** UN/LOCODE Port Code Lookup
- **Opening:** Search the bundled UNECE UN/LOCODE data by port name or five-character code. Use standardized location codes to reduce ambiguity in shipping documents and route records.
- **H2s:** Find a Port Code by Name; How to Read a UN/LOCODE; UN/LOCODE vs IATA Port or Airport Codes; Dataset Version and Coverage; Port Code Lookup FAQ

### `/tools/lcl-freight-calculator`

- **Primary query:** LCL freight calculator; secondary: W/M calculator, ocean freight cost calculator
- **Title:** LCL Freight Calculator | Ocean W/M Cost Estimate
- **Meta:** Calculate LCL ocean freight from CBM, gross weight and a quoted W/M rate. See whether volume or metric weight controls and add local charges.
- **H1:** LCL Freight W/M Calculator
- **Opening:** Estimate LCL ocean freight by comparing shipment CBM with weight in metric tons. Apply the quoted W/M rate, identify the controlling revenue tons, and add entered accessorial charges.
- **H2s:** How LCL Freight Is Calculated; Weight or Measure (W/M) Formula; Worked LCL Freight Example; Charges Not Included Automatically; LCL Freight Calculator FAQ

### `/tools/demurrage-detention-calculator`

- **Primary query:** demurrage calculator; secondary: detention calculator, container free time calculator
- **Title:** Demurrage & Detention Calculator | Free-Time Charges
- **Meta:** Calculate free days, chargeable days, tiered daily demurrage or detention rates and fixed fees from your carrier dates and tariff.
- **H1:** Demurrage and Detention Charge Calculator
- **Opening:** Audit container free time and estimated charges using the dates, free days and rate tiers in your carrier tariff or contract. See elapsed, free and chargeable days separately.
- **H2s:** Demurrage vs Detention; How to Calculate Chargeable Days; Tiered Rate Worked Example; Inclusive Dates, Holidays and Combined Free Time; Demurrage Calculator FAQ

### `/tools/hs-code-finder`

- **Primary query:** HS code finder; secondary: HTS code lookup, tariff code lookup
- **Title:** Free HS Code Finder & U.S. HTS Tariff Lookup
- **Meta:** Search official U.S. HTS descriptions by product keyword. Review candidate tariff codes, international six-digit HS headings and published duty-rate fields.
- **H1:** HS Code Finder and U.S. HTS Lookup
- **Opening:** Search official U.S. Harmonized Tariff Schedule descriptions using a product keyword. Results separate the international six-digit HS heading from the longer U.S. HTS classification and show published rate fields where available.
- **H2s:** Search HS and HTS Codes by Product; HS Code vs HTS Code; How to Verify a Candidate Classification; Duty Rates, Origin and Additional Tariffs; HS Code Finder FAQ
- **Accuracy note:** Do not say the tool “finds the correct code.” Search results are candidates; legal classification can depend on composition, use, origin, and the General Rules of Interpretation.

### `/tools/shipping-mark-generator`

- **Primary query:** shipping mark generator; secondary: carton marking template, export shipping marks
- **Title:** Free Shipping Mark Generator for Cartons & Export Cases
- **Meta:** Create and print carton shipping marks with consignee, destination, PO, case numbers, weights, dimensions and handling instructions. No account required.
- **H1:** Free Shipping Mark Generator
- **Opening:** Create a clear, printable shipping mark for cartons, crates or export cases. Add consignee, destination, purchase order, case range, weights, dimensions and handling instructions, then print or download.
- **H2s:** Create a Carton Shipping Mark; What to Include on Export Shipping Marks; Shipping Mark Example and Format; Buyer, Carrier and Destination Requirements; Shipping Mark Generator FAQ

## Template-page content map

Use **Word** in visible titles because users search “Word,” not “DOCX.” The page can still label the actual `.docx` download correctly. Use **Excel** before `.xlsx` for the same reason.

| URL | Recommended title | Recommended H1 | Opening copy and required H2 topics |
|---|---|---|---|
| `/templates/bill-of-lading-template` | Free Bill of Lading Template | Word, Excel & PDF | Free Bill of Lading Template and Data Worksheet | Prepare shipper, consignee, notify party, routing, container and cargo details in a fillable worksheet for carrier instructions and B/L draft checking. **H2:** Download/Fill; What to Include; How to Fill Out; Straight vs Order vs Sea Waybill; Issuance Notice; FAQ. |
| `/templates/commercial-invoice-template` | Free Commercial Invoice Template | Excel, Word & PDF | Free Commercial Invoice Template for International Shipping | Create an export commercial invoice with seller, buyer, HS codes, origin, quantities, values, Incoterms, freight, insurance and declarations. **H2:** Fill Online; Required Fields; Worked Line-Item Example; Commercial vs Pro Forma Invoice; Customs Review; FAQ. |
| `/templates/packing-list-template` | Free Export Packing List Template | Excel, Word & PDF | Free Packing List Template for International Shipping | Build a case-level packing list with marks, package counts, product lines, dimensions, net and gross weight, and CBM totals. **H2:** Fill Online; Fields; CBM/Weight Totals; Packing List vs Commercial Invoice; FAQ. |
| `/templates/simple-packing-list-template` | Simple Packing List Template | Free Excel, Word & PDF | Free Simple Packing List Template | Create a compact shipment-level packing list for a small number of package groups when case-by-case dimensions are not required. **H2:** When to Use; Package Summary; Required Fields; Simple vs Detailed Packing List; FAQ. |
| `/templates/container-packing-list-template` | Container Packing List Template | Excel, Word & PDF | Free Container Packing List Template | Allocate packages and cargo rows to container and seal numbers with gross weight and CBM totals. **H2:** Container Allocation; Required Fields; VGM vs Cargo Weight; Reconcile with B/L; FAQ. |
| `/templates/shipping-instructions-template` | Free Shipping Instructions Template | Word, Excel & PDF | Shipping Instructions Template for Bill of Lading Preparation | Prepare consistent shipper, consignee, routing, equipment and cargo instructions for a carrier or freight forwarder. **H2:** Required Shipping Instructions; How Carrier Uses SI; SI Cut-Off Checklist; Compare SI with Draft B/L; FAQ. |
| `/templates/arrival-notice-template` | Arrival Notice Template & Data Sheet | Word, Excel & PDF | Free Arrival Notice Data Sheet Template | Prepare or review carrier, vessel, ETA, terminal, B/L, container, charge and free-time information. **H2:** Fields; Arrival/Availability/LFD Dates; Charges; Match to B/L; Authority Notice; FAQ. |
| `/templates/delivery-order-template` | Delivery Order Template & Release Data Sheet | Word, Excel & PDF | Free Delivery Order Data Sheet Template | Organize the references, parties, terminal, equipment and release details required for an authorized cargo-delivery process. **H2:** Required Fields; Release References; Delivery Order vs B/L; Issuance Notice; FAQ. |
| `/templates/pro-forma-invoice-template` | Free Pro Forma Invoice Template | Excel, Word & PDF | Free Pro Forma Invoice Template for International Trade | Prepare a pre-shipment quotation with buyer, seller, validity, item values, origin, Incoterms, payment and delivery terms. **H2:** Fill Online; Required Fields; Pro Forma vs Commercial Invoice; Worked Example; FAQ. |
| `/templates/certificate-of-origin-template` | Certificate of Origin Template & Data Worksheet | Free Word, Excel & PDF | Certificate of Origin Data Worksheet | Assemble exporter, producer, consignee, invoice, goods and origin-criterion details before submitting the required form to the competent issuer. **H2:** Required Data; Non-Preferential vs Preferential Origin; Supporting Evidence; Certification Notice; FAQ. |
| `/templates/air-waybill-template` | Air Waybill Template & AWB Data Worksheet | Word, Excel & PDF | Air Waybill Data Worksheet for Shippers | Prepare shipper, consignee, routing, pieces, weight, charge and handling data for an airline, freight forwarder or cargo agent. **H2:** AWB Fields; MAWB vs HAWB; Chargeable Weight; Issuance Notice; FAQ. |

Do not turn the B/L or AWB worksheet into a purported “generator” unless the product and legal workflow genuinely support issuance. The present authority notices are a competitive trust asset and should stay.

## Guide-page content map

### `/guides/how-to-read-a-bill-of-lading`

- **Title:** How to Read a Bill of Lading: Fields, Terms & Checklist
- **H1:** How to Read a Bill of Lading
- **Direct answer:** Start with the B/L number, carrier and parties; then verify vessel, voyage and ports; reconcile containers, seals, packages and weights; and finally check dates, freight terms, release type and originals. Compare the document with the commercial invoice and packing list before approval.
- **H2s:** Bill of Lading Sections at a Glance; Shipper, Consignee and Notify Party; Vessel, Voyage, POL and POD; Containers, Seals, Packages and Weight; Freight Terms and Release Type; Common B/L Errors; Bill of Lading Review Checklist; FAQ

### `/guides/commercial-invoice-vs-packing-list`

- **Title:** Commercial Invoice vs Packing List: Differences & Checklist
- **H1:** Commercial Invoice vs Packing List
- **Direct answer:** A commercial invoice records the sale, customs value, currency and payment terms. A packing list records how the goods are physically packed, including cartons, dimensions and weights. Product identity, quantities, parties and shipment references should agree across both documents.
- **H2s:** Commercial Invoice vs Packing List Comparison Table; What a Commercial Invoice Includes; What a Packing List Includes; Fields That Must Match; Common Discrepancies; Which Document Customs Uses; Reconciliation Checklist; FAQ

### `/guides/iso-6346-container-number-check-digit`

- **Title:** ISO 6346 Container Check Digit: Formula & Example
- **H1:** How the ISO 6346 Container Check Digit Works
- **Direct answer:** An ISO 6346 container number contains a three-letter owner code, one equipment-category letter, a six-digit serial number and one check digit. The check digit is calculated by mapping letters to ISO values, applying powers-of-two weights and reducing the sum modulo 11.
- **H2s:** ISO 6346 Container Number Format; Letter Value Table; Check Digit Formula Step by Step; Worked Container Number Example; Why Remainder 10 Becomes 0; What a Failed Check Digit Means; FAQ

### `/guides/how-to-calculate-cbm-for-shipping`

- **Title:** How to Calculate CBM for Shipping: Formula & Examples
- **H1:** How to Calculate CBM for Shipping
- **Direct answer:** Multiply length × width × height after converting all dimensions to metres, then multiply by quantity. For centimetres, use `(L × W × H × quantity) ÷ 1,000,000`. Calculate each carton size separately and add the results.
- **H2s:** CBM Formula; Calculate CBM from Centimetres; Calculate CBM from Inches; Multiple-Carton Worked Example; CBM and Volumetric Weight; CBM Capacity of 20ft and 40ft Containers; Common CBM Mistakes; FAQ

## Hub and company-page map

| URL | Recommended title | H1 / opening recommendation |
|---|---|---|
| `/features` | Shipping Document Automation Software Features | **H1:** Shipping Document Automation from OCR to Export. Opening: Extract, validate, match, search, export and reuse logistics document data in one reviewed workflow. |
| `/tools` | Free Shipping Calculators & Freight Tools | **H1:** Free Shipping and Freight Calculators. Opening should name all nine tools and link with descriptive anchors. |
| `/templates` | Free Shipping Document Templates | Word, Excel & PDF | **H1:** Free Shipping Document Templates. Opening: Fill online or download editable templates for invoices, packing lists, shipping instructions and transport-data worksheets. |
| `/guides` | Shipping Document & Freight Calculation Guides | **H1:** Shipping Document and Freight Guides. Group future content under Documents, Calculations, Containers, Customs, and Charges. |
| `/about` | About GainingDocx | Shipping Document Automation | Keep the current story but add who the product is for, verifiable company/operator identity, editorial/technical review process, data sources, and update policy. |
| `/pricing` | Shipping Document Parser Pricing | GainingDocx | **H1:** Shipping Document Parser Pricing. Keep “planned” highly visible; add a comparison table and pricing FAQ only after final limits are accurate. |
| `/contact` | Contact GainingDocx Support & Sales | Keep H1. Add response-time expectation, support/sales/partnership routes, legal business identity and mailing jurisdiction if applicable. |
| `/privacy` | Privacy Policy | GainingDocx | Do not optimize for commercial phrases. Ensure every security, storage, subprocessor, training-use, retention and deletion statement is technically verified. |
| `/terms` | Terms of Service | GainingDocx | Do not optimize for commercial phrases. Keep the current legal intent and ensure planned billing language matches actual launch state. |

## Internal-link architecture

- Every parser → matching template, matching guide, export feature, and validation/matching feature.
- Every template → matching parser and the calculator needed to complete it.
- Every tool → one guide, one relevant template, and one parser use case.
- Every guide → the exact tool in the first useful section, not only a generic CTA at the end.
- Homepage → link to category hubs and top landing pages with descriptive anchors such as “Bill of Lading OCR” and “free CBM calculator.”

Examples:

- CBM calculator ↔ CBM guide ↔ packing-list template ↔ packing-list parser.
- Container-number checker ↔ ISO 6346 guide ↔ B/L parser ↔ maritime validation.
- Chargeable-weight calculator ↔ AWB worksheet ↔ air-waybill parser.
- Commercial-invoice template ↔ commercial-invoice parser ↔ HS-code finder ↔ invoice-vs-packing-list guide.
- Demurrage calculator ↔ arrival-notice parser/template.

## Technical and trust actions

1. Submit the sitemap in Google Search Console and Bing Webmaster Tools, inspect priority URLs, and monitor “Crawled/Discovered—currently not indexed.” The site appears very new; copy changes cannot substitute for index discovery and authority.
2. Correct all visible inventory counts and avoid hard-coded counts in meta descriptions.
3. Add `dateModified`, named author/reviewer, and cited primary sources to guides.
4. Show the UN/LOCODE dataset version on the lookup page. UNECE currently lists release 2025-1 and says the database covers more than 103,000 locations.
5. Cite the official USITC source and data date on the U.S. HTS page.
6. Add a sample input and output to every parser page. Use redacted, owned, or licensed examples.
7. Add unique images/screenshots with descriptive alt text; do not repeat one generic product image across all pages.
8. Keep `SoftwareApplication`/`WebApplication`, breadcrumb, article, and how-to structured data where the visible page supports it. Do not add markup for content users cannot see.
9. FAQ content should remain useful, but do not treat FAQ rich results as an acquisition forecast.
10. Build authority with original benchmarks, field dictionaries, sample schemas, validation methodology, and links/mentions from freight-forwarding, customs, supply-chain and trade-compliance publications.

## Content expansion backlog

The present four-guide library is too small to support 36 commercial/tool/template landing pages. Add these next, each linked into an existing conversion page:

1. Bill of Lading vs Sea Waybill
2. MAWB vs HAWB
3. How to Fill Out a Commercial Invoice
4. How to Create a Packing List for Export
5. Volumetric Weight vs Actual Weight
6. 20ft vs 40ft Container Dimensions and Capacity
7. Demurrage vs Detention
8. How LCL Freight W/M Is Calculated
9. HS Code vs HTS Code vs Schedule B
10. Shipping Instructions Checklist
11. Three-Way Matching: PO, Invoice and Goods Receipt
12. Bill of Lading, Commercial Invoice and Packing List Reconciliation Checklist

## Measurement plan

Track results by intent cluster, not only sitewide traffic:

- Impressions, position and CTR for tool terms.
- Template downloads/form completions from organic visits.
- Parser trial starts and completed parses from parser-page organic visits.
- Guide-to-tool, guide-to-template and guide-to-parser click-through.
- Indexed URL count, non-indexing reasons, crawl errors and canonical status.
- Branded versus non-branded queries.

Reassess titles only after sufficient impressions. A page with impressions but low CTR needs a SERP-title/snippet change; a page with no impressions usually needs indexing, authority, intent alignment, or stronger content—not repeated title edits.

## Research references

- [UNECE UN/LOCODE overview and current release](https://unece.org/trade/uncefact/unlocode)
- [Official UN/LOCODE directory](https://unlocode.unece.org/directory/)
- [Freightos chargeable and volumetric weight calculator guide](https://www.freightos.com/freight-resources/chargeable-and-volumetric-weight-calculator-freightos/)
- [Affinda bill of lading extraction terminology](https://www.affinda.com/documents/bill-of-lading/)
- [Affinda commercial invoice extraction terminology](https://www.affinda.com/documents/commercial-invoice/)
- [SAP Concur three-way match product terminology](https://www.concur.com/products/three-way-match)
- [QuickBooks commercial invoice template SERP benchmark](https://quickbooks.intuit.com/r/invoicing/commercial-invoice-template/)
- [Smartsheet bill of lading template SERP benchmark](https://www.smartsheet.com/bill-of-lading-templates)

