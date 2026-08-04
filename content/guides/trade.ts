import type { GuideDefinition } from "@/content/guides";

export const TRADE_GUIDES: GuideDefinition[] = [
  {
    slug: "incoterms-2020-explained",
    title: "Incoterms 2020 Explained: All 11 Rules, Risk and Cost Transfer",
    seoTitle: "Incoterms 2020 Explained: All 11 Rules with Cost & Risk Chart",
    description:
      "Every Incoterms 2020 rule explained — where risk transfers, who pays for what, which rules suit containers, and the mistakes that cost money on real shipments.",
    readMinutes: 16,
    updated: "2026-08-04",
    keywords: [
      "incoterms 2020",
      "incoterms explained",
      "FOB vs CIF",
      "EXW meaning shipping",
      "DAP vs DDP",
      "incoterms chart",
      "FCA incoterms",
    ],
    tool: {
      href: "/templates/commercial-invoice-template",
      label: "Build a commercial invoice",
      title: "State the Incoterm properly on your invoice",
      description:
        "A rule without a named place and an edition is commercially incomplete. The commercial invoice template puts the Incoterm, named place and rules edition where customs and your buyer expect to find them.",
    },
    sections: [
      {
        heading: "What Incoterms actually decide",
        paragraphs: [
          "Incoterms are a set of eleven three-letter rules published by the International Chamber of Commerce that allocate obligations between a seller and a buyer in a sale of goods. Each rule answers three questions: who arranges and pays for carriage, who bears the risk of loss or damage at each stage, and who handles export and import formalities.",
          "They are contractual shorthand, incorporated into a sale contract by reference. They are not law, they do not transfer ownership, they do not decide when payment is due, and they do not override the terms of your contract if the two conflict. What they do is remove ambiguity from a set of questions that would otherwise take a page of drafting each time.",
          "The 2020 edition is the current one. Referencing an edition matters: 'FOB Shanghai' without an edition is technically incomplete, and prior editions remain in use in some contracts, so 'Incoterms 2020' should always follow the rule and named place.",
        ],
        bullets: [
          "Incoterms allocate cost, risk and formalities — nothing else",
          "They do not transfer title or ownership of the goods",
          "They do not set payment terms or currency",
          "They do not decide which court or law governs the contract",
          "They must be stated with a named place and an edition to be complete",
        ],
      },
      {
        heading: "The two families: any mode and sea only",
        paragraphs: [
          "The eleven rules split into seven that work for any mode of transport and four that are designed exclusively for sea and inland waterway. This split is the single most practically important thing to understand, because misapplying it is the most common Incoterms error in international trade.",
          "The four maritime rules — FAS, FOB, CFR and CIF — were written for goods handed over alongside or loaded across a ship's rail. That is how break bulk works. It is not how containers work: containerised cargo is handed to a carrier at a terminal or a container yard, often days before the vessel loads, and the seller has no practical control over it in the interval.",
          "The result of using FOB for a container shipment is a gap. Risk formally stays with the seller until the goods are on board, but the seller lost physical control at the terminal gate. If the container is damaged in the yard, the seller bears a risk it could not manage and cannot easily evidence. FCA, CPT and CIP exist to close exactly that gap.",
        ],
        table: {
          caption: "The eleven Incoterms 2020 rules",
          columns: ["Rule", "Mode", "Where risk transfers", "Seller arranges carriage", "Seller insures"],
          rows: [
            ["EXW — Ex Works", "Any", "At the seller's premises, before loading", "No", "No"],
            ["FCA — Free Carrier", "Any", "On delivery to the named carrier or place", "No", "No"],
            ["CPT — Carriage Paid To", "Any", "On handover to the first carrier", "Yes", "No"],
            ["CIP — Carriage and Insurance Paid To", "Any", "On handover to the first carrier", "Yes", "Yes, at the higher cover level"],
            ["DAP — Delivered at Place", "Any", "At the destination, ready for unloading", "Yes", "No"],
            ["DPU — Delivered at Place Unloaded", "Any", "At the destination, once unloaded", "Yes", "No"],
            ["DDP — Delivered Duty Paid", "Any", "At the destination, import cleared", "Yes, plus import duties", "No"],
            ["FAS — Free Alongside Ship", "Sea and inland waterway", "Alongside the vessel at the load port", "No", "No"],
            ["FOB — Free On Board", "Sea and inland waterway", "When the goods are on board", "No", "No"],
            ["CFR — Cost and Freight", "Sea and inland waterway", "When the goods are on board", "Yes", "No"],
            ["CIF — Cost, Insurance and Freight", "Sea and inland waterway", "When the goods are on board", "Yes, minimum cover", "Yes, at the minimum level"],
          ],
          note: "Risk and cost transfer at different points under the C rules — this is the detail that catches people out and is explained below.",
        },
      },
      {
        heading: "The C rules: where risk and cost part company",
        paragraphs: [
          "Under CPT, CIP, CFR and CIF the seller pays for carriage to the named destination. It does not follow that the seller bears risk to that destination — and this divergence is the most misunderstood feature of the entire system.",
          "Under CIF Rotterdam, the seller pays freight and insurance to Rotterdam. But risk transfers when the goods are loaded on board at the origin port. If the vessel sinks mid-ocean, the loss is the buyer's, even though the seller paid the freight to a port the goods never reached. The buyer's protection is the insurance the seller was required to arrange — which is precisely why the insurance obligation exists in CIF and CIP but not in CFR and CPT.",
          "Under CFR and CPT there is no insurance obligation at all. A buyer agreeing CFR terms and not arranging its own cover is uninsured for a voyage whose risk it bears. This is a genuinely common and expensive mistake.",
        ],
        bullets: [
          "Cost transfer point: the named destination the seller pays carriage to",
          "Risk transfer point: on board at origin (CFR, CIF) or handover to the first carrier (CPT, CIP)",
          "CIF requires only minimum insurance cover — typically inadequate for manufactured goods",
          "CIP requires the higher institute-clauses level of cover under the 2020 edition",
          "CFR and CPT require no insurance from either party — the buyer must arrange its own",
        ],
      },
      {
        heading: "EXW and DDP: the two extremes, and why both are risky",
        paragraphs: [
          "EXW places the maximum obligation on the buyer. The seller makes the goods available at its own premises and does nothing else — it does not load, does not clear for export, and bears no transport risk. In practice this creates a problem: in many countries the exporter of record must be established locally, and a foreign buyer cannot legally file the export declaration. The workaround is usually that the seller does it anyway, informally, without the contractual obligation or the protection.",
          "FCA at the seller's premises achieves nearly everything EXW is chosen for while placing loading and export clearance with the party actually able to perform them. For most sales where EXW is being considered, FCA is the better rule.",
          "DDP is the mirror image: the seller does everything including import clearance and paying duties and taxes at destination. It requires the seller to be able to act as importer of record in the buyer's country, which is frequently impossible or requires a local registration the seller does not have. Unrecoverable import VAT is the usual sting — a seller who cannot reclaim destination VAT has quietly absorbed it into the sale price.",
        ],
        bullets: [
          "EXW: the buyer may not be legally able to file the export declaration",
          "EXW: the seller loading a truck under EXW is doing so at the buyer's risk, which surprises both parties",
          "FCA seller's premises is usually the correct alternative to EXW",
          "DDP: the seller must be able to act as importer of record at destination",
          "DDP: import VAT is often unrecoverable by a foreign seller",
          "DAP or DPU achieves delivered-terms convenience without the import clearance burden",
        ],
      },
      {
        heading: "What changed from Incoterms 2010",
        paragraphs: [
          "The 2020 revision made a small number of substantive changes. Knowing them matters because contracts referencing the 2010 edition remain in force, and a party assuming the current rules against a 2010 contract will get the insurance level and the delivery point wrong.",
        ],
        bullets: [
          "DAT (Delivered at Terminal) was renamed DPU (Delivered at Place Unloaded), widening it beyond terminals to any place",
          "CIP now requires the higher institute-clauses level of insurance cover; CIF continues to require only minimum cover",
          "FCA gained an option for the parties to agree that the buyer instructs the carrier to issue an on-board bill of lading to the seller — solving a long-standing problem for FCA sales under documentary credits",
          "The rules now expressly allow for carriage using the seller's or buyer's own means of transport, rather than assuming a third-party carrier",
          "Security-related obligations and their costs are set out more explicitly throughout",
          "The presentation was reordered to make the delivery point and risk transfer more prominent in each rule",
        ],
      },
      {
        heading: "Choosing a rule",
        paragraphs: [
          "The practical question is not which rule is best but which party is genuinely able to perform each obligation in each country. A rule that allocates a task to a party that cannot do it does not save anyone money; it produces an informal workaround with no contractual backing.",
        ],
        bullets: [
          "Containerised cargo: use FCA, CPT, CIP, DAP, DPU or DDP — not FOB, CFR or CIF",
          "Break bulk and bulk loaded across a ship's rail: the maritime rules are appropriate",
          "Buyer has strong freight rates and wants control: FCA",
          "Seller wants to control the routing and sell a landed price: CIP or DAP",
          "Buyer cannot clear imports and expects a door price: DDP, but only if the seller can act as importer of record",
          "Payment by documentary credit: check which rule the credit assumes, since the required documents follow from it",
          "Always state the named place precisely — 'FCA Shenzhen' is ambiguous, 'FCA Seller's warehouse, Bao'an District, Shenzhen, Incoterms 2020' is not",
        ],
      },
      {
        heading: "Where Incoterms go wrong in practice",
        paragraphs: [
          "Nearly every Incoterms dispute traces back to one of a small number of recurring errors, and all of them are avoidable at the contract stage.",
        ],
        bullets: [
          "Using FOB, CFR or CIF for containerised cargo, creating a risk gap between terminal handover and vessel loading",
          "Stating a rule without a named place, so the delivery point is undefined",
          "Omitting the edition, so it is unclear whether CIP requires minimum or higher insurance cover",
          "Assuming that the party paying freight also bears the risk under the C rules",
          "Agreeing CFR or CPT and arranging no insurance at all",
          "Agreeing EXW where the buyer cannot legally file the export declaration",
          "Agreeing DDP where the seller cannot recover destination VAT",
          "Naming a destination under DAP without agreeing who unloads — that is what DPU is for",
          "Using an Incoterm to describe when title passes, which it does not do",
          "Inconsistent Incoterms across the purchase order, the invoice and the transport document",
        ],
      },
    ],
    faqs: [
      {
        q: "What is the difference between FOB and FCA?",
        a: "FOB is a maritime rule: risk transfers when the goods are on board the vessel, and the seller bears risk in the terminal until loading. FCA works for any mode: risk transfers when the goods are handed to the carrier at the named place, which for containers is the terminal or container yard. For containerised cargo FCA is the correct rule, because the seller has no practical control over a container sitting in a yard waiting to load.",
      },
      {
        q: "Does CIF mean my goods are fully insured?",
        a: "No. CIF requires the seller to arrange only minimum insurance cover, which for most manufactured goods is inadequate — it covers a restricted set of named perils rather than all risks. If you need full cover under CIF, agree it expressly in the contract or arrange your own additional insurance. CIP under the 2020 edition requires the higher institute-clauses level, which is one of the practical reasons to prefer it.",
      },
      {
        q: "Who pays for what under DAP?",
        a: "The seller arranges and pays for carriage to the named destination and bears the risk until the goods arrive there ready for unloading. The buyer unloads, and the buyer handles import clearance and pays duties and taxes. If you want the seller to unload, the rule is DPU. If you want the seller to clear imports and pay duty, the rule is DDP.",
      },
      {
        q: "Do Incoterms determine when ownership transfers?",
        a: "No. Incoterms allocate cost, risk and formalities. Transfer of title is governed by the sale contract and the applicable law, and it can happen at a completely different moment from risk transfer. If title matters to your transaction — for financing, for insurance, or for insolvency protection — it must be addressed expressly in the contract.",
      },
      {
        q: "Which Incoterm should I use for a container shipment?",
        a: "FCA, CPT, CIP, DAP, DPU or DDP. The four maritime rules — FAS, FOB, CFR and CIF — assume the goods are handed over alongside or loaded across a ship's rail, which is not how containers move. Using them for containers leaves the seller bearing risk over cargo it no longer controls, in a terminal it has no access to.",
      },
      {
        q: "What replaced DAT in Incoterms 2020?",
        a: "DPU — Delivered at Place Unloaded. The change was more than cosmetic: DAT required delivery at a terminal, while DPU allows delivery unloaded at any agreed place. It remains the only rule under which the seller is obliged to unload the goods at destination.",
      },
      {
        q: "Can I modify an Incoterm in my contract?",
        a: "You can, and parties frequently do — 'FOB stowed and trimmed', 'EXW loaded' — but modifications are outside the published rules and mean whatever your contract says they mean. If you modify a rule, spell out exactly which obligation has moved and who bears the cost and risk of it, because the ICC definition no longer answers the question.",
      },
      {
        q: "Do I need to state the Incoterms edition?",
        a: "Yes. Prior editions remain in use in existing contracts, and there are substantive differences — particularly the CIP insurance level and the DAT to DPU change. 'CIP Hamburg' is ambiguous about insurance cover; 'CIP Hamburg, Incoterms 2020' is not.",
      },
      {
        q: "What is the risk with EXW?",
        a: "That the buyer cannot legally perform the obligations EXW allocates to it. In many countries the export declaration must be filed by a locally established exporter of record, which a foreign buyer is not. The result is that the seller files it informally without the contractual obligation, protection or documentation trail. FCA at the seller's premises solves this.",
      },
      {
        q: "Under DDP, who pays import VAT?",
        a: "The seller, and that is the trap. A seller not registered in the destination country generally cannot recover import VAT, so it becomes an unrecoverable cost absorbed into the sale price. Before agreeing DDP, confirm whether you can act as importer of record and whether the VAT is recoverable — if either answer is no, DAP is usually the better rule.",
      },
      {
        q: "Should the Incoterm on my invoice match the purchase order?",
        a: "Always. An Incoterm that differs between the purchase order and the invoice means the parties disagree about who pays for carriage and who bears risk — which will surface as a payment dispute or, worse, as an uninsured loss. It is one of the standard checks in cross-document matching for exactly this reason.",
      },
      {
        q: "Do Incoterms apply to domestic sales?",
        a: "They can. The rules are written to work for domestic as well as international sales, and the any-mode rules in particular translate well. What changes is that export and import formalities largely fall away, which makes several of the distinctions between rules much less significant.",
      },
    ],
    related: [
      { href: "/templates/commercial-invoice-template", label: "Commercial invoice template", blurb: "State the Incoterm, named place and edition where they belong." },
      { href: "/guides/hs-code-classification-guide", label: "HS classification guide", blurb: "The other half of what determines duty at destination." },
      { href: "/commercial-invoice-parser", label: "Commercial invoice parser", blurb: "Extract and check Incoterms across your invoices automatically." },
      { href: "/guides/letter-of-credit-document-checklist", label: "Letter of credit checklist", blurb: "Which documents a credit requires under each Incoterm." },
    ],
    sources: [
      { name: "International Chamber of Commerce — Incoterms 2020", url: "https://iccwbo.org/business-solutions/incoterms-rules/", note: "The publisher of the rules. The full text is the authoritative source; summaries including this one are explanatory." },
      { name: "ICC Incoterms 2020 introduction", url: "https://iccwbo.org/business-solutions/incoterms-rules/incoterms-2020/", note: "Official overview of the changes from the 2010 edition." },
    ],
  },

  {
    slug: "hs-code-classification-guide",
    title: "HS Code Classification: Structure, GRI Rules and How to Classify",
    seoTitle: "HS Code Classification Guide: Structure, GRI Rules & Examples",
    description:
      "How Harmonized System codes are structured, how the General Rules of Interpretation work in order, how many digits each country needs, and what misclassification actually costs.",
    readMinutes: 15,
    updated: "2026-08-04",
    keywords: [
      "HS code classification",
      "harmonized system explained",
      "general rules of interpretation",
      "how to classify goods customs",
      "HS vs HTS",
      "tariff classification guide",
      "binding ruling customs",
    ],
    tool: {
      href: "/tools/hs-code-finder",
      label: "Search HS and HTS codes",
      title: "Find a candidate classification",
      description:
        "Search official U.S. tariff descriptions by product keyword, see the international six-digit heading separately from the U.S. statistical code, and review published duty-rate fields.",
    },
    sections: [
      {
        heading: "What the Harmonized System is",
        paragraphs: [
          "The Harmonized Commodity Description and Coding System is maintained by the World Customs Organization and used by more than 200 countries and territories. It is the nearest thing international trade has to a universal product language: the first six digits mean the same thing everywhere the system applies.",
          "That common root is why a manufacturer in Vietnam and an importer in Germany can agree what a product is without either understanding the other's national tariff. Below six digits, every country goes its own way — which is where duty rates, quotas, licensing and trade remedies live.",
          "Classification is a legal exercise, not a search. The code determines duty, preference eligibility, licensing requirements, quota treatment, statistical reporting and exposure to antidumping and safeguard measures. Getting it wrong is not a filing error; it is an assessment liability that compounds across every entry made with the same code.",
        ],
        table: {
          caption: "Decomposing a commodity code",
          columns: ["Segment", "Digits", "Level", "Scope"],
          rows: [
            ["84", "1–2", "Chapter", "Nuclear reactors, boilers, machinery and mechanical appliances"],
            ["8471", "1–4", "Heading", "Automatic data processing machines and units thereof"],
            ["8471.30", "1–6", "Subheading", "Portable ADP machines weighing not more than 10 kg — international"],
            ["8471.30.01", "1–8", "National tariff line", "Where the legal duty rate attaches in the United States"],
            ["8471.30.0100", "1–10", "Statistical suffix", "Reporting detail with no separate duty consequence"],
          ],
          note: "Only the first six digits transfer internationally. Everything beyond is specific to the country applying it.",
        },
      },
      {
        heading: "How many digits your destination needs",
        paragraphs: [
          "A supplier quoting six digits has given you a starting point, not an import classification. The length required depends entirely on where the goods are entering, and export codes frequently differ from import codes even within the same country.",
        ],
        table: {
          caption: "Code length by jurisdiction",
          columns: ["Jurisdiction", "System", "Digits", "Note"],
          rows: [
            ["International", "Harmonized System", "6", "Common to all contracting parties"],
            ["United States — imports", "HTSUS", "10", "8 digits legal, 10 statistical"],
            ["United States — exports", "Schedule B", "10", "Diverges from HTSUS below 6 digits"],
            ["European Union", "CN / TARIC", "8 / 10", "CN 8 for export, TARIC 10 for import measures"],
            ["United Kingdom", "UK Global Tariff", "10", "Aligned to but separate from EU TARIC"],
            ["China", "China Customs", "13", "10 statutory plus regulatory digits"],
            ["India", "ITC (HS)", "8", "National subdivision at 8"],
            ["Japan", "Japan Tariff", "9", "Statistical code extends to 9"],
          ],
        },
      },
      {
        heading: "The General Rules of Interpretation, applied in order",
        paragraphs: [
          "Six rules govern classification, and they are applied sequentially. You do not reach GRI 3 until GRI 1 and GRI 2 have failed to resolve the question. Working out of order is the most common way a plausible-looking classification turns out to be legally wrong.",
          "In practice, most classifications are settled by GRI 1 — the terms of the headings and the section and chapter notes. The notes do a great deal of work: they exclude goods as often as they include them, and an exclusion note settles a question faster than any amount of searching.",
        ],
        bullets: [
          "GRI 1 — Classification is determined by the terms of the headings and any relevant section or chapter notes. Section and chapter titles are for reference only and have no legal force",
          "GRI 2(a) — An incomplete or unassembled article is classified as the finished article if, as presented, it has the essential character of the finished article",
          "GRI 2(b) — A reference to a material includes mixtures and combinations of that material; goods of more than one material go to GRI 3",
          "GRI 3(a) — Where two or more headings apply, the heading with the most specific description prevails over the more general",
          "GRI 3(b) — Where 3(a) does not resolve it, classify by the material or component that gives the goods their essential character",
          "GRI 3(c) — Where neither applies, classify under the heading occurring last in numerical order among those equally meriting consideration",
          "GRI 4 — Goods that cannot be classified by the above go to the heading appropriate to the goods to which they are most akin",
          "GRI 5 — Cases, containers and packing materials presented with the goods are generally classified with them",
          "GRI 6 — Subheadings are compared only at the same level, applying the above rules and any subheading notes",
        ],
      },
      {
        heading: "Working a classification",
        paragraphs: [
          "A classification you cannot explain is one you cannot defend in an audit. The process below produces both an answer and the reasoning behind it, and the reasoning is what protects you three years later.",
        ],
        bullets: [
          "Describe the article factually: what it is, what it is made of, what it does, how it is presented, who uses it. A vague description produces a vague classification",
          "Search on the most distinctive attribute first — material, function, or the commercial name if it is a term of art",
          "Read the candidate headings in full rather than skimming a search result list",
          "Read the section and chapter notes for every candidate, looking specifically for exclusions",
          "Apply GRI 1: does a heading describe these goods by its own terms? If so, you are largely done at four digits",
          "For composite goods, mixtures and sets, work GRI 3(a), then 3(b), then 3(c) in that order",
          "Compare subheadings at the same level only, under GRI 6, to reach six digits",
          "Extend to the destination's national length and check for measures attached to that specific line",
          "Write down the reasoning and the notes relied on, and keep it with the product record",
        ],
      },
      {
        heading: "Reading duty rate columns",
        paragraphs: [
          "Finding the code is half the job. The rate that applies depends on the country of origin of the goods — not where they shipped from — and on whether a valid preference claim is being made.",
          "In the United States schedule, Column 1 General is the default rate for normal trade relations partners. Column 1 Special shows preferential rates available under specific agreements and programmes, each identified by a letter code and each requiring valid origin evidence. Column 2 contains statutory rates applying to a small number of countries.",
          "Critically, additional duties sit outside these columns entirely. Antidumping, countervailing and safeguard measures attach to specific products from specific origins and can substantially exceed the base tariff. A classification exercise that stops at the rate column has missed the part most likely to hurt.",
        ],
      },
      {
        heading: "Binding rulings",
        paragraphs: [
          "For high-value, high-volume or genuinely ambiguous goods, a binding ruling from the customs authority of the importing country is the only classification that protects you. It is issued in advance, it binds that authority, and it removes the classification from the list of things an audit can reassess.",
          "The application requires a complete factual description, usually samples or detailed specifications, and your proposed classification with reasoning. Turnaround varies by country and can take weeks to months, so it belongs at the product-introduction stage rather than the shipment stage.",
          "Rulings are generally published, which makes the ruling database a useful research source in its own right: someone has often already asked about a product very like yours, and the reasoning in that ruling tells you how the authority thinks about the category.",
        ],
      },
      {
        heading: "What misclassification costs",
        paragraphs: [
          "Classification errors rarely surface at the border. They surface at audit, by which point the same wrong code has been used on hundreds of entries, and the exposure is retrospective across the whole audit period.",
        ],
        bullets: [
          "Underpaid duty recovered across the audit period, with interest",
          "Penalties assessed on the basis of negligence or failure to exercise reasonable care",
          "Overpaid duty that is difficult or time-barred to reclaim — errors run in both directions and the recovery routes are asymmetric",
          "Preference claims invalidated, because the origin rule that applied was keyed to the wrong classification",
          "Licensing or permit requirements attached to the correct code that were never obtained",
          "Antidumping or countervailing duty exposure discovered after the goods have been sold at a price that did not include it",
          "Shipments held pending reclassification, with storage and demurrage accruing",
          "Loss of trusted-trader or authorised operator status where error rates breach thresholds",
        ],
      },
    ],
    faqs: [
      {
        q: "What is the difference between an HS code and an HTS code?",
        a: "HS is the six-digit international standard maintained by the World Customs Organization. HTS is the United States import tariff schedule, which extends the HS to eight legal and ten statistical digits. Both describe the same goods, but only the first six digits are common — a full HTS number is meaningless outside the United States.",
      },
      {
        q: "Can I use my supplier's HS code?",
        a: "As a starting point, and only the first six digits. Your supplier classified for export under its own country's rules; you are importing under yours, and the importer of record carries the legal responsibility for the code declared on the entry. Verify the six-digit root and extend it under the destination's own schedule.",
      },
      {
        q: "What are the General Rules of Interpretation?",
        a: "Six legally binding rules applied in sequence to determine classification. GRI 1 governs through the terms of the headings and the section and chapter notes. GRI 2 covers incomplete articles and mixtures. GRI 3 resolves goods classifiable under two or more headings, by specificity, then essential character, then last in numerical order. GRI 4 covers goods most akin, GRI 5 packaging, and GRI 6 applies the same logic at subheading level.",
      },
      {
        q: "What does 'essential character' mean under GRI 3(b)?",
        a: "The factor that gives the goods their identity — which can be the material, the component, the bulk, the quantity, the weight, the value or the role the component plays in the article's use. There is no single test; it is assessed on the facts of the specific product. It is the most argued-about concept in classification and the most common subject of binding rulings.",
      },
      {
        q: "How do I classify a set of different items sold together?",
        a: "Sets put up for retail sale are classified under GRI 3(b) by the component that gives the set its essential character, provided the set consists of items put up together to meet a particular need or carry out a specific activity, and is packaged for sale directly to users without repacking. Where no component gives essential character, GRI 3(c) sends it to the heading occurring last in numerical order.",
      },
      {
        q: "Do section and chapter notes really matter?",
        a: "They are legally binding and they frequently decide the question. Notes exclude goods from chapters, define terms, and direct specific products to specific headings regardless of what a heading's plain wording suggests. Reading them is not optional diligence — GRI 1 makes them part of the classification rule itself.",
      },
      {
        q: "How often do HS codes change?",
        a: "The World Customs Organization revises the Harmonized System periodically, historically at roughly five-year intervals, and national schedules change more often as rates, quotas and trade measures are amended. Classifications inherited in product master data for several years should be reviewed rather than assumed to still be current.",
      },
      {
        q: "Is a customs broker's classification binding?",
        a: "No. A broker acts as your agent, and the importer of record remains legally responsible for the classification declared. A competent broker's opinion is valuable evidence of reasonable care, but only a binding ruling from the customs authority itself binds that authority.",
      },
      {
        q: "What is a binding ruling and when should I get one?",
        a: "A written determination from the importing country's customs authority, issued in advance, that binds the authority to that classification. Get one for high-value or high-volume products, for anything genuinely ambiguous, and for any product where an alternative classification would materially change the duty. Apply at product introduction, because turnaround can take weeks to months.",
      },
      {
        q: "Does the HS code alone determine the duty I pay?",
        a: "No. Duty depends on the classification, the country of origin, the customs value, any valid preference claim, and any additional measures attached to that line — antidumping, countervailing, safeguard or other trade actions, which frequently exceed the base tariff rate. The code is the key that unlocks all of those, not the whole answer.",
      },
      {
        q: "What happens if I have been using the wrong code for years?",
        a: "The exposure is retrospective. Most jurisdictions have a prior disclosure or voluntary correction procedure that materially reduces penalties compared with the same error being found at audit. Take advice specific to the jurisdiction before disclosing, but do not assume that quietly correcting the code going forward resolves the historic position.",
      },
      {
        q: "Can software classify products for me?",
        a: "Search tools find candidates by matching text; they do not read chapter notes, apply the GRIs or know your product. Treat any automated suggestion as a starting point to be verified against the headings, the notes and the rules — and for anything material, obtain a binding ruling rather than relying on a tool of any kind.",
      },
    ],
    related: [
      { href: "/tools/hs-code-finder", label: "HS code finder", blurb: "Search official tariff descriptions and separate HS from national codes." },
      { href: "/guides/rules-of-origin-explained", label: "Rules of origin explained", blurb: "Classification determines which origin rule applies to your product." },
      { href: "/templates/commercial-invoice-template", label: "Commercial invoice template", blurb: "Put the HS code and origin on each line where customs expects them." },
      { href: "/commercial-invoice-parser", label: "Commercial invoice parser", blurb: "Extract and check HS codes across supplier invoices." },
    ],
    sources: [
      { name: "World Customs Organization — Harmonized System", url: "https://www.wcoomd.org/en/topics/nomenclature/overview.aspx", note: "Maintains the Harmonized System and publishes the General Rules of Interpretation and explanatory notes." },
      { name: "U.S. International Trade Commission — HTS", url: "https://hts.usitc.gov/", note: "The official U.S. Harmonized Tariff Schedule, including rate columns and statistical suffixes." },
    ],
  },

  {
    slug: "rules-of-origin-explained",
    title: "Rules of Origin: Preferential Claims, Criteria and Verification",
    seoTitle: "Rules of Origin Explained: Preferential Claims & Verification",
    description:
      "How origin is determined, the difference between preferential and non-preferential origin, tariff shift and value-content rules, self-certification, and what happens in a verification.",
    readMinutes: 14,
    updated: "2026-08-04",
    keywords: [
      "rules of origin",
      "preferential origin",
      "certificate of origin",
      "tariff shift rule",
      "regional value content",
      "origin verification customs",
      "self certification origin",
    ],
    tool: {
      href: "/templates/certificate-of-origin-template",
      label: "Prepare origin data",
      title: "Assemble the origin evidence first",
      description:
        "Collect exporter, producer, consignee, invoice, goods and origin-criterion details in one worksheet before approaching a chamber of commerce or making a self-certified declaration.",
    },
    sections: [
      {
        heading: "Origin is not where the goods shipped from",
        paragraphs: [
          "This single misunderstanding causes more origin problems than any technical rule. Origin is where goods were produced or last substantially transformed, determined by legal rules. It has nothing to do with the port of loading, the seller's country, the vessel's flag, or where the invoice was raised.",
          "Goods manufactured in Vietnam, warehoused in Singapore, invoiced by a Hong Kong trading company and shipped from Shenzhen are of Vietnamese origin. Every other fact in that sentence is irrelevant to origin, however prominently it appears on the paperwork.",
          "Origin matters because it drives duty rates, preference eligibility, quota treatment, trade remedy exposure, marking requirements and government procurement eligibility. And the consequences of getting it wrong generally land on the importer, who made the claim, rather than on the exporter who supplied the evidence.",
        ],
      },
      {
        heading: "Preferential and non-preferential origin",
        paragraphs: [
          "These are two different systems with different rules, different evidence and different consequences, and conflating them is a common and expensive error.",
          "Non-preferential origin establishes where goods are from for general purposes: marking requirements, statistics, quotas, and antidumping or safeguard measures that attach to a specific origin. It carries no duty benefit. It is usually evidenced by a general certificate of origin issued by a chamber of commerce or designated body.",
          "Preferential origin supports a claim for reduced or zero duty under a specific trade agreement. It must satisfy that agreement's own rules of origin, which are product-specific and set out in its annexes. A general chamber-issued certificate does not obtain a preferential rate, no matter how genuine the origin.",
        ],
        table: {
          caption: "The two systems compared",
          columns: ["Aspect", "Non-preferential", "Preferential"],
          rows: [
            ["Purpose", "General origin determination", "A claim for reduced or zero duty"],
            ["Rules applied", "The importing country's own non-preferential rules", "The specific rules in the relevant agreement"],
            ["Evidence", "General certificate of origin", "The agreement's prescribed form, declaration or statement"],
            ["Typical issuer", "Chamber of commerce or designated authority", "Increasingly the exporter, under a registration scheme"],
            ["Product specificity", "General principles", "Rules set per HS heading in the agreement's annex"],
            ["Consequence of error", "Query, delay, possible penalty", "Preference denied, duty recovered with interest, penalties"],
          ],
        },
      },
      {
        heading: "How origin is determined",
        paragraphs: [
          "Two concepts run through almost every origin regime. The first is straightforward; the second is where all the work is.",
          "Goods are wholly obtained when they are entirely produced in one country from that country's own materials — minerals extracted there, plants grown and harvested there, animals born and raised there, fish taken by its vessels, and goods produced exclusively from any of those. This is rarely disputed.",
          "Where materials from more than one country are used, origin goes to the country where the last substantial transformation occurred. Agreements express substantial transformation in three ways, often combining them for a single product.",
        ],
        bullets: [
          "Tariff shift — the finished good must be classified under a different HS chapter, heading or subheading from its non-originating inputs. The required level of change is specified per product",
          "Regional value content — a minimum percentage of qualifying value must originate in the region, or the value of non-originating materials must stay below a ceiling. Calculation methods vary between agreements and are not interchangeable",
          "Specific process — a defined manufacturing operation must take place, such as a chemical reaction, a spinning-to-fabric step, or a specified assembly",
          "De minimis — a tolerance allowing a small proportion of non-originating material that fails the rule, typically expressed as a percentage of value or weight",
          "Cumulation — inputs from partner countries under the same agreement may count as originating, which is often what makes a rule achievable at all",
          "Insufficient operations — packaging, labelling, sorting, simple mixing and basic assembly never confer origin, regardless of where they happen",
        ],
      },
      {
        heading: "The classification connection",
        paragraphs: [
          "Origin rules are written per HS heading. That means you cannot determine origin until you have classified the product — and if the classification is wrong, the origin rule you applied is the wrong rule, even if your production facts were perfectly recorded.",
          "It also means the classification used for the origin analysis must be the same one declared on the entry. A mismatch between the two is a straightforward ground for denying a preference claim, and it is found routinely in verifications because the two exercises are frequently done by different people at different times.",
        ],
      },
      {
        heading: "Self-certification and approved exporter schemes",
        paragraphs: [
          "Modern trade agreements have moved decisively away from authority-issued certificates toward declarations made by the exporter itself, on the invoice or another commercial document, under a registration or approval scheme.",
          "This is often presented as simplification. It is more accurately a transfer of risk. Under a certificate regime, an issuing body performs some checking before the document exists. Under self-certification, nobody checks until a verification is opened — at which point the exporter must produce complete substantiating evidence for consignments that shipped years earlier.",
          "The practical consequences are that registration in the applicable scheme is a prerequisite, the declaration wording is prescribed and must be reproduced exactly, and record retention becomes a compliance control rather than an administrative habit.",
        ],
      },
      {
        heading: "What a verification asks for",
        paragraphs: [
          "Customs authorities conduct retrospective origin verifications, sometimes years after import, and they ask the exporter for the substantiation rather than the statement. A certificate is not evidence of origin; it is a claim about origin, and the evidence sits behind it.",
        ],
        bullets: [
          "Bills of materials showing every input and its origin status",
          "Supplier declarations for inputs treated as originating, covering the relevant production period",
          "Cost calculations where a regional value content rule was applied, on the basis the agreement prescribes",
          "Production records evidencing that the required process actually took place",
          "The classification analysis for both the finished good and the non-originating inputs",
          "Evidence of direct consignment or compliance with any transit rules",
          "Purchase and sales records tying the specific consignment to the production run",
        ],
      },
      {
        heading: "Where origin claims fail",
        paragraphs: [
          "Verification failures follow a predictable pattern. Almost none of them are about goods that did not originate where claimed; they are about evidence that was never assembled.",
        ],
        bullets: [
          "The origin criterion claimed does not match the rule the agreement specifies for that HS heading",
          "The classification used for the origin rule differs from the one declared on entry",
          "Supplier declarations are missing, expired, or do not cover the production period of the exported goods",
          "Regional value content calculated on the wrong basis, or including costs the agreement excludes",
          "Direct consignment or transit requirements breached by an unauthorised operation en route",
          "The certificate names a producer or exporter inconsistent with the invoice",
          "Descriptions or quantities that do not correspond to the commercial invoice",
          "The declaration made by a party not registered or approved under the applicable scheme",
          "Records not retained for the period the agreement requires, so a verification cannot be answered at all",
        ],
      },
    ],
    faqs: [
      {
        q: "Is origin the same as the country I ship from?",
        a: "No. Origin is where goods were produced or last substantially transformed under legal rules. Port of loading, the seller's address, the vessel's flag and where the invoice was raised are all irrelevant. Goods made in one country, warehoused in a second and invoiced from a third retain the origin of the country of production.",
      },
      {
        q: "What is the difference between preferential and non-preferential origin?",
        a: "Non-preferential origin establishes where goods are from for general purposes — marking, statistics, quotas, trade remedies — with no duty benefit. Preferential origin supports a claim for reduced or zero duty under a trade agreement and must satisfy that agreement's product-specific rules. A general certificate of origin does not obtain a preferential rate.",
      },
      {
        q: "What is a tariff shift rule?",
        a: "A rule that confers origin when the finished product is classified under a different HS chapter, heading or subheading from the non-originating materials used to make it. The required level of change is specified per product in the agreement's annex. It is the most common form of origin rule because it is objective and auditable from classification records.",
      },
      {
        q: "What is regional value content?",
        a: "A requirement that a minimum percentage of the product's value originates in the agreement's territory, or that non-originating material stays below a ceiling. Agreements prescribe the calculation method — build-up, build-down, net cost, focused value — and they are not interchangeable. Using the wrong method is a common verification failure even where the underlying value would have qualified.",
      },
      {
        q: "Can I self-certify origin?",
        a: "Under many modern agreements, yes — by making a declaration on the invoice or another commercial document, provided you are registered or approved under the applicable scheme and use the prescribed wording. It shifts the burden from obtaining a certificate to maintaining substantiating records, which increases rather than reduces the importance of disciplined record keeping.",
      },
      {
        q: "What is a supplier declaration?",
        a: "A statement from an input supplier confirming the origin status of the materials it supplies, which the manufacturer relies on when determining the origin of the finished goods. Where inputs are treated as originating, the supplier declaration is the evidence. Missing, expired or period-mismatched supplier declarations are among the most common reasons verifications fail.",
      },
      {
        q: "How long must origin records be kept?",
        a: "It depends on the agreement and the jurisdiction; three to five years from the date of the declaration is common. Retain the underlying evidence — bills of materials, supplier declarations, cost calculations, production records — not just the certificate, because a verification asks for the substantiation rather than the statement.",
      },
      {
        q: "Does packaging or labelling in a country confer origin?",
        a: "No. Every origin regime lists insufficient operations that never confer origin regardless of where they occur: packaging, labelling, sorting, simple mixing, cleaning, and basic assembly. A product shipped in from elsewhere and repackaged does not acquire the origin of the repackaging country.",
      },
      {
        q: "What is cumulation?",
        a: "A provision allowing inputs from partner countries under the same agreement to count as originating, rather than as non-originating material. It is frequently what makes a rule achievable for products with regional supply chains. The form varies — bilateral, diagonal and full cumulation each work differently — so check what the specific agreement allows.",
      },
      {
        q: "What happens if a preference claim is denied?",
        a: "The duty saved is recovered from the importer, usually with interest, and penalties may follow. Because verifications are retrospective and often cover several years of entries, a single wrong rule applied consistently produces a large assessment. The exposure sits with the importer even though the origin evidence came from the exporter.",
      },
      {
        q: "Do I need a certificate of origin for every shipment?",
        a: "No. Non-preferential certificates are needed only where the destination requires one, a letter of credit calls for it, or a specific trade measure attaches to origin. Preferential evidence is needed only when you are actually claiming preference. Many shipments need neither, and obtaining certificates by default wastes time and money.",
      },
      {
        q: "Must the certificate match the commercial invoice?",
        a: "Yes, exactly. Descriptions, quantities, invoice numbers and party details must correspond, because customs compares them. A certificate describing goods differently from the invoice, or referencing an invoice number that does not match, is a straightforward ground for rejecting the claim regardless of whether the goods genuinely originate where stated.",
      },
    ],
    related: [
      { href: "/templates/certificate-of-origin-template", label: "Certificate of origin worksheet", blurb: "Assemble exporter, producer and criterion data before applying." },
      { href: "/guides/hs-code-classification-guide", label: "HS classification guide", blurb: "Classification determines which origin rule applies to your product." },
      { href: "/guides/incoterms-2020-explained", label: "Incoterms 2020 explained", blurb: "How cost and risk allocation interacts with customs value and origin." },
      { href: "/commercial-invoice-parser", label: "Commercial invoice parser", blurb: "Check origin and HS codes across supplier invoices." },
    ],
    sources: [
      { name: "World Customs Organization — Rules of Origin", url: "https://www.wcoomd.org/en/topics/origin/overview.aspx", note: "Overview of preferential and non-preferential origin concepts and international instruments." },
      { name: "WTO — Agreement on Rules of Origin", url: "https://www.wto.org/english/tratop_e/roi_e/roi_e.htm", note: "The multilateral framework governing non-preferential rules of origin." },
    ],
  },

  {
    slug: "export-documents-checklist",
    title: "Export Documents Checklist: What Every Shipment Needs",
    seoTitle: "Export Documents Checklist: Core & Conditional Paperwork",
    description:
      "The core export document set, the conditional documents driven by commodity and destination, who issues each one, and the sequencing errors that hold shipments at the border.",
    readMinutes: 13,
    updated: "2026-08-04",
    keywords: [
      "export documents checklist",
      "documents required for export",
      "international shipping paperwork",
      "export documentation list",
      "shipping documents explained",
      "customs documents export",
      "trade document requirements",
    ],
    tool: {
      href: "/templates",
      label: "Open the template library",
      title: "Prepare the documents you issue yourself",
      description:
        "Fillable templates for commercial invoices, packing lists, shipping instructions, origin worksheets and more — with the fields customs and carriers actually look for.",
    },
    sections: [
      {
        heading: "The core set",
        paragraphs: [
          "Four or five documents accompany essentially every export, regardless of mode, commodity or destination. They carry different information for different audiences, and the discipline that matters is not collecting them but reconciling them against each other.",
          "The commercial invoice tells customs what the goods are worth and what they are. The packing list tells handlers and examiners what is physically in the shipment. The transport document is the contract of carriage and the operational record. The export declaration is the regulatory filing at origin. Where an intermediary is involved, a written instruction — shipping instructions for ocean, a shipper's letter of instruction for air — tells them what to prepare.",
        ],
        table: {
          caption: "The core export documents",
          columns: ["Document", "Issued by", "Establishes", "Read by"],
          rows: [
            ["Commercial invoice", "Seller or exporter", "Value, currency, terms, commodity, origin", "Customs at both ends, the bank under a credit"],
            ["Packing list", "Shipper or packer", "Packages, marks, dimensions, net and gross weight", "Handlers, customs examination, receiving warehouse"],
            ["Shipping instructions / SLI", "Shipper", "What the carrier or agent should prepare", "Carrier, forwarder, cargo agent"],
            ["Transport document", "Carrier, NVOCC or authorised agent", "Contract of carriage, receipt, and title if negotiable", "Carrier, customs manifest, consignee, bank"],
            ["Export declaration", "Exporter or its agent", "The regulatory export filing at origin", "Origin customs"],
          ],
        },
      },
      {
        heading: "Conditional documents",
        paragraphs: [
          "Beyond the core, requirements are driven by three things: what you are shipping, where it is going, and how payment is secured. There is no universal list — anyone offering one is describing a common case rather than a rule.",
        ],
        bullets: [
          "Certificate of origin — where the destination requires it, a trade measure attaches to origin, or a credit calls for it",
          "Preferential origin evidence — where a reduced-duty claim is being made under a trade agreement",
          "Import licence or permit — where the destination requires one obtained before shipment, not on arrival",
          "Export licence — for controlled goods, dual-use items and sanctioned destinations",
          "Insurance certificate — under CIF and CIP terms, or where a credit requires it",
          "Inspection certificate — where the buyer, the destination or a credit requires pre-shipment inspection",
          "Phytosanitary certificate — for plants and plant products, issued within a validity window",
          "Veterinary or health certificate — for animal products and foodstuffs",
          "Fumigation or ISPM 15 evidence — where wooden packaging is used and the destination enforces the standard",
          "Dangerous goods declaration — for hazardous cargo, under the regulations for the mode",
          "Cargo security declaration — for air cargo entering the secure supply chain",
          "Weight certificate or VGM declaration — mandatory for packed containers under SOLAS",
          "Bank documents — draft, bill of exchange and any document a documentary credit specifies",
        ],
      },
      {
        heading: "Sequencing: what has to happen before what",
        paragraphs: [
          "Export shipments fail on sequencing far more often than on availability. A certificate that exists but was issued after the cut-off is worth nothing. An import permit obtained after departure does not help a shipment already in transit. A security status applied after the cargo left the secured area cannot be reinstated.",
        ],
        bullets: [
          "Confirm the commodity is acceptable for the mode and identify any dangerous goods, perishable or controlled classification — before booking",
          "Establish destination import requirements, especially permits that must exist before shipment",
          "Check export control and sanctions exposure for the goods, the destination and the end user",
          "Prepare the commercial invoice and packing list, and reconcile them against each other",
          "Issue shipping instructions or the SLI to the carrier or forwarder before the documentation cut-off",
          "File the export declaration and obtain any export licence",
          "Obtain commodity-specific certificates inside their validity windows",
          "Submit VGM for containerised cargo before the VGM cut-off",
          "Deliver cargo before the physical cut-off, which is later than the documentation cut-off but not by much",
          "Check the carrier's draft transport document against your instructions before it is released",
        ],
      },
      {
        heading: "Reconciliation is the actual control",
        paragraphs: [
          "Having every document is necessary and not sufficient. The failures that hold shipments are almost always differences between documents rather than defects in one: a package count that disagrees, a description written for two different audiences, party names updated in one system and not the other.",
          "Customs compares the invoice against the packing list against the transport document. A bank under a documentary credit compares everything against the credit terms and against each other, literally and unforgivingly. A destination agent compares the arrival notice against the transport document.",
        ],
        bullets: [
          "Party names and addresses identical across invoice, packing list and transport document",
          "Invoice, PO and shipment references carried consistently through every document",
          "Goods description consistent, and matching the credit wording exactly where one applies",
          "Quantities and units of measure agreeing at line level, not only in total",
          "Net and gross weights consistent, and net never exceeding gross",
          "Package counts agreeing between packing list, transport document and any manifest",
          "Container and seal numbers identical, with check digits validated",
          "HS codes and origin consistent between invoice and any origin evidence",
          "Dates plausible and inside any credit's shipment deadline",
        ],
      },
      {
        heading: "Documents you can issue and documents you cannot",
        paragraphs: [
          "A recurring source of confusion is which documents an exporter produces itself and which require a specific authority. Getting this wrong wastes time chasing the wrong party.",
        ],
        table: {
          caption: "Who issues what",
          columns: ["Document", "Issued by", "Exporter's role"],
          rows: [
            ["Commercial invoice", "The exporter", "Prepare and sign"],
            ["Packing list", "The exporter or packer", "Prepare from the packed cargo"],
            ["Pro forma invoice", "The exporter", "Prepare before the sale concludes"],
            ["Bill of Lading", "Carrier, NVOCC or authorised agent", "Provide instructions, then check the draft"],
            ["Air waybill", "Airline or authorised cargo agent", "Provide an SLI, then check the issued document"],
            ["Certificate of origin", "Chamber of commerce or designated body, or self-certified under a scheme", "Assemble evidence and apply, or declare if registered"],
            ["Phytosanitary certificate", "The national plant protection organisation", "Apply and present goods for inspection"],
            ["Export declaration", "The exporter or its broker", "File, or instruct a broker to file"],
            ["Insurance certificate", "The insurer or broker", "Arrange cover and obtain the certificate"],
            ["Delivery order", "Carrier or its destination agent", "Request once release conditions are met"],
          ],
        },
      },
      {
        heading: "Common reasons shipments are held",
        bullets: [
          "Goods description too generic for customs to confirm classification — 'spare parts', 'samples', 'general merchandise'",
          "Package count or weight disagreeing between the packing list and the transport document",
          "Value or currency on the invoice conflicting with the declared value on the transport document",
          "Certificate issued outside its validity window, or naming a consignee that does not match the invoice",
          "Wooden packaging without an ISPM 15 mark where the destination enforces the standard",
          "Import permit not obtained before shipment where the destination required it in advance",
          "Missing signature where the destination or a credit requires a signed document",
          "HS code absent or inconsistent between documents",
          "Consignee contact details incomplete, so the destination agent cannot arrange clearance",
          "Export declaration filed late, blocking the container from loading",
        ],
      },
    ],
    faqs: [
      {
        q: "What documents are required for every export shipment?",
        a: "A commercial invoice, a packing list, a transport document and the export declaration required at origin, plus a written instruction to the carrier or forwarder where one is involved. Everything else — certificates, licences, permits, inspection and insurance documents — is conditional on the commodity, the destination and how payment is secured.",
      },
      {
        q: "Who prepares the packing list?",
        a: "The shipper or the party that physically packed the goods, because it describes what was actually packed rather than what was ordered. Where a third-party warehouse or contract packer does the work, they should produce or verify it — a packing list generated from a purchase order is a statement of intent, not of fact.",
      },
      {
        q: "Do I always need a certificate of origin?",
        a: "No. It is needed where the destination requires one, where a trade measure attaches to origin, where a letter of credit calls for it, or where the buyer needs it for a preferential duty claim. Many shipments need none. Obtaining certificates by default costs money and time without adding anything.",
      },
      {
        q: "What is the difference between shipping instructions and a shipper's letter of instruction?",
        a: "They perform the same function in different modes. Shipping instructions tell an ocean carrier or forwarder how to prepare the Bill of Lading, using ports, vessels, containers and VGM. A shipper's letter of instruction tells an air forwarder or cargo agent how to prepare the air waybill, using airports, flights, pieces and declared values. They are not interchangeable.",
      },
      {
        q: "Can I issue my own Bill of Lading or air waybill?",
        a: "No. Both are issued by the carrier or an authorised agent, because they evidence the carrier's receipt of goods and its contract of carriage — statements only the carrier can make. What you provide is the instruction, and what you should do is check the issued document against it before the cargo departs.",
      },
      {
        q: "When do I need an export licence?",
        a: "For controlled goods, dual-use items with potential military application, and shipments to sanctioned destinations or restricted parties. The check is on the goods, the destination and the end user together — a perfectly ordinary product can require a licence because of who is receiving it or what it will be used for. Screen before quoting, not before shipping.",
      },
      {
        q: "What is ISPM 15 and does it apply to my shipment?",
        a: "The international standard for treating solid wood packaging — crates, pallets, dunnage, bracing — to prevent pest spread. It applies wherever the destination enforces it, in every mode including air. The mark must be legible and permanent on at least two opposite sides. Manufactured products such as plywood and OSB fall outside its scope.",
      },
      {
        q: "How far in advance should documents be ready?",
        a: "Ahead of the documentation cut-off, which is earlier than the physical cargo cut-off — often by a day or more. Certificates with validity windows should be timed to be current at departure rather than at preparation. The practical rule is to finalise the invoice and packing list before the cargo is collected, because everything else derives from them.",
      },
      {
        q: "What happens if my documents disagree with each other?",
        a: "At best a customs query and a delay; at worst an examination, a credit discrepancy that puts payment at the buyer's discretion, or a shipment held while it is resolved. Differences between documents are the most common cause of clearance and payment problems, and they are almost entirely preventable by reconciling before dispatch.",
      },
      {
        q: "Does a documentary credit change what documents I need?",
        a: "Substantially. A credit specifies exactly which documents must be presented, in what form, with what wording, and by when — and banks examine them literally against those terms rather than against commercial reasonableness. Read the credit before preparing anything, because a document that satisfies customs perfectly can still be a discrepancy under a credit.",
      },
      {
        q: "Who is responsible if a document is wrong?",
        a: "It depends on the document. The exporter is responsible for the accuracy of what it declares on the invoice, the packing list and the export declaration. The carrier is responsible for the transport document it issues — but it issues it on the shipper's information, so an error traceable to the instruction is the shipper's. Keeping a copy of what you instructed is what settles that question later.",
      },
      {
        q: "Can I reuse last shipment's documents?",
        a: "Reuse the format, never the content. Copying a previous shipment's documents and editing them is how stale consignees, superseded purchase orders, old container numbers and previous vessel names reach live paperwork. Start from the current order and the current booking every time.",
      },
    ],
    related: [
      { href: "/templates", label: "Document template library", blurb: "Fillable versions of every document an exporter issues itself." },
      { href: "/tools/air-cargo-document-checklist", label: "Air cargo document checklist", blurb: "Build a scenario-specific list for an air shipment." },
      { href: "/guides/incoterms-2020-explained", label: "Incoterms 2020 explained", blurb: "Which party is responsible for which formalities under each rule." },
      { href: "/features/shipment-document-matching", label: "Document matching", blurb: "Reconcile the whole set automatically before dispatch." },
    ],
  },
];
