export interface SeoPageCopy {
  title: string;
  description: string;
  h1: string;
  intro: string;
  headings: string[];
}

export const PARSER_SEO: Record<string, SeoPageCopy> = {
  "bill-of-lading-parser": {
    title: "Bill of Lading OCR & AI Data Extraction | GainingDocx",
    description: "Extract B/L numbers, parties, ports, containers, seals, cargo lines, weights and dates from Bill of Lading PDFs or images. Review and export structured data.",
    h1: "AI Bill of Lading Parser and OCR",
    intro: "Upload a Bill of Lading PDF, scan or photo and extract shipment data into editable fields and cargo lines. GainingDocx checks ISO 6346 container numbers, port references, IMO checksums and printed totals before export.",
    headings: ["Bill of Lading Data You Can Extract", "B/L Validation Checks", "How to Extract Data from a Bill of Lading", "Bill of Lading Parser FAQ"],
  },
  "air-waybill-parser": {
    title: "Air Waybill OCR & AWB Data Extraction | GainingDocx",
    description: "Extract MAWB and HAWB numbers, parties, airports, pieces, weights, routing and charges from air waybill PDFs and images. Review and export the result.",
    h1: "Air Waybill OCR and AI AWB Parser",
    intro: "Convert master and house air waybills into reviewed, structured data. Extract AWB references, shipper and consignee details, routing, pieces, gross and chargeable weight, handling instructions, rates and charges.",
    headings: ["MAWB and HAWB Fields Extracted", "Air Waybill Number Validation", "How to Extract AWB Data from PDF or Image", "Air Waybill OCR FAQ"],
  },
  "commercial-invoice-parser": {
    title: "Commercial Invoice OCR & Data Extraction | GainingDocx",
    description: "Extract seller, buyer, invoice number, HS codes, line items, quantities, prices, currency, Incoterms and totals from commercial invoice PDFs or images.",
    h1: "AI Commercial Invoice Parser and OCR",
    intro: "Extract customs and trade data from commercial invoices without retyping each line. Review seller and buyer details, HS codes, quantities, unit prices, charges, currency, Incoterms and invoice totals before export or matching.",
    headings: ["Commercial Invoice Fields and Line Items Extracted", "Invoice Validation and Matching Checks", "How to Extract Commercial Invoice Data", "Commercial Invoice Parser FAQ"],
  },
  "packing-list-parser": {
    title: "Packing List OCR & Line-Item Data Extraction | GainingDocx",
    description: "Extract cartons, package marks, SKUs, quantities, dimensions, net weight, gross weight and CBM from packing list PDFs, scans and photos.",
    h1: "Packing List OCR and AI Data Extraction",
    intro: "Turn multi-page packing lists into editable package and cargo rows. GainingDocx extracts carton counts, marks, product lines, dimensions, net and gross weight, CBM and container references, then checks printed totals.",
    headings: ["Packing List Fields Extracted", "Packing List Total and Container Checks", "How to Extract Packing List Data", "Packing List OCR FAQ"],
  },
  "sea-waybill-parser": {
    title: "Sea Waybill OCR & Data Extraction | GainingDocx",
    description: "Extract parties, vessels, ports, containers, cargo, weights, dates and freight terms from sea waybill PDFs and images, with shipping-data checks.",
    h1: "AI Sea Waybill Parser and OCR",
    intro: "Extract operational shipping data from sea waybills, express bills and straight-consigned ocean documents. Review parties, routing, containers, cargo, weights, dates and freight terms in one structured record.",
    headings: ["Sea Waybill Fields Extracted", "Container, Port and Weight Checks", "How to Extract Sea Waybill Data", "Sea Waybill Parser FAQ"],
  },
  "arrival-notice-parser": {
    title: "Arrival Notice OCR & Shipping Data Extraction | GainingDocx",
    description: "Extract B/L references, vessel, ETA, port, containers, consignee, charges and printed free-time dates from carrier arrival notices.",
    h1: "Arrival Notice OCR and Data Extraction",
    intro: "Turn carrier arrival notices into reviewed shipment records. Extract B/L references, vessel and voyage, ETA, port, container numbers, consignee details, printed charges and free-time dates before planning pickup.",
    headings: ["Arrival Notice Fields Extracted", "Arrival Notice Validation and B/L Matching", "How to Extract Arrival Notice Data", "Arrival Notice OCR FAQ"],
  },
  "booking-confirmation-parser": {
    title: "Shipping Booking Confirmation OCR & Parser | GainingDocx",
    description: "Extract booking number, carrier, vessel, voyage, ports, equipment, cut-offs and sailing dates from ocean booking confirmations.",
    h1: "Ocean Booking Confirmation OCR Parser",
    intro: "Extract the routing, equipment and deadline data inside ocean booking confirmations. Capture booking numbers, carrier, vessel and voyage, ports, container requirements, cut-offs and sailing dates for downstream shipping instructions.",
    headings: ["Booking Confirmation Fields Extracted", "Routing and Date Validation Checks", "How to Extract Ocean Booking Data", "Booking Confirmation OCR FAQ"],
  },
  "purchase-order-parser": {
    title: "Purchase Order OCR & PO Line-Item Extraction | GainingDocx",
    description: "Extract PO numbers, suppliers, product lines, quantities, unit prices, currency, delivery terms and totals for review and three-way invoice matching.",
    h1: "Purchase Order OCR and AI PO Parser",
    intro: "Convert purchase order PDFs and images into structured header and line-item data. Capture supplier, delivery, quantity, price, currency and Incoterm evidence for invoice and goods-receipt matching.",
    headings: ["Purchase Order Fields and Lines Extracted", "PO Validation and Three-Way Matching Checks", "How to Extract Purchase Order Data", "Purchase Order OCR FAQ"],
  },
  "freight-invoice-parser": {
    title: "Freight Invoice OCR, Data Extraction & Audit | GainingDocx",
    description: "Extract shipment references, base freight, fuel, terminal and accessorial charges from freight invoices. Check line arithmetic and match supporting records.",
    h1: "Freight Invoice OCR and Charge-Line Extraction",
    intro: "Extract every freight charge as a separate, reviewable line instead of relying on a grand total. Capture invoice, B/L, booking and container references, route, equipment, rates, taxes and accessorial charges for audit and matching.",
    headings: ["Freight Invoice Fields and Charges Extracted", "Freight Charge Audit and Matching Checks", "How to Extract Freight Invoice Data", "Freight Invoice OCR FAQ"],
  },
  "goods-receipt-parser": {
    title: "Goods Receipt OCR & GRN Data Extraction | GainingDocx",
    description: "Extract GRN references, receipt dates, PO numbers, accepted and rejected quantities, item lines and signatures for invoice three-way matching.",
    h1: "Goods Receipt and GRN OCR Parser",
    intro: "Extract goods-receipt evidence from GRNs, warehouse receipts and proof-of-receipt documents. Capture PO references, dates, item lines, accepted quantities, rejected quantities and exceptions for three-way matching.",
    headings: ["Goods Receipt and GRN Fields Extracted", "Receipt Validation and Three-Way Matching", "How to Extract Goods Receipt Data", "Goods Receipt OCR FAQ"],
  },
};

