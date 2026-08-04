import type { GuideDefinition } from "@/content/guides";

export const AIR_FINANCE_GUIDES: GuideDefinition[] = [
  {
    slug: "air-waybill-vs-bill-of-lading",
    title: "Air Waybill vs Bill of Lading: Title, Liability and Release",
    seoTitle: "Air Waybill vs Bill of Lading: Key Differences Explained",
    description:
      "Why an air waybill is never a document of title, how liability regimes differ between air and sea, and what that means for payment security, release and claims.",
    readMinutes: 11,
    updated: "2026-08-04",
    keywords: [
      "air waybill vs bill of lading",
      "AWB vs BL difference",
      "is an air waybill negotiable",
      "montreal convention liability",
      "document of title shipping",
      "air freight payment security",
      "MAWB HAWB explained",
    ],
    tool: {
      href: "/templates/air-waybill-template",
      label: "Prepare air waybill data",
      title: "Get the AWB particulars right before tender",
      description:
        "Assemble parties, routing, pieces, weights, declared values and handling instructions in one worksheet so the issued air waybill can be checked against what you actually instructed.",
    },
    sections: [
      {
        heading: "The single difference that drives everything else",
        paragraphs: [
          "A negotiable Bill of Lading is a document of title. Whoever lawfully holds the properly endorsed original can claim the cargo, and the document can be transferred while the goods are afloat. An air waybill is never a document of title. It cannot be endorsed, it cannot be transferred, and cargo is delivered to the named consignee on identification.",
          "Every other practical difference follows from this. Payment cannot be secured through an air waybill the way it can through a Bill of Lading. Goods cannot be sold in transit by transferring the air document. There is no set of originals to courier, no telex release to arrange, and no letter of indemnity if one goes missing — because none of those mechanisms exist when there is nothing to surrender.",
          "The reason is practical rather than legal doctrine. Air transit is measured in hours. A system requiring an original document to travel separately and arrive first would break on every shipment.",
        ],
        table: {
          caption: "Air waybill and Bill of Lading compared",
          columns: ["Aspect", "Air waybill", "Negotiable Bill of Lading"],
          rows: [
            ["Document of title", "No", "Yes"],
            ["Transferable by endorsement", "No", "Yes"],
            ["Release mechanism", "Named consignee identifies itself", "Surrender of an endorsed original"],
            ["Originals issued", "Three, but none is a title document", "Usually three, each representing the cargo"],
            ["Secures payment", "No", "Yes"],
            ["Goods saleable in transit", "No, not via the document", "Yes"],
            ["Governing convention", "Montreal Convention (or Warsaw where applicable)", "Hague, Hague-Visby, Hamburg or Rotterdam Rules depending on the contract and jurisdiction"],
            ["Typical transit", "Hours to days", "Days to weeks"],
            ["Rating shown on the document", "Yes — rate class, chargeable weight, charges", "Usually only freight terms, prepaid or collect"],
          ],
        },
      },
      {
        heading: "The three originals that are not title documents",
        paragraphs: [
          "An air waybill is issued in a set of three originals, which causes confusion because the same word means something quite different than it does on a Bill of Lading. Original 1 is for the issuing carrier, original 2 travels with the cargo for the consignee, and original 3 is returned to the shipper as evidence that the carrier accepted the goods.",
          "None of them controls delivery. Losing all three would be inconvenient and would not prevent the consignee collecting its cargo. This is precisely the opposite of the Bill of Lading position, where losing one original triggers an indemnity process costing a multiple of the cargo value.",
        ],
      },
      {
        heading: "Master and house documents in both modes",
        paragraphs: [
          "Both modes have a master and house structure, and the logic is the same: a forwarder consolidates several shippers' cargo, receives one document from the carrier, and issues its own documents to its customers.",
          "In air, a master air waybill covers the consolidation and house air waybills cover the underlying shipments. MAWB numbers follow the eleven-digit IATA structure with a modulus-7 check digit; house references are forwarder-assigned and follow no standard, which means you cannot tell them apart by format.",
          "In ocean, a master Bill of Lading is issued by the carrier to the NVOCC and house Bills of Lading by the NVOCC to its customers. The critical difference is that a house Bill of Lading can be negotiable and can function as a document of title against the NVOCC — whereas a house air waybill cannot be a title document because no air waybill is.",
        ],
      },
      {
        heading: "Liability, and why it matters more in air",
        paragraphs: [
          "Carrier liability for cargo is capped by convention in both modes, and in both modes the cap is calculated by weight. That works reasonably for dense cargo and badly for the light, high-value goods that dominate air freight.",
          "Under the Montreal Convention, cargo liability is limited to a figure in Special Drawing Rights per kilogram, subject to periodic revision. Under the Hague-Visby Rules, the limit is per package or per kilogram, whichever is higher. In both cases, a shipment of electronics weighing 40 kg and worth a hundred thousand is covered for a fraction of its value.",
          "The mechanism for raising the ceiling is the declared value for carriage, which attracts a valuation charge. Where nothing is declared, 'NVD' — no value declared — is entered and the convention limit applies. The practical answer for most shippers is not to rely on carrier liability at all but to arrange cargo insurance, and to treat the declared value box as a deliberate decision rather than a default.",
        ],
        bullets: [
          "Convention limits are weight-based and are frequently far below cargo value",
          "Declared value for carriage raises the ceiling and attracts a valuation charge",
          "NVD means the convention limit applies — it is a choice, not an omission",
          "Declared value for customs is a separate box serving a different purpose",
          "Cargo insurance is the practical protection in both modes",
          "Claim time limits are short and differ between the conventions — check them before you need them",
        ],
      },
      {
        heading: "What this means for payment terms",
        paragraphs: [
          "A seller shipping by sea on unsecured terms can consign a negotiable Bill of Lading to order and withhold the originals until payment. That is a genuine security interest in the goods. A seller shipping by air has no equivalent.",
          "The workarounds are all commercial rather than documentary. Consign the air waybill to a bank rather than the buyer, so the bank controls release under a documentary credit. Require payment before departure. Use a documentary collection where the bank holds the delivery instruction. Or accept the credit risk and price for it.",
          "What does not work is consigning the air waybill to the seller's own agent at destination and hoping — that creates an operational bottleneck without a legal one, and it delays a shipment whose entire value proposition was speed.",
        ],
      },
      {
        heading: "Practical checks that differ by mode",
        bullets: [
          "Air: validate the master air waybill number with the modulus-7 check digit; house references cannot be validated this way",
          "Ocean: validate every container number with the ISO 6346 modulo-11 calculation",
          "Air: check gross weight against chargeable weight and confirm chargeable is reconcilable from dimensions",
          "Ocean: check container gross weights sum to the printed total and reconcile against VGM",
          "Air: confirm the declared value for carriage is what you instructed, not a defaulted NVD",
          "Ocean: confirm consignee wording, number of originals and release method are what you instructed",
          "Air: confirm handling and dangerous goods annotations reached the handling information box",
          "Ocean: confirm the shipped-on-board date and any carrier clause added to the document",
        ],
      },
    ],
    faqs: [
      {
        q: "Is an air waybill negotiable?",
        a: "No. An air waybill is never a document of title. It cannot be endorsed or transferred, and cargo is delivered to the named consignee on identification rather than against surrender of a document. This is the fundamental difference from a negotiable Bill of Lading and it drives every other practical distinction.",
      },
      {
        q: "Why does an air waybill have three originals if none is a title document?",
        a: "They serve record and evidence purposes rather than control. Original 1 is for the issuing carrier, original 2 travels with the cargo for the consignee, and original 3 is returned to the shipper as evidence the carrier accepted the goods. Losing all three would be inconvenient but would not prevent the consignee collecting the cargo.",
      },
      {
        q: "How can I secure payment on an air shipment?",
        a: "Not through the transport document. The options are commercial: consign the air waybill to a bank under a documentary credit so the bank controls release, require payment before departure, use a documentary collection, or accept and price the credit risk. Consigning to your own destination agent creates delay without legal security.",
      },
      {
        q: "What is the carrier's liability for air cargo?",
        a: "Under the Montreal Convention it is capped at a figure in Special Drawing Rights per kilogram, subject to periodic revision. Because the cap is weight-based, light high-value cargo is covered for a small fraction of its worth. Declaring a value for carriage raises the ceiling and attracts a valuation charge; cargo insurance is the practical answer for most shippers.",
      },
      {
        q: "What does NVD mean on an air waybill?",
        a: "No Value Declared — the shipper has not declared a value for carriage, so the carrier's liability is limited by the applicable convention. It is a deliberate choice with real consequences, not an empty field, and on a light high-value shipment it can leave you severely under-covered. Decide it consciously and rely on cargo insurance either way.",
      },
      {
        q: "Can I use a telex release for an air shipment?",
        a: "No, and it is unnecessary. Telex release exists to solve the problem of a negotiable Bill of Lading needing to be physically surrendered at destination. An air waybill is not surrendered at all — the consignee identifies itself — so there is nothing for a telex release to work around.",
      },
      {
        q: "What is the difference between a MAWB and a HAWB?",
        a: "The master air waybill is the contract between the airline and the party tendering the consolidated consignment, usually a forwarder. The house air waybill is the contract between that forwarder and an individual shipper. Customs entry at destination is generally filed at house level, so the house document must be complete in its own right.",
      },
      {
        q: "Can a house Bill of Lading be a document of title?",
        a: "Yes, if it is issued in negotiable form — which is a real difference from air, where no document can be. A house Bill of Lading issued by an NVOCC and consigned to order functions as a title document against that NVOCC. Its practical strength depends on the NVOCC's standing, which is worth considering separately.",
      },
      {
        q: "Which document shows the freight charges?",
        a: "The air waybill shows the rating on its face — rate class, chargeable weight, rate, weight charge, valuation charge and other charges due to carrier and agent. A Bill of Lading usually shows only whether freight is prepaid or collect. This makes the air waybill the primary evidence in an air freight billing dispute.",
      },
      {
        q: "Do the same Incoterms apply to air and sea?",
        a: "The seven any-mode rules apply to both. The four maritime rules — FAS, FOB, CFR and CIF — are for sea and inland waterway only and should never be used for air. FCA, CPT, CIP, DAP, DPU and DDP are the appropriate choices for air shipments.",
      },
      {
        q: "How quickly must a cargo claim be filed?",
        a: "Short and mode-specific. The conventions set notice periods for damage and delay that are measured in days from receipt, with longer periods for total loss and a separate overall limitation period. Check the applicable convention and the carrier's terms at the point of loss, not afterwards — a late notice can defeat an otherwise good claim.",
      },
      {
        q: "Can an air waybill be amended after issue?",
        a: "Minor corrections are possible through the issuing carrier or agent before departure, and become progressively harder once the cargo has moved and the manifest has been filed. Changes to the consignee, routing or declared values may require the document to be cancelled and reissued. Check it against your instruction before departure.",
      },
    ],
    related: [
      { href: "/guides/how-to-read-a-bill-of-lading", label: "How to read a Bill of Lading", blurb: "The ocean counterpart, field by field." },
      { href: "/air-waybill-parser", label: "Air waybill parser", blurb: "Extract and validate MAWB and HAWB documents." },
      { href: "/tools/air-waybill-number-check", label: "Air waybill number checker", blurb: "Validate the modulus-7 check digit on a MAWB number." },
      { href: "/guides/telex-release-vs-original-bill-of-lading", label: "Telex release vs originals", blurb: "How ocean release methods work, and why air has none." },
    ],
    sources: [
      { name: "ICAO — Montreal Convention 1999", url: "https://www.icao.int/secretariat/legal/Pages/TreatyCollection.aspx", note: "The convention governing international carriage by air, including cargo liability limits." },
    ],
  },

  {
    slug: "dangerous-goods-air-freight-guide",
    title: "Dangerous Goods by Air: Classes, Documents and Acceptance",
    seoTitle: "Dangerous Goods Air Freight: Classes, DGD & Acceptance Guide",
    description:
      "The nine hazard classes, what a shipper's declaration must contain, lithium battery provisions, why consignments are refused at acceptance, and where trained personnel are legally required.",
    readMinutes: 14,
    updated: "2026-08-04",
    keywords: [
      "dangerous goods air freight",
      "IATA DGR",
      "shipper's declaration dangerous goods",
      "hazard classes air cargo",
      "lithium battery shipping air",
      "cargo aircraft only",
      "DG acceptance checklist",
    ],
    tool: {
      href: "/tools/air-cargo-document-checklist",
      label: "Build a DG document checklist",
      title: "Work out what your shipment needs",
      description:
        "Choose your role and cargo scenario to see the core and conditional paperwork for a dangerous goods air shipment, and where each document comes from.",
    },
    sections: [
      {
        heading: "Who this guide is for, and what it is not",
        paragraphs: [
          "Air transport of dangerous goods is governed by the ICAO Technical Instructions, implemented commercially through the IATA Dangerous Goods Regulations. Classification, packing, marking, labelling, quantity limits, documentation and acceptance are all regulated, and the regulations are revised annually.",
          "This guide is orientation for people who work around dangerous goods shipments — export coordinators, forwarder operations, customer service — so they understand what is being asked for and why consignments get refused. It is not training, and it is not a substitute for the current regulations.",
          "Anyone who classifies, packs, marks, labels, documents or accepts dangerous goods must hold current training. That is a legal requirement, not best practice, and a declaration signed by an untrained person is invalid regardless of how accurate its content is.",
        ],
      },
      {
        heading: "The nine hazard classes",
        table: {
          caption: "Classification of dangerous goods",
          columns: ["Class", "Hazard", "Common air cargo examples"],
          rows: [
            ["1", "Explosives", "Fireworks, ammunition, airbag inflators, detonators"],
            ["2", "Gases — flammable, non-flammable and toxic", "Aerosols, compressed oxygen, refrigerant gases, lighters"],
            ["3", "Flammable liquids", "Paints, solvents, adhesives, perfumes, alcohol-based products"],
            ["4", "Flammable solids, spontaneously combustible, dangerous when wet", "Matches, sulphur, sodium, some metal powders"],
            ["5", "Oxidising substances and organic peroxides", "Hydrogen peroxide, pool chemicals, some fertilisers"],
            ["6", "Toxic and infectious substances", "Pesticides, diagnostic specimens, biological samples"],
            ["7", "Radioactive material", "Medical isotopes, industrial gauges"],
            ["8", "Corrosives", "Acids, alkalis, wet cell batteries, some cleaning products"],
            ["9", "Miscellaneous dangerous goods", "Lithium batteries, dry ice, magnetised material, environmentally hazardous substances"],
          ],
          note: "Many everyday commercial products are dangerous goods. Perfume, nail polish, aerosols, paint, hand sanitiser, e-cigarettes and anything containing a lithium battery all fall within the regulations.",
        },
      },
      {
        heading: "Lithium batteries",
        paragraphs: [
          "Lithium batteries are the most common dangerous goods in air cargo and the most frequently mis-shipped. They sit in Class 9 and are subdivided by chemistry and by whether they travel alone, packed with equipment, or installed in equipment — with a different UN number and a different packing instruction for each combination.",
          "The provisions are detailed and change regularly. State of charge limits apply to some categories, quantity limits differ between passenger and cargo aircraft, some configurations are forbidden on passenger aircraft entirely, and specific marks and labels are required on the packages.",
          "The practical risk is that shippers do not realise they are shipping dangerous goods at all. A consignment of power tools, laptops, toys, e-bikes or medical devices is a lithium battery shipment, and treating it as general cargo is both a regulatory breach and a genuine safety hazard — undeclared lithium batteries have caused aircraft fires.",
        ],
        bullets: [
          "Different UN numbers apply to lithium ion and lithium metal, and to batteries alone, with equipment, or in equipment",
          "Packing instructions differ by category and specify the permitted quantities and packaging",
          "State of charge limits apply to some categories of cells and batteries shipped alone",
          "Some configurations are forbidden on passenger aircraft and travel Cargo Aircraft Only",
          "Damaged, defective or recalled batteries have their own — much stricter — provisions",
          "Batteries must be protected against short circuit and against movement within the packaging",
          "Package marks and labels are prescribed and are not interchangeable with general hazard labels",
          "Check the current edition of the regulations, since lithium provisions are revised frequently",
        ],
      },
      {
        heading: "The shipper's declaration",
        paragraphs: [
          "The Shipper's Declaration for Dangerous Goods is the document that accompanies most dangerous goods air shipments. It is completed and signed by a trained shipper, and it states — for each dangerous substance or article in the consignment — exactly what is being shipped and how it is packed.",
        ],
        bullets: [
          "UN or ID number and the proper shipping name, which must correspond exactly",
          "Class or division, and any subsidiary risk",
          "Packing group where the entry requires one",
          "Quantity and type of packing, per package",
          "Packing instruction number applied",
          "Aircraft limitation — passenger and cargo aircraft, or cargo aircraft only",
          "Any authorisation or approval reference where one applies",
          "Additional handling information, including overpack and all-packed-in-one statements",
          "A monitored emergency contact telephone number",
          "The name, title, place, date and signature of the trained person making the declaration",
        ],
      },
      {
        heading: "Why consignments are refused at acceptance",
        paragraphs: [
          "Handling agents work through a formal acceptance checklist, item by item, and they refuse consignments for a narrow and predictable set of reasons. Almost all of them are documentary or preparation failures that a careful check before dispatch would have caught.",
        ],
        bullets: [
          "Declaration unsigned, or missing the signatory's name, title, place or date",
          "Emergency contact number missing, or one that will not be answered throughout transport",
          "Proper shipping name that does not correspond to the UN number given",
          "Subsidiary risk omitted where the entry requires it",
          "Packing instruction inconsistent with the quantity or the packaging actually used",
          "Quantity exceeding the limit for the aircraft type indicated",
          "Packaging not UN specification, or specification packaging assembled incorrectly",
          "Marks and labels missing, wrong, obscured or applied to the wrong surface",
          "Air waybill not annotated to reference the dangerous goods declaration",
          "Aircraft limitation on the declaration inconsistent with the air waybill annotation",
          "Overpack used without the required overpack statement and markings",
          "State or operator variations not accounted for on the origin, transit or destination",
        ],
      },
      {
        heading: "State and operator variations",
        paragraphs: [
          "Beyond the base regulations, individual states and individual airlines publish their own additional restrictions. A substance perfectly acceptable under the regulations can be prohibited by the state of origin, the state of transit, the state of destination or the operating carrier — and those restrictions are not all in the same place.",
          "Variations change regularly and apply to the specific routing rather than to the shipment in general. A consignment that moved without difficulty last month on a direct flight can be refused this month on a routing that transits a different country. Checking them is part of preparing the shipment, not a formality.",
        ],
      },
      {
        heading: "Preparing a shipment without surprises",
        bullets: [
          "Establish whether the goods are dangerous goods before quoting, not before booking — the answer changes the price and the routing",
          "Confirm the classification with someone trained, using the current regulations edition",
          "Confirm the packing instruction and obtain the correct UN specification packaging",
          "Check state and operator variations for every leg of the intended routing",
          "Confirm quantity limits for the aircraft type the routing actually uses",
          "Have the declaration completed and signed by a trained person, with a monitored emergency contact",
          "Confirm the air waybill will be annotated and the aircraft limitation stated consistently",
          "Apply marks and labels to the packages before the truck arrives, not at the counter",
          "Allow more lead time than for general cargo — acceptance takes longer and refusal costs a flight",
        ],
      },
    ],
    faqs: [
      {
        q: "What are the nine classes of dangerous goods?",
        a: "Class 1 explosives, 2 gases, 3 flammable liquids, 4 flammable solids and related hazards, 5 oxidising substances and organic peroxides, 6 toxic and infectious substances, 7 radioactive material, 8 corrosives, and 9 miscellaneous dangerous goods including lithium batteries and dry ice.",
      },
      {
        q: "Are lithium batteries dangerous goods?",
        a: "Yes, in Class 9. They are the most common dangerous goods in air cargo and the most frequently mis-shipped, largely because shippers do not realise a consignment of power tools, laptops, e-bikes or medical devices is a battery shipment. Different UN numbers and packing instructions apply depending on chemistry and whether batteries travel alone, with equipment or installed in it.",
      },
      {
        q: "Do I need training to ship dangerous goods by air?",
        a: "Yes, and it is a legal requirement rather than best practice. Anyone who classifies, packs, marks, labels, documents or accepts dangerous goods must hold current training appropriate to their function. A declaration signed by an untrained person is invalid regardless of whether its content is correct.",
      },
      {
        q: "What is a Shipper's Declaration for Dangerous Goods?",
        a: "The document accompanying most dangerous goods air shipments, completed and signed by a trained shipper. For each substance it states the UN number, proper shipping name, class and subsidiary risk, packing group, quantity and type of packing, packing instruction and aircraft limitation, plus a monitored emergency contact and the signatory's details.",
      },
      {
        q: "What does 'Cargo Aircraft Only' mean?",
        a: "That the consignment may not travel on an aircraft carrying passengers. Some substances and some quantities are permitted only on freighters, and the limitation must appear consistently on the declaration, the air waybill and the package labelling. It constrains the routing, so it affects transit time and cost as well as compliance.",
      },
      {
        q: "Why was my dangerous goods shipment refused?",
        a: "Most commonly a documentary or preparation failure: an unsigned declaration, a missing emergency contact, a proper shipping name that does not match the UN number, a packing instruction inconsistent with the packaging used, missing or wrong labels, or an air waybill without the required annotation. Acceptance staff work a formal checklist and any single failure stops the consignment.",
      },
      {
        q: "What are state and operator variations?",
        a: "Additional restrictions published by individual states and individual airlines beyond the base regulations. They can prohibit substances that are otherwise acceptable or impose stricter limits, and they apply to the specific routing — origin, transit and destination. They change regularly, so they must be checked for each shipment rather than assumed from a previous one.",
      },
      {
        q: "Can I ship aerosols or perfume by air?",
        a: "Often yes, under the appropriate class and packing instruction, but they are dangerous goods and must be declared, packed, marked and documented as such. Treating them as general cargo because they are ordinary consumer products is one of the most common undeclared dangerous goods scenarios and it is a serious breach.",
      },
      {
        q: "What is an overpack?",
        a: "An enclosure used by a single shipper to contain one or more packages, forming one handling unit — for example several boxes shrink-wrapped to a pallet. Overpacks require a specific statement on the declaration and specific markings on the outside, including reproduction of the hazard labels of the packages inside if they are not visible.",
      },
      {
        q: "How much lead time do dangerous goods shipments need?",
        a: "More than general cargo. Classification and packing take time, correct packaging may need ordering, acceptance takes longer at the counter, and a refusal costs a flight rather than an hour. Build the preparation into the schedule at quotation stage rather than discovering the constraint on the day of departure.",
      },
      {
        q: "Are the rules the same for sea freight?",
        a: "No. Sea transport is governed by the IMDG Code, which has its own declaration format, packing provisions, segregation rules and documentation. The classification system is broadly shared, but the specific requirements, quantity limits and paperwork are not interchangeable between the two modes.",
      },
      {
        q: "Can software check my dangerous goods paperwork?",
        a: "It can check for presence, structure and consistency — signature present, emergency contact present, UN number well-formed, the declaration and air waybill agreeing on references and aircraft limitation. It cannot determine whether a classification or packing instruction is correct, which requires the current regulations and a trained assessor. Use it as a pre-check that makes specialist review faster, not as a substitute for it.",
      },
    ],
    related: [
      { href: "/dangerous-goods-declaration-parser", label: "Dangerous goods declaration parser", blurb: "Extract declaration evidence into a structured, reviewable record." },
      { href: "/features/air-dangerous-goods-readiness", label: "DG readiness pre-check", blurb: "Catch missing and contradictory evidence before acceptance." },
      { href: "/tools/air-cargo-document-checklist", label: "Air cargo document checklist", blurb: "Assemble the full document set for a DG shipment." },
      { href: "/air-waybill-parser", label: "Air waybill parser", blurb: "Check that the AWB carries the required DG annotation." },
    ],
    sources: [
      { name: "IATA — Dangerous Goods Regulations", url: "https://www.iata.org/en/programs/cargo/dgr/", note: "The commercial implementation of the ICAO Technical Instructions, revised annually and used by airlines worldwide." },
      { name: "ICAO — Technical Instructions for the Safe Transport of Dangerous Goods by Air", url: "https://www.icao.int/safety/dangerousgoods/Pages/default.aspx", note: "The underlying international standard for dangerous goods by air." },
    ],
  },

  {
    slug: "three-way-matching-guide",
    title: "Three-Way Matching: PO, Invoice and Goods Receipt Controls",
    seoTitle: "Three-Way Matching Guide: PO, Invoice & Goods Receipt",
    description:
      "How three-way matching works, what each document proves, sensible tolerances, why international shipments need a fourth check, and how to resolve each type of variance.",
    readMinutes: 12,
    updated: "2026-08-04",
    keywords: [
      "three way matching",
      "PO invoice goods receipt",
      "accounts payable matching",
      "invoice matching process",
      "purchase order matching",
      "AP controls procurement",
      "two way vs three way match",
    ],
    tool: {
      href: "/features/shipment-document-matching",
      label: "See document matching",
      title: "Run the comparison automatically",
      description:
        "Group the purchase order, invoice, goods receipt and transport documents as one shipment to compare them at header and line level, with variances prioritised by what actually blocks payment.",
    },
    sections: [
      {
        heading: "What three-way matching actually controls",
        paragraphs: [
          "Three-way matching compares the purchase order, the supplier invoice and the goods receipt before payment is approved. It answers three questions: was this ordered, was it received, and is the price what we agreed. If any answer is no, payment should not proceed.",
          "It is one of the oldest controls in accounts payable and it exists because each document is produced by a different party at a different moment. The purchase order comes from the buyer before anything happens. The invoice comes from the supplier asserting what is owed. The receipt comes from the buyer's own warehouse recording what arrived. No single one of them can be trusted alone, and the control is the comparison rather than any individual document.",
        ],
        table: {
          caption: "What each document proves",
          columns: ["Document", "Produced by", "Proves", "Cannot prove"],
          rows: [
            ["Purchase order", "Buyer, before supply", "What was authorised, at what price and terms", "That anything was supplied"],
            ["Supplier invoice", "Supplier, after supply", "What the supplier claims is owed", "That the goods arrived"],
            ["Goods receipt", "Buyer's warehouse, on delivery", "What arrived and what was accepted", "What was agreed to be paid"],
          ],
        },
      },
      {
        heading: "Two-way, three-way and four-way matching",
        paragraphs: [
          "Two-way matching compares the purchase order and the invoice only. It is appropriate for services and for goods where no physical receipt exists, and it is materially weaker — it cannot detect that goods were never delivered.",
          "Three-way adds the goods receipt and is the standard control for physical goods. Four-way matching adds an inspection or quality record, used where acceptance depends on more than counting: pharmaceuticals, food, engineered components, anything with a specification to verify.",
          "For international shipments there is an additional check that the classic model misses, and it matters more than the two-versus-three-way distinction: comparing against the transport document. A shipment can match perfectly across PO, invoice and receipt while the Bill of Lading shows a different package count, a different consignee or a weight that cannot be reconciled.",
        ],
      },
      {
        heading: "Resolving the common variances",
        table: {
          caption: "What each variance means and how to treat it",
          columns: ["Variance", "Meaning", "Usual treatment"],
          rows: [
            ["Invoiced quantity above received", "Over-billing or short delivery", "Pay against the receipt; raise the difference with the supplier"],
            ["Received above ordered", "Over-delivery", "Confirm authorisation before accepting or paying"],
            ["Price above PO", "Price variance", "Hold against the contract or a documented price change"],
            ["Price below PO", "Also a variance", "Investigate — it may indicate a wrong item or a missing line"],
            ["Item invoiced not on the PO", "Unauthorised supply", "Treat as unauthorised until confirmed in writing"],
            ["Accepted below received", "Damage or quality rejection", "Pay accepted quantity only; pursue the claim separately"],
            ["Currency or terms differ from PO", "The commercial deal has changed", "Escalate rather than absorb"],
            ["No goods receipt at all", "Arrival unconfirmed", "Incomplete, not passed — do not approve"],
            ["Duplicate invoice number", "Possible duplicate payment", "Block and verify against payment history"],
          ],
        },
      },
      {
        heading: "Tolerances: deliberate, not accidental",
        paragraphs: [
          "Not every variance justifies investigation. Chasing a rounding difference costs more in staff time than it recovers, and a process that stops on every trivial difference gets bypassed. Most organisations therefore operate tolerances.",
          "What matters is that the tolerance is a documented policy rather than a function of who happened to review the invoice. Set it explicitly — a percentage and an absolute cap, so that a small percentage of a large invoice does not slip through — and review it periodically against what the exceptions actually turn out to be.",
        ],
        bullets: [
          "Set a percentage tolerance and an absolute value cap, and apply whichever is lower",
          "Apply tolerances at line level as well as invoice level, so offsetting errors do not cancel out",
          "Set quantity tolerances separately from price tolerances — they have different causes",
          "Never tolerate an item that is not on the purchase order, regardless of value",
          "Never tolerate a missing goods receipt, regardless of value",
          "Review the tolerance against outcomes: if most exceptions turn out to be genuine, it is too tight; if none do, it is too loose",
        ],
      },
      {
        heading: "Where matching quietly breaks",
        paragraphs: [
          "Most three-way matching failures are not fraud. They are process artefacts that produce variances nobody caused, which then consume the time that should have gone to the real ones.",
        ],
        bullets: [
          "Purchase order revisions — an invoice raised against revision 2 matched against revision 1 produces a variance that is nobody's error",
          "Partial deliveries invoiced in full, or full deliveries invoiced in parts, without the relationship being explicit",
          "Blanket orders drawn down over time without a release reference to match against",
          "Supplier item codes that differ from buyer item codes, so lines cannot be paired automatically",
          "Units of measure differing between documents — cases against units, or kilograms against pounds",
          "Freight and handling charges on the invoice that the purchase order never provided for",
          "Goods receipts recorded as a single quantity with no split between accepted and rejected",
          "Receipts posted days late, so the invoice arrives first and appears unmatched",
        ],
      },
      {
        heading: "Extending the match to transport evidence",
        paragraphs: [
          "For imported goods, the transport document is the only record made by an independent third party — the carrier — of what was actually handed over. That makes it a genuinely different kind of evidence from the other three, all of which come from either the buyer or the seller.",
        ],
        bullets: [
          "Packages and gross weight on the Bill of Lading or air waybill against the packing list",
          "Consignee on the transport document against the ship-to on the purchase order",
          "Container and seal numbers against the packing list and the goods receipt",
          "Shipment date against any contractual delivery window",
          "Goods description against the invoice, since a difference here also attracts customs attention",
          "Freight terms against the Incoterm agreed on the purchase order, which determines who should be paying for carriage",
        ],
      },
    ],
    faqs: [
      {
        q: "What is three-way matching?",
        a: "Comparing the purchase order, the supplier invoice and the goods receipt before approving payment, to confirm that what is being charged was ordered, was received, and is priced as agreed. Any of the three failing should stop payment. It is the standard accounts payable control for physical goods.",
      },
      {
        q: "What is the difference between two-way and three-way matching?",
        a: "Two-way compares the purchase order and the invoice only. Three-way adds the goods receipt. Two-way is appropriate for services and for goods with no physical receipt, but it is materially weaker — it cannot detect that goods were never delivered, which is precisely what the receipt exists to prove.",
      },
      {
        q: "What is four-way matching?",
        a: "Three-way plus an inspection or quality record. It is used where acceptance depends on more than counting — pharmaceuticals, food, engineered components, anything with a specification to verify. The fourth document confirms that what arrived met the standard, not just that it arrived.",
      },
      {
        q: "Can a three-way match pass without a goods receipt?",
        a: "It should not. A match that approves because the receipt was never posted is not a control at all — it is a two-way match wearing the wrong name. Where a required evidence role is missing, the correct outcome is 'incomplete' rather than 'passed', with the missing document named.",
      },
      {
        q: "What tolerance should I set?",
        a: "A percentage and an absolute cap, applying whichever is lower, so a small percentage of a large invoice does not pass unexamined. Set quantity and price tolerances separately since they have different causes, and apply them at line level as well as invoice level so offsetting errors do not cancel. Review the setting against what your exceptions actually turn out to be.",
      },
      {
        q: "What should I do if the invoice quantity exceeds the receipt?",
        a: "Pay against the receipt, not the invoice, and raise the difference with the supplier. This is the classic over-billing case and the specific reason goods receipts exist in the process. Approving the invoiced quantity because the difference is small defeats the control entirely.",
      },
      {
        q: "How do purchase order revisions break matching?",
        a: "An invoice raised against revision 2 and matched against revision 1 produces a price or quantity variance that neither party caused. Capture the revision number and date and match against the version in force when the goods shipped — otherwise the exception queue fills with variances that resolve to nothing.",
      },
      {
        q: "What if the supplier uses different item codes?",
        a: "Match on several signals rather than a single key — item code, description, quantity and price together. Where the correspondence is genuinely ambiguous, report the lines unmatched for a human rather than pairing them on weak similarity, because a wrong pairing produces a confident but false match.",
      },
      {
        q: "Should freight charges be part of the match?",
        a: "They should be checked against the agreed Incoterm. Under EXW or FCA the buyer arranges carriage and a freight line on the supplier invoice is unexpected. Under CIF or DAP it is included in the price and should not appear separately. A freight charge inconsistent with the Incoterm is a real finding, not a rounding item.",
      },
      {
        q: "Why add the transport document to the match?",
        a: "Because it is the only record made by an independent third party. The purchase order and receipt come from the buyer, the invoice from the seller. The Bill of Lading or air waybill records what the carrier actually received, which is the check that catches a shipment matching perfectly on paper while the goods that moved were something else.",
      },
      {
        q: "Can three-way matching be automated?",
        a: "The comparison can, and should be — it is mechanical once the documents are structured. What cannot be automated is the resolution: deciding whether an over-delivery was authorised, whether a price change was agreed, or whether a rejection is the supplier's problem. Automation should produce a short, prioritised exception list, not an approval.",
      },
      {
        q: "How do partial shipments affect matching?",
        a: "They produce legitimate quantity variances that must be made explicit. Where an invoice covers a full order and the delivery covers a third of it, record the partial relationship against the match so the same variance is not re-investigated on every subsequent delivery against the same order.",
      },
    ],
    related: [
      { href: "/features/shipment-document-matching", label: "Document matching", blurb: "Run the comparison across PO, invoice, receipt and transport documents." },
      { href: "/purchase-order-parser", label: "Purchase order parser", blurb: "Extract the baseline that variances are measured against." },
      { href: "/goods-receipt-parser", label: "Goods receipt parser", blurb: "Capture accepted and rejected quantities separately." },
      { href: "/guides/freight-invoice-audit-guide", label: "Freight invoice audit", blurb: "The equivalent control for carrier and forwarder billing." },
    ],
  },

  {
    slug: "freight-invoice-audit-guide",
    title: "Freight Invoice Audit: Finding Charges That Should Not Be There",
    seoTitle: "Freight Invoice Audit Guide: Line-by-Line Checks & Disputes",
    description:
      "How to audit ocean and air freight invoices line by line, the charge patterns that recur, how to evidence a dispute, and why the total is the least useful number on the bill.",
    readMinutes: 12,
    updated: "2026-08-04",
    keywords: [
      "freight invoice audit",
      "freight bill checking",
      "ocean freight invoice errors",
      "accessorial charges freight",
      "freight cost recovery",
      "carrier invoice dispute",
      "freight audit process",
    ],
    tool: {
      href: "/freight-invoice-parser",
      label: "Extract charge lines",
      title: "Get every charge as its own line",
      description:
        "Turn a freight invoice into structured charge lines with description, basis, rate, quantity and amount — the form you need to compare against a quotation rather than a total.",
    },
    sections: [
      {
        heading: "Why the total tells you nothing",
        paragraphs: [
          "Freight invoices are audited line by line or not at all. A grand total cannot tell you whether a fuel surcharge was applied at the contracted percentage, whether terminal handling was billed per container or per shipment, or whether a documentation fee appeared twice under two different names.",
          "The recurring pattern in freight billing is not fabrication. It is charges that are individually plausible and collectively unauthorised — each one defensible in isolation, none of them in the quotation. Nothing in a total surfaces that, which is why audits that check totals against budget find almost nothing.",
        ],
      },
      {
        heading: "The charge patterns that recur",
        table: {
          caption: "What to look for and where it comes from",
          columns: ["Pattern", "How it appears", "Check against"],
          rows: [
            ["Wrong rated basis", "Freight rated on the wrong weight, volume or revenue tons", "The packing list and transport document"],
            ["Surcharge percentage", "Fuel, security or currency adjustment at an unagreed rate", "The service contract or quotation"],
            ["Basis substitution", "Per container where the contract says per shipment, or vice versa", "The quotation's stated basis"],
            ["Duplicate under two names", "The same service billed as two differently described lines", "The rest of the invoice, and the other end's invoice"],
            ["Unrendered service", "Charges for handling, storage or inspection that did not occur", "Operational records and gate events"],
            ["Currency adjustment", "Applied to a rate already quoted in local currency", "The quotation currency"],
            ["Time-based charges", "Demurrage or detention on a wrong day count or with retroactive tiers", "Gate records and the tariff tiers"],
            ["Tax base", "Tax computed on charges that should have been excluded", "Local tax rules for the charge type"],
            ["Minimum charge", "Applied above a properly rated weight or volume", "The tariff minimum and the rated figure"],
          ],
        },
      },
      {
        heading: "Running the audit",
        paragraphs: [
          "Work from evidence rather than expectation. The productive question is not whether a charge looks reasonable but which document supports it — and charges with no supporting evidence are the ones worth challenging.",
        ],
        bullets: [
          "Confirm the invoice references a shipment you actually have; an unmatched reference is itself a significant finding",
          "Check the rated basis first, because an error there scales through every rated line",
          "Compare each charge line against the quotation or service contract and mark anything not provided for",
          "Look for duplicate charges under different descriptions — the single most common finding",
          "Verify surcharge percentages against the contracted basis rather than against a familiar-looking amount",
          "Reconcile time-based charges against your own day count and the tariff's tier structure",
          "Confirm the tax base excludes any charge local rules exclude",
          "Check the currency of every line and any conversion rate applied",
          "Recompute the arithmetic: line amounts, subtotal and total",
        ],
      },
      {
        heading: "Which documents support which charges",
        paragraphs: [
          "Every legitimate charge has a document behind it. Knowing which one turns an audit from an argument about reasonableness into a request for evidence.",
        ],
        table: {
          caption: "Evidence behind common charges",
          columns: ["Charge", "Supporting evidence"],
          rows: [
            ["Ocean or air freight", "The transport document's rated weight, volume or container count"],
            ["Terminal handling", "The transport document and the terminal's published tariff"],
            ["Documentation fee", "The Bill of Lading or air waybill issued"],
            ["Demurrage", "Discharge or availability record, gate-out record, the tariff"],
            ["Detention", "Gate-out record, empty return receipt, the tariff"],
            ["Storage", "The terminal or CFS tariff and the dates cargo occupied ground"],
            ["Customs disbursement", "The entry and the authority's own charge"],
            ["Inspection or exam", "The authority's exam notice"],
            ["Chassis or equipment", "The interchange record and the contract's equipment provision"],
            ["Waiting time", "Driver records with timestamps"],
          ],
        },
      },
      {
        heading: "Raising a dispute that gets paid",
        paragraphs: [
          "Disputes are won on evidence and timing, not on tone. Windows are frequently short and sometimes contractual — in the United States, demurrage and detention billing rules give the billed party a defined period to seek mitigation, and other jurisdictions and contracts set their own. An invoice not disputed inside the window is generally payable regardless of its merits.",
        ],
        bullets: [
          "Diarise the dispute deadline the day the invoice arrives, before you investigate the merits",
          "Dispute the specific line, not the whole invoice — rejecting everything delays legitimate lines and can become a payment default",
          "State the amount questioned and the reason in one sentence each",
          "Attach the evidence rather than describing it: gate records, the quotation, the transport document, the availability notice",
          "Address it to the party named on the invoice, with the invoice and shipment references in the subject line",
          "Pay the undisputed portion where the contract requires it",
          "Keep the exchange in writing, and record the outcome against the shipment for the next time the same charge appears",
        ],
      },
      {
        heading: "Preventing rather than recovering",
        paragraphs: [
          "Recovery is expensive and partial. The charges that never appear are worth more than the ones successfully disputed, and most of them are preventable at the quotation stage.",
        ],
        bullets: [
          "Get the full charge schedule in writing before booking, including destination charges — this is where most surprises live",
          "Confirm the basis of every charge: per container, per shipment, per revenue ton, per document",
          "Confirm surcharge percentages and what base they apply to",
          "Confirm the validity period of the rate, since freight quotations expire quickly",
          "Confirm free time allowances and the day-count convention in writing",
          "Track the last free day on every import from the moment the arrival notice arrives",
          "Keep a charge-code reference per carrier so an unfamiliar description is recognisable next time",
          "Analyse charge lines across shipments — a charge appearing on 30 per cent of shipments is either legitimate or a systemic billing error, and both are worth knowing",
        ],
      },
    ],
    faqs: [
      {
        q: "How do I audit a freight invoice?",
        a: "Line by line against the quotation and the shipment documents. Confirm the invoice matches a shipment you have, check the rated basis first, compare each charge against the contract, look for duplicates under different descriptions, verify surcharge percentages, reconcile time-based charges against gate records, and recompute the arithmetic. The total is the last thing to look at, not the first.",
      },
      {
        q: "What are the most common freight invoice errors?",
        a: "Duplicate charges billed under two different descriptions, surcharges at an unagreed percentage, the wrong rated basis — per container instead of per shipment, or the wrong chargeable weight — charges for services never rendered, and demurrage billed on an incorrect day count or with tiers applied retroactively.",
      },
      {
        q: "What is an accessorial charge?",
        a: "Any charge beyond the base freight for a service performed in connection with the movement — terminal handling, documentation, chassis, waiting time, storage, inspection, special equipment. They are legitimate when the service was rendered and provided for in the contract, and they are where most billing disputes originate.",
      },
      {
        q: "How long do I have to dispute a freight invoice?",
        a: "It depends on the jurisdiction and the contract, and the window is frequently short. In the United States, demurrage and detention billing rules give the billed party a defined period to request mitigation or waiver. Elsewhere the service contract or carrier terms govern. Diarise the deadline the day the invoice arrives, before you investigate.",
      },
      {
        q: "Should I withhold the whole invoice while disputing one line?",
        a: "Generally no. Rejecting an entire invoice over one charge delays every legitimate line, and where the contract requires payment of undisputed amounts it can turn a billing question into a payment default. Identify the specific line, state the amount questioned, attach evidence, and pay the remainder.",
      },
      {
        q: "How do I check whether a surcharge is correct?",
        a: "Verify the percentage against the contracted basis and confirm what base it applies to — a fuel surcharge on base freight is a different amount from one on the invoice subtotal. Then check whether the contract provides for it at all. A surcharge at a plausible-looking percentage that was never agreed is still an unauthorised charge.",
      },
      {
        q: "What evidence supports a demurrage charge?",
        a: "The discharge or availability record, the gate-out record, the applicable tariff with its free time and tier structure, and the day-count convention. Reconstruct the calculation yourself and compare — most demurrage disputes turn on the start event, whether the first day counts, or retroactive tier application rather than on the rate.",
      },
      {
        q: "Can I recover overcharges from previous years?",
        a: "Sometimes, subject to contractual and statutory limitation periods and to the carrier's willingness. Recovery becomes progressively harder as evidence ages and the people involved move on. The realistic conclusion is that prevention and prompt auditing are worth far more than retrospective recovery projects.",
      },
      {
        q: "Should I use a third-party freight audit provider?",
        a: "It depends on volume. Providers bring charge-code knowledge and scale, and typically charge a percentage of recoveries or a per-invoice fee. Below a certain volume the economics do not work, and structured extraction of your own charge lines gives you most of the visibility at a fraction of the cost. Above it, the specialist knowledge is genuinely valuable.",
      },
      {
        q: "What is the value of analysing charge lines across shipments?",
        a: "Patterns invisible on a single invoice become obvious across a hundred. A charge appearing on 30 per cent of shipments is either a legitimate conditional charge you should be quoting for, or a systemic billing error worth a single conversation rather than a hundred disputes. Both outcomes are worth having.",
      },
      {
        q: "Why do destination charges cause so many disputes?",
        a: "Because they are frequently not quoted. A rate covering the ocean leg says nothing about destination terminal handling, deconsolidation, delivery order fees or storage — and on collect or ex-works terms those land on a consignee who never saw the quotation. Ask for the destination schedule in writing before booking.",
      },
      {
        q: "How does document extraction help with freight audit?",
        a: "It turns the invoice into structured charge lines with description, basis, rate, quantity and amount, so the comparison against a quotation is direct rather than requiring figures to be dug out of a PDF. Grouping the invoice with the transport document and booking gives every rated line something to be checked against.",
      },
    ],
    related: [
      { href: "/freight-invoice-parser", label: "Freight invoice parser", blurb: "Extract every charge line with its basis, rate and amount." },
      { href: "/tools/demurrage-detention-calculator", label: "Demurrage and detention calculator", blurb: "Reconstruct the day count behind a time-based charge." },
      { href: "/features/airfreight-invoice-audit", label: "Air freight invoice audit", blurb: "The equivalent reconciliation against air waybills and rates." },
      { href: "/guides/demurrage-detention-calculation-guide", label: "Demurrage and detention guide", blurb: "Free time, tiers and how to evidence a dispute." },
    ],
  },

  {
    slug: "letter-of-credit-document-checklist",
    title: "Letter of Credit Documents: Discrepancies and How to Avoid Them",
    seoTitle: "Letter of Credit Document Checklist: Avoiding Discrepancies",
    description:
      "What banks actually check under UCP 600, the discrepancies that recur on first presentation, and a practical checklist for preparing a compliant document set.",
    readMinutes: 13,
    updated: "2026-08-04",
    keywords: [
      "letter of credit documents",
      "LC discrepancies",
      "UCP 600 document examination",
      "documentary credit checklist",
      "bill of lading letter of credit",
      "commercial invoice LC requirements",
      "avoid LC discrepancies",
    ],
    tool: {
      href: "/features/shipment-document-matching",
      label: "Compare the document set",
      title: "Check the set against itself before presentation",
      description:
        "Group the invoice, transport document, packing list and certificates as one shipment to surface the inconsistencies banks reject — before the presentation rather than after.",
    },
    sections: [
      {
        heading: "What a documentary credit actually promises",
        paragraphs: [
          "A letter of credit is a bank's undertaking to pay against documents, not against goods. The bank never sees the cargo. It examines the documents presented, on their face, against the terms of the credit — and if they comply, it pays regardless of what actually happened to the shipment.",
          "That is the source of both its value and its difficulty. The seller gets a bank's payment obligation instead of a buyer's. In exchange, payment depends entirely on producing documents that comply exactly, and a document set that describes a perfect shipment imperfectly will be rejected.",
          "Examination is governed by UCP 600, the ICC's uniform rules, supplemented by international standard banking practice. Banks have a defined period to examine a presentation and must give a single notice of refusal stating every discrepancy relied on. Compliance is assessed on the face of the documents — commercial reasonableness is not the test.",
        ],
      },
      {
        heading: "The discrepancies that recur",
        paragraphs: [
          "A substantial proportion of presentations are rejected on first attempt, and the reasons cluster tightly. Almost none of them are about goods that were not shipped; they are about documents that do not say what the credit required.",
        ],
        bullets: [
          "Documents presented after the presentation period, or after the credit's expiry",
          "Shipment effected after the latest shipment date stated in the credit",
          "Goods description on the invoice not corresponding to the description in the credit",
          "Invoice issued to a party other than the applicant, or for an amount exceeding the credit",
          "Amount drawn exceeding the credit value, or outside any stated tolerance",
          "Transport document not evidencing shipment as required — missing an on-board notation, or the wrong document type",
          "Bill of Lading claused, evidencing defective condition of the goods or packaging",
          "Incomplete set of originals presented where the credit requires a full set",
          "Insurance certificate for less than the required percentage, in the wrong currency, or dated after shipment",
          "Documents inconsistent with each other — weights, quantities, marks or party names that conflict",
          "A required document simply not presented",
          "Certificates not signed, not dated, or issued by a party other than the one specified",
        ],
      },
      {
        heading: "The consistency rule",
        paragraphs: [
          "Under UCP 600, data in one document need not be identical to data in another, but it must not conflict with it. That distinction does a great deal of work and is widely misunderstood in both directions.",
          "It means an invoice describing 'cotton knitted T-shirts, men's, 180gsm' and a Bill of Lading describing 'textiles' are not automatically discrepant — the B/L may use a general description. It also means a packing list showing 400 cartons and a Bill of Lading showing 380 is discrepant, because those statements conflict.",
          "The invoice is the exception. The goods description on the commercial invoice must correspond with the description in the credit, which is a stricter test than not conflicting. This is why the invoice description is the single field most worth getting exactly right.",
        ],
      },
      {
        heading: "Reading the credit before you ship",
        paragraphs: [
          "Every avoidable discrepancy is decided before the goods move. The moment to read the credit properly is when it is received, not when the documents are being assembled.",
        ],
        bullets: [
          "Check that every document the credit requires can actually be obtained — chambers, authorities and inspection bodies have lead times",
          "Check the latest shipment date against your realistic production and booking schedule, not the best case",
          "Check the presentation period and the expiry date, and where the credit expires — at your counters or the issuing bank's",
          "Check whether partial shipment and transhipment are permitted; if not, and your routing involves transhipment, that is a problem now",
          "Check the goods description you must reproduce on the invoice, word for word",
          "Check the required transport document type and whether an on-board notation is required",
          "Check the number of originals required and to whom the document must be consigned",
          "Check insurance requirements: percentage, currency, risks covered and who must be named",
          "Check who must issue and sign each certificate, and in what form",
          "Request an amendment immediately for anything you cannot comply with — before shipment, not after",
        ],
      },
      {
        heading: "Preparing the set",
        paragraphs: [
          "The documents must comply with the credit and be consistent with each other. Working from a single reviewed source of shipment facts is what makes the second half achievable.",
        ],
        table: {
          caption: "Document-by-document checks",
          columns: ["Document", "Key checks"],
          rows: [
            ["Commercial invoice", "Issued by the beneficiary to the applicant; goods description corresponds to the credit; amount within the credit and any tolerance; currency correct; signed if required"],
            ["Transport document", "Correct type; on-board notation if required; consigned as the credit specifies; full set of originals; clean; ports and dates consistent with the credit"],
            ["Packing list", "Consistent with the invoice on quantities, weights and marks; contains anything the credit specifies"],
            ["Insurance document", "At least the required percentage; correct currency; covering the specified risks; dated no later than shipment; issued or endorsed as required"],
            ["Certificate of origin", "Issued by the specified body; description and quantities consistent with the invoice; signed and dated"],
            ["Inspection certificate", "Issued by the named inspector; dated as the credit requires; wording as specified"],
            ["Draft or bill of exchange", "Drawn on the correct party, for the correct amount, at the correct tenor"],
          ],
        },
      },
      {
        heading: "When documents are discrepant anyway",
        paragraphs: [
          "If a discrepancy is found, the issuing bank may refuse and hold the documents at the presenter's disposal, and payment becomes discretionary — the applicant may waive the discrepancy, or may not. That is a commercial negotiation conducted from a weak position, with the goods already shipped.",
          "The options are limited and none are good. Correct and re-present if time remains before expiry. Seek the applicant's waiver. Present on an approval or collection basis, giving up the credit's protection. Or, where the relationship allows, ship on different terms next time.",
          "The asymmetry is the point: a discrepancy costs the seller its payment security for what is often a formatting error. That is why the effort belongs at the preparation stage, where a careful hour is worth more than a week of negotiation afterwards.",
        ],
      },
    ],
    faqs: [
      {
        q: "What is a documentary credit?",
        a: "A bank's undertaking to pay against documents that comply with the terms of the credit. The bank never sees the goods — it examines the presented documents on their face against the credit's requirements, and pays if they comply. It substitutes a bank's payment obligation for the buyer's, in exchange for strict documentary compliance.",
      },
      {
        q: "What are the most common LC discrepancies?",
        a: "Late presentation or shipment after the latest date, a goods description on the invoice not corresponding to the credit, an incomplete set of transport document originals, missing on-board notation, insurance for less than the required percentage or dated after shipment, documents that conflict with each other, and required documents simply not presented.",
      },
      {
        q: "Do all documents need identical wording?",
        a: "No. Under UCP 600, data need not be identical but must not conflict. A Bill of Lading may carry a general goods description where the invoice carries a detailed one. The exception is the commercial invoice, whose goods description must correspond with the credit — a stricter test than merely not conflicting.",
      },
      {
        q: "What makes a Bill of Lading acceptable under a credit?",
        a: "It must be the document type the credit requires, evidence shipment as required including an on-board notation where called for, be consigned as specified, be presented as a full set of originals where required, and be clean — carrying no clause noting defective condition of the goods or packaging. Ports and dates must be consistent with the credit.",
      },
      {
        q: "What is a claused Bill of Lading?",
        a: "One annotated by the carrier to note defective condition of the goods or their packaging at the time of receipt — damage, shortage, staining, inadequate packing. Most credits require a clean transport document, so a clause can prevent payment even when the underlying commercial transaction is entirely sound.",
      },
      {
        q: "What happens if my documents are discrepant?",
        a: "The issuing bank may refuse and hold the documents at your disposal, and payment becomes discretionary — the applicant may waive the discrepancy or may not. Your options are to correct and re-present if time remains, seek a waiver, or present on a collection basis, giving up the credit's protection. All of them are weaker positions than compliance.",
      },
      {
        q: "Can I ship before checking the credit?",
        a: "You can, and it is how most discrepancies are created. Every avoidable discrepancy is decided before the goods move: the latest shipment date, the required documents, the goods description, whether transhipment is permitted. Read the credit when it is received and request an amendment immediately for anything you cannot comply with.",
      },
      {
        q: "How long do I have to present documents?",
        a: "Within the presentation period stated in the credit, and in any event before its expiry. Where a credit calls for a transport document and states no presentation period, UCP 600 applies a default period after the date of shipment. Both deadlines matter — presenting inside the period but after expiry is still late.",
      },
      {
        q: "Who checks the documents?",
        a: "The nominated bank, the confirming bank if there is one, and the issuing bank — each examining independently against the credit terms. UCP 600 gives banks a defined number of banking days to examine a presentation and requires a single notice of refusal stating every discrepancy relied on, so a bank cannot raise new discrepancies later.",
      },
      {
        q: "What is an amendment and when should I request one?",
        a: "A change to the credit's terms, which requires the agreement of the issuing bank, the applicant, the beneficiary and any confirming bank. Request one as soon as you identify a term you cannot comply with — a later shipment date, a different document, a corrected description. Requesting before shipment is negotiation; requesting after is damage control.",
      },
      {
        q: "Does a credit change what documents I need for customs?",
        a: "No, but it frequently requires more, or in a stricter form. Customs and a credit are different audiences with different standards — a description that satisfies customs perfectly can be a discrepancy under a credit, and vice versa. Where they pull in different directions, resolve it before shipment with your broker and the bank.",
      },
      {
        q: "How can document checking software help with credits?",
        a: "It cannot examine a presentation the way a bank does — that requires reading the credit's specific terms. What it does is catch the internal inconsistencies that cause a large share of discrepancies: weights, quantities, marks and party names that conflict between documents. Those are mechanical failures, and finding them before presentation is cheap.",
      },
    ],
    related: [
      { href: "/features/shipment-document-matching", label: "Document matching", blurb: "Find the inconsistencies between documents before a bank does." },
      { href: "/guides/how-to-read-a-bill-of-lading", label: "How to read a Bill of Lading", blurb: "On-board notation, originals, clean status and consignee wording." },
      { href: "/templates/commercial-invoice-template", label: "Commercial invoice template", blurb: "The document whose description must correspond to the credit." },
      { href: "/guides/incoterms-2020-explained", label: "Incoterms 2020 explained", blurb: "Which documents a credit requires follows from the trade term." },
    ],
    sources: [
      { name: "ICC — UCP 600", url: "https://iccwbo.org/business-solutions/incoterms-rules/uniform-customs-practice-documentary-credits-ucp-600/", note: "The Uniform Customs and Practice for Documentary Credits, governing examination of presentations." },
    ],
  },
];
