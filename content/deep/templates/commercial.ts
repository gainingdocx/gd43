import type { DeepContentMap } from "@/content/deep/types";

export const COMMERCIAL_TEMPLATE_DEEP: DeepContentMap = {
  "commercial-invoice-template": {
    updated: "2026-08-04",
    keywords: [
      "commercial invoice template",
      "export invoice format",
      "customs invoice template",
      "commercial invoice for international shipping",
      "invoice HS code incoterms",
      "commercial invoice requirements",
      "free commercial invoice excel",
    ],
    quickAnswer: {
      heading: "What a commercial invoice must contain",
      body:
        "A commercial invoice is the customs and commercial record of a sale. It must identify the seller and buyer, the invoice number and date, a specific description of the goods with HS codes and country of origin, quantities and unit prices, the currency, the Incoterm with its named place, any freight and insurance charges, and the total. Customs uses it to establish value, classification and origin — the three things that determine duty.",
      bullets: [
        "Specific goods description — not 'samples' or 'parts'",
        "HS code and country of origin per line",
        "Incoterm with named place and rules edition",
        "Currency stated as an ISO code",
      ],
    },
    sections: [
      {
        heading: "Why the commercial invoice carries so much weight",
        paragraphs: [
          "Of all the documents in an international shipment, the commercial invoice is the one customs reads most closely, because it is the source of the three facts that determine duty: what the goods are, where they come from, and what they are worth. Every other document supports or corroborates; this one asserts.",
          "It also carries commercial weight. Where payment runs through a documentary credit, the invoice must satisfy the credit's requirements exactly. Where the transaction is on open account, it is the demand for payment. And in a dispute, it is the clearest written record of what was sold on what terms.",
        ],
      },
      {
        heading: "Customs value: what actually goes into it",
        paragraphs: [
          "Most customs administrations apply the WTO Valuation Agreement, whose primary method is transaction value — the price actually paid or payable for the goods when sold for export, with prescribed additions and deductions. That is not simply the number at the bottom of your invoice.",
          "Certain costs must be added if not already included: commissions and brokerage other than buying commissions, packing and container costs, the value of materials, tools or design work supplied free or at reduced cost by the buyer, and royalties or licence fees the buyer must pay as a condition of sale. Certain costs may be deducted if separately identified: transport and insurance after importation, construction or assembly after import, and duties and taxes of the destination.",
        ],
        bullets: [
          "State the price actually paid or payable, in the invoice currency",
          "Show freight and insurance as separate lines, not folded into unit prices",
          "Disclose any assist — moulds, tooling, design work — supplied by the buyer",
          "Disclose royalties or licence fees payable as a condition of the sale",
          "Identify any discount, rebate or commission, and say what it relates to",
          "State whether the parties are related, since related-party pricing may be examined",
        ],
        callout: {
          tone: "warn",
          title: "Do not under-declare, and do not over-simplify",
          body:
            "Understating value is a customs offence with penalties that extend well beyond the duty avoided. But a nominal or 'no commercial value' figure on samples is equally problematic — customs still needs a value, and a placeholder invites a valuation query. Where goods genuinely have no sale price, state the basis on which the declared value was determined.",
        },
      },
      {
        heading: "Incoterms on the invoice",
        paragraphs: [
          "An Incoterm allocates cost and risk between seller and buyer, and it directly affects customs value — whether freight and insurance are inside or outside the price matters for duty in most jurisdictions. State the rule, the named place and the edition: 'FOB Nhava Sheva, Incoterms 2020' is complete; 'FOB' alone is not.",
          "Two distinctions cause most of the trouble. First, the four maritime-only rules — FAS, FOB, CFR and CIF — are designed for goods handed over at a ship's rail or alongside, and are routinely misapplied to containerised cargo delivered to a terminal, where FCA, CPT or CIP are the correct choices. Second, EXW places almost every obligation on the buyer including export clearance, which the buyer frequently cannot legally perform in the seller's country.",
        ],
        table: {
          caption: "Incoterms 2020 rules by transport mode",
          columns: ["Rule", "Mode", "Risk transfers", "Seller arranges carriage?"],
          rows: [
            ["EXW — Ex Works", "Any", "At the seller's premises, before loading", "No"],
            ["FCA — Free Carrier", "Any", "On delivery to the named carrier or place", "No"],
            ["CPT — Carriage Paid To", "Any", "On handover to the first carrier", "Yes, to the named destination"],
            ["CIP — Carriage and Insurance Paid To", "Any", "On handover to the first carrier", "Yes, plus insurance at the higher cover level"],
            ["DAP — Delivered at Place", "Any", "At the named destination, ready for unloading", "Yes"],
            ["DPU — Delivered at Place Unloaded", "Any", "At the named destination, once unloaded", "Yes"],
            ["DDP — Delivered Duty Paid", "Any", "At the named destination, import cleared", "Yes, including import duties"],
            ["FAS — Free Alongside Ship", "Sea and inland waterway", "Alongside the vessel", "No"],
            ["FOB — Free On Board", "Sea and inland waterway", "When goods are on board", "No"],
            ["CFR — Cost and Freight", "Sea and inland waterway", "When goods are on board", "Yes, freight only"],
            ["CIF — Cost, Insurance and Freight", "Sea and inland waterway", "When goods are on board", "Yes, freight plus minimum insurance"],
          ],
          note: "Under CIF the seller need only provide minimum cover; under CIP the 2020 revision requires the higher institute-clauses level. Confirm the cover actually required by the sale contract rather than assuming the default.",
        },
      },
      {
        heading: "Describing goods so customs does not stop them",
        paragraphs: [
          "The single most common cause of a customs query is a goods description that does not let an officer confirm the classification. 'Spare parts', 'samples', 'gifts', 'machinery' and 'textiles' are all descriptions that will generate a request for information — and that request arrives after the goods have landed and storage has started.",
          "A usable description states what the article is, what it is made of, and what it is for. 'Cotton knitted T-shirts, men's, 180gsm, HS 6109.10' is a description. 'Garments' is not. Where a line covers several variants, either split it or describe the range specifically enough that the classification is unambiguous.",
        ],
        bullets: [
          "Name the article in ordinary commercial terms, not an internal product code alone",
          "State the constituent material where classification depends on it, which is most of the time",
          "State the intended use where classification depends on it",
          "Give the HS code per line, at the length the destination requires",
          "State country of origin per line, not just per invoice — mixed-origin shipments are common",
          "Include SKU or part numbers as supporting reference, alongside the description rather than instead of it",
          "Keep the description consistent with the packing list and the transport document",
        ],
      },
      {
        heading: "Building the invoice section by section",
        numbered: [
          "Enter the invoice number and date, and reference the purchase order or contract so the buyer's accounts payable can match it.",
          "Enter the seller, buyer and — where different — the ship-to consignee, using full legal names and registered addresses.",
          "State the Incoterm with its named place and the rules edition, and the payment terms.",
          "State the currency as an ISO code, and use one currency throughout.",
          "Enter each line with a specific description, HS code, origin, quantity, unit of measure, unit price and line amount.",
          "Add net and gross weight per line where the buyer or destination requires them, keeping them consistent with the packing list.",
          "Enter freight, insurance and other charges as separate lines rather than folding them into unit prices.",
          "Add any declaration the destination requires, and complete the authorised signature block where a signed invoice is needed.",
          "Reconcile the totals, the piece count and the weights against the packing list before issuing.",
        ],
        callout: {
          tone: "check",
          title: "Reconcile before you send, not after they ask",
          body:
            "Quantities, weights, party names and references should agree between the invoice, the packing list and the transport document. Nearly every downstream query — customs, bank or buyer — is a question about a difference between two of those three documents. Checking takes minutes; answering a customs query takes days of storage.",
        },
      },
      {
        heading: "Documentary credits: stricter than customs",
        paragraphs: [
          "Where payment runs through a letter of credit, the invoice must comply with the credit's terms exactly, and banks examine documents on their face against those terms rather than against commercial reasonableness. A description that customs would accept without comment can be a discrepancy under a credit.",
          "Common discrepancies are entirely mechanical: a goods description that does not correspond to the credit, an invoice made out to a party other than the applicant, an amount exceeding the credit value or drawn in the wrong currency, missing signature where the credit requires one, and quantities outside any tolerance the credit allows. Read the credit before the invoice is prepared, not after it is rejected.",
        ],
      },
    ],
    faqs: [
      {
        q: "What must a commercial invoice include?",
        a: "Seller and buyer details, invoice number and date, a specific description of the goods with HS codes and country of origin, quantity and unit of measure, unit price and line amount, the currency, the Incoterm with its named place and edition, any freight, insurance and other charges shown separately, the total, and any declaration or signature the destination requires. Package counts and weights are commonly included and should match the packing list.",
      },
      {
        q: "What is the difference between a commercial invoice and a pro forma invoice?",
        a: "A pro forma invoice is a quotation issued before the sale is concluded — used to obtain an import permit, open a letter of credit or secure advance payment. A commercial invoice records a concluded sale and is the document customs uses to establish value. A pro forma is not a demand for payment and should never be presented as the customs invoice for a shipment.",
      },
      {
        q: "Does a commercial invoice need to be signed?",
        a: "It depends on the destination and the transaction. Some customs administrations require a signed and sometimes stamped invoice; many accept electronic documents without signature. Where a documentary credit governs payment, the credit's own requirement controls and is often stricter than customs. Check both before printing, because adding a signature afterwards means reissuing the document.",
      },
      {
        q: "Should freight and insurance appear on the invoice?",
        a: "Yes, as separate lines, whenever they are part of the price under the agreed Incoterm. Customs value in most jurisdictions depends on whether these costs are inside or outside the price, and showing them separately allows the correct treatment. Folding freight into unit prices makes the declared value harder to defend and can result in duty being assessed on transport costs unnecessarily.",
      },
      {
        q: "What currency should I invoice in?",
        a: "The currency agreed in the sale contract, stated as a three-letter ISO code — USD, EUR, CNY — rather than a symbol, because '$' is ambiguous across at least a dozen currencies. Use one currency consistently throughout the invoice. Customs will convert at its own published rate for the entry date, so do not add your own conversion unless the destination requires it.",
      },
      {
        q: "How specific does the goods description need to be?",
        a: "Specific enough that a customs officer can confirm the classification without asking you. State what the article is, what it is made of and what it is for. 'Spare parts', 'samples', 'gifts' and 'general merchandise' will generate an information request, which arrives after the goods have landed and storage has begun. Include the HS code per line at the length the destination requires.",
      },
      {
        q: "Do I need an HS code on the invoice?",
        a: "It is not universally mandatory but it is strongly advisable, and some destinations require it. Providing the code speeds classification, reduces the chance of a query, and demonstrates reasonable care. Give the six-digit international heading at minimum; extend to the destination's national length where you know it. The importer remains legally responsible for the classification declared on the entry.",
      },
      {
        q: "What Incoterm should I use for container shipments?",
        a: "For containerised cargo delivered to a terminal, FCA, CPT or CIP are generally the correct choices. FAS, FOB, CFR and CIF are designed for goods handed over alongside or on board a vessel, and applying them to containers creates a gap between where risk actually transfers and where the rule says it does. This mismatch is one of the most common Incoterm errors in practice.",
      },
      {
        q: "What is the difference between the invoice value and the customs value?",
        a: "The invoice value is the price on the document. The customs value is determined under the destination's valuation rules — usually transaction value, being the price actually paid or payable with prescribed additions such as assists, royalties and certain commissions, and prescribed deductions such as post-importation transport. They are often the same figure but not always, and the difference is the importer's responsibility to identify.",
      },
      {
        q: "Can I use one invoice for multiple shipments?",
        a: "Generally not for customs purposes. Each entry needs an invoice covering the goods in that shipment. Where an order is split across several shipments, issue an invoice per shipment referencing the order, and make the partial nature explicit. A single invoice covering goods that arrived on different vessels or flights will not reconcile against any of the transport documents.",
      },
      {
        q: "What are the most common commercial invoice discrepancies under a letter of credit?",
        a: "A goods description that does not correspond to the credit wording, an invoice issued to a party other than the applicant, an amount exceeding the credit or drawn in the wrong currency, quantities outside the credit's tolerance, missing signature where required, and inconsistency with the transport document or packing list. Banks examine on the face of the documents against the credit terms, so read the credit before preparing the invoice.",
      },
      {
        q: "Can GainingDocx check my invoice against the shipment documents?",
        a: "Yes. Extracting a commercial invoice returns header fields and every line item — description, HS code, origin, quantity, unit price, amount, weights — as structured data with the arithmetic recomputed. Grouping it with the packing list, Bill of Lading and purchase order compares parties, references, quantities, weights and values across the set and reports the disagreements for review.",
      },
    ],
    related: [
      { href: "/guides/commercial-invoice-vs-packing-list", label: "Commercial invoice vs packing list", blurb: "What each document establishes and which fields must agree between them." },
      { href: "/commercial-invoice-parser", label: "Commercial invoice parser", blurb: "Extract line items, HS codes and totals from invoices you receive." },
      { href: "/tools/hs-code-finder", label: "HS code finder", blurb: "Find and verify the classification for each invoice line." },
      { href: "/templates/packing-list-template", label: "Export packing list template", blurb: "Build the physical counterpart your invoice must reconcile against." },
    ],
  },

  "pro-forma-invoice-template": {
    updated: "2026-08-04",
    keywords: [
      "pro forma invoice template",
      "proforma invoice format",
      "pro forma vs commercial invoice",
      "quotation invoice international trade",
      "proforma invoice for letter of credit",
      "advance payment invoice export",
      "proforma invoice sample",
    ],
    quickAnswer: {
      heading: "What a pro forma invoice is for",
      body:
        "A pro forma invoice is a committed quotation issued before a sale is concluded. It states exactly what will be supplied, at what price, on what terms and for how long the offer stands. Buyers use it to obtain an import permit, open a letter of credit, secure internal approval or arrange advance payment. It is not a demand for payment and is not the invoice customs clears against.",
      bullets: [
        "Issued before the sale is concluded",
        "States a validity period",
        "Supports permits, credits and advance payment",
        "Replaced by a commercial invoice at shipment",
      ],
    },
    sections: [
      {
        heading: "Why buyers ask for a pro forma invoice",
        paragraphs: [
          "A pro forma invoice exists because several things a buyer must do before goods can ship require a formal, itemised document — and the commercial invoice does not exist yet. It is the seller's binding-in-substance statement of what the transaction will be, in a form other institutions can act on.",
          "That institutional audience is why it matters that a pro forma is complete. A bank opening a documentary credit will transcribe its terms; a customs authority issuing an import permit will key its descriptions and values; a buyer's finance function will approve against its totals. Every vagueness in the pro forma becomes a constraint or a discrepancy downstream.",
        ],
        bullets: [
          "Applying for an import licence or permit, which many destinations require before shipment",
          "Opening a letter of credit, whose terms are usually drawn directly from the pro forma",
          "Obtaining foreign exchange approval where currency controls apply",
          "Securing internal purchase approval or a capital release",
          "Arranging advance payment or a deposit against a defined scope",
          "Obtaining an insurance quotation for the specific consignment",
          "Confirming landed cost before committing to the order",
        ],
      },
      {
        heading: "Pro forma against commercial invoice",
        table: {
          caption: "The two documents compared",
          columns: ["Aspect", "Pro forma invoice", "Commercial invoice"],
          rows: [
            ["Issued", "Before the sale is concluded", "When goods are sold and shipped"],
            ["Legal character", "An offer or quotation", "A record of a concluded sale"],
            ["Demands payment", "No", "Yes, on the stated terms"],
            ["Used for customs entry", "Rarely, and only where expressly permitted", "Yes, as the primary valuation document"],
            ["Has a validity period", "Yes, and it should be stated prominently", "No"],
            ["Recorded in accounts", "No", "Yes"],
            ["Typical audience", "Buyer, bank, licensing authority", "Customs, bank, buyer's accounts payable"],
          ],
          note: "Some destinations accept a pro forma for temporary imports, samples or specific procedures. Never assume it; confirm with the broker at the destination before shipping against one.",
        },
      },
      {
        heading: "What a complete pro forma contains",
        paragraphs: [
          "A pro forma should contain everything the commercial invoice will contain, plus the things that make it an offer rather than a record: a validity period, the lead time, and the conditions under which the price holds.",
        ],
        bullets: [
          "Clear labelling as a PRO FORMA INVOICE, so it cannot be mistaken for a demand for payment",
          "A unique reference number and issue date",
          "Validity period — the date the quotation expires",
          "Full seller and buyer details, with the consignee if different",
          "Line-by-line description, HS code, origin, quantity, unit of measure, unit price and amount",
          "Currency as an ISO code, and any exchange-rate condition",
          "Incoterm with named place and rules edition",
          "Payment terms, including any deposit percentage and the balance trigger",
          "Estimated lead time from order or from receipt of payment",
          "Estimated packing details, gross weight and volume",
          "Port of loading and destination, and the intended transport mode",
          "Bank details where advance payment or a credit is expected",
          "Any condition on which the price depends — minimum quantity, raw material index, freight validity",
        ],
        callout: {
          tone: "warn",
          title: "State the validity period prominently",
          body:
            "A pro forma without an expiry date is an open-ended price commitment. Freight rates, raw material costs and exchange rates all move, and a buyer who returns three months later with your pro forma has a reasonable expectation that the price stands. Thirty days is a common default; state whatever period you can actually honour.",
        },
      },
      {
        heading: "Writing a pro forma a bank can work from",
        paragraphs: [
          "When a letter of credit is opened against a pro forma, the credit's terms are drawn from it — often almost verbatim. Anything ambiguous in the pro forma becomes a term you will later have to comply with exactly, and anything missing becomes a term the bank or applicant invents.",
        ],
        numbered: [
          "Write goods descriptions you can reproduce identically on the commercial invoice, because the credit will require them to correspond.",
          "State quantities with the tolerance you need — if partial shipment or a quantity variance is possible, say so, because a credit that forbids it will bind you.",
          "State the Incoterm precisely, including the named place, since the credit will specify the documents required on that basis.",
          "List the documents you will be able to present, and do not offer any you cannot reliably obtain.",
          "State a realistic latest shipment date, allowing for production and booking, not the best case.",
          "State the currency and the exact amount, and flag whether the total is subject to a tolerance.",
          "Confirm the beneficiary name and bank details exactly as they appear on your bank records.",
        ],
      },
      {
        heading: "From pro forma to shipment",
        paragraphs: [
          "The pro forma is superseded, not amended, when the order proceeds. Issue a commercial invoice reflecting what is actually being shipped, referencing the pro forma number so the transaction is traceable, and expect the two to differ — quantities shift, prices are renegotiated, partial shipments happen.",
          "Where a letter of credit was opened against the pro forma, differences matter more. Any change to quantity, description, price or shipment date that the credit does not accommodate needs a credit amendment agreed before shipment. Shipping first and seeking a waiver afterwards puts payment at the buyer's discretion.",
        ],
      },
    ],
    faqs: [
      {
        q: "What is a pro forma invoice?",
        a: "A committed quotation issued before a sale is concluded, stating what will be supplied, at what price, on what terms, and for how long the offer stands. Buyers use it to obtain import permits, open letters of credit, secure internal approval and arrange advance payment. It is not a demand for payment and is not normally the document customs clears against.",
      },
      {
        q: "Is a pro forma invoice legally binding?",
        a: "It is generally treated as an offer rather than a concluded contract, so it does not by itself create an obligation to pay. But it is not without effect: acceptance of the offer on its stated terms can form a contract, and a pro forma without a validity period is an open-ended price commitment. Treat it as a document you intend to honour, because buyers and banks will.",
      },
      {
        q: "Can I use a pro forma invoice for customs clearance?",
        a: "Usually not. Customs requires a commercial invoice evidencing a concluded sale, because valuation is based on the price actually paid or payable. Some destinations accept a pro forma for specific procedures — temporary imports, samples, goods with no commercial value — but this is an exception rather than a rule. Confirm with the destination broker before shipping against one.",
      },
      {
        q: "What is the difference between a pro forma invoice and a quotation?",
        a: "Largely one of formality and detail. A quotation may be a price list or an email; a pro forma is structured like an invoice, with line items, HS codes, Incoterms, weights and shipping details, so that a bank or licensing authority can act on it. Where a buyer needs a document for an institution rather than for itself, a pro forma is what they are asking for.",
      },
      {
        q: "How long should a pro forma invoice be valid?",
        a: "Long enough for the buyer to act and short enough that you can honour the price. Thirty days is a common default. Where your price depends on volatile inputs — raw materials, freight rates, exchange rates — either shorten the validity or state the condition explicitly, such as 'subject to freight rate valid at time of booking'.",
      },
      {
        q: "Should a pro forma invoice show freight and insurance?",
        a: "Yes, wherever they are part of the price under the quoted Incoterm, and shown as separate lines. Buyers use the pro forma to calculate landed cost and to arrange their own insurance, and a bundled figure defeats both. It also keeps the pro forma consistent with the commercial invoice that will follow.",
      },
      {
        q: "Can a pro forma invoice be used for advance payment?",
        a: "Yes, and it is one of its most common uses. Include your bank details, state the deposit percentage and what triggers the balance, and reference the pro forma number so the payment can be reconciled. Issue a commercial invoice when the goods ship — the pro forma is not the accounting document for the sale.",
      },
      {
        q: "What happens if the final shipment differs from the pro forma?",
        a: "Issue a commercial invoice reflecting what actually shipped and reference the pro forma number. Differences are normal on open-account terms. Under a letter of credit they are not: any variance in quantity, description, price or shipment date that the credit does not accommodate needs a credit amendment agreed before shipment, or payment becomes discretionary.",
      },
      {
        q: "Does a pro forma invoice need a signature?",
        a: "Not universally, but sign it where the buyer, their bank or a licensing authority requires it — which is common for permit applications and credit openings. A signed pro forma also reads as a firmer commitment, which is usually what a buyer asking for one actually wants.",
      },
      {
        q: "Should a pro forma include HS codes?",
        a: "Yes. The buyer needs them to calculate duty and landed cost, and licensing authorities frequently require them on permit applications. Give the six-digit international heading at minimum. Providing them at the quotation stage also surfaces classification disagreements early, when they are cheap to resolve.",
      },
      {
        q: "Can I convert a pro forma into a commercial invoice?",
        a: "You can reuse the data, and you should — it is the same transaction. But issue a distinct document with its own number, labelled as a commercial invoice, reflecting what is actually shipping. Do not simply relabel the pro forma: the two documents have different legal characters and different audiences, and the buyer's accounts payable will be reconciling against the commercial invoice number.",
      },
      {
        q: "Can GainingDocx generate a commercial invoice from a pro forma?",
        a: "Where a pro forma has been extracted into the workspace, its reviewed line items, parties and terms can be reused to prepare a commercial invoice draft, so descriptions, HS codes and values carry across rather than being retyped. The draft remains editable for the quantities and prices that actually shipped.",
      },
    ],
    related: [
      { href: "/templates/commercial-invoice-template", label: "Commercial invoice template", blurb: "The document that replaces the pro forma when goods actually ship." },
      { href: "/tools/hs-code-finder", label: "HS code finder", blurb: "Classify each line before quoting, so the buyer's duty estimate is right." },
      { href: "/commercial-invoice-parser", label: "Commercial invoice parser", blurb: "Extract line items and terms from invoices you receive from suppliers." },
      { href: "/templates/certificate-of-origin-template", label: "Certificate of origin worksheet", blurb: "Prepare origin evidence where the buyer's duty claim depends on it." },
    ],
  },

  "certificate-of-origin-template": {
    updated: "2026-08-04",
    keywords: [
      "certificate of origin template",
      "certificate of origin format",
      "preferential vs non-preferential origin",
      "origin criterion",
      "chamber of commerce certificate of origin",
      "rules of origin",
      "self certification origin declaration",
    ],
    quickAnswer: {
      heading: "What a certificate of origin does",
      body:
        "A certificate of origin states where goods were produced. Non-preferential certificates support general import requirements and are usually issued by a chamber of commerce. Preferential certificates support a claim for reduced or zero duty under a trade agreement, follow that agreement's prescribed form and rules of origin, and increasingly rely on self-certification by an approved exporter rather than a third-party issuer.",
      bullets: [
        "Non-preferential: proves origin, no duty benefit",
        "Preferential: supports a reduced-duty claim",
        "Origin is determined by rules, not by where goods shipped from",
        "The importer carries the risk if the claim fails",
      ],
    },
    sections: [
      {
        heading: "Origin is not where the goods shipped from",
        paragraphs: [
          "This is the misunderstanding that generates most origin problems. Origin is where goods were produced or last substantially transformed, determined by legal rules. It is unrelated to the port of loading, the seller's country, the vessel's flag or where the invoice was raised. Goods manufactured in Vietnam, warehoused in Singapore and invoiced by a Hong Kong trading company are of Vietnamese origin.",
          "Because origin drives duty rates, preference eligibility, quota treatment, trade remedies and marking requirements, getting it wrong has consequences in several directions at once — and those consequences generally land on the importer, who made the declaration, rather than on the exporter who supplied the certificate.",
        ],
      },
      {
        heading: "Preferential and non-preferential origin",
        table: {
          caption: "The two families of origin evidence",
          columns: ["Aspect", "Non-preferential", "Preferential"],
          rows: [
            ["Purpose", "Establishes origin for general import requirements, marking, statistics and trade measures", "Supports a claim for reduced or zero duty under a trade agreement"],
            ["Rules applied", "The importing country's own non-preferential rules", "The specific rules of origin in the relevant agreement"],
            ["Typical form", "A general certificate of origin", "The agreement's prescribed form, declaration or statement"],
            ["Typical issuer", "Chamber of commerce or designated authority", "Increasingly the exporter itself, under an approved or registered scheme"],
            ["Consequence of error", "Query, delay, possible penalty", "Preference denied, duty recovered with interest, penalties possible"],
          ],
        },
        callout: {
          tone: "info",
          title: "A general certificate does not claim preference",
          body:
            "A chamber-issued certificate of origin proves origin; it does not by itself entitle anyone to a preferential rate. Preference requires the specific evidence the relevant agreement prescribes, produced under that agreement's rules. Presenting a general certificate where an agreement-specific declaration is required will not obtain the reduced rate.",
        },
      },
      {
        heading: "How origin is determined",
        paragraphs: [
          "Two broad concepts run through nearly every origin regime, and the second is where the work is.",
        ],
        subsections: [
          {
            heading: "Wholly obtained",
            paragraphs: [
              "Goods entirely produced in one country from that country's own materials — minerals extracted there, plants grown and harvested there, live animals born and raised there, fish caught by its vessels, goods produced exclusively from any of those. This is straightforward and rarely disputed.",
            ],
          },
          {
            heading: "Substantial transformation",
            paragraphs: [
              "Where materials from more than one country are used, origin goes to the country where the last substantial transformation occurred. Agreements express this in one of three ways, and frequently combine them for a given product.",
              "The tariff shift rule requires the finished good to be classified under a different heading or subheading from its non-originating inputs. The value-added rule requires a minimum percentage of regional value content, or caps the value of non-originating materials. The specific process rule requires a defined operation to have taken place — a particular chemical reaction, a spinning-to-fabric step, or a defined assembly.",
            ],
            bullets: [
              "Tariff shift — change in HS classification between inputs and output",
              "Regional value content — a minimum percentage of qualifying value",
              "Specific process — a named manufacturing operation must occur",
              "De minimis — a small tolerance for non-originating material that fails the rule",
              "Cumulation — inputs from partner countries may count as originating",
              "Insufficient operations — packaging, labelling and simple assembly never confer origin on their own",
            ],
          },
        ],
      },
      {
        heading: "What the worksheet needs to capture",
        paragraphs: [
          "Whether you are applying to a chamber of commerce or preparing a self-certified declaration, the same information underpins the claim. Assemble it before approaching the issuer — incomplete applications are the main reason certificates take longer than expected.",
        ],
        bullets: [
          "Exporter's full legal name and address, and its registration or trader identifier",
          "Producer's details where different from the exporter, which is common and frequently required",
          "Consignee and destination country",
          "Commercial invoice number and date, and any purchase order reference",
          "Transport details and route where the agreement requires direct-consignment evidence",
          "Line-by-line goods description, matching the invoice",
          "HS code per line at the length the agreement or authority requires",
          "Quantity, unit of measure, and gross weight or other measure",
          "Marks and numbers on the packages",
          "The origin criterion claimed per line, expressed in the agreement's own coding",
          "Any supporting evidence: bills of materials, supplier declarations, cost breakdowns, production records",
          "The declaration and authorised signature",
        ],
        callout: {
          tone: "warn",
          title: "Keep the evidence, not just the certificate",
          body:
            "A certificate is a statement; the evidence behind it is what survives a verification. Customs authorities conduct retrospective origin verifications years after import, and they ask the exporter for bills of materials, supplier declarations and production records. Certificates issued without that evidence assembled are claims you cannot later substantiate.",
        },
      },
      {
        heading: "Self-certification and approved exporter schemes",
        paragraphs: [
          "The direction of travel across modern trade agreements is away from third-party certificates and toward declarations made by the exporter itself — on the invoice or another commercial document — under a registration or approval scheme. The administrative burden shifts from obtaining a certificate to maintaining the records that justify one.",
          "This is a genuine change in risk profile rather than a simplification. Under a certificate regime, an issuing body performs some checking. Under self-certification, nobody checks until a verification is opened, at which point the exporter must produce complete evidence for consignments shipped years earlier. Registration in the applicable scheme, correct declaration wording and disciplined record retention are all prerequisites, not formalities.",
        ],
      },
      {
        heading: "Where origin claims fail",
        bullets: [
          "The origin criterion claimed does not match the rule the agreement specifies for that HS heading",
          "The classification used for the origin rule differs from the classification declared on entry",
          "Supplier declarations for inputs are missing, expired or do not cover the period of production",
          "Regional value content calculated on the wrong basis, or using costs the agreement excludes",
          "Direct consignment or transit requirements breached by an unauthorised operation en route",
          "The certificate names a producer or exporter inconsistent with the invoice",
          "Descriptions or quantities that do not correspond to the commercial invoice",
          "The declaration made by a party not registered or approved under the applicable scheme",
          "Records not retained for the period the agreement requires, so a verification cannot be answered",
        ],
      },
    ],
    faqs: [
      {
        q: "What is a certificate of origin?",
        a: "A document stating the country where goods were produced or last substantially transformed. Non-preferential certificates support general import requirements, marking and trade measures, and are usually issued by a chamber of commerce or designated authority. Preferential evidence supports a claim for reduced duty under a specific trade agreement and follows that agreement's own form and rules.",
      },
      {
        q: "Is origin the same as the country I ship from?",
        a: "No, and confusing the two is the most common origin error. Origin is determined by where goods were produced or last substantially transformed under legal rules. Goods made in one country, warehoused in a second and invoiced from a third retain the origin of the country of production. Port of loading, seller's address and vessel flag are all irrelevant to origin.",
      },
      {
        q: "What is the difference between preferential and non-preferential origin?",
        a: "Non-preferential origin establishes where goods are from for general purposes — marking, statistics, trade remedies, quotas — with no duty benefit attached. Preferential origin supports a claim for reduced or zero duty under a trade agreement and must satisfy that agreement's specific rules of origin. A general certificate of origin does not obtain a preferential rate.",
      },
      {
        q: "Who issues a certificate of origin?",
        a: "For non-preferential certificates, typically a chamber of commerce or a body designated by the exporting country. For preferential evidence, it depends on the agreement: some still use authority-issued certificates, while many modern agreements rely on a declaration made by the exporter itself under a registration or approved-exporter scheme.",
      },
      {
        q: "What is substantial transformation?",
        a: "The test applied when goods contain materials from more than one country: origin goes to the country where the last substantial transformation took place. Agreements express this as a change in tariff classification, a minimum regional value content, a specific manufacturing process, or a combination. Simple operations such as packaging, labelling, sorting and basic assembly never confer origin on their own.",
      },
      {
        q: "What is a tariff shift rule?",
        a: "A rule that confers origin when the finished product is classified under a different HS heading or subheading from the non-originating materials used to make it. It is the most common form of origin rule because it is objective and auditable. The rule specifies the level of change required — chapter, heading or subheading — and that level varies by product.",
      },
      {
        q: "What happens if a preference claim is wrong?",
        a: "The duty saved is recovered from the importer, typically with interest, and penalties may follow. Because verifications are retrospective and often cover several years, a single wrong rule applied consistently produces a large assessment. The exposure sits with the importer who made the claim, even though the origin evidence came from the exporter.",
      },
      {
        q: "How long must origin records be kept?",
        a: "It depends on the agreement and the jurisdiction, and periods of three to five years from the date of the declaration are common. Retain the underlying evidence — bills of materials, supplier declarations, cost calculations, production records — not just the certificate, because a verification asks for the substantiation rather than the statement.",
      },
      {
        q: "What is a supplier declaration?",
        a: "A statement from an input supplier confirming the origin status of the materials it supplies, which the manufacturer relies on when determining the origin of the finished goods. Where inputs are treated as originating, the supplier declaration is the evidence. Missing, expired or period-mismatched supplier declarations are one of the most common reasons origin verifications fail.",
      },
      {
        q: "Can I self-certify origin?",
        a: "Under many modern trade agreements, yes — by making a declaration on the invoice or another commercial document, provided you are registered or approved under the applicable scheme and use the prescribed wording. This shifts the burden from obtaining a certificate to maintaining substantiating records, and it increases rather than reduces the importance of disciplined record keeping.",
      },
      {
        q: "Does the certificate need to match the commercial invoice?",
        a: "Yes. Descriptions, quantities, invoice numbers and party details must correspond, because customs checks them against each other. A certificate describing goods differently from the invoice, or referencing an invoice number that does not match, is a straightforward ground for rejecting the claim regardless of whether the goods genuinely originate where stated.",
      },
      {
        q: "Can GainingDocx help with origin documentation?",
        a: "The workspace extracts origin fields, HS codes and line-level detail from commercial invoices and certificates, and compares them across the document set so a mismatch between the certificate and the invoice is caught before submission. It organises and checks the evidence; it does not determine origin, which requires the applicable agreement's rules applied to your production facts.",
      },
    ],
    related: [
      { href: "/templates/commercial-invoice-template", label: "Commercial invoice template", blurb: "The invoice a certificate of origin must correspond to line for line." },
      { href: "/tools/hs-code-finder", label: "HS code finder", blurb: "Classification drives the origin rule that applies to each product." },
      { href: "/commercial-invoice-parser", label: "Commercial invoice parser", blurb: "Extract origin, HS codes and values from supplier invoices for verification." },
      { href: "/templates/pro-forma-invoice-template", label: "Pro forma invoice template", blurb: "Surface classification and origin questions at the quotation stage." },
    ],
  },
};
