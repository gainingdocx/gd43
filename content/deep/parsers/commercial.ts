import type { DeepContentMap } from "@/content/deep/types";

export const COMMERCIAL_PARSER_DEEP: DeepContentMap = {
  "commercial-invoice-parser": {
    updated: "2026-08-04",
    keywords: [
      "commercial invoice OCR",
      "invoice data extraction shipping",
      "extract HS codes from invoice",
      "customs invoice parser",
      "invoice line item extraction",
      "commercial invoice to excel",
      "trade invoice automation",
    ],
    quickAnswer: {
      heading: "What a commercial invoice parser extracts",
      body:
        "Every header field and every line item: seller and buyer, invoice number and date, currency, Incoterm and named place, payment terms, and per line the description, SKU, HS code, country of origin, quantity, unit price, amount and weights. Line amounts are recomputed against quantity × unit price, and the lines are totalled against the printed invoice total.",
      bullets: [
        "Line items as rows, not as flattened text",
        "HS code and origin captured per line",
        "Arithmetic recomputed, not trusted",
        "Ready for three-way and shipment matching",
      ],
    },
    sections: [
      {
        heading: "Why invoice line items are the hard part",
        paragraphs: [
          "Header extraction is comparatively easy — an invoice number is an invoice number wherever it sits on the page. Line items are where invoice parsing succeeds or fails, because a commercial invoice table is rarely a clean grid. Descriptions wrap over several lines, a single product occupies three visual rows, subtotals interleave with items, and continuation pages repeat headers in the middle of the data.",
          "Getting this right matters because everything downstream is line-level. Customs classifies per line. Three-way matching compares per line. Duty is calculated per line. An extraction that returns a correct total and mangled lines has solved the easy half of the problem.",
        ],
        bullets: [
          "Multi-line descriptions that belong to one item, not several",
          "Quantity and unit of measure printed together in one cell",
          "Unit prices with varying decimal precision across the same invoice",
          "Discount, charge and subtotal rows mixed into the item table",
          "Multi-page tables with repeated headers and carried-forward subtotals",
          "Currency symbols that are ambiguous between currencies",
          "HS codes printed with or without dots, and truncated to different lengths",
        ],
      },
      {
        heading: "The field inventory",
        table: {
          caption: "Commercial invoice extraction",
          columns: ["Group", "Fields"],
          rows: [
            ["Invoice", "Invoice number, invoice date, due date, purchase order and contract references, exporter reference"],
            ["Parties", "Seller and exporter, buyer, consignee or ship-to, notify party, and any agent named"],
            ["Trade terms", "Currency as an ISO code, Incoterm and named place, rules edition, payment terms, country of origin, country of destination"],
            ["Shipment", "Mode of transport, carrier, vessel or flight, port of loading, port of discharge, transport document reference"],
            ["Line items", "Description, SKU or part number, HS code, country of origin, quantity, unit of measure, unit price, line amount, net weight, gross weight"],
            ["Charges", "Freight, insurance, packing, handling, discounts and any other charge shown as a separate line"],
            ["Totals", "Subtotal, charges, tax, invoice total, total packages, total net and gross weight"],
            ["Certification", "Declarations, destination control statements, signatory name, title and date"],
          ],
        },
      },
      {
        heading: "Arithmetic and structural checks",
        paragraphs: [
          "The AI reads what is printed; deterministic code decides whether it is coherent. Invoice arithmetic is the clearest case for this — a total is either the sum of its parts or it is not, and no amount of model confidence changes that.",
        ],
        bullets: [
          "Each line amount recomputed as quantity × unit price and compared with the printed amount",
          "Line amounts summed and compared with the printed subtotal",
          "Subtotal plus charges compared with the printed invoice total",
          "Currency checked for consistency across lines, charges and totals",
          "HS codes checked for structural plausibility — length, digit content and a valid chapter",
          "Net weight checked against gross weight per line and in total",
          "Incoterm validated against the published rule set and flagged where a maritime-only rule is used on containerised cargo",
          "Dates checked for plausible ordering against each other and against the transport document",
        ],
        callout: {
          tone: "info",
          title: "A total that does not add up is a real finding",
          body:
            "It usually means a line was added, edited or removed after the total was written — which is exactly the situation you want to catch before the invoice is filed with customs or presented under a credit. It is one of the most frequently triggered checks on real documents, and it is almost never a false positive.",
        },
      },
      {
        heading: "Matching the invoice to the rest of the shipment",
        paragraphs: [
          "An invoice is rarely wrong in isolation. It is wrong relative to something — the purchase order that authorised the purchase, the packing list that describes what was actually shipped, the Bill of Lading that records what the carrier received, or the goods receipt confirming what arrived.",
        ],
        table: {
          caption: "Comparisons that find real problems",
          columns: ["Compare with", "What to check"],
          rows: [
            ["Purchase order", "Item, quantity, unit price, currency, delivery terms — the classic price and quantity variance check"],
            ["Packing list", "Line quantities, SKUs, net and gross weights, package counts, origin"],
            ["Bill of Lading or air waybill", "Parties, references, description, weights, and whether shipment dates are consistent"],
            ["Goods receipt", "Accepted quantity against invoiced quantity, and rejected or damaged quantities"],
            ["Certificate of origin", "Description, quantity, invoice reference and the origin claimed"],
            ["Letter of credit", "Description wording, amount, tolerance, currency, and required declarations"],
          ],
        },
      },
      {
        heading: "Using the extracted data",
        numbered: [
          "Review the flagged fields first — arithmetic failures, HS code structure and weight relationships are ordered by severity rather than by page position.",
          "Correct anything the source document genuinely shows differently, so the record reflects the document rather than the model.",
          "Group the invoice with the packing list, transport document and purchase order for the same shipment.",
          "Work the resulting discrepancy list, which is prioritised by what actually delays clearance or payment.",
          "Export to Excel with the line items intact, to CSV for a flat feed, or to JSON where the array structure needs to survive.",
          "Reuse the reviewed data to generate a packing list or shipping-instruction draft rather than retyping it.",
        ],
      },
    ],
    faqs: [
      {
        q: "What data is extracted from a commercial invoice?",
        a: "Header fields — invoice number and date, seller, buyer and consignee, currency, Incoterm and named place, payment terms, origin and destination, transport details — plus every line item with its description, SKU, HS code, origin, quantity, unit of measure, unit price, amount and weights, and all charge and total lines.",
      },
      {
        q: "Does it preserve line items or just totals?",
        a: "Line items are returned as structured rows, because everything downstream is line-level: customs classifies per line, three-way matching compares per line, and duty is calculated per line. Multi-line descriptions are reassembled into their item, and subtotal or charge rows interleaved in the table are separated from the items themselves.",
      },
      {
        q: "Are HS codes extracted?",
        a: "Yes, per line where they are printed, and they are checked for structural plausibility — length, digit content and whether the chapter exists. Codes printed with dots, without dots, or truncated to six, eight or ten digits are normalised for comparison while the printed form is preserved. Classification itself remains the importer's responsibility.",
      },
      {
        q: "Is the invoice arithmetic checked?",
        a: "Yes, in deterministic code. Each line amount is recomputed as quantity × unit price, the lines are summed against the printed subtotal, and the subtotal plus charges is compared with the invoice total. A total that does not equal its parts is one of the most frequently triggered checks on real documents and is almost never a false positive.",
      },
      {
        q: "Can it match the invoice against a purchase order?",
        a: "Yes. Grouping the invoice with the purchase order and, where available, the goods receipt performs a three-way comparison at header and line level, reporting price variances, quantity variances, unmatched lines and currency or terms differences rather than requiring a manual reconciliation.",
      },
      {
        q: "What about multi-currency invoices?",
        a: "Currency is captured per invoice and checked for consistency across lines, charges and totals. An invoice mixing currencies without a stated conversion is flagged, because it is either an error or something customs will query. Where a conversion rate is printed, it is captured as a field rather than applied silently.",
      },
      {
        q: "Does it handle multi-page invoices?",
        a: "Yes. Tables that run across page breaks are reassembled, repeated column headers on continuation pages are recognised as headers rather than data rows, and carried-forward subtotals are distinguished from item lines. Long invoices take proportionally longer because every page is processed.",
      },
      {
        q: "Can it read invoices in other languages?",
        a: "Yes, for the languages the extraction layer supports, and field labels are mapped to the same structured model regardless of the language they are printed in. Values, party names and descriptions are preserved as written rather than translated, so the record matches the document a customs officer will be holding.",
      },
      {
        q: "Does the parser validate the Incoterm?",
        a: "It checks the rule against the published set and flags a maritime-only rule — FAS, FOB, CFR or CIF — used on containerised cargo, which is one of the most common Incoterm errors in practice. It also flags a rule stated without a named place or without the rules edition, both of which leave the term commercially incomplete.",
      },
      {
        q: "Can it detect an under-declared or fraudulent invoice?",
        a: "No. Validation detects internal inconsistency — arithmetic that does not add up, weights that contradict each other, references that do not match other documents. It cannot assess whether a stated price reflects the real transaction. Valuation questions are for the importer, its broker and, ultimately, customs.",
      },
      {
        q: "What formats can I export invoice data to?",
        a: "Excel with separate summary and line-item sheets, CSV for a flat feed, structured JSON that preserves the line array, and a PDF review report showing the extracted values alongside any findings. The JSON structure is the right choice where a downstream system needs the line detail intact.",
      },
      {
        q: "Can the invoice data be reused to create other documents?",
        a: "Yes. Reviewed invoice data can populate a packing list or shipping-instruction draft, so descriptions, SKUs, HS codes, quantities and party details carry across rather than being retyped — which is also what keeps the documents consistent with each other from the outset.",
      },
    ],
    related: [
      { href: "/guides/commercial-invoice-vs-packing-list", label: "Commercial invoice vs packing list", blurb: "Which document customs uses for value, and which fields must agree." },
      { href: "/tools/hs-code-finder", label: "HS code finder", blurb: "Verify the classification on each invoice line." },
      { href: "/templates/commercial-invoice-template", label: "Commercial invoice template", blurb: "Build a customs-ready invoice with the fields in the right places." },
      { href: "/features/shipment-document-matching", label: "Three-way document matching", blurb: "Compare the invoice against the PO and goods receipt automatically." },
    ],
  },

  "packing-list-parser": {
    updated: "2026-08-04",
    keywords: [
      "packing list OCR",
      "packing list data extraction",
      "extract carton details from packing list",
      "packing list to excel",
      "net gross weight extraction",
      "CBM extraction packing list",
      "case level packing data",
    ],
    quickAnswer: {
      heading: "What a packing list parser extracts",
      body:
        "Package rows with marks and case numbers, package type and count, contents with SKU and HS code, item quantity, net and gross weight, dimensions and CBM, plus container and seal allocation where the list is container-based. Printed totals are recomputed from the rows, and impossible relationships — net weight above gross, a total that does not match its lines — are flagged.",
      bullets: [
        "Package rows preserved, not summarised",
        "Net, gross and CBM recomputed from lines",
        "Container and seal allocation captured",
        "Matched against the invoice and B/L",
      ],
    },
    sections: [
      {
        heading: "Packing lists are the least standardised document in the set",
        paragraphs: [
          "Bills of Lading vary by carrier but converge on a recognisable structure. Packing lists have no such gravity. They are produced by whoever packed the goods, in whatever their ERP or spreadsheet emits, and the result ranges from a properly structured case-level table to a scanned spreadsheet with merged cells and a handwritten amendment in the margin.",
          "That variability is why extraction has to be tolerant about layout and strict about arithmetic. The structure of any given packing list cannot be assumed; the relationship between net weight, gross weight and package counts can be, and it is where the real findings come from.",
        ],
        bullets: [
          "Merged cells spanning several package rows",
          "Case ranges expressed as '1-20' in a single cell rather than as twenty rows",
          "Dimensions given per carton on some rows and per pallet on others, without saying which",
          "Weights in kilograms on one row and pounds on another",
          "Subtotals per container interleaved with package rows",
          "Handwritten amendments over a printed table",
          "Continuation sheets where the header does not repeat",
        ],
      },
      {
        heading: "Field inventory",
        table: {
          caption: "Packing list extraction",
          columns: ["Group", "Fields"],
          rows: [
            ["References", "Packing list number and date, commercial invoice number, purchase order or contract reference"],
            ["Parties", "Seller or exporter, buyer, consignee or ship-to"],
            ["Shipment", "Mode of transport, carrier, vessel or flight, port of loading, port of discharge, transport document reference"],
            ["Package rows", "Marks and numbers, case number or range, package type, package count, contents description, SKU, HS code, item quantity and unit"],
            ["Weights", "Net weight and gross weight per row, and shipment totals"],
            ["Dimensions", "Length, width, height and unit, and CBM per row where printed or derived"],
            ["Equipment", "Container number, seal number, size and type where the list allocates cargo to containers"],
            ["Totals", "Total packages, total net weight, total gross weight, total CBM"],
            ["Certification", "Packing and handling notes, preparer name and signature evidence"],
          ],
        },
      },
      {
        heading: "The checks that find real errors",
        paragraphs: [
          "Packing list validation is unusually productive because the document is full of quantities that must satisfy simple relationships. When they do not, something upstream is genuinely wrong.",
        ],
        bullets: [
          "Net weight compared against gross weight per row and in total — net can never exceed gross",
          "Package counts summed across rows and compared with the printed total",
          "Net and gross weights summed and compared with the printed totals",
          "CBM recomputed from dimensions and package count, and compared with any printed CBM",
          "Container check digits recomputed under ISO 6346 where the list allocates cargo to containers",
          "Per-container subtotals summed against the shipment totals",
          "Units checked for consistency across rows, since a single row in a different unit distorts every total",
          "Case number sequences checked for gaps and overlaps against the stated package count",
        ],
        callout: {
          tone: "warn",
          title: "Net exceeding gross is more common than it should be",
          body:
            "It is one of the most frequently triggered validations on real documents. The usual causes are net and gross entered in the wrong columns, units mixed across rows, or net taken from a product specification while gross was measured. Whatever the cause, a document where net exceeds gross has an error somewhere upstream that will surface at customs if it is not resolved first.",
        },
      },
      {
        heading: "Where the packing list has to agree with other documents",
        table: {
          caption: "Cross-document reconciliation",
          columns: ["Compare with", "What must agree"],
          rows: [
            ["Commercial invoice", "SKUs, line quantities, HS codes, origin, and net and gross weights where the invoice states them"],
            ["Bill of Lading or air waybill", "Package counts, gross weight, measurement, container and seal numbers, marks"],
            ["Purchase order", "Item and quantity against what was ordered, so short or over shipment is visible"],
            ["Goods receipt", "What was declared as packed against what was recorded as received"],
            ["VGM declaration", "Cargo gross weight plus container tare against the weighed figure"],
            ["Shipping marks on the cargo", "Case numbers and marks, which are checked physically at examination"],
          ],
        },
      },
      {
        heading: "Getting good results from difficult documents",
        numbered: [
          "Submit the whole document including continuation sheets — package tables run over more often than any other document type.",
          "Where the packing list exists as a spreadsheet, submit that rather than a scan of a printout; structure that survives is structure that does not need reconstructing.",
          "Review the unit columns first, because a single row in the wrong unit distorts every total on the page.",
          "Check rows where dimensions describe a pallet rather than a carton, and confirm the CBM basis.",
          "Resolve any net-versus-gross flag at source rather than adjusting one figure to satisfy the check.",
          "Group with the invoice and transport document before exporting, so cross-document differences are caught in the same pass.",
        ],
      },
    ],
    faqs: [
      {
        q: "What data is extracted from a packing list?",
        a: "Package rows with marks and case numbers, package type and count, contents description, SKU, HS code and item quantity, net and gross weight, dimensions and CBM, plus container and seal allocation where present — together with the header references, parties, transport details and the printed shipment totals.",
      },
      {
        q: "Are the totals checked against the lines?",
        a: "Yes. Package counts, net weight, gross weight and CBM are all recomputed from the rows and compared with the printed totals. A total that does not equal the sum of its lines usually means a line was added, edited or removed after the total was written, and it is one of the more reliable defect signals in shipping documents.",
      },
      {
        q: "What happens if net weight exceeds gross weight?",
        a: "It is flagged as a contradiction, because the relationship is impossible. The usual causes are the two columns transposed, units mixed across rows, or a net figure taken from a product specification while the gross was measured. Resolve it at source rather than adjusting one number to satisfy the check, because customs applies the same logic.",
      },
      {
        q: "Is CBM recalculated?",
        a: "Yes, from dimensions and package count where dimensions are present, and compared with any printed CBM. Where a row's dimensions describe a loaded pallet or a whole lot rather than each package, the printed value is retained and the difference surfaced for review, since the calculation would otherwise be wrong by the number of packages.",
      },
      {
        q: "Can it handle case ranges like 'C/NO. 1-20'?",
        a: "Yes. A range expressed in one cell is captured as a range with its package count, rather than being misread as a single case. Case sequences are also checked across the document for gaps and overlaps against the stated total, which catches the common error of two rows claiming the same case numbers.",
      },
      {
        q: "Does it capture container and seal allocation?",
        a: "Yes, where the packing list allocates cargo to containers. Container numbers have their ISO 6346 check digits recomputed, seal numbers are captured as printed, and per-container subtotals are checked against the shipment totals. This is what makes a multi-container packing list reconcilable against the Bill of Lading.",
      },
      {
        q: "What if the packing list mixes units?",
        a: "Unit consistency is checked across rows and a mixed-unit document is flagged, because a single row in centimetres among rows in inches — or pounds among kilograms — distorts every total on the page while looking entirely normal. The printed unit per row is preserved so the source remains auditable.",
      },
      {
        q: "Can the packing list be matched against the invoice?",
        a: "Yes. Grouping them compares SKUs, line quantities, HS codes, origin and weights, and reports where the two documents describe the shipment differently. Divergence between the invoice and the packing list is one of the most common causes of customs queries and letter-of-credit discrepancies.",
      },
      {
        q: "Does it work with scanned spreadsheets and photographs?",
        a: "Yes, though a native file gives better results than a scan of a printout. Merged cells, handwritten amendments and photographed pages are all normal inputs. Where structure is genuinely ambiguous, the affected rows are surfaced for review rather than being resolved by assumption.",
      },
      {
        q: "How does this help with VGM?",
        a: "The packing list gross weight plus the container's stencilled tare should approximate the weighed VGM closely. Extracting the per-container gross weight makes that cross-check possible, and a material divergence means something was loaded, omitted or mis-weighed — worth resolving before the container ships rather than at the terminal.",
      },
      {
        q: "Can I export the package rows to Excel?",
        a: "Yes. Export produces an Excel workbook with the package rows intact on their own sheet, plus CSV and structured JSON where the row array needs to survive into a downstream system. Flattening the rows into a summary would defeat the purpose of extracting them.",
      },
      {
        q: "Does the parser handle simple totals-only packing lists?",
        a: "Yes, but it reports what it can. A list showing only shipment totals extracts those totals and records that no package-level detail was present, rather than fabricating rows. Where the document is too summarised to reconcile against the invoice, that limitation is stated instead of being hidden by a confident-looking result.",
      },
    ],
    related: [
      { href: "/templates/packing-list-template", label: "Export packing list template", blurb: "Build a case-level packing list with totals that reconcile." },
      { href: "/tools/cbm-calculator", label: "CBM calculator", blurb: "Verify the volume figures on a packing list you have received." },
      { href: "/commercial-invoice-parser", label: "Commercial invoice parser", blurb: "The financial counterpart the packing list must agree with." },
      { href: "/guides/how-to-calculate-cbm-for-shipping", label: "How to calculate CBM", blurb: "Formulas and the conversion errors that distort a volume total." },
    ],
  },

  "purchase-order-parser": {
    updated: "2026-08-04",
    keywords: [
      "purchase order OCR",
      "PO data extraction",
      "purchase order line items",
      "three way matching PO invoice",
      "extract purchase order to excel",
      "PO parser AI",
      "procurement document automation",
    ],
    quickAnswer: {
      heading: "What a purchase order parser extracts",
      body:
        "Header and line-level data: PO number and date, buyer and supplier, delivery and payment terms, currency, requested dates, and per line the item, description, quantity, unit of measure, unit price, line amount and delivery date. The result is the baseline that invoices and goods receipts are matched against in a three-way check.",
      bullets: [
        "Line items with price and quantity per row",
        "Delivery terms, dates and ship-to captured",
        "Arithmetic recomputed against printed totals",
        "The reference point for three-way matching",
      ],
    },
    sections: [
      {
        heading: "The purchase order is the baseline everything is judged against",
        paragraphs: [
          "In a three-way match, the purchase order is the authority: it records what was agreed, at what price, in what quantity, on what terms. The invoice asserts what is owed and the goods receipt records what arrived. Where the three disagree, the purchase order is what the disagreement is measured from.",
          "That makes PO extraction quality disproportionately important. An invoice line extracted imperfectly produces one wrong comparison. A PO line extracted imperfectly produces a wrong baseline against which every subsequent invoice and receipt is judged.",
        ],
      },
      {
        heading: "Field inventory",
        table: {
          caption: "Purchase order extraction",
          columns: ["Group", "Fields"],
          rows: [
            ["Order", "PO number, PO date, revision number, buyer's internal reference, contract or agreement reference"],
            ["Parties", "Buyer or ordering entity, supplier or vendor, ship-to address, bill-to address, requester and approver where named"],
            ["Terms", "Currency, payment terms, Incoterm and named place, delivery terms, shipping method, freight payment responsibility"],
            ["Dates", "Order date, requested delivery date, ship-by or window dates, expiry or validity"],
            ["Line items", "Line number, item code, description, quantity, unit of measure, unit price, line amount, per-line delivery date, and any tax or discount"],
            ["Totals", "Subtotal, tax, freight, discounts, order total"],
            ["Instructions", "Packing, marking, documentation and quality requirements stated on the order"],
          ],
        },
      },
      {
        heading: "Checks applied",
        bullets: [
          "Line amount recomputed as quantity × unit price and compared with the printed amount",
          "Line amounts summed against the printed subtotal, and subtotal plus charges against the order total",
          "Currency checked for consistency across lines and totals",
          "Delivery dates checked for plausible ordering against the order date",
          "Duplicate line numbers and repeated item codes flagged",
          "Incoterm validated against the published rule set",
          "Revision indicators captured, so an amended PO is not silently treated as the original",
        ],
        callout: {
          tone: "warn",
          title: "Revisions are where three-way matching quietly breaks",
          body:
            "A revised purchase order that changes a quantity or a price, matched against an invoice raised on the original, produces a variance that is nobody's error. Capturing the revision number and date is what lets the match run against the version that was actually in force when the goods shipped.",
        },
      },
      {
        heading: "Three-way matching in practice",
        paragraphs: [
          "The classic three-way match compares the purchase order, the supplier invoice and the goods receipt. It answers three questions: was this ordered, was it received, and is the price what we agreed. Any of those failing should stop payment.",
          "In international trade there is a fourth question that the classic model misses: does the transport evidence support it. A shipment can match perfectly on paper while the Bill of Lading shows a different quantity or a different consignee, and that is precisely the situation where a payment goes out against goods that never arrived as described.",
        ],
        table: {
          caption: "What each document contributes",
          columns: ["Document", "Answers", "Typical variance found"],
          rows: [
            ["Purchase order", "What was agreed", "The baseline — variances are measured against it"],
            ["Commercial invoice", "What is being charged", "Price variance, quantity billed above received, unauthorised charges"],
            ["Goods receipt", "What arrived", "Short delivery, damaged or rejected quantity, wrong item"],
            ["Packing list", "What was declared as packed", "Discrepancy between packed and invoiced quantity"],
            ["Bill of Lading or AWB", "What the carrier received", "Weight or package differences, consignee mismatch"],
          ],
        },
      },
      {
        heading: "Tolerances and what to do with variances",
        paragraphs: [
          "Not every variance is a problem. Most organisations operate tolerances — a small percentage on price, a small quantity band on delivery — because chasing a rounding difference costs more than it recovers. What matters is that the tolerance is a deliberate policy rather than an accident of who reviewed the document.",
        ],
        bullets: [
          "Price variance above tolerance: hold payment and confirm against the contract or a documented price change",
          "Quantity invoiced above quantity received: pay against the receipt, not the invoice",
          "Quantity received above ordered: confirm whether over-delivery was authorised before accepting",
          "Item on the invoice that is not on the PO: treat as unauthorised until confirmed",
          "Currency or terms differing from the PO: escalate rather than absorb, since it changes the commercial deal",
          "Freight or handling charges not provided for on the PO: check the Incoterm before paying",
          "A revised PO in circulation: confirm which revision governed the shipment before judging any variance",
        ],
      },
    ],
    faqs: [
      {
        q: "What data is extracted from a purchase order?",
        a: "PO number, date and revision, buyer and supplier, ship-to and bill-to, currency, payment terms, Incoterm and named place, requested delivery dates, and per line the item code, description, quantity, unit of measure, unit price, amount and any line-level delivery date — plus subtotals, charges and the order total.",
      },
      {
        q: "What is three-way matching?",
        a: "Comparing the purchase order, the supplier invoice and the goods receipt before approving payment, to confirm that what is being charged was ordered, was received, and is priced as agreed. Any of the three failing should stop payment. In international trade it is worth extending to a fourth check against the transport document, which records what the carrier actually received.",
      },
      {
        q: "Are line items extracted individually?",
        a: "Yes, as structured rows with their own quantity, price and amount. This matters because matching happens per line: an invoice that totals correctly can still bill a wrong quantity on one line and a compensating amount on another, and only a line-level comparison finds that.",
      },
      {
        q: "How are purchase order revisions handled?",
        a: "The revision number and date are captured where the document states them, so an amended PO is not silently treated as the original. This is important because an invoice raised against revision 2 and matched against revision 1 produces a variance that is nobody's error, and it is a common source of unnecessary payment holds.",
      },
      {
        q: "Can it match a purchase order to an invoice automatically?",
        a: "Yes. Grouping the PO, invoice and goods receipt as one record runs the comparison at header and line level, reporting price variances, quantity variances, unmatched lines and differences in currency or terms. Findings are prioritised by what actually blocks payment rather than listed in document order.",
      },
      {
        q: "What if the invoice quantity is higher than what was received?",
        a: "That is the classic over-billing case and the reason goods receipts exist in the process. The correct treatment is to pay against the receipt, not the invoice, and to raise the difference with the supplier. Extraction surfaces the variance with both figures and their sources so the conversation starts from evidence rather than from an assertion.",
      },
      {
        q: "Does it handle blanket or open purchase orders?",
        a: "It extracts what the document states, including validity periods and any call-off structure that is printed. Blanket orders drawn down over time need the release or call-off reference to match correctly, so where that reference is present it is captured. Where it is not, the ambiguity is surfaced rather than resolved by assumption.",
      },
      {
        q: "Are tolerances applied automatically?",
        a: "Variances are reported with their size and direction so a tolerance policy can be applied consistently. The tool's job is to make the variance visible and quantified; deciding what magnitude is acceptable is a commercial policy that belongs with the organisation rather than in the extraction.",
      },
      {
        q: "What about purchase orders that arrive as email or spreadsheets?",
        a: "All of these are normal inputs. Native spreadsheets extract more cleanly than scans because their structure survives, and email intake accepts an order sent as a message body rather than an attachment. Photographs and faxed copies are handled, with genuinely ambiguous rows flagged rather than guessed.",
      },
      {
        q: "Does the parser check the Incoterm on a purchase order?",
        a: "It validates the rule against the published set and flags a rule stated without a named place or edition. It also flags a maritime-only rule used where the shipment is containerised. Incoterm mismatches between the PO and the invoice are separately reported when the documents are matched, since they change who bears which cost.",
      },
      {
        q: "Can I export purchase order data to my ERP?",
        a: "Yes. Reviewed data exports to Excel, CSV or structured JSON with the line array preserved, and connector payloads are available for pushing reviewed records into a downstream system rather than re-keying them.",
      },
      {
        q: "Does matching work when the supplier uses different item codes?",
        a: "Matching compares on several signals rather than a single key — item code, description, quantity and price — so a supplier using its own part numbers can still be matched against your item lines. Where the correspondence is genuinely ambiguous, unmatched lines are reported for a human to resolve rather than paired on a weak similarity.",
      },
    ],
    related: [
      { href: "/features/shipment-document-matching", label: "Three-way document matching", blurb: "Compare PO, invoice and goods receipt at header and line level." },
      { href: "/commercial-invoice-parser", label: "Commercial invoice parser", blurb: "Extract the invoice that the purchase order is matched against." },
      { href: "/goods-receipt-parser", label: "Goods receipt parser", blurb: "Capture accepted and rejected quantities for the third leg of the match." },
      { href: "/features/shipping-data-export", label: "Data export and integrations", blurb: "Move reviewed order data into your ERP without re-keying it." },
    ],
  },

  "freight-invoice-parser": {
    updated: "2026-08-04",
    keywords: [
      "freight invoice audit",
      "freight bill parser",
      "extract charge lines freight invoice",
      "ocean freight invoice OCR",
      "accessorial charge extraction",
      "freight invoice reconciliation",
      "carrier invoice validation",
    ],
    quickAnswer: {
      heading: "What a freight invoice parser extracts",
      body:
        "Every charge as its own line — base freight, fuel, terminal handling, documentation, security, accessorials, demurrage and taxes — each with its description, basis, rate, quantity and amount. Plus the shipment references, route, equipment and rated weights, so each charge can be traced back to the quotation and the transport document that should support it.",
      bullets: [
        "Charge lines separated, never a bundled total",
        "Basis and rate captured alongside the amount",
        "References linked to B/L, booking and container",
        "Arithmetic recomputed against the printed total",
      ],
    },
    sections: [
      {
        heading: "Why the total is the least useful number on the invoice",
        paragraphs: [
          "Freight invoices are audited line by line or not at all. A grand total tells you nothing about whether a fuel surcharge was applied at the contracted percentage, whether a terminal handling charge was billed per container or per shipment, or whether an accessorial appeared that nobody agreed to.",
          "The recurring pattern in freight billing errors is not fabrication — it is charges that are individually plausible and collectively unauthorised. A documentation fee billed twice under two names, a chassis charge on a lane where the carrier provides chassis, a currency adjustment applied to a rate already quoted in local currency. None of those are visible in a total.",
        ],
        bullets: [
          "Base freight rated on the wrong weight, volume or revenue tons",
          "Fuel or bunker surcharge applied at a percentage other than the contracted one",
          "Terminal handling billed per container where the contract says per shipment",
          "The same service billed twice under two different descriptions",
          "Accessorials for services that were never rendered or never agreed",
          "Currency adjustment applied where the rate was already in local currency",
          "Demurrage or detention billed on the wrong day count or with retroactive tiers",
          "Taxes computed on a base that should have excluded certain charges",
        ],
      },
      {
        heading: "Field inventory",
        table: {
          caption: "Freight invoice extraction",
          columns: ["Group", "Fields"],
          rows: [
            ["Invoice", "Invoice number and date, due date, currency, payment terms, issuing carrier or forwarder"],
            ["References", "B/L or air waybill number, booking number, container numbers, shipment or file reference, customer reference"],
            ["Route and service", "Origin, destination, port of loading and discharge, vessel or flight, service level, movement type"],
            ["Rated basis", "Chargeable weight, gross weight, volume, revenue tons, container count, equipment type"],
            ["Charge lines", "Description, charge code, basis, rate, quantity, currency and amount for each line"],
            ["Taxes and totals", "Tax lines with their base and rate, subtotal, total, and any prepaid or collect split"],
            ["Payment", "Bank details, remittance reference, and any credit or adjustment lines"],
          ],
        },
      },
      {
        heading: "Checks applied",
        bullets: [
          "Each charge line recomputed as rate × quantity and compared with the printed amount",
          "Charge lines summed against the printed subtotal, and subtotal plus tax against the invoice total",
          "Currency consistency checked across lines, taxes and totals",
          "Container numbers validated under ISO 6346 and matched against the transport document",
          "B/L, booking and container references matched to an existing shipment record",
          "Duplicate charge descriptions within one invoice flagged",
          "Rated weight or volume compared against the transport document and packing list where available",
          "Ports matched against the bundled UN/LOCODE dataset",
        ],
        callout: {
          tone: "check",
          title: "Match the charge to the evidence, not to expectation",
          body:
            "The productive audit question is not 'does this charge look reasonable' but 'which document supports it'. A terminal handling charge is supported by the transport document; a demurrage charge by the gate records and the tariff; a customs disbursement by the entry. Charges with no supporting evidence are the ones worth challenging.",
        },
      },
      {
        heading: "Running an audit",
        numbered: [
          "Extract the invoice and confirm the shipment references match a shipment you actually have.",
          "Check the rated basis first — chargeable weight, revenue tons or container count — because an error there scales through every rated line.",
          "Compare each charge line against the quotation or service contract, and mark anything not provided for.",
          "Check for duplicate charges under different descriptions, which is the single most common finding.",
          "Verify surcharge percentages against the contracted basis rather than against the amount that looks familiar.",
          "Reconcile demurrage and detention lines against your own day count and the tariff tiers.",
          "Confirm the tax base excludes any charge it should exclude under local rules.",
          "Raise disputed lines in writing with the specific line identified and the evidence attached, inside the applicable window.",
        ],
      },
      {
        heading: "Matching the invoice to the shipment",
        paragraphs: [
          "A freight invoice is only auditable against the shipment it bills. Grouping it with the Bill of Lading, booking confirmation, arrival notice and packing list gives every charge line something to be checked against — and makes the invoice that references a shipment you have no record of immediately visible.",
        ],
        bullets: [
          "Bill of Lading: route, equipment, packages and weights that rated lines depend on",
          "Booking confirmation: the rate and terms agreed, and the equipment committed",
          "Arrival notice: destination charges that were disclosed before arrival",
          "Packing list: the volume and weight the freight was rated on",
          "Quotation or service contract: the authority for every line on the invoice",
        ],
      },
    ],
    faqs: [
      {
        q: "What data is extracted from a freight invoice?",
        a: "Invoice header details, all shipment references including B/L, booking and container numbers, the route and service, the rated basis such as chargeable weight or revenue tons, and every charge line separately with its description, code, basis, rate, quantity, currency and amount — plus tax lines and totals.",
      },
      {
        q: "Why does it matter that charges are separated rather than totalled?",
        a: "Because a total cannot be audited. Freight billing errors are rarely fabrications; they are individually plausible charges that were never agreed — a fee billed twice under two names, a surcharge at the wrong percentage, an accessorial for a service not rendered. None of those are visible without line-level detail.",
      },
      {
        q: "Can it detect duplicate charges?",
        a: "Duplicate descriptions within one invoice are flagged directly. Duplicates across invoices — the same service billed on both the origin and destination invoice — are found by grouping the invoices to the same shipment, which is where that pattern actually lives.",
      },
      {
        q: "Does it check the arithmetic?",
        a: "Yes, in deterministic code. Each line is recomputed as rate × quantity, the lines are summed against the printed subtotal, and subtotal plus tax is compared with the invoice total. Currency consistency is checked across all of them, since a single line in a different currency silently distorts the total.",
      },
      {
        q: "Can it verify a charge against my contract rate?",
        a: "It extracts the rate, basis and quantity as separate fields so the comparison against your quotation or service contract is direct rather than requiring the figures to be dug out of a PDF. The contract itself remains the authority — the parser presents the evidence in a form you can check against it.",
      },
      {
        q: "Does it handle demurrage and detention lines?",
        a: "Yes, as charge lines with their basis and day counts where those are printed. Auditing them properly requires the tariff, the gate records and the day-count convention, which is what the demurrage calculator is for. Extraction gives you the billed figures in a form you can check that calculation against.",
      },
      {
        q: "Can it match the invoice to the Bill of Lading?",
        a: "Yes, by B/L number, booking reference and container numbers, with container check digits recomputed. Where the invoice references a shipment already in the workspace it is linked automatically, and rated weights and volumes are compared against the transport document and packing list.",
      },
      {
        q: "What about invoices in multiple currencies?",
        a: "Currency is captured per line as well as per invoice, and inconsistency is flagged. Multi-currency freight invoices are common where local charges are billed in local currency against a USD ocean rate, and any conversion rate printed on the invoice is captured as a field rather than applied silently.",
      },
      {
        q: "Does it work with forwarder invoices as well as carrier invoices?",
        a: "Yes. Forwarder invoices are typically the more complex of the two, bundling carrier charges with the forwarder's own services and disbursements. The same line-level model applies, and disbursement lines that pass through a third party's charge are captured with whatever supporting reference is printed.",
      },
      {
        q: "How quickly should a freight invoice be audited?",
        a: "Inside whatever dispute window applies, which is often short and sometimes contractual. In the United States, demurrage and detention billing rules give the billed party a defined period to seek mitigation. The practical discipline is to audit on receipt rather than at payment, because a dispute raised after the window closes is usually payable regardless of merit.",
      },
      {
        q: "Can I export the charge lines for analysis?",
        a: "Yes. Export produces the charge lines as rows in Excel or CSV, and structured JSON where the array needs to survive into a downstream system. Charge-line data across many invoices is what makes lane-level cost analysis possible at all, which is a second use for the same extraction.",
      },
      {
        q: "Does it tell me whether a charge is legitimate?",
        a: "No, and it should not. It tells you what was billed, on what basis, at what rate, and which document — if any — supports it. Whether a charge is authorised is a question about your contract and what actually happened, and that judgement stays with you. The parser removes the data-gathering, not the decision.",
      },
    ],
    related: [
      { href: "/tools/demurrage-detention-calculator", label: "Demurrage and detention calculator", blurb: "Audit time-based charge lines against the tariff and your own day count." },
      { href: "/tools/lcl-freight-calculator", label: "LCL freight W/M calculator", blurb: "Check whether the rated revenue tons on an LCL invoice are correct." },
      { href: "/features/airfreight-invoice-audit", label: "Air freight invoice audit", blurb: "The equivalent reconciliation for air waybills and airline charges." },
      { href: "/bill-of-lading-parser", label: "Bill of Lading parser", blurb: "Extract the transport document that rated charges must be traced to." },
    ],
  },

  "goods-receipt-parser": {
    updated: "2026-08-04",
    keywords: [
      "goods receipt OCR",
      "GRN data extraction",
      "goods received note parser",
      "receipt quantity extraction",
      "three way match goods receipt",
      "warehouse receipt document",
      "proof of delivery extraction",
    ],
    quickAnswer: {
      heading: "What a goods receipt parser extracts",
      body:
        "The GRN or receipt reference and date, the purchase order and delivery references, the receiving location, and per line the item, quantity received, quantity accepted, quantity rejected or damaged and the reason. Accepted and rejected quantities are kept strictly separate, because the difference between them is what should be paid and what should not.",
      bullets: [
        "Received, accepted and rejected quantities separated",
        "Rejection reasons and condition notes preserved",
        "PO and delivery references captured for matching",
        "Signature and receiving evidence recorded",
      ],
    },
    sections: [
      {
        heading: "The receipt is the only document that says what actually arrived",
        paragraphs: [
          "The purchase order says what was agreed. The invoice says what is being charged. The packing list says what the shipper claims was packed. Only the goods receipt records what a person at the receiving location actually counted, inspected and accepted — and that is why it is the leg of the three-way match that cannot be skipped.",
          "It is also the leg most often recorded badly. Receipts are frequently completed under time pressure at a loading dock, with a single 'received' quantity and no distinction between what arrived and what was accepted. That distinction is exactly what determines whether a variance is a delivery problem or a billing problem.",
        ],
        callout: {
          tone: "warn",
          title: "Received and accepted are different numbers",
          body:
            "Forty cartons arrived; thirty-seven were accepted and three were damaged. A receipt recording only 'received: 40' loses the fact that three should not be paid for. Keeping the two quantities separate — with a rejection reason attached — is what turns a receipt into evidence rather than a tick in a box.",
        },
      },
      {
        heading: "Field inventory",
        table: {
          caption: "Goods receipt extraction",
          columns: ["Group", "Fields"],
          rows: [
            ["Receipt", "GRN or receipt number, receipt date and time, receiving location or warehouse, receiving personnel"],
            ["References", "Purchase order number, delivery note or despatch reference, transport document reference, supplier reference"],
            ["Parties", "Supplier, receiving entity, carrier or haulier delivering"],
            ["Line items", "Item code, description, unit of measure, quantity delivered, quantity accepted, quantity rejected or damaged, rejection reason"],
            ["Condition", "Packaging condition, seal condition where containerised, temperature on arrival where relevant, inspection notes"],
            ["Totals", "Total packages received, total accepted, total rejected, weight received where recorded"],
            ["Evidence", "Receiver signature, driver signature, date and time stamps, photograph references where attached"],
          ],
        },
      },
      {
        heading: "Checks applied",
        bullets: [
          "Accepted plus rejected quantity reconciled against the delivered quantity per line",
          "Line quantities summed and compared against printed totals",
          "Receipt date checked for plausibility against the transport document and delivery note",
          "Purchase order reference matched to an existing order record where one exists",
          "Rejected quantity without a stated reason flagged, since an unexplained rejection cannot be actioned",
          "Duplicate item lines within one receipt flagged",
          "Seal condition compared against the seal number on the transport document where both are present",
        ],
      },
      {
        heading: "Completing the three-way match",
        paragraphs: [
          "With the purchase order, the invoice and the goods receipt all extracted, the comparison becomes mechanical: was it ordered, was it received, is the price agreed. What matters is which figure wins when they disagree.",
        ],
        table: {
          caption: "Resolving common three-way variances",
          columns: ["Situation", "What it means", "Usual treatment"],
          rows: [
            ["Invoiced above received", "Over-billing or short delivery", "Pay against the receipt; raise the difference with the supplier"],
            ["Received above ordered", "Over-delivery", "Confirm authorisation before accepting or paying"],
            ["Received matches, price differs", "Price variance", "Hold against the contract or a documented price change"],
            ["Item invoiced not on the PO", "Unauthorised supply", "Treat as unauthorised until confirmed"],
            ["Accepted below received", "Damage or quality rejection", "Pay accepted quantity only; pursue the claim separately"],
            ["Receipt missing entirely", "Cannot confirm arrival", "No approval; the match is incomplete rather than passed"],
          ],
          note: "A missing receipt is not a pass. Where a required evidence role is absent, the match should report as incomplete rather than approving by default.",
        },
      },
      {
        heading: "Receipts as claims evidence",
        paragraphs: [
          "Beyond payment control, the goods receipt is the primary evidence in a cargo claim. A claim for damage discovered after acceptance is materially weaker than one supported by a receipt that recorded the damage at delivery, with the driver's signature against it.",
        ],
        bullets: [
          "Record damage at the point of receipt, not after unpacking, and get the delivering driver's acknowledgement",
          "Note seal condition and the seal number on containerised deliveries before opening",
          "Record packaging condition separately from goods condition — intact packaging with damaged contents points to a different cause",
          "Attach photographs where damage is visible, and reference them on the receipt",
          "Record temperature on arrival for temperature-controlled cargo, because a data logger alone proves less without a receiving observation",
          "Sign with a name and a time, not an illegible mark, since the receipt may be read years later by an adjuster",
        ],
      },
    ],
    faqs: [
      {
        q: "What is a goods receipt note?",
        a: "A record made at the receiving location confirming what was physically delivered, counted and inspected. It records the delivered quantity, what was accepted, what was rejected or damaged and why, and it carries the signatures and timestamps that make it evidence. It is the third leg of a three-way match and the primary evidence in a cargo claim.",
      },
      {
        q: "What data is extracted from a goods receipt?",
        a: "The receipt number and date, receiving location and personnel, the purchase order and delivery references, the supplier, and per line the item, unit of measure, quantity delivered, quantity accepted, quantity rejected and the rejection reason — plus condition notes, seal condition and signature evidence.",
      },
      {
        q: "Why keep accepted and rejected quantities separate?",
        a: "Because they drive different actions. The accepted quantity is what should be paid; the rejected quantity is what should be claimed or credited. A receipt recording only a single 'received' figure loses that distinction and pushes the problem into a later dispute with weaker evidence.",
      },
      {
        q: "Can a three-way match pass without a goods receipt?",
        a: "It should not. Where a required evidence role is missing, the match reports as incomplete rather than approving by default — because the whole purpose of the receipt is to confirm that what is being paid for actually arrived. An approval issued without it is an assumption, not a control.",
      },
      {
        q: "Are damage and rejection reasons preserved?",
        a: "Yes, as text alongside the quantity they relate to. A rejected quantity with no stated reason is flagged, because it cannot be actioned: whether three cartons were short-delivered, crushed in transit or wrong-item determines who the claim goes to and under which process.",
      },
      {
        q: "Does it capture seal condition?",
        a: "Where the receipt records it, yes — and where the transport document also carries a seal number, the two are compared. A seal number at delivery that differs from the number recorded at stuffing is a cargo security event, and it is the first thing an adjuster will ask about in a loss claim.",
      },
      {
        q: "Can it match receipts to purchase orders automatically?",
        a: "Yes. The PO reference is matched to an existing order record, and line-level comparison of item, quantity and unit follows. Where the supplier uses different item codes, matching uses several signals rather than a single key, and genuinely ambiguous lines are surfaced for a human rather than paired on weak similarity.",
      },
      {
        q: "What if the receipt quantity is higher than the order?",
        a: "Over-delivery is flagged rather than silently accepted, because accepting it may create an obligation to pay for goods nobody ordered. Confirm whether the over-delivery was authorised — some contracts allow a tolerance — before accepting or paying, and record the decision against the shipment.",
      },
      {
        q: "Does the parser handle proof-of-delivery documents?",
        a: "Yes. Proof-of-delivery notes, warehouse receipts and signed delivery notes carry the same essential evidence — what arrived, in what condition, when, and who acknowledged it — and extract into the same field model. Signature and timestamp evidence is captured as present or absent rather than interpreted.",
      },
      {
        q: "What about handwritten receipts?",
        a: "They are common at loading docks and are handled, though results depend on legibility. Handwritten quantities and annotations are extracted where readable and flagged for review where they are not, rather than being guessed. Given that these documents become claims evidence, a field marked uncertain is more useful than a field filled in confidently and wrongly.",
      },
      {
        q: "Can receipt data be exported to an ERP?",
        a: "Yes. Reviewed data exports to Excel, CSV or structured JSON with line rows preserved, and connector payloads are available for pushing receipts into a downstream system so the goods-receipt posting does not have to be re-keyed.",
      },
      {
        q: "How does a goods receipt support a cargo claim?",
        a: "It establishes the condition of the goods at the moment custody transferred, with a signature and a time against it. Damage recorded at receipt, with the delivering driver's acknowledgement and photographs referenced, is materially stronger evidence than damage discovered during unpacking a day later — and adjusters treat the two very differently.",
      },
    ],
    related: [
      { href: "/purchase-order-parser", label: "Purchase order parser", blurb: "Extract the order that the receipt and invoice are matched against." },
      { href: "/features/shipment-document-matching", label: "Three-way document matching", blurb: "Run PO, invoice and receipt comparison at header and line level." },
      { href: "/commercial-invoice-parser", label: "Commercial invoice parser", blurb: "The billing document the receipt controls payment of." },
      { href: "/packing-list-parser", label: "Packing list parser", blurb: "Compare what was declared as packed against what was received." },
    ],
  },
};
