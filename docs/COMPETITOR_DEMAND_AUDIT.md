# Competitor and Search-Demand Audit

Updated: 2026-07-21

## Evidence standard

Exact keyword volumes are estimates owned by SEO data providers and vary by country and month. This audit records exact figures only where a public provider exposed them. Otherwise, demand is ranked from repeated competitor product coverage, public customer case studies, search-result density and user problem reports.

## Ranked user demand

| Rank | User job | Demand evidence | GainingDocx status |
|---|---|---|---|
| 1 | Extract complete document and line-item data accurately | Nanonets markets B/L header, cargo, routing, financial, signature and line-item extraction; Rossum's Wolt case says header-only OCR was insufficient and line-level matching was required. | Implemented with document-specific schemas, fast-to-dense escalation, deterministic validation and review flags. |
| 2 | Match PO, receipt/transport evidence and invoice | Rossum, Nanonets and AP automation competitors repeatedly position two/three-way matching and discrepancy review as core workflows. | Implemented with exact-reference, party, currency, amount, quantity, UOM, product, container and tolerance rules. Missing evidence never auto-approves. |
| 3 | Calculate CBM and packing volume | Semrush publicly estimated 12,100 monthly India searches for `cbm calculator` and 105,100 monthly visits to cbmcalculator.com in May 2026. | Implemented as a multi-line, multi-unit calculator with CSV evidence export. |
| 4 | Create and validate commercial invoice, packing-list and transport working documents | Search results are dense across Incodocs, carrier and template vendors. Incodocs supports multiple packing structures; FedEx lists the commercial invoice, certificate of origin, pro forma invoice, packing list and air waybill among common international documents. | Implemented as 11 workflow-grouped browser forms with required-field validation, calculated lines/CBM and PDF, XLSX and DOCX outputs. Carrier/authority-issued documents are correctly labelled as preparation worksheets. |
| 5 | Audit chargeable weight and LCL W/M billing | UPS defines chargeable weight as the greater of actual and volumetric weight; freight calculator competitors distinguish express, air and ocean W/M modes. | Implemented. Imperial conversion was corrected; exact 139 in3/lb express and 166 in3/lb air bases are supported. A new LCL W/M invoice-audit calculator uses CBM versus 1,000 kg revenue tons. |
| 6 | Check container fit before booking | Container-planning competitors emphasize rotations, payload, door aperture, upright restrictions and mixed-load planning. | Improved for door aperture and three rotation policies. It deliberately remains an identical-carton feasibility calculation, not a falsely precise mixed-SKU 3D plan. |
| 7 | Review uncertainty and preserve an audit trail | Nanonets exposes review workflows; Docsumo highlights per-field confidence and human review; user reports consistently identify correction workload as the practical OCR failure point. | Implemented with field editing, deterministic flags, cross-model conflict flags, match findings and append-only match runs. Per-field calibrated probabilities remain a future benchmark item. |
| 8 | Import/export and integrate at scale | Nanonets highlights email, API, Drive/Dropbox, RPA, ERP/TMS/WMS connections; Rossum cases require downstream ERP integration. | Excel, CSV, JSON, PDF and in-app shipment records are implemented. Public API, webhooks, email ingestion and ERP connectors remain competitive gaps. |
| 9 | Batch and multilingual processing | Rossum's Wolt case covers high-volume invoices across multiple European languages; document-AI competitors emphasize batch queues. | Multi-page and mixed-language documents are supported. Separate-document batch queues and a multilingual labelled accuracy benchmark remain gaps. |
| 10 | Audit demurrage, detention and free time | Carrier invoice disputes depend on free-time start/end events, calendar conventions, progressive rate tiers and fixed fees. Search results contain many single-purpose calculators, while arrival-notice and invoice workflows expose the same dates and charges. | Implemented as a transparent two-tier calendar-day audit with explicit caveats and a next step into arrival-notice verification. |

## Competitor capability map

| Competitor/category | Strongest published capabilities | Product implication |
|---|---|---|
| Nanonets B/L OCR | Multi-source import, B/L flat fields and line items, validation, review, workflows and business-system connections. | Deep extraction alone is insufficient; review, validation and integration must be part of one workflow. |
| Rossum invoice automation | Multi-format/multilingual extraction, checksums, line/header validation, data transformations, approval and ERP export. | Straight-through processing requires reliable exceptions, not an unconditional accuracy claim. |
| Docsumo | Stable document APIs, documented rate limits, webhooks, confidence and human review. | Enterprise buyers expect operational APIs and observable delivery behavior. |
| Incodocs | Practical export-document creation and multiple packing structures. | Templates must calculate and represent physical packaging, not only provide empty branded boxes. |
| EasyCargo/container planners | Interactive 3D/mixed-load planning, manual adjustment and integrations. | A simple grid calculator should be explicit about its limits and must check door and payload constraints. |

## Changes delivered from this audit

- Added public Purchase Order, Freight Invoice and Goods Receipt parser entry points.
- Added an LCL W/M freight calculator for invoice audit.
- Corrected imperial chargeable-weight calculations and added exact contractual bases.
- Added container door-aperture checks and upright/fixed/all-rotation policies.
- Moved calculator math into deterministic, unit-tested functions.
- Added real Maersk B/L calculation regression for 20 CBM and 15,750 kg.
- Fixed XLSX template formatting that extended into dozens of unused columns.
- Re-generated every XLSX/DOCX download and rechecked all workbook formulas.
- Expanded the template library from 6 to 11: pro forma invoice, certificate-of-origin worksheet, air-waybill worksheet, simple packing list and container packing list.
- Added workflow grouping and document-specific recommended next steps to calculators and templates.
- Added a deterministic, unit-tested demurrage/detention free-time calculator.
- Corrected styled navigation controls so anchors retain link semantics without runtime accessibility warnings.

## Sources

- Nanonets B/L OCR: https://nanonets.com/ocr-api/bill-of-lading-ocr
- Rossum Wolt case: https://rossum.ai/customer-stories/wolt/
- Rossum invoice automation: https://rossum.ai/blog/invoice-processing-automation-guide/
- Docsumo API platform comparison: https://www.docsumo.com/blog/best-api-based-document-processing-platforms
- Incodocs packing-list formats: https://help.incodocs.com/en/articles/2048576-how-to-create-a-packing-list-template
- Semrush cbmcalculator.com traffic and keyword snapshot: https://www.semrush.com/website/cbmcalculator.com/overview/
- UPS chargeable-weight definition: https://www.ups.com/us/en/supplychain/resources/glossary-term/chargeable-weight
- EasyCargo container-loading capabilities: https://www.container-loading.com/en/
- FedEx international customs documents: https://www.fedex.com/en-us/shipping/international/create-documents.html
- FedEx international shipping checklist: https://www.fedex.com/content/dam/fedex/us-united-states/services/international_shipping_checklist.pdf
- UPS international forms library: https://www.ups.com/intl_forms/formslibrary

## Honest competitive conclusion

GainingDocx is now unusually strong for a self-serve product that combines shipping-document extraction, maritime validation, editable review, exports, document generation and three-way matching. It should not claim to do everything better than every enterprise competitor. The largest remaining enterprise gaps are public API/webhook ingestion, email/connectors, separate-document batch orchestration, calibrated per-field confidence, multilingual labelled benchmarks and mixed-SKU 3D load planning.
