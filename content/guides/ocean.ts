import type { GuideDefinition } from "@/content/guides";

export const OCEAN_GUIDES: GuideDefinition[] = [
  {
    slug: "shipping-container-types-and-sizes",
    title: "Shipping Container Types and Sizes: Dimensions, Capacity and Payload",
    seoTitle: "Container Types & Sizes: 20ft, 40ft, HC Dimensions & Capacity",
    description:
      "Internal dimensions, capacity and payload for 20ft, 40ft, high cube and 45ft containers, plus reefer, open top, flat rack and tank equipment — and how to choose by cargo density.",
    readMinutes: 13,
    updated: "2026-08-04",
    keywords: [
      "container types and sizes",
      "20ft container dimensions",
      "40ft high cube capacity",
      "container payload weight",
      "reefer container dimensions",
      "flat rack open top container",
      "container internal dimensions",
    ],
    tool: {
      href: "/tools/container-load-calculator",
      label: "Check carton fit and payload",
      title: "Test your cargo against the equipment",
      description:
        "Enter carton dimensions and weight to see how many fit in 20GP, 40GP, 40HC or 45HC equipment — with the spatial count and the payload count reported separately.",
    },
    sections: [
      {
        heading: "External name, internal reality",
        paragraphs: [
          "A container is named for its external length, but nothing you load is affected by the outside. Corrugations, corner castings, flooring and door frames all take space, so the usable interior is meaningfully smaller than the name suggests — and the door aperture is smaller again than the internal cross-section.",
          "Two limits govern every load and they run out at different times. Volume is bounded by internal dimensions. Weight is bounded by payload, which is the container's maximum gross weight minus its own tare — both stencilled on the door, and both varying between individual boxes of the same nominal size.",
          "Dense cargo hits payload long before it fills the space. Light cargo fills the space long before it approaches payload. Knowing which of the two constrains your shipment determines whether packaging redesign or different equipment is the answer, and it is the first thing to work out.",
        ],
        table: {
          caption: "Standard dry container dimensions and capacity",
          columns: ["Equipment", "Internal L × W × H (m)", "Capacity", "Typical tare", "Typical payload", "Door W × H (m)"],
          rows: [
            ["20ft general purpose (22G1)", "5.90 × 2.35 × 2.39", "≈ 33.2 CBM", "≈ 2,200 kg", "≈ 28,200 kg", "2.34 × 2.28"],
            ["40ft general purpose (42G1)", "12.03 × 2.35 × 2.39", "≈ 67.7 CBM", "≈ 3,800 kg", "≈ 26,600 kg", "2.34 × 2.28"],
            ["40ft high cube (45G1)", "12.03 × 2.35 × 2.69", "≈ 76.3 CBM", "≈ 3,900 kg", "≈ 26,400 kg", "2.34 × 2.58"],
            ["45ft high cube (L5G1)", "13.55 × 2.35 × 2.69", "≈ 86.0 CBM", "≈ 4,800 kg", "≈ 27,700 kg", "2.34 × 2.58"],
          ],
          note: "Indicative planning figures. Always take the tare and maximum gross weight from the specific container's door markings, and check road weight limits at origin and destination separately.",
        },
      },
      {
        heading: "Why a 40ft does not carry twice a 20ft",
        paragraphs: [
          "This surprises people every time. A 40ft container gives roughly twice the volume of a 20ft, but its payload is often lower — because maximum gross weight is set by structural rating and by road and lifting limits rather than by length, while the 40ft's tare is nearly double.",
          "The consequence drives most equipment decisions in ocean freight. Heavy cargo — tiles, stone, machinery, liquids in drums, cabling — moves in 20ft units, often several of them, because a 40ft would be paid for and half empty. Light cargo — furniture, packaging, textiles, plastics — moves in 40ft high cubes, where the extra foot of height adds roughly nine cubic metres at little freight premium.",
          "The rough dividing line is cargo density. Above about 850 kg per cubic metre a shipment will hit the payload of a 20ft before filling it. Below about 400 kg per cubic metre it will fill a 40ft high cube before approaching the weight limit.",
        ],
        table: {
          caption: "Choosing equipment by cargo density",
          columns: ["Density", "Behaviour", "Usual answer"],
          rows: [
            ["Above ~850 kg/CBM", "Weight-constrained; payload runs out with the box half full", "20ft GP, possibly several"],
            ["400–850 kg/CBM", "Balanced; volume and weight run out together", "40ft GP"],
            ["Below ~400 kg/CBM", "Volume-constrained; the box fills long before payload", "40ft HC or 45ft HC"],
            ["Below ~250 kg/CBM and under 13–15 CBM", "Too little to justify a whole box", "Compare against LCL"],
          ],
        },
      },
      {
        heading: "Specialised equipment",
        paragraphs: [
          "Beyond dry boxes, a range of equipment exists for cargo that cannot travel in a standard container. Each trades capacity or convenience for a specific capability, and each has its own loading rules and availability constraints.",
        ],
        bullets: [
          "Refrigerated (reefer) — temperature-controlled, with the machinery occupying internal length and the T-floor and air return needing to stay clear. Capacity is materially lower than a dry box of the same nominal size, and free time allowances are typically shorter",
          "Insulated or ventilated — passive temperature protection or airflow without active refrigeration, used for coffee, cocoa and similar commodities",
          "Open top — removable tarpaulin roof for cargo loaded by crane from above, or that exceeds internal height. Cargo protruding above the roof line attracts out-of-gauge surcharges",
          "Flat rack — collapsible or fixed end walls with no sides or roof, for machinery, vehicles and oversized cargo. Loading and securing are specialist work",
          "Platform — a flat base with no walls at all, for very heavy or very wide cargo",
          "Tank container — an ISO frame around a cylindrical tank, for bulk liquids, gases and powders. Cleaning certificates and previous-cargo history are part of the booking",
          "Half height — reduced height for dense bulk cargo such as ore and stone, where payload is exhausted at low volume",
          "Hard top — a removable steel roof, combining weather protection with top loading",
        ],
      },
      {
        heading: "Reading the markings on the door",
        paragraphs: [
          "Everything you need to plan a load is stencilled on the container itself, and reading it takes seconds. Beside the eleven-character identifier sits a four-character ISO size and type code: the first character is length, the second is height and width, and the last two describe the type.",
          "Below that are the weights: maximum gross weight, tare weight and net or payload capacity, usually in both kilograms and pounds. Take these from the actual container rather than a table — tares vary by manufacturer, by age and by any repairs, and a several-hundred-kilogram assumption error propagates straight into your VGM.",
          "Also look for the CSC safety approval plate, which evidences that the container has been examined and is approved for carriage. A container without a valid plate should not be loaded.",
        ],
        table: {
          caption: "Common ISO 6346 size and type codes",
          columns: ["Code", "Equipment"],
          rows: [
            ["22G1", "20ft general purpose, 8ft 6in high"],
            ["42G1", "40ft general purpose, 8ft 6in high"],
            ["45G1", "40ft high cube, 9ft 6in high"],
            ["L5G1", "45ft high cube, 9ft 6in high"],
            ["22R1", "20ft refrigerated"],
            ["45R1", "40ft high-cube refrigerated"],
            ["22U1", "20ft open top"],
            ["42P1", "40ft flat rack"],
            ["22T1", "20ft tank container"],
          ],
        },
      },
      {
        heading: "What you can actually load",
        paragraphs: [
          "Nominal capacity assumes a perfect rectangular fill that no real load achieves. Plan on 80 to 85 per cent of nominal for floor-loaded cartons, and less again for palletised cargo where the pallet consumes height on every layer.",
          "The space goes to predictable places: the door aperture is roughly 100 mm narrower and 110 mm lower than the internal cross-section, so the last tier often cannot be loaded to full height; corrugated walls take a few centimetres at intervals; cartons packed tight bulge beyond their printed dimensions; dunnage, airbags and edge protection occupy real volume; and cargo cannot be stacked above its own crush rating.",
        ],
        table: {
          caption: "Typical pallet positions in a single floor layer",
          columns: ["Equipment", "EUR pallet 1200 × 800", "Industrial pallet 1200 × 1000"],
          rows: [
            ["20ft general purpose", "10–11", "9–10"],
            ["40ft general purpose", "23–25", "20–21"],
            ["40ft high cube", "23–25", "20–21"],
            ["45ft high cube", "27", "24"],
          ],
          note: "Counts depend on straight versus pinwheel loading and whether slight overhang is acceptable. Double-stacking doubles them where pallet strength, cargo and internal height allow.",
        },
      },
      {
        heading: "High cubes and the road leg",
        paragraphs: [
          "A high cube's extra 300 mm of internal height is free volume at sea and a constraint on land. Combined vehicle height limits, low bridges, tunnels and some national road regulations restrict where a high cube can travel, and in a few markets they require specific chassis or permits.",
          "This is worth confirming before booking rather than after. Discovering at destination that a high cube cannot reach the delivery address means transloading — unstuffing into a standard container or a truck — at a cost that comfortably exceeds whatever the extra volume saved.",
        ],
      },
    ],
    faqs: [
      {
        q: "What are the internal dimensions of a 20ft container?",
        a: "Approximately 5.90 m long, 2.35 m wide and 2.39 m high, giving about 33.2 CBM of nominal capacity. The door aperture is smaller — roughly 2.34 m wide and 2.28 m high — which is why the top tier often cannot be loaded to full internal height.",
      },
      {
        q: "How much can a 40ft container hold?",
        a: "About 67.7 CBM for a standard 40ft and about 76.3 CBM for a 40ft high cube. Realistic floor-loaded stows reach 80 to 85 per cent of those figures, and palletised cargo less again. Payload is roughly 26 to 27 tonnes for both, which is why dense cargo runs out of weight long before space.",
      },
      {
        q: "Why is a 40ft payload lower than a 20ft?",
        a: "Because maximum gross weight is set by structural rating and by road and lifting limits rather than by length, while the 40ft's tare weight is nearly double. A 20ft rated at about 30,480 kg gross with a 2,200 kg tare leaves roughly 28 tonnes of payload; a 40ft with a 3,800 kg tare leaves less.",
      },
      {
        q: "What is the difference between a 40ft and a 40ft high cube?",
        a: "Height only. Both are 40 feet long and 8 feet wide externally; the high cube is 9 feet 6 inches tall against 8 feet 6 inches, adding roughly 300 mm of internal height and about 8.6 CBM. The trade-off is on the road, where combined vehicle height limits, bridges and tunnels restrict high cubes on some routes.",
      },
      {
        q: "How many pallets fit in a container?",
        a: "In a single floor layer: ten to eleven EUR pallets or nine to ten industrial pallets in a 20ft; twenty-three to twenty-five EUR or twenty to twenty-one industrial in a 40ft. Double-stacking doubles these where the pallet, the cargo and the internal height allow, which is the usual limiting factor.",
      },
      {
        q: "How much less does a reefer container hold?",
        a: "Materially less than a dry box of the same nominal size. The refrigeration unit occupies internal length, and the T-floor and air-return path must stay clear for the airflow to work at all — blocking them is one of the most common causes of temperature excursions. Take the specific unit's internal dimensions rather than assuming dry-box figures.",
      },
      {
        q: "When do I need an open top or flat rack?",
        a: "An open top when cargo must be loaded by crane from above or exceeds internal height; a flat rack when it exceeds width or requires side loading, or when it is a machine, vehicle or structure that cannot go through a door. Both involve out-of-gauge handling, specialist securing and surcharges, so confirm the cost before assuming they are the answer.",
      },
      {
        q: "What is the maximum weight I can load?",
        a: "The payload stencilled on the specific container — its maximum gross weight minus its actual tare. Then check road weight limits at origin and destination, which are frequently lower and are enforced with fines and offloading rather than warnings. The lower of the two is your real limit.",
      },
      {
        q: "Where do I find a container's tare weight?",
        a: "Stencilled on the door, usually in both kilograms and pounds, alongside the maximum gross weight and payload. Use that figure rather than a generic table value: tares vary by manufacturer, age and repair history by several hundred kilograms, and a wrong tare propagates directly into an inaccurate VGM declaration.",
      },
      {
        q: "What is the ISO size and type code?",
        a: "The four-character code stencilled beside the container number. The first character is length, the second is height and width, and the last two describe the type — so 45G1 is a 40ft high-cube general-purpose container. It is separate from the container number and is not covered by the check digit.",
      },
      {
        q: "Can I load a container to its full internal height?",
        a: "Rarely. The door aperture is roughly 110 mm lower than the internal ceiling, so the top tier must be loaded before the doors are reached or omitted. Clearance for handling equipment and the cargo's own crush rating usually cap stack height well below the ceiling anyway.",
      },
      {
        q: "How do I decide between one 40ft and two 20ft containers?",
        a: "By density. Above roughly 850 kg per cubic metre the cargo is weight-constrained and two 20ft units carry more total payload than one 40ft. Below that, one 40ft is almost always cheaper per unit shipped. Also weigh handling: two 20ft units mean two of everything at both ends.",
      },
    ],
    related: [
      { href: "/tools/container-load-calculator", label: "Container load calculator", blurb: "Test carton fit and payload against each equipment type." },
      { href: "/tools/cbm-calculator", label: "CBM calculator", blurb: "Total your cargo volume before choosing equipment." },
      { href: "/guides/lcl-vs-fcl-shipping", label: "LCL vs FCL", blurb: "When a partial load is cheaper than a whole container." },
      { href: "/guides/verified-gross-mass-vgm-guide", label: "Verified Gross Mass guide", blurb: "The weight declaration every packed container needs." },
    ],
    sources: [
      { name: "ISO 6346 — Freight containers coding and marking", url: "https://www.iso.org/standard/83558.html", note: "The standard governing container identification, size and type codes and marking." },
      { name: "IMO — Container safety (CSC)", url: "https://www.imo.org/en/OurWork/Safety/Pages/Containers.aspx", note: "The International Convention for Safe Containers, behind the CSC approval plate on every box." },
    ],
  },

  {
    slug: "lcl-vs-fcl-shipping",
    title: "LCL vs FCL: Cost, Transit, Risk and Where the Crossover Sits",
    seoTitle: "LCL vs FCL Shipping: Cost Comparison & Breakeven Volume",
    description:
      "How LCL and FCL are priced, what LCL local charges actually cost, where the volume crossover falls, and the handling and transit differences that matter as much as price.",
    readMinutes: 12,
    updated: "2026-08-04",
    keywords: [
      "LCL vs FCL",
      "when to use LCL",
      "FCL breakeven volume",
      "LCL shipping cost",
      "container vs consolidation",
      "less than container load",
      "ocean freight comparison",
    ],
    tool: {
      href: "/tools/lcl-freight-calculator",
      label: "Calculate LCL freight",
      title: "Work out the revenue tons first",
      description:
        "Compare CBM against gross weight to find which measure controls, apply your W/M rate, and add local charges — the numbers you need before comparing against an FCL quotation.",
    },
    sections: [
      {
        heading: "Two entirely different products",
        paragraphs: [
          "FCL means you buy a container. What you put in it, how you pack it and when it is opened are your business, and the carrier's price is per box regardless of whether it is full.",
          "LCL means you buy space in someone else's container. Your cargo is delivered to a consolidation warehouse, measured, weighed, loaded alongside other shippers' goods, shipped, then unloaded and separated at destination. You pay for the volume or weight you use, and you accept the handling that consolidation requires.",
          "That difference in product shape explains everything else — the pricing basis, the transit time, the damage exposure, the free time and the measurement risk all follow from it.",
        ],
      },
      {
        heading: "How each is priced",
        paragraphs: [
          "FCL is priced per container for the ocean leg, with local charges largely fixed per container at both ends. Doubling the cargo inside the box does not change the freight.",
          "LCL is priced per revenue ton on a weight-or-measure basis: compare the shipment's volume in cubic metres with its gross weight in metric tons and charge on whichever is higher, with a tariff minimum that is usually one revenue ton. Crucially, most LCL local charges are also per revenue ton — so origin CFS handling, destination deconsolidation and terminal charges all scale with your cargo rather than being fixed.",
          "This is why LCL cost rises close to linearly with volume while FCL cost is a step function. It is also why the headline ocean rate is a poor guide to LCL cost: on shipments under about five revenue tons, local charges routinely exceed the freight itself.",
        ],
        table: {
          caption: "Where the money goes",
          columns: ["Cost element", "LCL", "FCL"],
          rows: [
            ["Ocean freight", "Per revenue ton, W/M basis", "Per container"],
            ["Origin handling", "Per RT — CFS receiving, THC", "Per container — THC"],
            ["Documentation", "Per B/L", "Per B/L"],
            ["Destination handling", "Per RT — CFS deconsolidation, THC", "Per container — THC"],
            ["Delivery order", "Per shipment", "Per shipment"],
            ["Free time at destination", "Short CFS storage, often 3–7 days", "Longer demurrage and detention allowances"],
            ["Measurement risk", "Re-measured at CFS; the invoice can exceed the quote", "None — you bought the box"],
          ],
        },
      },
      {
        heading: "Where the crossover falls",
        paragraphs: [
          "The conventional answer is 13 to 15 cubic metres, and it is roughly right for the ocean freight comparison alone. It is also the wrong comparison.",
          "Because LCL local charges scale per revenue ton while FCL local charges are largely fixed per container, the true crossover on landed cost is often lower than the freight-only figure suggests — sometimes around 10 CBM on lanes with expensive CFS handling. Conversely on lanes with cheap consolidation and expensive FCL destination charges it can be higher.",
          "The only reliable method is to price both, all-in, for the specific lane and season. A quotation covering only the ocean leg is not a comparison, it is half of one.",
        ],
        bullets: [
          "Under about 6 CBM: LCL is almost always cheaper, and FCL is rarely worth considering",
          "6 to 13 CBM: LCL usually wins on cost, but check destination charges — this is where surprises live",
          "13 to 15 CBM: genuinely marginal; compare landed cost and weigh the non-price factors",
          "Above 15 CBM: FCL usually wins on cost and always wins on handling",
          "Any volume with fragile, high-value or time-critical cargo: FCL deserves serious consideration regardless of the arithmetic",
        ],
      },
      {
        heading: "The measurement problem",
        paragraphs: [
          "LCL cargo is measured and weighed at the consolidation warehouse, as presented, to the outermost point. That includes the pallet, the shrink wrap, any overhang and any bulge in tightly packed cartons.",
          "A palletised shipment is routinely measured 10 to 20 per cent larger than the sum of its cartons. A pallet base of 1.2 by 1.0 metres loaded to 1.5 metres is measured as 1.8 CBM even if the cartons themselves total 1.55. On a per-revenue-ton tariff that difference is billed at every charge line, not just the freight.",
          "The fix is to quote from the loaded pallet dimension rather than the carton total, and to build the allowance in at the quotation stage rather than discovering it on the invoice.",
        ],
      },
      {
        heading: "What price does not capture",
        paragraphs: [
          "Cost comparisons dominate the LCL versus FCL conversation and they miss most of what actually differs between the two products.",
        ],
        bullets: [
          "Transit time — LCL adds consolidation days at origin and deconsolidation days at destination, frequently a week in total across both ends",
          "Handling — LCL cargo is handled loose at least twice more than FCL cargo, and restacked at the CFS by people who did not pack it",
          "Damage exposure — your cargo travels alongside unknown goods, and a leaking drum three positions away is your problem too",
          "Free time — CFS storage allowances at destination are typically much shorter than FCL demurrage free time, so a slow clearance gets expensive faster",
          "Predictability — an FCL container is sealed at origin and opened by the consignee; an LCL shipment passes through more hands and more points of failure",
          "Documentation — LCL almost always moves under a house Bill of Lading issued by the consolidator rather than a carrier document",
          "Rolling risk — LCL shipments can be rolled if the consolidator does not fill the box, which is outside your control and not always visible",
        ],
      },
      {
        heading: "Auditing an LCL invoice",
        paragraphs: [
          "LCL invoices carry more separately quoted components than almost any other freight bill, which makes silent additions easy. The most productive audit is not recalculating the freight but confirming that the volume and weight billed match what your packing list declares.",
        ],
        bullets: [
          "Confirm the billed CBM against the packing list, and request the CFS measurement record if they differ beyond a rounding margin",
          "Confirm the billed gross weight against the weight ticket",
          "Check which measure controlled — being billed on weight when the cargo is clearly volume-controlled is an arithmetic error",
          "Verify the rate against the written quotation, including its validity date",
          "Check each local charge against the quotation and query anything undisclosed",
          "Confirm per-RT charges used the same revenue ton figure as the freight line",
          "Check the tariff minimum was applied correctly on small shipments",
          "Confirm currency and any exchange rate applied to locally billed charges",
        ],
      },
    ],
    faqs: [
      {
        q: "What is the breakeven volume between LCL and FCL?",
        a: "Conventionally 13 to 15 CBM, but that reflects ocean freight alone. Because LCL local charges scale per revenue ton while FCL local charges are largely fixed per container, the crossover on landed cost is often lower — around 10 CBM on lanes with expensive CFS handling. Price both all-in for the specific lane rather than relying on a rule of thumb.",
      },
      {
        q: "How is LCL freight calculated?",
        a: "On a weight-or-measure basis: compare the shipment's volume in cubic metres with its gross weight in metric tons, take whichever is higher as the revenue ton count, apply the tariff minimum if it is below one, and multiply by the quoted W/M rate. Then add origin and destination charges, most of which are also per revenue ton.",
      },
      {
        q: "Why is my LCL invoice higher than the quote?",
        a: "Usually because the cargo was re-measured at the consolidation warehouse. LCL cargo is measured as presented, to the outermost point, including pallets, wrap and overhang — routinely 10 to 20 per cent above the carton total on palletised shipments. And because most local charges are per revenue ton, that increase applies to every line, not just the freight.",
      },
      {
        q: "Is LCL slower than FCL?",
        a: "Yes, typically by several days at each end. Cargo must arrive at the consolidation warehouse before the container is built, and at destination it must be unloaded and separated before it is released. That adds up to roughly a week across both ends on many lanes, on top of the same sea transit.",
      },
      {
        q: "Is LCL riskier for damage?",
        a: "Statistically yes. LCL cargo is handled loose at least twice more, restacked at the CFS by people who did not pack it, and stowed alongside unknown cargo whose condition you cannot verify. Pack LCL cargo to survive handling rather than to the standard you would use for a sealed container.",
      },
      {
        q: "Do LCL shipments have demurrage?",
        a: "Not detention, since you never take a container. What you face is CFS storage at destination once free time expires, and that allowance is typically much shorter than FCL demurrage free time — often three to seven days. It accrues per revenue ton per day, so a slow clearance on bulky cargo escalates quickly.",
      },
      {
        q: "Are destination charges included in an LCL quote?",
        a: "Frequently not. A quotation naming only a per-CBM ocean rate is quoting one line of a bill with eight or ten. Always ask for the destination charge schedule in writing before booking, especially on collect or ex-works terms where the consignee receives them. Undisclosed destination charges are the most common LCL complaint.",
      },
      {
        q: "What is the minimum charge for LCL?",
        a: "Most tariffs apply a minimum of one revenue ton, so a 0.3 CBM shipment weighing 60 kg is still billed as 1 RT. Some lanes and consolidators set higher minimums, and separate minimums often apply to individual local charges. Confirm them in writing — on very small shipments they determine the whole cost.",
      },
      {
        q: "Can I use FCL for less than a full container?",
        a: "Yes, and it is sometimes the right answer. Buying a whole container for 10 CBM of fragile or time-critical cargo can cost more in freight and less overall, because the cargo is sealed at origin, handled less, arrives faster and enjoys longer free time. The box does not have to be full for FCL to be the better product.",
      },
      {
        q: "Who issues the Bill of Lading on an LCL shipment?",
        a: "Almost always the consolidator or NVOCC, as a house Bill of Lading. The ocean carrier issues one master Bill of Lading to the consolidator covering the whole container. That means your contractual counterparty is the consolidator, not the shipping line, which matters for claims and for release.",
      },
      {
        q: "How should I pack cargo for LCL?",
        a: "For handling, not for a sealed box. Use stronger cartons than you would for FCL, palletise and wrap where practical, keep the load stable and squared so it is not restacked, mark clearly with case numbers, and avoid overhang — which is both a damage risk and a measurement penalty.",
      },
      {
        q: "Can LCL shipments be rolled?",
        a: "Yes. If the consolidator does not fill the container, it may hold the build for the next sailing. This is outside your control and not always communicated proactively. If timing is critical, ask about the consolidation schedule and cut-off before booking, or consider FCL.",
      },
    ],
    related: [
      { href: "/tools/lcl-freight-calculator", label: "LCL freight calculator", blurb: "Convert volume and weight into revenue tons and estimate freight." },
      { href: "/tools/container-load-calculator", label: "Container load calculator", blurb: "Check whether your cargo justifies a full container." },
      { href: "/guides/shipping-container-types-and-sizes", label: "Container types and sizes", blurb: "Capacity and payload for every standard equipment type." },
      { href: "/freight-invoice-parser", label: "Freight invoice parser", blurb: "Extract LCL charge lines for audit against the quotation." },
    ],
  },

  {
    slug: "verified-gross-mass-vgm-guide",
    title: "Verified Gross Mass (VGM): Rules, Methods and Common Errors",
    seoTitle: "VGM Guide: SOLAS Verified Gross Mass Rules & Methods",
    description:
      "What VGM is, who is legally responsible, the two permitted weighing methods, cut-offs, and the tare and packaging errors that cause most VGM discrepancies.",
    readMinutes: 10,
    updated: "2026-08-04",
    keywords: [
      "verified gross mass",
      "VGM SOLAS",
      "container weight declaration",
      "VGM method 1 method 2",
      "VGM cut off",
      "container weighing requirement",
      "SOLAS container weight",
    ],
    tool: {
      href: "/templates/container-packing-list-template",
      label: "Build a container packing list",
      title: "Get the cargo weight right first",
      description:
        "Allocate every package to a container with gross weights totalled per unit — the figure you cross-check the weighbridge VGM against before submitting.",
    },
    sections: [
      {
        heading: "What VGM is and why it exists",
        paragraphs: [
          "Verified Gross Mass is the total weight of a packed container: the cargo, all packaging, all dunnage and securing material, plus the container's own tare weight. Under the SOLAS Convention it must be provided to the carrier and the terminal before a packed container can be loaded onto a vessel.",
          "The requirement followed a series of incidents in which mis-declared container weights contributed to stack collapses, vessel stability problems, lifting failures and road accidents. A container declared at 12 tonnes and actually weighing 24 is not a paperwork problem — it is a stow plan built on false information.",
          "The legal position is unambiguous: no VGM, no loading. Terminals will not load a container without one, and carriers will not accept the risk of doing so.",
        ],
      },
      {
        heading: "Who is responsible",
        paragraphs: [
          "The obligation rests on the shipper named on the Bill of Lading. Not the packer, not the haulier, not the forwarder — the named shipper, who must ensure the VGM is obtained, is accurate, is signed by an authorised person and reaches the carrier and terminal in time.",
          "In practice the work is frequently delegated: the packing warehouse weighs, a forwarder submits. Delegation does not transfer the responsibility. If the declaration is wrong, the shipper named on the transport document answers for it.",
        ],
      },
      {
        heading: "The two permitted methods",
        paragraphs: [
          "Only two methods are permitted, and estimating is not one of them. Both require calibrated and certified equipment, and both require the result to be documented.",
        ],
        table: {
          caption: "Method 1 and Method 2 compared",
          columns: ["", "Method 1", "Method 2"],
          rows: [
            ["What is weighed", "The packed, sealed container as a unit", "All packages, pallets, dunnage and securing material"],
            ["Then", "Nothing further — the reading is the VGM", "Add the container's stencilled tare weight"],
            ["Equipment", "Weighbridge or calibrated lifting equipment", "Calibrated scales for the contents"],
            ["Approval", "Certified and calibrated equipment", "A documented method approved by the competent authority of the packing country"],
            ["Best for", "Mixed or irregular loads where contents cannot be weighed individually", "Uniform, countable cargo weighed as part of the packing process"],
            ["Common error", "Weighing before the last packages are loaded", "Omitting dunnage, or using a generic tare"],
          ],
        },
      },
      {
        heading: "Where VGM goes wrong",
        paragraphs: [
          "Almost every VGM discrepancy traces to one of a handful of causes, and all of them are avoidable with a checklist at the packing point.",
        ],
        bullets: [
          "Generic tare weight — tares vary by manufacturer, age and repair history by several hundred kilograms. Read the actual container's door",
          "Dunnage omitted — airbags, timber bracing, lashing and edge protection are cargo for VGM purposes and are routinely forgotten",
          "Pallets omitted — a pallet weighs 20 to 30 kg and twenty of them is half a tonne",
          "Packaging omitted — shrink wrap, strapping and internal packing all count",
          "Weighing before loading is finished, so the last few packages are missing",
          "Submitting against the booking rather than the specific container number",
          "Product weight taken from a specification rather than measured, on cargo with natural weight variation",
          "Method 2 used without an approved documented procedure, which makes the declaration non-compliant even if the number is right",
          "The declaration unsigned, or signed by someone not authorised to do so",
        ],
      },
      {
        heading: "Cut-offs and submission",
        paragraphs: [
          "VGM has its own cut-off, separate from the documentation cut-off and from the physical cargo cut-off. It is frequently the earliest of the three, and missing it is one of the more reliable ways to have a container rolled — because unlike a late document, there is no way for the carrier to work around a missing VGM.",
          "Submission routes vary: carrier portals, EDI, port community systems and, on some trades, email. The declaration must identify the shipper, the container number, the VGM figure, the units and the method used, and it must carry the name or signature of an authorised person.",
        ],
      },
      {
        heading: "Cross-checking your own declaration",
        paragraphs: [
          "The container packing list is the natural check on a VGM. Your declared cargo weight plus the stencilled tare should approximate the weighbridge figure closely. When they diverge materially, something is wrong and finding out what is far cheaper before the container ships.",
        ],
        bullets: [
          "A weighbridge figure well above the packing list usually means packaging, pallets or dunnage were omitted from the list",
          "A figure well below usually means cargo was not loaded, or was loaded into a different container",
          "A difference of a few hundred kilograms often means a generic tare was used instead of the actual one",
          "A difference that changes between weighings points at equipment calibration",
          "Any material difference should be resolved before the B/L is finalised, since the gross weight also appears there",
        ],
      },
    ],
    faqs: [
      {
        q: "What is VGM in shipping?",
        a: "Verified Gross Mass — the total weight of a packed container including cargo, all packaging, dunnage, securing material and the container's own tare weight. Under the SOLAS Convention it must be provided before a packed container can be loaded onto a vessel, and it must be obtained by weighing rather than estimated.",
      },
      {
        q: "Who is responsible for providing VGM?",
        a: "The shipper named on the Bill of Lading. The work is frequently delegated to a packing warehouse or a forwarder, but delegation does not transfer the legal responsibility — if the declaration is wrong, the named shipper answers for it.",
      },
      {
        q: "What are Method 1 and Method 2?",
        a: "Method 1 weighs the packed, sealed container as a unit on a weighbridge or calibrated lifting equipment; the reading is the VGM. Method 2 weighs all packages, pallets, dunnage and securing material and adds the container's stencilled tare, using a documented method approved by the competent authority of the packing country.",
      },
      {
        q: "Can I estimate the VGM?",
        a: "No. Estimation is expressly not permitted, and a declaration based on it is non-compliant regardless of how close the number turns out to be. Both permitted methods require calibrated equipment and documented results, and Method 2 additionally requires an approved procedure.",
      },
      {
        q: "Does VGM include the container tare?",
        a: "Yes. VGM is the gross mass of the packed container as a whole, which necessarily includes the container itself. Under Method 1 the tare is captured automatically because you weigh the whole unit; under Method 2 it must be added, and it must be the specific container's stencilled tare rather than a generic figure.",
      },
      {
        q: "What happens if I miss the VGM cut-off?",
        a: "The container is not loaded. Unlike a late document, there is nothing a carrier can do to work around a missing VGM — the terminal will not lift it. The VGM cut-off is separate from and frequently earlier than the documentation and cargo cut-offs, so treat it as its own deadline.",
      },
      {
        q: "Do pallets and dunnage count toward VGM?",
        a: "Yes, all of it — pallets, shrink wrap, strapping, airbags, timber bracing, lashing and edge protection. Omitting them is one of the most common Method 2 errors, and on a fully palletised container the omission can run to several hundred kilograms.",
      },
      {
        q: "Does VGM apply to LCL shipments?",
        a: "The obligation attaches to the packed container, so it falls on the party that packs and ships it — the consolidator, not the individual LCL shipper. What the LCL shipper must provide is an accurate weight for its own cargo, which the consolidator relies on to build its declaration.",
      },
      {
        q: "How accurate does the VGM need to be?",
        a: "It must be the result of an actual weighing on calibrated equipment. National authorities apply tolerances for enforcement purposes and these vary, so check the requirement for the country of packing rather than assuming a universal figure. The obligation is to weigh accurately, not to hit a tolerance.",
      },
      {
        q: "Can the carrier weigh the container for me?",
        a: "Some terminals offer weighing as a service, and it can be a practical route where you have no weighbridge. It does not transfer the legal obligation, which remains with the named shipper, and it costs money and time at the terminal — so it is a fallback rather than a plan.",
      },
      {
        q: "Should the VGM match the packing list gross weight?",
        a: "It should approximate it closely — cargo gross weight plus tare. A material divergence means packaging or dunnage was omitted from the packing list, cargo was not loaded, or a generic tare was used. It is worth resolving before the Bill of Lading is finalised, because the gross weight appears there too.",
      },
      {
        q: "What must the VGM declaration contain?",
        a: "The shipper's identity, the container number, the verified gross mass figure with its units, the weighing method used, and the name or signature of a person authorised by the shipper. Submitting against the booking rather than the specific container number is a common and rejectable error.",
      },
    ],
    related: [
      { href: "/templates/container-packing-list-template", label: "Container packing list", blurb: "Allocate cargo to containers with gross weights per unit." },
      { href: "/templates/shipping-instructions-template", label: "Shipping instructions template", blurb: "Where VGM sits alongside the other pre-departure submissions." },
      { href: "/guides/shipping-container-types-and-sizes", label: "Container types and sizes", blurb: "Where to find tare and payload on the container itself." },
      { href: "/tools/container-number-check", label: "Container number check", blurb: "Validate the container number your VGM is submitted against." },
    ],
    sources: [
      { name: "IMO — SOLAS container weight verification", url: "https://www.imo.org/en/MediaCentre/HotTopics/Pages/container-weighing.aspx", note: "The IMO's guidance on the SOLAS Chapter VI amendments requiring verified gross mass." },
    ],
  },

  {
    slug: "telex-release-vs-original-bill-of-lading",
    title: "Telex Release vs Original Bill of Lading: How Cargo Gets Released",
    seoTitle: "Telex Release vs Original B/L: Release Methods Compared",
    description:
      "How original, telex, express and sea waybill releases differ, when each is appropriate, what happens if an original is lost, and how to choose before the document is issued.",
    readMinutes: 11,
    updated: "2026-08-04",
    keywords: [
      "telex release",
      "telex release vs original bill of lading",
      "express release shipping",
      "surrendered bill of lading",
      "sea waybill vs bill of lading",
      "cargo release methods",
      "original B/L lost",
    ],
    tool: {
      href: "/templates/shipping-instructions-template",
      label: "Prepare shipping instructions",
      title: "State the release method before issuance",
      description:
        "Document type, release method and number of originals are three separate decisions the carrier needs in writing. The instructions template puts all three where the carrier will read them.",
    },
    sections: [
      {
        heading: "The problem release methods solve",
        paragraphs: [
          "A negotiable Bill of Lading is a document of title. Cargo is released only against surrender of a properly endorsed original, which is exactly what makes it useful — the seller can withhold delivery until it is paid, and the document can be transferred while the goods are afloat.",
          "It also creates a practical problem. On short sea routes, cargo arrives before its documents. A container crossing in three days while its originals sit in a courier bag for five generates demurrage for no commercial reason at all. On longer routes, a bank holding documents under a credit can add days more.",
          "Telex release, express release and sea waybills are three different answers to that problem, and they trade control for speed in different amounts.",
        ],
      },
      {
        heading: "The four release methods",
        table: {
          caption: "How each method works",
          columns: ["Method", "Originals printed", "How cargo is released", "Seller retains control?"],
          rows: [
            ["Original negotiable B/L", "Yes, usually a set of three", "Surrender of one endorsed original at destination", "Yes, fully"],
            ["Telex release", "Yes, then surrendered at origin", "Carrier's origin office authorises destination release", "Until surrender at origin"],
            ["Express release", "No originals issued", "Release to the named consignee on identification", "No"],
            ["Sea waybill", "Not applicable — a different document type", "Consignee identifies itself; nothing to surrender", "No"],
          ],
          note: "A telex release is not a document type. The B/L remains an original B/L; only the mechanism by which release is authorised has changed.",
        },
      },
      {
        heading: "How a telex release actually works",
        paragraphs: [
          "The shipper surrenders the full set of originals to the carrier at origin. The carrier's origin office confirms to its destination office that the originals are in its possession, and the destination office releases cargo to the consignee without an original being presented there.",
          "The name is historical — it dates from when that confirmation was sent by telex — and the message today is electronic. Some carriers call it 'surrendered', 'surrender at origin' or 'cable release', and the terminology varies enough that it is worth confirming what your carrier means rather than assuming.",
          "The key point is that the originals still exist and were still issued. Until they are surrendered, the shipper retains control. The moment they are surrendered, that control is gone — so a telex release should be instructed when payment is secured, not before.",
        ],
      },
      {
        heading: "Choosing before the document is issued",
        paragraphs: [
          "This is a decision to make at the shipping instruction stage, not after the vessel sails. Once originals have been printed and issued, switching to express release requires all of them to be returned to the carrier — which is straightforward if they are still on your desk and difficult if one is with a bank in another country.",
          "State three things explicitly in your instructions: the document type, the release method and the number of originals. Leaving any of them to be defaulted is how a shipper ends up with three originals it did not want and a consignee waiting for a courier.",
        ],
        bullets: [
          "Payment secured or intercompany, short transit: express release or sea waybill",
          "Payment secured after shipment, cargo arriving before documents: originals with telex release once paid",
          "Payment unsecured: originals, surrendered only against payment",
          "Documentary credit: originals, in the number and form the credit requires — nothing else will be accepted",
          "Goods may be sold in transit: originals, since only a negotiable document can be transferred by endorsement",
          "Consignee is a trusted long-term customer on open account: sea waybill removes the paperwork entirely",
        ],
      },
      {
        heading: "When an original is lost",
        paragraphs: [
          "The carrier will not release cargo without one. The usual remedy is a letter of indemnity, frequently required to be countersigned by a bank and secured for a multiple of the cargo value, because the carrier is accepting the risk that the genuine original surfaces later in someone else's hands.",
          "It is expensive, slow and disruptive — and it is entirely avoidable by requesting only the number of originals you genuinely need. A full set of three exists by convention, not necessity. If one original will do the job, ask for one.",
        ],
      },
      {
        heading: "What each method does not change",
        paragraphs: [
          "A common misunderstanding is that removing the document from the release path removes the conditions. It does not. Whatever the release method, cargo still requires the carrier's release and the customs release before a delivery order will issue.",
        ],
        bullets: [
          "Freight and destination charges must still be settled",
          "Customs entry must still be cleared and any hold lifted",
          "A delivery order is still required for the terminal to hand cargo over",
          "Demurrage and detention still accrue on the same terms",
          "The consignee must still be able to identify itself",
          "Any terminal or carrier block against the container still applies",
        ],
      },
    ],
    faqs: [
      {
        q: "What is a telex release?",
        a: "An arrangement where the shipper surrenders the full set of original Bills of Lading to the carrier at origin, and the carrier's origin office authorises its destination office to release cargo without an original being presented there. It solves the problem of cargo arriving before its documents. It is not a document type — the B/L remains an original B/L.",
      },
      {
        q: "What is the difference between telex release and express release?",
        a: "Under a telex release, originals are printed and issued, then surrendered at origin. Under an express release, no originals are printed at all — the carrier issues the document as non-negotiable from the outset and releases to the named consignee on identification. Express release is decided before issuance; telex release can be arranged afterwards.",
      },
      {
        q: "Can I switch from originals to express release after issuance?",
        a: "Only by returning all issued originals to the carrier. That is easy if they are still on your desk and difficult if one is with a bank or in transit. This is why the release method belongs in the shipping instructions rather than being decided later.",
      },
      {
        q: "Does a telex release mean I lose control of the cargo?",
        a: "Yes, from the moment the originals are surrendered. Until then you hold them and the consignee cannot collect. After surrender, the carrier will release to the named consignee. Instruct a telex release when payment is secured, not in anticipation of it.",
      },
      {
        q: "What is the difference between a sea waybill and an express release?",
        a: "A sea waybill is a different document type that is non-negotiable by nature. An express release is a Bill of Lading issued with no originals printed. Both release to the named consignee on identification, and both remove documents from the release path — but only one is a distinct document type, and a credit requiring a Bill of Lading will not accept a sea waybill.",
      },
      {
        q: "How many original Bills of Lading should I request?",
        a: "The minimum you actually need. A full set of three is convention rather than requirement, and every additional original is another document that can be lost, misused or held up. Where a documentary credit specifies a number, that number governs. Otherwise, ask whether one will do.",
      },
      {
        q: "What happens if an original Bill of Lading is lost?",
        a: "The carrier will not release cargo without one. The remedy is usually a letter of indemnity, frequently bank-countersigned and secured for a multiple of the cargo value, because the carrier is accepting the risk that the genuine original later surfaces in another party's hands. It is expensive, slow and avoidable by requesting fewer originals.",
      },
      {
        q: "Can I use a telex release under a letter of credit?",
        a: "Generally not, unless the credit expressly permits it. Credits typically require presentation of a full set of originals precisely because that gives the bank control of the goods. Surrendering the originals at origin defeats that, and a presentation without them will be rejected.",
      },
      {
        q: "Does telex release cost anything?",
        a: "Most carriers charge a fee for it, and the amount varies by carrier and trade. Weigh it against the demurrage that accrues while cargo waits for couriered originals — on a short route the fee is usually a fraction of a single day's demurrage on one container.",
      },
      {
        q: "Do I still need a delivery order with a telex release?",
        a: "Yes. Release methods determine how the carrier's document condition is satisfied. They do not remove the requirement for charges to be settled, customs to be cleared, or a delivery order to be issued before the terminal will hand the container over.",
      },
      {
        q: "Is a 'surrendered' B/L the same as a telex release?",
        a: "Usually yes — carriers use 'surrendered', 'surrender at origin', 'telex release' and 'cable release' for broadly the same arrangement. Terminology varies enough between carriers that it is worth confirming what your specific carrier means rather than assuming, particularly on a trade you have not shipped before.",
      },
      {
        q: "Which method is best for intercompany shipments?",
        a: "A sea waybill, in most cases. There is no payment risk to secure, no need for the document to be transferable, and no reason to carry the cost and delay of originals. Express release achieves a similar outcome if you prefer to stay on a Bill of Lading form.",
      },
    ],
    related: [
      { href: "/guides/how-to-read-a-bill-of-lading", label: "How to read a Bill of Lading", blurb: "Consignee wording, originals and the fields that control release." },
      { href: "/templates/shipping-instructions-template", label: "Shipping instructions template", blurb: "State document type, release method and originals explicitly." },
      { href: "/sea-waybill-parser", label: "Sea waybill parser", blurb: "Extract and check the non-negotiable alternative." },
      { href: "/templates/delivery-order-template", label: "Delivery order data sheet", blurb: "The instrument that actually authorises collection." },
    ],
  },
];
