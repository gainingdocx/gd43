import type { DeepContentMap } from "@/content/deep/types";

export const TRADE_TOOL_DEEP: DeepContentMap = {
  "cbm-calculator": {
    updated: "2026-08-04",
    keywords: [
      "CBM calculator",
      "cubic meter calculator shipping",
      "how to calculate CBM",
      "CBM formula",
      "shipping volume calculator",
      "carton volume calculator",
      "CBM to kg",
    ],
    quickAnswer: {
      heading: "The CBM formula",
      body:
        "CBM is length × width × height in metres, multiplied by the number of packages. For centimetres, multiply the three dimensions and the quantity, then divide by 1,000,000. For inches, multiply by 0.000016387064. Calculate each carton size as its own group and add the results — averaging different carton sizes changes the answer.",
      bullets: [
        "Metres: L × W × H × qty",
        "Centimetres: (L × W × H × qty) ÷ 1,000,000",
        "Millimetres: (L × W × H × qty) ÷ 1,000,000,000",
        "Inches: L × W × H × qty × 0.000016387064",
      ],
    },
    sections: [
      {
        heading: "What CBM measures and what it does not",
        paragraphs: [
          "CBM — cubic metres — is the volume a shipment occupies. It is the single most reused number in freight: it drives LCL pricing, container selection, warehouse charging, air freight volumetric weight and the capacity conversation with every carrier you deal with. Getting it right once means getting a dozen downstream figures right.",
          "It is not weight, and it is not a guarantee of fit. A shipment of 28 CBM does not necessarily go into a 33 CBM container, and 1 CBM is not 1,000 kg for any purpose except the ocean weight-or-measure convention. Treating CBM as interchangeable with any of those is the source of most costly volume mistakes.",
        ],
        table: {
          caption: "Unit conversions to cubic metres",
          columns: ["Input unit", "Conversion", "Example", "Result"],
          rows: [
            ["Metres", "L × W × H", "1.2 × 0.8 × 1.0 m", "0.960 CBM"],
            ["Centimetres", "÷ 1,000,000", "120 × 80 × 100 cm", "0.960 CBM"],
            ["Millimetres", "÷ 1,000,000,000", "1200 × 800 × 1000 mm", "0.960 CBM"],
            ["Inches", "× 0.000016387064", "47.24 × 31.50 × 39.37 in", "0.960 CBM"],
            ["Feet", "× 0.028316846592", "3.94 × 2.62 × 3.28 ft", "0.960 CBM"],
          ],
          note: "The same box in five units. If your five answers differ, a unit conversion is wrong — this is the fastest way to catch one.",
        },
      },
      {
        heading: "Worked examples",
        paragraphs: [
          "Volume errors compound quietly, so it is worth walking through the three cases that cover almost every real shipment: a single carton size, several different sizes, and palletised cargo where the pallet itself has to be counted.",
        ],
        subsections: [
          {
            heading: "Single carton size",
            paragraphs: [
              "Fifty cartons measuring 60 × 40 × 40 cm. Each carton is 96,000 cm³, which is 0.096 CBM. Fifty cartons is 4.800 CBM. The arithmetic is one multiplication and one division, and the only way to get it wrong is to forget the quantity — which happens more often than it should.",
            ],
          },
          {
            heading: "Mixed carton sizes",
            paragraphs: [
              "Twenty cartons at 60 × 40 × 50 cm and ten cartons at 80 × 60 × 40 cm. The first group is 0.120 CBM each, so 2.400 CBM. The second is 0.192 CBM each, so 1.920 CBM. The shipment is 4.320 CBM.",
              "Do not average the dimensions. Averaging 60/40/50 and 80/60/40 to 70 × 50 × 45 and multiplying by thirty cartons gives 4.725 CBM — nearly ten percent high, entirely fictional, and impossible to reconcile against the packing list when the consolidator measures the cargo.",
            ],
          },
          {
            heading: "Palletised cargo",
            paragraphs: [
              "Cartons on a pallet are measured as the loaded pallet, not as the sum of the cartons. A EUR pallet footprint of 1.20 × 0.80 m loaded to 1.55 m including the 0.14 m pallet gives 1.488 CBM per pallet, regardless of how efficiently the cartons are stacked on it.",
              "This is why palletised LCL is routinely measured 10–20% larger than the carton total: the pallet adds height, the wrap adds width, and any overhang is measured to the outermost point. Quote from the loaded pallet dimension and there is nothing to argue about later.",
            ],
          },
        ],
        callout: {
          tone: "info",
          title: "Keep precision until the final total",
          body:
            "Round each row to two decimals and the errors accumulate in the same direction across twenty rows. Carry full precision through the calculation and round once at the end. The calculator does this for you, which is one reason its total can differ slightly from a spreadsheet built by hand.",
        },
      },
      {
        heading: "CBM against the other volume-derived numbers",
        paragraphs: [
          "Four different figures are all derived from the same physical volume, and they are not interchangeable. Confusing them produces quotations that are wrong by multiples, not percentages.",
        ],
        table: {
          caption: "What each volume-derived figure is used for",
          columns: ["Figure", "Derivation", "Used for", "1 CBM equals"],
          rows: [
            ["CBM", "L × W × H in metres", "Capacity planning, warehouse charging, LCL measurement", "1 CBM"],
            ["Revenue ton (W/M)", "Greater of CBM or metric tons", "Ocean LCL freight pricing", "1 RT if under 1,000 kg"],
            ["Volumetric weight, air cargo", "cm³ ÷ 6,000", "Air freight chargeable weight", "167 kg"],
            ["Volumetric weight, express", "cm³ ÷ 5,000", "Courier chargeable weight", "200 kg"],
            ["Volumetric weight, road groupage", "cm³ ÷ 3,000", "European LTL pricing", "333 kg"],
          ],
          note: "One cubic metre of the same cargo is billed as 167 kg by an airline, 200 kg by a courier, 333 kg by a European road groupage operator and 1,000 kg by an ocean carrier. The cargo has not changed.",
        },
      },
      {
        heading: "How much CBM fits in a container",
        paragraphs: [
          "The nominal capacity of a container and the volume you can actually load into it are different numbers, and quoting the first as if it were the second is how shipments end up needing a second container at spot rates.",
          "Plan on 80–85% of nominal capacity for floor-loaded cartons, and less again for palletised cargo where the pallet consumes height on every layer. The gap is real: door clearance, corrugated walls, dunnage, carton bulge and the crush rating of the cargo itself all take space that a volume calculation cannot see.",
        ],
        table: {
          caption: "Nominal against realistic loaded volume",
          columns: ["Equipment", "Nominal capacity", "Realistic floor-loaded", "Realistic palletised"],
          rows: [
            ["20ft general purpose", "≈ 33.2 CBM", "26–28 CBM", "22–25 CBM"],
            ["40ft general purpose", "≈ 67.7 CBM", "54–58 CBM", "46–52 CBM"],
            ["40ft high cube", "≈ 76.3 CBM", "61–65 CBM", "54–60 CBM"],
            ["45ft high cube", "≈ 86.0 CBM", "69–73 CBM", "61–68 CBM"],
          ],
          note: "Planning ranges, not guarantees. Dense cargo will hit the payload limit long before any of these volumes.",
        },
      },
      {
        heading: "Mistakes that distort a CBM total",
        bullets: [
          "Mixing units within one shipment — a row in inches among rows in centimetres is the single most common error and produces an answer wrong by a factor of thousands",
          "Omitting quantity, so the total reflects one carton of each size rather than the shipment",
          "Averaging unlike carton dimensions instead of calculating each group separately",
          "Using internal carton dimensions instead of external — the carrier measures the outside",
          "Ignoring the pallet, its height and any overhang on palletised cargo",
          "Rounding every row before summing, so the errors accumulate rather than cancel",
          "Assuming total CBM below container capacity means the cargo will physically fit",
          "Treating CBM as a weight, or carrying an air freight divisor into an ocean calculation",
          "Measuring a flat carton specification rather than the packed, bulged, banded article",
        ],
        callout: {
          tone: "warn",
          title: "Measure what the carrier will measure",
          body:
            "Consolidators and handling agents measure cargo as presented, to the outermost point — including pallet, wrap, banding, protruding handles and any bulge. Cartons packed tight measure more than their printed specification. Build that reality into the figure you quote rather than discovering it on the invoice.",
        },
      },
      {
        heading: "Using the calculator in a quotation or a document check",
        numbered: [
          "Add one row per carton size group, entering the external dimensions of the packed carton and the quantity in that group.",
          "Keep every row in the same unit, or convert deliberately — the calculator handles mm, cm, m and inches, but consistency within a shipment makes the result auditable.",
          "Enter the gross weight per carton so the total weight is calculated alongside the volume; you need both to choose equipment and to run any freight comparison.",
          "Check the density figure: total weight divided by total CBM tells you immediately whether the shipment is volume-controlled or weight-controlled.",
          "Export the CSV and attach it to the packing list, so the volume on the document has a visible derivation.",
        ],
      },
    ],
    faqs: [
      {
        q: "What is the CBM formula for shipping?",
        a: "CBM = length × width × height × quantity, with all dimensions in metres. From centimetres, multiply the three dimensions and the quantity then divide by 1,000,000. From millimetres, divide by 1,000,000,000. From inches, multiply the cubic inches by 0.000016387064. Calculate each carton size separately and add the group totals.",
      },
      {
        q: "How do I calculate CBM from centimetres?",
        a: "Multiply length, width and height in centimetres to get cubic centimetres, multiply by the number of cartons, then divide by 1,000,000. A carton of 60 × 40 × 40 cm is 96,000 cm³, or 0.096 CBM; fifty of them are 4.8 CBM. The division by a million is the step people drop when working quickly.",
      },
      {
        q: "How many kg is 1 CBM?",
        a: "It depends entirely on the pricing basis, not on physics. Ocean LCL treats 1 CBM as 1,000 kg under the weight-or-measure convention. General air cargo treats it as 167 kg at the 6,000 divisor. Express couriers treat it as 200 kg at the 5,000 divisor. European road groupage treats it as 333 kg. There is no universal conversion — always state which basis you mean.",
      },
      {
        q: "Should I use internal or external carton dimensions?",
        a: "External, always. The carrier, consolidator or handling agent measures the outside of the package as presented, including any bulge from tight packing, banding and protruding features. Internal dimensions describe what fits inside the box and are irrelevant to freight measurement.",
      },
      {
        q: "How do I calculate CBM for pallets?",
        a: "Measure the loaded pallet as a single unit: footprint length × footprint width × total height including the pallet itself. A 1.20 × 0.80 m EUR pallet loaded to 1.55 m overall is 1.488 CBM. Do not sum the cartons and ignore the pallet — you will understate the shipment by 10–20% and the consolidator's measurement will not match yours.",
      },
      {
        q: "Can I average carton sizes to save time?",
        a: "No. Averaging unlike dimensions changes the calculated volume, usually upward, and produces a figure that cannot be reconciled against the packing list. Twenty cartons at 60 × 40 × 50 and ten at 80 × 60 × 40 total 4.320 CBM; averaging the dimensions gives 4.725 CBM. Calculate each group and add.",
      },
      {
        q: "Does CBM tell me whether my cargo fits in a container?",
        a: "No — it tells you whether it might. Nominal container capacity assumes a perfect rectangular fill that no real load achieves. Plan on 80–85% of nominal for floor-loaded cartons and less for palletised cargo. Use a carton fit calculation for orientation and stacking, and confirm the payload limit separately, because dense cargo runs out of weight before it runs out of space.",
      },
      {
        q: "What is the difference between CBM and volumetric weight?",
        a: "CBM is a measurement of space. Volumetric weight is a billing figure derived from that space by dividing by a contractual divisor, so that light bulky cargo pays for the room it occupies. One CBM is always one CBM; its volumetric weight is 167 kg, 200 kg or 333 kg depending on whose tariff you are under.",
      },
      {
        q: "How precise should CBM be?",
        a: "Carry full precision through the calculation and round once at the end, conventionally to three decimal places. Rounding each row first pushes the error consistently in one direction across a long packing list. Where the figure will appear on a Bill of Lading or a customs document, match the precision the carrier or authority expects rather than adding decimals of your own.",
      },
      {
        q: "Why does the consolidator's CBM differ from mine?",
        a: "Because they measure the cargo as it arrives, not as it was specified. Pallets add height, shrink wrap adds width, overhang is measured to the outermost point, and tightly packed cartons bulge beyond their printed dimensions. A 10–20% difference on palletised cargo is normal. A larger gap is worth querying, and worth asking for the measurement record.",
      },
      {
        q: "Does CBM include the pallet?",
        a: "For freight measurement, yes. The pallet is part of the article presented for carriage, and the carrier measures the loaded unit including it. For a packing list describing what is inside the shipment, you may show the carton volume separately — but the freight figure is the loaded pallet.",
      },
      {
        q: "Can GainingDocx pull CBM out of my packing lists automatically?",
        a: "Yes. Extracting a packing list returns package rows with dimensions, net and gross weights and any printed CBM as structured fields, and the printed totals are recomputed and checked against the line detail. Where the document's own total disagrees with the sum of its lines, that is surfaced as a discrepancy rather than passed through.",
      },
    ],
    related: [
      { href: "/guides/how-to-calculate-cbm-for-shipping", label: "How to calculate CBM for shipping", blurb: "Formulas, unit conversions, worked examples and the errors that distort a total." },
      { href: "/tools/container-load-calculator", label: "Container load calculator", blurb: "Turn a CBM total into a realistic carton count for 20ft and 40ft equipment." },
      { href: "/tools/lcl-freight-calculator", label: "LCL freight W/M calculator", blurb: "Convert volume and weight into revenue tons and estimate ocean freight." },
      { href: "/packing-list-parser", label: "Packing list parser", blurb: "Extract dimensions, weights and CBM from packing lists and check the printed totals." },
    ],
  },

  "hs-code-finder": {
    updated: "2026-08-04",
    keywords: [
      "HS code finder",
      "HTS code lookup",
      "harmonized system code search",
      "tariff classification",
      "US HTS duty rate",
      "6 digit HS code",
      "commodity code search",
    ],
    quickAnswer: {
      heading: "How HS codes are structured",
      body:
        "The first six digits of a commodity code are the international Harmonized System heading and are the same in every country that applies the HS: two digits for the chapter, four for the heading, six for the subheading. Digits beyond the sixth are national. The United States uses eight digits for duty and ten for statistics; the European Union uses eight for the Combined Nomenclature and ten for TARIC.",
      bullets: [
        "Digits 1–2: chapter",
        "Digits 3–4: heading",
        "Digits 5–6: subheading — international",
        "Digits 7 onward: national subdivision",
      ],
    },
    sections: [
      {
        heading: "Reading a commodity code",
        paragraphs: [
          "The Harmonized System is maintained by the World Customs Organization and used by well over 200 countries and territories. Its six-digit structure is the closest thing international trade has to a universal product language, and it is why a Chinese exporter and a German importer can discuss the same commodity without ambiguity even when their full national codes differ.",
          "Everything after the sixth digit belongs to the country applying it. That is where duty rates, quotas, licences, anti-dumping measures and statistical reporting live, and it is why a code that is correct for export from one country may be incomplete for import into another.",
        ],
        table: {
          caption: "Decomposing US HTS 8471.30.0100",
          columns: ["Segment", "Digits", "Level", "Meaning"],
          rows: [
            ["84", "1–2", "Chapter", "Nuclear reactors, boilers, machinery and mechanical appliances"],
            ["8471", "1–4", "Heading", "Automatic data processing machines and units thereof"],
            ["8471.30", "1–6", "Subheading — international", "Portable ADP machines weighing not more than 10 kg"],
            ["8471.30.01", "1–8", "US tariff line", "The legal duty rate applies at this level"],
            ["8471.30.0100", "1–10", "US statistical suffix", "Reporting detail; no separate duty consequence"],
          ],
          note: "Only the first six digits transfer internationally. The 8- and 10-digit levels are specific to the United States.",
        },
      },
      {
        heading: "How many digits your destination needs",
        paragraphs: [
          "A supplier quoting a six-digit code has given you a starting point, not an import classification. Which length you need depends on where the goods are entering and what you are doing with the code.",
        ],
        table: {
          caption: "Code length by jurisdiction",
          columns: ["Jurisdiction", "System", "Digits", "Notes"],
          rows: [
            ["International", "Harmonized System (WCO)", "6", "Common to all HS contracting parties"],
            ["United States — import", "HTSUS", "10", "8 digits legal, 10 statistical"],
            ["United States — export", "Schedule B", "10", "Export codes differ from import HTS below 6 digits"],
            ["European Union", "CN / TARIC", "8 / 10", "CN 8 for export, TARIC 10 for import measures"],
            ["United Kingdom", "UK Global Tariff", "10", "Aligned to but separate from EU TARIC"],
            ["China", "China Customs", "13", "10 statutory plus additional regulatory digits"],
            ["India", "ITC (HS)", "8", "Aligned to HS at 6, national at 8"],
            ["Japan", "Japan Tariff", "9", "Statistical code extends to 9"],
          ],
        },
        callout: {
          tone: "info",
          title: "Import and export codes are not the same list",
          body:
            "In the United States, exports are classified under Schedule B and imports under the HTSUS. They share the six-digit HS root but diverge below it. Using an HTS number on an export filing, or a Schedule B number on an entry, is a classification error even though both codes describe the same goods.",
        },
      },
      {
        heading: "The General Rules of Interpretation",
        paragraphs: [
          "Classification is not a search problem, it is a legal one. Six General Rules of Interpretation, applied in order, determine where goods belong. Most disputes are resolved by GRI 1 and GRI 3, and understanding those two will resolve most of the questions that reach you.",
          "The rules are applied sequentially: you do not reach GRI 3 until GRI 1 and 2 have failed to settle the question. Working out of order is the most common way a plausible-looking classification turns out to be wrong.",
        ],
        table: {
          caption: "The six General Rules of Interpretation",
          columns: ["Rule", "Principle"],
          rows: [
            ["GRI 1", "Classification is determined by the terms of the headings and any relevant section or chapter notes. Titles of sections and chapters are for reference only."],
            ["GRI 2(a)", "An incomplete or unassembled article is classified as the finished article if it has its essential character as presented."],
            ["GRI 2(b)", "A reference to a material includes mixtures and combinations of that material; goods of more than one material are classified under GRI 3."],
            ["GRI 3(a)", "The heading with the most specific description prevails over a more general one."],
            ["GRI 3(b)", "Where 3(a) does not resolve it, classify by the material or component that gives the goods their essential character."],
            ["GRI 3(c)", "If neither applies, classify under the heading occurring last in numerical order among those equally meriting consideration."],
            ["GRI 4", "Goods that cannot be classified by the above go to the heading appropriate to the goods most akin to them."],
            ["GRI 5", "Cases, containers and packing materials presented with the goods are generally classified with them."],
            ["GRI 6", "Subheadings are compared only at the same level, applying the above rules and any subheading notes."],
          ],
        },
      },
      {
        heading: "Classifying a product step by step",
        numbered: [
          "Describe the article factually: what it is, what it is made of, what it does, how it is presented and who uses it. A vague description produces a vague classification.",
          "Search by the most distinctive term first — the material, the function or the trade name — and read the candidate headings in full rather than skimming the shortlist.",
          "Read the section and chapter notes for every candidate. Notes exclude goods as often as they include them, and an exclusion note settles a question faster than any amount of searching.",
          "Apply GRI 1 first: does a heading describe these goods by its own terms? If yes, you are largely done at four digits.",
          "Where the goods are composite, mixed or presented as a set, work through GRI 3(a), then 3(b), then 3(c) in that order.",
          "Compare subheadings only at the same level under GRI 6 to reach the six-digit international code.",
          "Extend to the national level required by the destination, and check for measures attached to that line — quotas, licences, anti-dumping duties, safeguard measures.",
          "Document the reasoning. A classification you cannot explain is one you cannot defend in an audit.",
        ],
        callout: {
          tone: "warn",
          title: "Search results are candidates, not decisions",
          body:
            "A keyword search ranks descriptions by textual similarity. It does not read chapter notes, apply the GRIs or know your product. Use it to find the neighbourhood, then classify properly. For high-value, high-volume or genuinely ambiguous goods, obtain a binding ruling from the customs authority in the destination — it is the only classification that binds them.",
        },
      },
      {
        heading: "Reading US duty rate columns",
        paragraphs: [
          "The US Harmonized Tariff Schedule presents rates in columns, and reading the wrong one is a common and expensive mistake. The applicable column depends on the country of origin of the goods, not the country they were shipped from.",
        ],
        table: {
          caption: "HTSUS rate columns",
          columns: ["Column", "Applies to", "Notes"],
          rows: [
            ["Column 1 — General", "Most trading partners with normal trade relations", "The default rate for goods without a preference claim"],
            ["Column 1 — Special", "Goods qualifying under a trade agreement or preference programme", "Shown with letter codes identifying each programme; requires a valid origin claim"],
            ["Column 2", "A small number of countries without normal trade relations", "Statutory rates, generally much higher"],
          ],
          note: "Additional duties — antidumping, countervailing, safeguard and other trade measures — sit outside these columns and can exceed the tariff rate itself. Always check for them separately against the specific classification and origin.",
        },
      },
      {
        heading: "What misclassification actually costs",
        paragraphs: [
          "Classification errors rarely surface immediately. They surface at audit, when the same wrong code has been used on several hundred entries, and the exposure is retrospective.",
        ],
        bullets: [
          "Underpaid duty recovered across the full audit period, with interest",
          "Penalties assessed on the basis of negligence or lack of reasonable care",
          "Overpaid duty that is difficult or time-barred to reclaim — errors run in both directions",
          "Preference claims invalidated because the origin rule keyed to the wrong classification",
          "Shipments held pending reclassification, with demurrage and storage accruing",
          "Missed licensing or permit requirements attached to the correct code",
          "Anti-dumping or countervailing duty exposure discovered after the goods are sold",
          "Loss of trusted-trader or authorised operator status where error rates breach thresholds",
        ],
      },
    ],
    faqs: [
      {
        q: "What is an HS code?",
        a: "A Harmonized System code is the international standard for classifying traded goods, maintained by the World Customs Organization. The first six digits — chapter, heading and subheading — are common to every country that applies the HS. Countries add further digits for their own duty rates, statistics and regulatory measures.",
      },
      {
        q: "What is the difference between HS, HTS and Schedule B codes?",
        a: "HS is the six-digit international root. HTS is the United States import tariff schedule, extending the HS to eight legal and ten statistical digits. Schedule B is the United States export classification, which also extends the HS but diverges from HTS below six digits. All three describe the same goods; they are not interchangeable on filings.",
      },
      {
        q: "How many digits does an HS code have?",
        a: "Six internationally. National systems extend it: the United States uses ten for imports, the European Union eight for the Combined Nomenclature and ten for TARIC, India eight, Japan nine, and China thirteen. A supplier quoting six digits has given you a starting point, not an import classification.",
      },
      {
        q: "Can I use my supplier's HS code?",
        a: "As a starting point only, and never below six digits. The supplier classified for export from their country under their rules; you are importing under yours, and the importer of record — not the supplier — carries the legal responsibility for the classification declared on the entry. Verify the six-digit root, then extend it under the destination's own schedule.",
      },
      {
        q: "How do I find the right HS code for my product?",
        a: "Describe the article factually, search for the most distinctive term, then read the candidate headings and their section and chapter notes in full. Apply the General Rules of Interpretation in order, starting with GRI 1. For composite goods or sets, work through GRI 3(a), 3(b) and 3(c) in sequence. Document your reasoning, and obtain a binding ruling for anything high-value or genuinely ambiguous.",
      },
      {
        q: "What are the General Rules of Interpretation?",
        a: "Six legally binding rules that determine classification, applied in order. GRI 1 says the terms of the headings and the section and chapter notes govern. GRI 2 covers incomplete and unassembled articles and mixtures. GRI 3 resolves goods classifiable under two or more headings, by specificity, then essential character, then last in numerical order. GRI 4 covers goods most akin. GRI 5 covers packaging. GRI 6 applies the same logic at subheading level.",
      },
      {
        q: "Is a search result a binding classification?",
        a: "No. A keyword search ranks tariff descriptions by textual similarity; it does not read chapter notes, apply the GRIs or know your product. Only the customs authority of the importing country can issue a binding ruling, and only that ruling protects you in an audit. Treat every search result as a candidate to be verified.",
      },
      {
        q: "How often do HS codes change?",
        a: "The World Customs Organization revises the Harmonized System periodically — historically about every five years — and national schedules change more frequently as duty rates, quotas and trade measures are amended. Classifications should be reviewed rather than inherited indefinitely, particularly for product lines that have been in your master data for several years.",
      },
      {
        q: "What do the duty rate columns mean?",
        a: "In the US schedule, Column 1 General is the default rate for normal trade relations partners; Column 1 Special shows preferential rates available under specific trade agreements and programmes, each identified by a letter code and each requiring a valid origin claim; Column 2 contains statutory rates applying to a small number of countries. Which column applies depends on the origin of the goods, not where they shipped from.",
      },
      {
        q: "Does the HS code determine duty on its own?",
        a: "No. Duty depends on the classification, the country of origin, the customs value, any preference claim, and any additional measures attached to that line — antidumping, countervailing, safeguard or other trade actions, which frequently exceed the base tariff. The code is the key that unlocks all of those, but it is not the whole answer.",
      },
      {
        q: "What happens if I use the wrong HS code?",
        a: "The exposure is retrospective and compounds. Underpaid duty is recovered across the audit period with interest, penalties may be assessed for lack of reasonable care, preference claims keyed to the wrong classification are invalidated, and licensing requirements attached to the correct code may have been missed. Overpayments run the other way and are often harder to reclaim than underpayments are to assess.",
      },
      {
        q: "Can GainingDocx classify goods from my invoices?",
        a: "The workspace extracts any HS or HTS code printed on a commercial invoice as a structured field and checks it for structural plausibility, so a truncated or malformed code is caught during review. It surfaces and validates what the document states; it does not issue classifications, and it is not a substitute for a customs broker or a binding ruling.",
      },
    ],
    related: [
      { href: "/commercial-invoice-parser", label: "Commercial invoice parser", blurb: "Extract HS codes, origins, values and line items from invoices for customs review." },
      { href: "/guides/commercial-invoice-vs-packing-list", label: "Commercial invoice vs packing list", blurb: "Which document customs uses for value and classification, and which for examination." },
      { href: "/templates/commercial-invoice-template", label: "Commercial invoice template", blurb: "Build an export invoice with HS codes, origin and Incoterms in the right places." },
      { href: "/templates/certificate-of-origin-template", label: "Certificate of origin worksheet", blurb: "Prepare the origin evidence that a preferential duty claim depends on." },
    ],
  },

  "shipping-mark-generator": {
    updated: "2026-08-04",
    keywords: [
      "shipping mark generator",
      "carton marking export",
      "shipping marks and numbers",
      "export case marking",
      "handling symbols ISO 780",
      "side mark main mark",
      "printable shipping label",
    ],
    quickAnswer: {
      heading: "What a shipping mark contains",
      body:
        "A shipping mark identifies a package without opening it. The main mark carries the consignee reference, destination, purchase order and case number out of a case range; the side mark carries dimensions, net and gross weight, and country of origin. Handling symbols and any hazard or treatment marks complete the set. Every element must agree with the packing list and the transport document.",
      bullets: [
        "Main mark: who, where, which case",
        "Side mark: dimensions, weights, origin",
        "Handling symbols per ISO 780",
        "ISPM 15 mark on solid wood packaging",
      ],
    },
    sections: [
      {
        heading: "Why shipping marks still matter",
        paragraphs: [
          "A shipping mark is the only information available about a package when it is sitting in a CFS at three in the morning, stacked among forty other people's cargo, with its paperwork somewhere else entirely. It is what lets a handler route a package, a customs officer select it for examination, and a consignee's warehouse receive it against a purchase order without opening anything.",
          "Marks also carry legal weight. Where a letter of credit specifies marks, a discrepancy between the marks on the cargo and the marks described in the documents is a documentary discrepancy, and it can delay or defeat payment. Where a buyer's purchase terms specify marking, non-conforming marks are a breach even if the goods themselves are perfect.",
        ],
      },
      {
        heading: "Main mark and side mark",
        paragraphs: [
          "Conventionally the identifying information goes on one face — the main mark — and the descriptive information on an adjacent face, the side mark. Applying both means a package can be identified whichever way it is stacked, which is the entire point.",
        ],
        table: {
          caption: "What belongs on each face",
          columns: ["Element", "Face", "Purpose"],
          rows: [
            ["Consignee name or buyer code", "Main", "Identifies who the package belongs to"],
            ["Destination port or city", "Main", "Routes the package at transhipment and delivery"],
            ["Purchase order or contract number", "Main", "Links the package to the commercial transaction"],
            ["Case number and total, e.g. C/NO. 7/40", "Main", "Identifies this package within the consignment"],
            ["Net weight", "Side", "Weight of the goods without packaging"],
            ["Gross weight", "Side", "Total weight as presented for carriage"],
            ["Measurement, L × W × H", "Side", "Supports volume verification and stow planning"],
            ["Country of origin", "Side", "Required by many destinations on the package itself"],
            ["Handling symbols", "Either, near an edge", "Instructs handlers without relying on language"],
          ],
        },
        callout: {
          tone: "info",
          title: "The case number is the field that does the work",
          body:
            "'C/NO. 7/40' says this is the seventh of forty packages. It is what makes a short-shipment provable, an examination traceable and a partial delivery reconcilable. A consignment marked without case numbers cannot be checked against its own packing list, which is why buyers and letters of credit so often insist on them.",
        },
      },
      {
        heading: "Handling symbols",
        paragraphs: [
          "Graphical handling symbols are standardised under ISO 780 precisely so that they work regardless of the handler's language. Use the standard symbols rather than inventing text instructions, and use only the ones that genuinely apply — a package covered in symbols communicates nothing.",
        ],
        bullets: [
          "Fragile, handle with care — for goods vulnerable to shock",
          "This way up — with the arrows pointing to the upright position, applied to at least two adjacent vertical faces",
          "Keep dry — for goods that must be protected from rain and moisture",
          "Keep away from heat, or protect from sunlight",
          "Temperature limits — with the actual range stated",
          "Centre of gravity — for heavy or unevenly loaded packages",
          "Sling here — indicating where lifting straps must be positioned",
          "Do not use hand hooks",
          "Stacking limit by number or by mass — a genuinely important one that is routinely omitted",
          "Do not stack",
        ],
      },
      {
        heading: "Marks that are regulatory rather than optional",
        subsections: [
          {
            heading: "ISPM 15 for wood packaging",
            paragraphs: [
              "Solid wood packaging material — crates, pallets, dunnage, bracing — must be treated and marked where the destination applies ISPM 15. The mark carries the IPPC symbol, the ISO country code, a unique producer code assigned by the national plant protection organisation, and the treatment code: HT for heat treatment, MB for methyl bromide, DH for dielectric heating.",
              "It must be legible, permanent and applied to at least two opposite sides of the packaging. Untreated or unmarked wood arriving at an enforcing destination is liable to be refused entry, re-exported, treated at the importer's cost or destroyed — and the cargo inside usually goes with it. Manufactured wood products such as plywood and OSB are outside the scope, which is why they are a common substitute for exporters shipping frequently.",
            ],
          },
          {
            heading: "Country of origin marking",
            paragraphs: [
              "Many destinations require imported goods, and often their packaging, to be marked conspicuously and permanently with the country of origin in English or the local language. The requirement attaches to the goods themselves as much as the carton, and the phrasing is prescribed in some jurisdictions.",
              "This is separate from the origin declared on the commercial invoice or evidenced by a certificate of origin, and satisfying one does not satisfy the others.",
            ],
          },
          {
            heading: "Dangerous goods marks and labels",
            paragraphs: [
              "Hazardous cargo carries its own mandatory marking: the proper shipping name, UN number, hazard class labels, orientation arrows where required, marine pollutant or environmentally hazardous substance marks, and limited or excepted quantity marks where those provisions apply.",
              "These are prescribed by the applicable regulations — IMDG for sea, the IATA Dangerous Goods Regulations for air, ADR and equivalents for road — and none of them are discretionary. A shipping mark generator produces identifying and handling information; it does not produce compliant dangerous goods marking, which must follow the regulation text exactly.",
            ],
          },
        ],
        callout: {
          tone: "warn",
          title: "Check the letter of credit before printing",
          body:
            "Where payment runs through a documentary credit, the credit may specify the exact marks, their wording and where they appear. Marks that differ from the credit's requirement — even by an abbreviation — create a documentary discrepancy that can hold payment. Read the credit terms before the cartons are marked, not after they are sealed.",
        },
      },
      {
        heading: "Practical marking that survives the journey",
        paragraphs: [
          "A mark that is unreadable on arrival has failed regardless of how correct its content was. Cargo is stacked, rubbed, rained on and handled repeatedly, and the marks take the worst of it.",
        ],
        bullets: [
          "Use high contrast — black on a light surface, and avoid printing over printed carton graphics",
          "Apply to at least two adjacent faces so the package is identifiable however it is stacked",
          "Keep type large enough to read at a distance, and use a sans-serif face without decorative styling",
          "Use waterproof, fade-resistant ink or a laminated label; thermal receipt printing fades badly in heat and humidity",
          "Never place marks on a seam, a flap join or a taped edge where they will split",
          "Remove or obliterate marks from previous shipments — a carton with two contradictory destinations will be misrouted",
          "Keep the numbering sequence unbroken across the consignment, and match it exactly to the packing list",
          "Avoid printing the commodity description on the outside of high-value cargo, which advertises the contents to the wrong audience",
        ],
      },
      {
        heading: "Keeping marks consistent with the documents",
        numbered: [
          "Fix the case numbering before printing anything, and use the same sequence on the packing list, the marks and any case-level detail on the invoice.",
          "Take the consignee and destination wording from the transport document or the buyer's instruction, not from an old shipment file.",
          "Confirm net and gross weights against the weighed figures rather than the estimated ones, because the marks will be checked against the packing list at examination.",
          "State measurements in the same unit as the packing list, and to the same precision.",
          "Print a proof of one mark and hold it against the packing list line for that case before running the full set.",
          "Keep a copy of the marks with the shipment file so a later dispute about what was on the cartons can be settled from the record.",
        ],
      },
    ],
    faqs: [
      {
        q: "What are shipping marks?",
        a: "The identifying and descriptive information printed or stencilled on the outside of a package so it can be handled, routed, examined and received without being opened. Conventionally split into a main mark carrying consignee, destination, order reference and case number, and a side mark carrying weights, measurements and country of origin, with standardised handling symbols alongside.",
      },
      {
        q: "What is the difference between a main mark and a side mark?",
        a: "The main mark identifies the package — who it belongs to, where it is going, which order it relates to and which case it is out of the total. The side mark describes it — net and gross weight, dimensions and origin. Applying both to adjacent faces means the package can be identified whichever way it is stacked in a container or a warehouse.",
      },
      {
        q: "Are shipping marks legally required?",
        a: "Some elements are. Country of origin marking is mandatory in many destinations, ISPM 15 marking is mandatory on solid wood packaging where the destination enforces the standard, and dangerous goods marking is mandatory under the applicable transport regulations. The identifying marks themselves are usually driven by the buyer's terms or a letter of credit rather than by law — but a discrepancy against those terms has commercial consequences of its own.",
      },
      {
        q: "What does C/NO. 7/40 mean?",
        a: "Case number 7 of 40 — this is the seventh package in a consignment of forty. It is the field that makes a consignment auditable: it allows a short-shipment to be proved, an examined package to be traced back to its packing list line, and a partial delivery to be reconciled. Buyers and letters of credit commonly require it for exactly that reason.",
      },
      {
        q: "What is the ISPM 15 mark?",
        a: "The mark applied to treated solid wood packaging, carrying the IPPC symbol, the ISO country code, a producer code assigned by the national plant protection organisation, and a treatment code — HT for heat treatment, MB for methyl bromide, DH for dielectric heating. It must be legible, permanent and applied to at least two opposite sides. Manufactured products such as plywood are outside the scope.",
      },
      {
        q: "What happens if wooden packaging is not ISPM 15 marked?",
        a: "At a destination that enforces the standard, the consignment is liable to be refused entry, re-exported at the shipper's cost, treated on arrival, or destroyed — and the cargo inside frequently shares the fate of the packaging. It is one of the few marking failures that can result in the total loss of a shipment, which is why exporters who ship regularly often move to plywood or plastic packaging to avoid the question entirely.",
      },
      {
        q: "Should I put the commodity description on the carton?",
        a: "Usually not on high-value goods. Marking the outside with 'laptop computers' or a recognisable brand advertises the contents to anyone in the supply chain, and theft of clearly marked cartons is a real and well-documented loss pattern. Where a description is required by the buyer or a credit, use a neutral generic term unless the specific wording is mandated.",
      },
      {
        q: "What handling symbols should I use?",
        a: "Only the ones that genuinely apply, taken from ISO 780: fragile, this way up, keep dry, protect from heat, temperature limits, centre of gravity, sling here, do not use hand hooks, stacking limit and do not stack. A carton covered in symbols communicates nothing. The stacking limit is the one most often omitted and most often needed.",
      },
      {
        q: "Do shipping marks have to match the packing list?",
        a: "Yes, exactly. The packing list is what the marks are checked against — at examination, at receiving and in any claim. Case numbers, weights and measurements that disagree between the cartons and the document turn a routine receipt into a query, and under a documentary credit a mismatch is a discrepancy that can hold payment.",
      },
      {
        q: "What size should shipping marks be?",
        a: "Large enough to read across a warehouse aisle and durable enough to survive the journey. There is no universal dimension because it depends on carton size, but the practical test is whether the mark is legible from three or four metres after the carton has been handled. Use high contrast, a plain sans-serif face, waterproof ink, and never place marks across a seam or a taped edge.",
      },
      {
        q: "Can I reuse cartons with old marks on them?",
        a: "Only if the old marks are completely removed or obliterated. A carton carrying two destinations will be misrouted, and a carton carrying an old case number will not reconcile against the current packing list. Painting over is usually insufficient — old stencilling frequently shows through, and a partially visible previous destination is worse than none.",
      },
      {
        q: "Does the generator produce dangerous goods labels?",
        a: "No. It produces identifying and handling marks. Dangerous goods marking and labelling — proper shipping name, UN number, hazard class labels, orientation arrows, marine pollutant marks — is prescribed by the applicable regulations for the transport mode, and must follow the regulation text exactly. Use the compliant labelling required by IMDG, the IATA Dangerous Goods Regulations or the relevant road regulation.",
      },
    ],
    related: [
      { href: "/templates/packing-list-template", label: "Export packing list template", blurb: "Build the case-level packing list your marks have to reconcile against." },
      { href: "/templates/container-packing-list-template", label: "Container packing list template", blurb: "Allocate marked cases to container and seal numbers with running totals." },
      { href: "/tools/cbm-calculator", label: "CBM calculator", blurb: "Produce the measurements that go on the side mark." },
      { href: "/packing-list-parser", label: "Packing list parser", blurb: "Extract marks, case numbers, weights and dimensions from an existing packing list." },
    ],
  },
};