export const FEATURE_SEO: Record<string, SeoPageCopy> = {
  "shipping-document-data-extraction": {
    title: "AI Shipping Document OCR & Data Extraction Software",
    description: "Extract structured fields and line items from Bills of Lading, invoices, packing lists, air waybills and other freight documents.",
    h1: "AI Data Extraction for Shipping and Freight Documents",
    intro: "Extract structured fields and line items from Bills of Lading, invoices, packing lists, air waybills and related logistics documents. Review every result before exporting it to Excel, CSV, JSON or a downstream system.",
    headings: ["Shipping Documents and Data Supported", "How Shipping Document OCR Works", "Shipping Document OCR FAQ"],
  },
  "maritime-document-validation": {
    title: "Shipping Document Validation & Maritime Data Checks",
    description: "Validate container numbers, IMO numbers, ports, dates, weights, package totals and financial arithmetic after shipping document OCR.",
    h1: "Validate Shipping Document Data After OCR",
    intro: "Check extracted container numbers, IMO numbers, ports, dates, weights, package totals and financial arithmetic with reproducible rules. Validation identifies internal inconsistencies; it does not authenticate the issuer.",
    headings: ["Shipping and Maritime Data Checks", "How Document Validation Works", "Shipping Data Validation FAQ"],
  },
  "shipment-document-matching": {
    title: "Three-Way Matching for PO, Invoice & Goods Receipt",
    description: "Compare purchase orders, invoices and goods receipts, then reconcile B/L, packing-list and freight-invoice shipment data.",
    h1: "Three-Way Document Matching and Shipment Reconciliation",
    intro: "Compare purchase orders, invoices and goods receipts at header and line level, then reconcile transport evidence across Bills of Lading, packing lists and freight invoices. GainingDocx preserves each source value and reports discrepancies for review.",
    headings: ["PO, Invoice and Goods Receipt Matching", "How Three-Way Matching Works", "Three-Way Matching FAQ"],
  },
  "shipping-document-search": {
    title: "Search Shipping Documents by B/L, Invoice or Container",
    description: "Search private shipping records by B/L, invoice, container, vessel, party, port or other data extracted from documents.",
    h1: "Search Shipping Records by Extracted Data",
    intro: "Find private workspace records by B/L number, invoice number, container, vessel, party or port—even when that reference appears only inside the original PDF.",
    headings: ["Search Shipping Documents and References", "How Shipping Record Search Works", "Shipping Document Search FAQ"],
  },
  "shipping-data-export": {
    title: "Export Shipping Document Data to Excel, CSV & JSON",
    description: "Export reviewed shipping document fields, container rows and cargo line items to Excel, CSV, structured JSON or PDF.",
    h1: "Export Reviewed Shipping Data to Excel, CSV and JSON",
    intro: "Move reviewed document fields, container rows and cargo line items into usable files. Export corrections—not raw OCR text—to Excel workbooks, CSV, structured JSON or PDF review reports.",
    headings: ["Shipping Data Export Formats", "How to Export Reviewed Document Data", "Shipping Data Export FAQ"],
  },
  "shipping-document-generation": {
    title: "Generate Shipping Document Drafts from Reviewed Data",
    description: "Reuse reviewed shipment data to create editable commercial-invoice, packing-list and shipping-instruction drafts.",
    h1: "Create Shipping Document Drafts Without Retyping Data",
    intro: "Reuse reviewed shipment data to prepare editable commercial invoices, packing lists and shipping-instruction drafts. Generated files remain working drafts for human review and formal issuance where required.",
    headings: ["Shipping Document Drafts You Can Create", "How Document Generation Works", "Shipping Document Generation FAQ"],
  },
};

