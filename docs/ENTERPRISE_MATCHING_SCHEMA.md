# Enterprise logistics extraction and three-way matching

## Scope

The production match is deliberately broader than a traditional accounts-payable three-way match. It reconciles:

1. purchase authorization (`purchase_order`),
2. performance or receipt evidence (`bill_of_lading`, `sea_waybill`, `packing_list`, or `goods_receipt`), and
3. the payable document (`freight_invoice` or `commercial_invoice`).

No model decides the result. Gemma transcribes the documents into the normalized schema; deterministic TypeScript rules produce `matched`, `review`, `blocked`, or `incomplete`.

## Research basis

- DCSA Bill of Lading 3.0 defines standardized shipping instructions and transport-document information across parties, goods, equipment, locations, references, and document lifecycle: https://dcsa.org/standards/bill-of-lading/documentation-bill-of-lading-3/bill-of-lading-3-introduction
- OASIS UBL 2.4 supplies normalized Order, Invoice, and FreightInvoice structures, including order-line references, shipments, goods items, allowances, taxes, and freight charges: https://docs.oasis-open.org/ubl/os-UBL-2.4/
- Google Document AI's Invoice Parser exposes header and line fields including PO references, carrier, delivery date, freight, parties, remittance, tax, product codes, quantity, unit price, and line amounts: https://docs.cloud.google.com/document-ai/docs/processors-list
- Microsoft Document Intelligence exposes invoice/PO party addresses, PO number, dates, totals, payment details, taxes, and item-level product, quantity, unit, unit price, tax, and amount fields: https://learn.microsoft.com/en-us/azure/ai-services/document-intelligence/prebuilt/invoice
- Amazon Textract AnalyzeExpense normalizes PO number, party/address roles, product code, description, quantity, unit price, and line total: https://docs.aws.amazon.com/textract/latest/dg/invoices-receipts.html
- Nanonets' published invoice and PO models similarly expose header identifiers, parties, totals, and product-level tables, and describe using these records for two- and three-way matching: https://docs.nanonets.com/docs/invoices and https://docs.nanonets.com/docs/purchase-order-model

These sources inform field coverage; the application schema is not a copy of any one vendor schema.

## Normalized document contract

Every document has `_meta.detected_type`, `confidence_flags`, `page_refs`, and `prompt_version`. Missing scalars are `null`; missing collections are `[]`. Identifiers remain strings so leading zeroes are preserved.

### Shared parties

`name`, `address`, `city`, `postal_code`, `country`, `tax_id`.

### Shared goods line

`line_no`, `product_code`, `buyer_product_code`, `seller_product_code`, `description`, `hs_code`, `marks`, `packages`, `package_type`, `quantity`, `uom`, `net_kg`, `gross_kg`, `volume_cbm`, `unit_price`, `amount`, `currency`, `tax_rate`, `tax_amount`, `discount_amount`, `country_of_origin`, `lot_no`, `cartons`, and dimensions.

### Bill of lading / sea waybill

Document, booking, shipper/export/customs/PO/L/C identifiers; carrier and full parties; vessel/voyage/IMO; receipt/load/discharge/delivery locations; issue and on-board dates; freight and negotiability terms; equipment with container/seal/type/count/weight/volume; granular cargo lines; printed cargo block; printed totals; originals and clauses.

### Purchase order

PO/date/revision/contract; buyer, seller, bill-to, ship-to; delivery commitments and shipping method; Incoterm and payment terms; currency; detailed order lines; subtotal, discount, authorized freight, tax, total; approval evidence and notes.

### Freight invoice

Invoice/date/due date and carrier reference; PO, B/L, booking, shipment, and container references; carrier, bill-to, remit-to; voyage and route; service period; currency/exchange rate; one row per base freight or accessorial charge; subtotal, discount, tax, total, paid and due amounts; payment reference and instructions.

### Goods receipt

GRN/date; PO, delivery note, B/L, and container references; supplier, receiver and delivery location; detailed accepted/rejected/received lines and totals; recipient evidence and notes.

Commercial invoice, packing list, booking confirmation, and arrival notice remain supported as complementary evidence.

## Match policy

- Exact normalized equality is required for PO, B/L, booking, container, invoice, customs and tax identifiers. Fuzzy matching is never used for legal identifiers.
- Party names are compared only after punctuation/case normalization. A mismatch blocks when the roles are contractually equivalent; carrier aliases are routed to review.
- Product lines match first by exact buyer/product/seller code. Description similarity is only a fallback and cannot silently approve a missing or weak match.
- Default monetary tolerance is the larger of 0.5% or one currency unit. Currency must be the same before amounts can be compared.
- Default quantity tolerance is 0%. Unit differences or absent units require review rather than conversion.
- Container numbers use ISO 6346 check-digit validation. Ports use printed UN/LOCODE when present.
- Printed totals are retained separately from calculated validation totals. Arithmetic contradictions fail deterministic document checks.
- Any missing evidence role makes the run `incomplete`. Any critical contradiction makes it `blocked`. Ambiguous lines or non-critical differences make it `review`. Only complete evidence with no failures or reviews becomes `matched`.

## Audit and human review

Each run stores its schema version, policy, score, requirements, individual rule results, source document IDs, compared paths/values, tolerances, and timestamp. Runs are immutable. Corrections are separate audit events and never rewrite source values silently.