export const TOOL_SEO: Record<string, SeoPageCopy> = {
  "cbm-calculator": { title: "Free CBM Calculator for Shipping | Multiple Cartons", description: "Calculate shipment CBM from carton dimensions and quantity in mm, cm, metres or inches. Add multiple box sizes, total gross weight and export CSV.", h1: "Free CBM Calculator for Shipping", intro: "Calculate cubic metres for one carton or a mixed shipment. Add each box size, choose the unit, enter quantity and weight, and get total CBM and gross weight instantly.", headings: ["What the Shipping CBM Calculator Shows", "CBM Formula and Calculation Method", "CBM Calculator FAQ"] },
  "container-load-calculator": { title: "Free Container Load Calculator for 20ft & 40ft Cartons", description: "Estimate how many identical cartons fit in 20GP, 40GP, 40HC or 45HC containers. Compare six rotations, internal space and payload limits.", h1: "Container Load Calculator for Carton Fit", intro: "Estimate identical-carton capacity for 20ft, 40ft and high-cube containers. The calculator tests six box rotations and compares dimensional fit with payload capacity.", headings: ["20ft and 40ft Container Carton Capacity", "Container Fit Calculation Method and Limits", "Container Load Calculator FAQ"] },
  "container-number-check": { title: "ISO 6346 Container Number Check Digit Calculator", description: "Validate up to 100 shipping container numbers with the ISO 6346 check digit calculation. Find errors, see the expected number and export CSV.", h1: "ISO 6346 Container Number Validator", intro: "Paste one or up to 100 container numbers to verify their ISO 6346 structure and check digit. Invalid results show the expected full number for review and CSV export.", headings: ["Check Shipping Container Numbers", "ISO 6346 Check Digit Calculation", "Container Number Checker FAQ"] },
  "port-code-lookup": { title: "UN/LOCODE Port Code Lookup | Search by Port or Code", description: "Search maritime locations by port name or five-character UN/LOCODE. Find the country and location code used in shipping and trade records.", h1: "UN/LOCODE Port Code Lookup", intro: "Search the bundled UNECE UN/LOCODE data by port name or five-character code. Use standardized location codes to reduce ambiguity in shipping documents and route records.", headings: ["Find a Port Code by Name or UN/LOCODE", "UN/LOCODE Search Method and Limits", "Port Code Lookup FAQ"] },
  "chargeable-weight-calculator": { title: "Air Freight Chargeable & Volumetric Weight Calculator", description: "Compare actual and volumetric weight for multiple packages using air freight, express courier or a custom DIM divisor. Metric and imperial options.", h1: "Air Freight Chargeable Weight Calculator", intro: "Calculate volumetric weight and compare it with actual gross weight to find the chargeable weight. Add multiple package groups and choose the air-cargo, express-courier or contracted custom divisor.", headings: ["Actual, Volumetric and Chargeable Weight", "Air Freight Volumetric Weight Formula", "Chargeable Weight Calculator FAQ"] },
  "lcl-freight-calculator": { title: "LCL Freight Calculator | Ocean W/M Cost Estimate", description: "Calculate LCL ocean freight from CBM, gross weight and a quoted W/M rate. See whether volume or metric weight controls and add local charges.", h1: "LCL Freight W/M Calculator", intro: "Estimate LCL ocean freight by comparing shipment CBM with weight in metric tons. Apply the quoted W/M rate, identify the controlling revenue tons, and add entered accessorial charges.", headings: ["LCL Weight or Measure Freight Estimate", "LCL W/M Formula and Calculation Method", "LCL Freight Calculator FAQ"] },
  "demurrage-detention-calculator": { title: "Demurrage & Detention Calculator | Free-Time Charges", description: "Calculate free days, chargeable days, tiered daily demurrage or detention rates and fixed fees from your carrier dates and tariff.", h1: "Demurrage and Detention Charge Calculator", intro: "Audit container free time and estimated charges using the dates, free days and rate tiers in your carrier tariff or contract. See elapsed, free and chargeable days separately.", headings: ["Container Free Time and Chargeable Days", "Demurrage and Detention Calculation Method", "Demurrage Calculator FAQ"] },
  "hs-code-finder": { title: "Free HS Code Finder & U.S. HTS Tariff Lookup", description: "Search official U.S. HTS descriptions by product keyword. Review candidate tariff codes, international six-digit HS headings and published duty-rate fields.", h1: "HS Code Finder and U.S. HTS Lookup", intro: "Search official U.S. Harmonized Tariff Schedule descriptions using a product keyword. Results separate the international six-digit HS heading from the longer U.S. HTS classification and show published rate fields where available.", headings: ["Search HS and HTS Codes by Product", "HS Code Search Method and Classification Limits", "HS Code Finder FAQ"] },
  "shipping-mark-generator": { title: "Free Shipping Mark Generator for Cartons & Export Cases", description: "Create and print carton shipping marks with consignee, destination, PO, case numbers, weights, dimensions and handling instructions.", h1: "Free Shipping Mark Generator", intro: "Create a clear, printable shipping mark for cartons, crates or export cases. Add consignee, destination, purchase order, case range, weights, dimensions and handling instructions, then print or download.", headings: ["Create a Carton or Export Shipping Mark", "Shipping Mark Format and Requirements", "Shipping Mark Generator FAQ"] },
};

export const TEMPLATE_SEO: Record<string, SeoPageCopy> = {
  "bill-of-lading-template": { title: "Free Bill of Lading Template | Word, Excel & PDF", description: "Fill a Bill of Lading data worksheet online or download editable Word, Excel and PDF formats for carrier instructions and draft checking.", h1: "Free Bill of Lading Template and Data Worksheet", intro: "Prepare shipper, consignee, notify party, routing, container and cargo details in a fillable worksheet for carrier instructions and Bill of Lading draft checking.", headings: ["Bill of Lading Cargo and Package Details", "Bill of Lading Field Checks", "How to Fill Out a Bill of Lading Template", "Bill of Lading Template FAQ"] },
  "commercial-invoice-template": { title: "Free Commercial Invoice Template | Excel, Word & PDF", description: "Create a commercial invoice for international shipping with seller, buyer, HS codes, origin, values, Incoterms and charges.", h1: "Free Commercial Invoice Template for International Shipping", intro: "Create an export commercial invoice with seller, buyer, HS codes, origin, quantities, values, Incoterms, freight, insurance and declarations.", headings: ["Commercial Invoice Line Items", "Commercial Invoice Field Checks", "How to Fill Out a Commercial Invoice", "Commercial Invoice Template FAQ"] },
  "packing-list-template": { title: "Free Export Packing List Template | Excel, Word & PDF", description: "Create an export packing list with package marks, dimensions, net and gross weight, and CBM totals. Fill online or download.", h1: "Free Packing List Template for International Shipping", intro: "Build a case-level packing list with marks, package counts, product lines, dimensions, net and gross weight, and CBM totals.", headings: ["Packing List Packages and Contents", "Packing List Weight and CBM Checks", "How to Fill Out an Export Packing List", "Packing List Template FAQ"] },
  "shipping-instructions-template": { title: "Free Shipping Instructions Template | Word, Excel & PDF", description: "Prepare shipper, consignee, routing, equipment and cargo instructions for a carrier or freight forwarder to draft the B/L.", h1: "Shipping Instructions Template for Bill of Lading Preparation", intro: "Prepare consistent shipper, consignee, routing, equipment and cargo instructions for a carrier or freight forwarder.", headings: ["Shipping Instruction Cargo Details", "Shipping Instruction Field Checks", "How to Prepare Shipping Instructions", "Shipping Instructions Template FAQ"] },
  "arrival-notice-template": { title: "Arrival Notice Template & Data Sheet | Word, Excel & PDF", description: "Prepare or review carrier, vessel, ETA, terminal, B/L, container, charge and free-time information in one editable worksheet.", h1: "Free Arrival Notice Data Sheet Template", intro: "Prepare or review carrier, vessel, ETA, terminal, B/L, container, charge and free-time information.", headings: ["Arrival Notice Equipment and Cargo Status", "Arrival Notice Date and Reference Checks", "How to Prepare an Arrival Notice Data Sheet", "Arrival Notice Template FAQ"] },
  "delivery-order-template": { title: "Delivery Order Template & Release Data Sheet | Word, Excel & PDF", description: "Organize the references, parties, terminal, equipment and release details required for an authorized cargo-delivery process.", h1: "Free Delivery Order Data Sheet Template", intro: "Organize the references, parties, terminal, equipment and release details required for an authorized cargo-delivery process.", headings: ["Authorized Equipment and Cargo Release", "Delivery Order Reference Checks", "How to Prepare a Delivery Order Data Sheet", "Delivery Order Template FAQ"] },
  "pro-forma-invoice-template": { title: "Free Pro Forma Invoice Template | Excel, Word & PDF", description: "Prepare a pre-shipment quotation with buyer, seller, item values, origin, Incoterms, payment, validity and delivery terms.", h1: "Free Pro Forma Invoice Template for International Trade", intro: "Prepare a pre-shipment quotation with buyer, seller, validity, item values, origin, Incoterms, payment and delivery terms.", headings: ["Pro Forma Invoice Line Items", "Pro Forma Invoice Field Checks", "How to Fill Out a Pro Forma Invoice", "Pro Forma Invoice Template FAQ"] },
  "certificate-of-origin-template": { title: "Certificate of Origin Template & Data Worksheet", description: "Prepare exporter, producer, consignee, invoice, goods and origin-criterion details before submission to the competent issuer.", h1: "Certificate of Origin Data Worksheet", intro: "Assemble exporter, producer, consignee, invoice, goods and origin-criterion details before submitting the required form to the competent issuer.", headings: ["Goods Covered by the Origin Declaration", "Certificate of Origin Data Checks", "How to Prepare Origin Information", "Certificate of Origin Template FAQ"] },
  "air-waybill-template": { title: "Air Waybill Template & AWB Data Worksheet | Word, Excel & PDF", description: "Prepare shipper, consignee, routing, pieces, weight, charge and handling data for an airline, freight forwarder or cargo agent.", h1: "Air Waybill Data Worksheet for Shippers", intro: "Prepare shipper, consignee, routing, pieces, weight, charge and handling data for an airline, freight forwarder or cargo agent.", headings: ["Air Waybill Cargo Particulars", "AWB Field and Weight Checks", "How to Prepare Air Waybill Data", "Air Waybill Template FAQ"] },
  "simple-packing-list-template": { title: "Simple Packing List Template | Free Excel, Word & PDF", description: "Create a compact shipment-level packing list for package groups when case-by-case dimensions are not required.", h1: "Free Simple Packing List Template", intro: "Create a compact shipment-level packing list for a small number of package groups when case-by-case dimensions are not required.", headings: ["Simple Packing List Package Summary", "Packing List Field Checks", "How to Fill Out a Simple Packing List", "Simple Packing List FAQ"] },
  "container-packing-list-template": { title: "Container Packing List Template | Excel, Word & PDF", description: "Allocate packages and cargo rows to container and seal numbers with gross weight and CBM totals.", h1: "Free Container Packing List Template", intro: "Allocate packages and cargo rows to container and seal numbers with gross weight and CBM totals.", headings: ["Container Allocation and Cargo", "Container Packing List Checks", "How to Prepare a Container Packing List", "Container Packing List FAQ"] },
};
