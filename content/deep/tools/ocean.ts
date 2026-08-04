import type { DeepContentMap } from "@/content/deep/types";

export const OCEAN_TOOL_DEEP: DeepContentMap = {
  "container-number-check": {
    updated: "2026-08-04",
    keywords: [
      "container number check",
      "ISO 6346 check digit calculator",
      "validate container number",
      "container number format",
      "shipping container number checker",
      "container check digit formula",
      "BIC code container",
    ],
    quickAnswer: {
      heading: "How a container number is validated",
      body:
        "A container number is eleven characters: a three-letter owner code, one equipment-category letter, a six-digit serial and a single check digit. To validate it, convert each of the first ten characters to its ISO 6346 numeric value, multiply each value by 2 raised to its zero-based position (1, 2, 4, 8 … 512), add the products, and divide the total by 11. The remainder is the expected check digit; a remainder of 10 is written as 0.",
      bullets: [
        "Owner code: three letters, registered with the BIC",
        "Category identifier: U, J or Z",
        "Serial: six digits assigned by the owner",
        "Check digit: one digit, derived from the other ten",
      ],
    },
    sections: [
      {
        heading: "Anatomy of an ISO 6346 container number",
        paragraphs: [
          "ISO 6346 is the international standard that governs how freight containers are identified and marked. The visible identifier painted on the door and printed on the Bill of Lading has four parts, and each part answers a different question. Reading them separately is the fastest way to spot a bad number before it reaches a carrier system, a customs filing or a terminal gate.",
          "The number is written without spaces in electronic data even though it is usually painted with a gap before the check digit. Any validator, including this one, should strip spaces, hyphens and lower case before it does arithmetic — otherwise a perfectly good number fails for cosmetic reasons.",
        ],
        table: {
          caption: "The four parts of MSCU 123456 7",
          columns: ["Part", "Characters", "Example", "What it tells you"],
          rows: [
            ["Owner code", "3 letters", "MSC", "The registered container owner or principal operator, allocated through the Bureau International des Conteneurs (BIC)"],
            ["Equipment category", "1 letter", "U", "U = freight container, J = detachable freight-container-related equipment, Z = trailers and chassis"],
            ["Serial number", "6 digits", "123456", "Assigned by the owner. It carries no meaning about size, type, age or contents"],
            ["Check digit", "1 digit", "7", "Calculated from the other ten characters. Its only job is to catch transcription errors"],
          ],
          note: "Owner codes always end in U, J or Z when combined with the category identifier — that is why almost every container number you see reads as four letters followed by seven digits.",
        },
      },
      {
        heading: "The ISO 6346 check digit formula",
        paragraphs: [
          "The check digit is a modulo-11 checksum with positional weights. Letters are not simply A=1, B=2. ISO 6346 assigns A=10 and then counts upward while skipping every multiple of 11 — so 11, 22 and 33 are never used as letter values. That skip is deliberate: it stops two different letters from producing the same remainder and therefore cancelling each other out in the sum.",
          "Each of the first ten characters is multiplied by 2 raised to the power of its zero-based position. The first character is multiplied by 1, the second by 2, the third by 4, and so on up to the tenth character which is multiplied by 512. Doubling weights make the checksum sensitive to both a wrong character and two characters swapped, which are the two mistakes humans and OCR engines actually make.",
        ],
        table: {
          caption: "ISO 6346 letter values",
          columns: ["Letters", "Values"],
          rows: [
            ["A B C D E F G H I", "10, 12, 13, 14, 15, 16, 17, 18, 19"],
            ["J K L M N O P Q R", "20, 21, 23, 24, 25, 26, 27, 28, 29"],
            ["S T U V W X Y Z", "30, 31, 32, 34, 35, 36, 37, 38"],
          ],
          note: "The gaps after K (21→23), U (32→34) and before J (19→20) are where the multiples of 11 have been skipped.",
        },
      },
      {
        heading: "Worked example: validating CSQU3054383",
        paragraphs: [
          "CSQU3054383 is the example used in the standard itself, which makes it a useful reference case for testing any implementation. Work left to right: convert, weight, multiply, then sum.",
          "The products are 13, 60, 112, 256, 48, 0, 320, 512, 768 and 4096, which total 6185. Dividing 6185 by 11 gives 562 with a remainder of 3. The expected check digit is therefore 3, which matches the printed final digit, so the number is structurally valid.",
        ],
        table: {
          caption: "Step-by-step calculation for CSQU3054383",
          columns: ["Position", "Character", "Value", "Weight", "Product"],
          rows: [
            ["1", "C", "13", "1", "13"],
            ["2", "S", "30", "2", "60"],
            ["3", "Q", "28", "4", "112"],
            ["4", "U", "32", "8", "256"],
            ["5", "3", "3", "16", "48"],
            ["6", "0", "0", "32", "0"],
            ["7", "5", "5", "64", "320"],
            ["8", "4", "4", "128", "512"],
            ["9", "3", "3", "256", "768"],
            ["10", "8", "8", "512", "4096"],
            ["Sum", "—", "—", "—", "6185"],
          ],
          note: "6185 ÷ 11 = 562 remainder 3 → check digit 3. Had the remainder been 10, the printed digit would be 0.",
        },
        callout: {
          tone: "info",
          title: "Why a remainder of 10 becomes 0",
          body:
            "The check character has to fit in one digit. Modulo 11 can return 10, which needs two characters, so the standard maps that single case to 0. It is the one place where a valid check digit does not equal the raw remainder, and it is the most common bug in home-made validators.",
        },
      },
      {
        heading: "What the size and type code beside the number means",
        paragraphs: [
          "Directly under or beside the container number you will usually see a four-character size-and-type code, also defined by ISO 6346. It is a separate field and it is not covered by the check digit. Operators frequently confuse the two, then wonder why a validator passes a number that clearly belongs to the wrong equipment.",
          "The first character is length, the second is height and width, and the last two describe the container type. Reading it lets you sanity-check a document: a Bill of Lading that lists 45G1 equipment but shows a 20ft freight rate deserves a second look before it is approved.",
        ],
        table: {
          caption: "Common ISO 6346 size and type codes",
          columns: ["Code", "Equipment", "Nominal length", "Nominal height"],
          rows: [
            ["22G1", "20ft general purpose", "20 ft", "8 ft 6 in"],
            ["42G1", "40ft general purpose", "40 ft", "8 ft 6 in"],
            ["45G1", "40ft high cube", "40 ft", "9 ft 6 in"],
            ["L5G1", "45ft high cube", "45 ft", "9 ft 6 in"],
            ["22R1", "20ft refrigerated", "20 ft", "8 ft 6 in"],
            ["45R1", "40ft high-cube reefer", "40 ft", "9 ft 6 in"],
            ["22U1", "20ft open top", "20 ft", "8 ft 6 in"],
            ["22T1", "20ft tank container", "20 ft", "8 ft 6 in"],
          ],
        },
      },
      {
        heading: "How to check a batch of container numbers",
        paragraphs: [
          "The checker accepts up to 100 numbers at a time, one per line or separated by commas, because container references usually arrive as a block: a stuffing report, a carrier manifest, a customs annex or a column pasted out of a spreadsheet. Batch checking is where check digits earn their keep — a single transposed pair in a list of forty is almost invisible to the eye and completely obvious to the arithmetic.",
        ],
        numbered: [
          "Paste the container numbers exactly as they appear on the source document, including any spaces — the checker normalises them for you.",
          "Read the status column first: pass means the printed check digit matches, fail means it does not, and a structural error means the input is not eleven ISO 6346 characters at all.",
          "For any failure, compare the expected full number shown by the checker against the container door photo, the equipment interchange receipt or the carrier's own record before you correct anything.",
          "Correct the value at its source — the stuffing record, the shipping instruction or the draft B/L — rather than only in the downstream copy you happen to be working in.",
          "Export the CSV audit and attach it to the shipment file so the check is evidenced if the number is later disputed.",
        ],
        callout: {
          tone: "warn",
          title: "A failed check digit is not always a typo in your file",
          body:
            "Occasionally the container itself is marked incorrectly, or a carrier system has propagated a bad number for years. When the door plate and the documents agree but the arithmetic does not, escalate to the carrier rather than silently 'fixing' the number — changing a reference that appears on a released Bill of Lading creates a bigger problem than the one you solved.",
        },
      },
      {
        heading: "What a valid check digit does and does not prove",
        paragraphs: [
          "This is the single most misunderstood point about container validation. The check digit is a transcription safeguard. It confirms that eleven characters are internally consistent — nothing more. It is computed from the number itself, so anyone can invent a structurally valid container number in a few seconds.",
        ],
        subsections: [
          {
            heading: "A passing check digit confirms",
            paragraphs: [
              "That the eleven characters form a well-formed ISO 6346 identifier and that the number has most likely survived copying, scanning or keying without corruption.",
            ],
            bullets: [
              "The owner code is three letters and the category identifier is U, J or Z",
              "The serial is six digits",
              "The printed check digit matches the modulo-11 calculation",
            ],
          },
          {
            heading: "A passing check digit does not confirm",
            paragraphs: [
              "Anything about the physical box or the shipment attached to it. Every operational fact still has to come from the carrier, the terminal or a physical inspection.",
            ],
            bullets: [
              "That the owner code is actually registered with the BIC to a real operator",
              "That the container exists, is in service, or is not scrapped",
              "That it is currently loaded with the cargo on your documents",
              "That the seal number, size, type or tare weight on the document is correct",
              "That the box is roadworthy or holds a valid CSC safety-approval plate",
            ],
          },
        ],
      },
      {
        heading: "Where container number errors cause real damage",
        paragraphs: [
          "The cost of a wrong container number is rarely the correction itself — it is the downstream process that silently fails. Because container numbers key almost every automated message in ocean freight, one bad character can break the link between a shipment and its own paperwork.",
        ],
        bullets: [
          "Customs entries that reference a container the carrier's manifest does not contain, triggering a mismatch hold",
          "Terminal gate rejections when a haulier presents a booking whose equipment reference does not exist",
          "Failed EDI messages and track-and-trace lookups that return nothing, so nobody notices the shipment has gone quiet",
          "Delivery orders released against the wrong box, producing a misdelivery claim",
          "Demurrage and detention invoices that cannot be reconciled because the equipment reference does not match your own records",
          "Insurance and claims documentation that fails to prove which container held the damaged cargo",
        ],
      },
    ],
    faqs: [
      {
        q: "What is the ISO 6346 check digit formula in one line?",
        a: "Check digit = (Σ character value × 2^position) mod 11, using zero-based positions 0 to 9 for the first ten characters, with letter values A=10 counting upward while skipping every multiple of 11, and with a remainder of 10 written as 0.",
      },
      {
        q: "Why do almost all container numbers have U as the fourth letter?",
        a: "The fourth character is the equipment category identifier. U is assigned to freight containers, which is the overwhelming majority of equipment you will see on a Bill of Lading. J marks detachable freight-container-related equipment such as a clip-on generator set, and Z marks trailers and chassis. If you see a J or Z where you expected a shipping container, the document may be describing something other than the box itself.",
      },
      {
        q: "Can two different containers have the same number?",
        a: "They should not. The owner code is allocated centrally through the BIC and the serial is controlled by the owner, so the combination is intended to be unique. In practice, duplicates appear when an owner code is reassigned after a company exits the market and the old boxes are still circulating, or when a number is reused after a long interval. If a lookup returns two live records for the same number, treat it as a data-quality issue and confirm with the carrier rather than assuming one record is wrong.",
      },
      {
        q: "Does the checker tell me who owns the container?",
        a: "No. It validates structure and arithmetic only. The owner code prefix is a strong hint — most three-letter prefixes are recognisable to anyone who works in ocean freight — but the authoritative registry of owner codes is maintained by the BIC, and this tool does not query it. Do not infer ownership, and never infer liability, from a prefix alone.",
      },
      {
        q: "How many container numbers can I check at once?",
        a: "Up to 100 per batch. Paste them one per line, comma-separated or copied straight out of a spreadsheet column; spaces, hyphens and lower case are normalised before the calculation. Every row is reported separately with a pass, fail or structural-error status, and the whole batch can be exported as a CSV audit file.",
      },
      {
        q: "The check digit fails but the number is definitely correct. What now?",
        a: "First, confirm you have all eleven characters and that no digit has been dropped or duplicated during copying — this accounts for most cases. Then compare the document against a photograph of the container door, because scanned or faxed paperwork frequently turns 8 into B, 0 into O, 5 into S and 1 into I. If the door plate and the document genuinely agree and the arithmetic still fails, the container is mis-marked; report it to the carrier and record their written confirmation rather than editing the reference yourself.",
      },
      {
        q: "Is the check digit the same as a seal number?",
        a: "No, and they are never interchangeable. The check digit is one character derived from the container number. A seal number is an independent identifier on the physical security seal fitted after stuffing, issued by whoever sealed the box. Both belong on the Bill of Lading and packing list, and a mismatch between the seal on the document and the seal on the container at delivery is a cargo-security event, not a clerical one.",
      },
      {
        q: "Do container numbers ever contain letters in the serial?",
        a: "No. Under ISO 6346 the six-character serial is numeric. If you are looking at a reference with letters after the category identifier, you are probably looking at a booking number, an equipment interchange receipt number or an internal reference rather than a container number — and it should not be validated with this formula.",
      },
      {
        q: "Does a valid container number mean the shipment is real?",
        a: "No. Because the check digit is calculated from the number itself, a structurally valid number can be fabricated instantly. Container number validation is a data-quality control, not a fraud control. Confirm the existence of cargo through the carrier's own booking and manifest systems, and treat unexpected documents referencing valid-looking numbers with the same caution as any other unverified claim.",
      },
      {
        q: "Should I validate container numbers before or after customs filing?",
        a: "Before, without exception. A container reference that does not exist on the carrier's manifest is one of the more common causes of a mismatch hold, and correcting a filed entry costs far more time than checking a list. The practical habit is to validate at the point the number first enters your system — the stuffing report or the shipping instruction — so the error never propagates.",
      },
      {
        q: "Can GainingDocx check container numbers automatically inside documents?",
        a: "Yes. When you extract a Bill of Lading, sea waybill, packing list or arrival notice in the workspace, every container number found on the page is put through this same deterministic calculation. Failures are flagged inline with the expected number so you can resolve them during review rather than discovering them after export.",
      },
      {
        q: "Is my data uploaded when I use this checker?",
        a: "The container-number calculation is deterministic arithmetic and runs without storing your list against an account. If you want the check to become part of a retained shipment record — with the source document, the review trail and the export attached — run the document through the workspace instead, where storage is explicit and deletable.",
      },
    ],
    related: [
      { href: "/guides/iso-6346-container-number-check-digit", label: "ISO 6346 check digit: formula and worked example", blurb: "The full derivation, letter-value table and validation limits in guide form." },
      { href: "/bill-of-lading-parser", label: "Bill of Lading parser", blurb: "Extract every container, seal and weight from a B/L and validate the check digits automatically." },
      { href: "/tools/container-load-calculator", label: "Container load calculator", blurb: "Check carton fit and payload for 20GP, 40GP, 40HC and 45HC equipment." },
      { href: "/tools/port-code-lookup", label: "UN/LOCODE port lookup", blurb: "Confirm the five-character location codes printed alongside the equipment on your B/L." },
    ],
  },

  "container-load-calculator": {
    updated: "2026-08-04",
    keywords: [
      "container load calculator",
      "how many cartons fit in a 20ft container",
      "container loading calculator",
      "40ft container capacity CBM",
      "container internal dimensions",
      "container payload capacity",
      "pallets per container",
    ],
    quickAnswer: {
      heading: "How many cartons fit in a container",
      body:
        "Divide the container's usable internal volume by the carton volume, then check the answer against payload. A 20ft general-purpose container holds roughly 33 CBM and about 28 tonnes; a 40ft holds roughly 67 CBM, and a 40ft high cube roughly 76 CBM. Real loads reach about 80–85% of nominal volume once orientation, pallets, dunnage and door clearance are accounted for, so treat the theoretical count as a ceiling rather than a plan.",
      bullets: [
        "20ft GP ≈ 33.2 CBM · 28,200 kg payload",
        "40ft GP ≈ 67.7 CBM · 26,600 kg payload",
        "40ft HC ≈ 76.3 CBM · 26,400 kg payload",
        "45ft HC ≈ 86.0 CBM · 27,700 kg payload",
      ],
    },
    sections: [
      {
        heading: "Container internal dimensions and capacity",
        paragraphs: [
          "Every fit calculation starts from internal dimensions, not the external size the equipment is named after. A '20ft' container is 20 feet long on the outside; inside, corrugations, corner castings, flooring and door frames take space away. The figures below are representative of standard dry equipment in general circulation and are what this calculator uses, but individual boxes vary by manufacturer and age, and the door opening is always narrower and lower than the internal cross-section.",
          "Payload matters as much as volume. Maximum gross weight is a regulated limit for the container as a unit; payload is that limit minus the tare weight stencilled on the door. Dense cargo hits the payload ceiling long before it fills the space, and road weight limits in the origin or destination country frequently bite before the container limit does.",
        ],
        table: {
          caption: "Representative internal dimensions, capacity and payload for standard dry containers",
          columns: ["Equipment", "Internal L × W × H (m)", "Nominal capacity", "Typical tare", "Typical payload", "Door opening W × H (m)"],
          rows: [
            ["20ft general purpose (22G1)", "5.90 × 2.35 × 2.39", "≈ 33.2 CBM", "≈ 2,200 kg", "≈ 28,200 kg", "2.34 × 2.28"],
            ["40ft general purpose (42G1)", "12.03 × 2.35 × 2.39", "≈ 67.7 CBM", "≈ 3,800 kg", "≈ 26,600 kg", "2.34 × 2.28"],
            ["40ft high cube (45G1)", "12.03 × 2.35 × 2.69", "≈ 76.3 CBM", "≈ 3,900 kg", "≈ 26,400 kg", "2.34 × 2.58"],
            ["45ft high cube (L5G1)", "13.55 × 2.35 × 2.69", "≈ 86.0 CBM", "≈ 4,800 kg", "≈ 27,700 kg", "2.34 × 2.58"],
          ],
          note: "Indicative figures for planning. Always confirm the tare and maximum gross weight stencilled on the specific container, and confirm road weight limits for the origin and destination legs separately.",
        },
      },
      {
        heading: "How the calculator tests carton fit",
        paragraphs: [
          "A carton can sit in a container in six orthogonal orientations — each of the three dimensions can point along the container length, and for each of those the remaining two can be swapped. The calculator evaluates all six, and for each one divides the container length, width and height by the corresponding carton dimension, discards the remainder, and multiplies the three whole numbers together. The best orientation is reported.",
          "This is a block-stacking model: identical cartons, all facing the same way, stacked in a rectangular grid. It deliberately does not attempt clever mixed-orientation packing, because a stow that only works if the loading crew rotates every third carton is not a stow that survives contact with a real warehouse at 6am.",
        ],
        numbered: [
          "Enter the carton length, width and height in your working unit, plus the weight of one carton.",
          "Enter how many cartons you actually have, so the calculator can tell you whether they fit rather than only how many would.",
          "Select the equipment type, or enter custom internal dimensions and payload if you are loading a non-standard box.",
          "Read the spatial count and the weight count separately — the smaller of the two is your real answer.",
          "Apply a utilisation allowance before you commit: for floor-loaded cartons, plan around 85% of the theoretical count.",
        ],
        callout: {
          tone: "info",
          title: "Space count vs weight count",
          body:
            "The calculator reports both a dimensional maximum and a payload maximum. When the payload figure is lower, your cargo is weight-constrained: adding volume changes nothing and you need more equipment, not better packing. When the spatial figure is lower, your cargo is volume-constrained and carton redesign or better orientation genuinely helps.",
        },
      },
      {
        heading: "Pallets per container",
        paragraphs: [
          "Most cargo does not travel as loose cartons. If you are palletising, the pallet footprint — not the carton — determines the base layer, and the number of layers depends on pallet height against the internal height, minus clearance for the forklift and any top load restrictions.",
          "The two dominant footprints are the EUR/EPAL pallet at 1200 × 800 mm and the industrial or GMA pallet at 1200 × 1000 mm. The counts below are single-layer floor positions for standard equipment; double-stacking doubles them if the cargo, pallet strength and height allow it.",
        ],
        table: {
          caption: "Typical single-layer pallet positions by equipment",
          columns: ["Equipment", "EUR pallet 1200 × 800", "Industrial pallet 1200 × 1000"],
          rows: [
            ["20ft general purpose", "10–11", "9–10"],
            ["40ft general purpose", "23–25", "20–21"],
            ["40ft high cube", "23–25", "20–21"],
            ["45ft high cube", "27", "24"],
          ],
          note: "Counts depend on whether pallets are loaded straight or in a mixed pinwheel arrangement, and on whether overhang is acceptable. Confirm with the loading warehouse before booking equipment.",
        },
      },
      {
        heading: "Why real loads never reach the theoretical number",
        paragraphs: [
          "Nominal capacity assumes a perfect rectangular prism of cargo filling every cubic centimetre. No load achieves that. Understanding where the space goes is what turns a calculator result into a booking you can defend.",
        ],
        bullets: [
          "Door clearance: the doorway is roughly 100 mm narrower and 110 mm lower than the internal cross-section, so the last tier often cannot be loaded to full height",
          "Corrugated side walls take a few centimetres of usable width at intervals along the box",
          "Cartons bulge — a nominally 400 mm carton packed tight measures more, and the error compounds across twenty rows",
          "Dunnage, airbags, lashing and edge protection consume space that the calculator does not model",
          "Cargo cannot be stacked above its own crush rating, which frequently caps height before the ceiling does",
          "Weight has to be distributed evenly along the floor; a dense product loaded only at one end can exceed axle limits even when total payload is legal",
          "Reefer equipment loses internal volume to the machinery and must keep the T-floor and air return clear, so it holds materially less than a dry box of the same nominal size",
        ],
        callout: {
          tone: "warn",
          title: "This is a fit estimate, not a stow plan",
          body:
            "A stow plan is a safety document. It accounts for load distribution, securing, crush strength, compatibility and handling, and it is produced by people who can see the cargo. Use this calculator to choose equipment and sanity-check a quotation; do not hand its output to a loading crew as instructions.",
        },
      },
      {
        heading: "Choosing between 20ft, 40ft and high cube",
        paragraphs: [
          "The decision is almost always volume against weight. A 40ft container gives roughly twice the volume of a 20ft but only a marginally higher payload — in many trades the 40ft payload is actually lower than the 20ft. That single fact drives most equipment choices in ocean freight.",
          "As a rule of thumb, cargo denser than about 850 kg per CBM will hit the payload limit of a 20ft before filling it, which makes two 20ft units the sensible answer for heavy goods such as tiles, stone, machinery parts or liquids in drums. Light, bulky cargo — furniture, packaging, textiles, plastics — should go into a 40ft high cube, where the extra 300 mm of internal height adds roughly 9 CBM over a standard 40ft at little or no freight premium in most trades.",
        ],
        table: {
          caption: "Which equipment suits which cargo density",
          columns: ["Cargo density", "Behaviour", "Usual answer"],
          rows: [
            ["Above ~850 kg/CBM", "Weight-constrained: payload runs out with the box half full", "20ft GP, possibly multiple units"],
            ["400–850 kg/CBM", "Balanced: volume and weight run out together", "40ft GP"],
            ["Below ~400 kg/CBM", "Volume-constrained: the box fills long before the payload", "40ft HC or 45ft HC"],
            ["Below ~250 kg/CBM with under 13–15 CBM", "Too little to justify a whole box", "Consider LCL — check the W/M calculation first"],
          ],
        },
      },
      {
        heading: "Verified Gross Mass and why your fit calculation feeds it",
        paragraphs: [
          "Under the SOLAS Convention, a packed container cannot be loaded onto a vessel unless the shipper has provided a Verified Gross Mass — the total weight of the cargo, packaging, dunnage and the container tare. VGM must be verified by weighing the packed container, or by weighing all the packages and adding the tare using a certified method; it may not simply be estimated.",
          "The load calculation you do here is a planning figure, not a VGM. It is still useful evidence: if your planned gross weight and the weighbridge figure disagree by more than a small margin, something in the load is not what the packing list says it is, and it is far cheaper to discover that at the warehouse than at the terminal gate.",
        ],
      },
    ],
    faqs: [
      {
        q: "How many CBM fit in a 20ft container?",
        a: "The nominal internal capacity of a standard 20ft general-purpose container is about 33.2 CBM. A realistic floor-loaded carton stow reaches roughly 25–28 CBM once orientation losses, door clearance, dunnage and crush limits are taken into account. Palletised cargo typically achieves less again, because the pallet itself consumes about 140 mm of height per layer.",
      },
      {
        q: "How many CBM fit in a 40ft and a 40ft high cube?",
        a: "About 67.7 CBM for a standard 40ft and about 76.3 CBM for a 40ft high cube — the high cube's extra foot of external height adds roughly 8.6 CBM. Practical loads are usually 80–85% of those figures. The high cube is the better buy for light cargo in most trades because the freight differential over a standard 40ft is small relative to the extra volume.",
      },
      {
        q: "Why is the payload of a 40ft container barely higher than a 20ft?",
        a: "Maximum gross weight is set by the container's structural rating and by road and lifting limits, not by its length. A 20ft is rated at about 30,480 kg gross with a light tare, leaving roughly 28 tonnes of payload; a 40ft has nearly twice the tare and a similar gross rating, so its payload can be lower. This is why heavy cargo is shipped in 20ft units and light cargo in 40ft high cubes.",
      },
      {
        q: "Does the calculator handle mixed carton sizes?",
        a: "No. It models identical cartons in a single orientation, because that is the only case where a deterministic answer is meaningful. For a mixed-SKU load, run each carton group separately to understand how much space each consumes, add the volumes, and compare the total against usable capacity — then have the loading warehouse confirm the physical stow.",
      },
      {
        q: "Should I use nominal capacity or 85% when quoting a customer?",
        a: "Quote from the realistic figure, not the nominal one. Committing to 33 CBM in a 20ft and then discovering the load stops at 27 CBM is one of the more common ways a shipment ends up needing a second container at short notice, at spot rates. Nominal capacity is useful only for comparing equipment types against each other.",
      },
      {
        q: "What is the difference between a 40ft high cube and a standard 40ft?",
        a: "Height only. Both are 40 feet long and 8 feet wide externally; the high cube is 9 feet 6 inches tall against 8 feet 6 inches, giving roughly 300 mm more internal height and about 8.6 CBM more capacity. Note that the extra height matters for road transport — some routes, tunnels and low-bridge corridors restrict high cubes, and a few countries limit them on specific roads.",
      },
      {
        q: "Can I load to the full internal height?",
        a: "Rarely. The door aperture is roughly 110 mm lower than the internal ceiling, so the top tier usually has to be loaded before the doors are reached, or omitted entirely. You also need clearance for handling equipment, and the cargo's own crush rating often caps stack height well below the ceiling. Plan the top tier deliberately rather than assuming it.",
      },
      {
        q: "How many pallets fit in a 20ft container?",
        a: "Ten to eleven EUR pallets (1200 × 800 mm) or nine to ten industrial pallets (1200 × 1000 mm) in a single floor layer, depending on whether they are loaded straight or pinwheeled and whether slight overhang is acceptable. Double-stacking doubles the count if the pallet, the cargo and the internal height allow it — check the height of a loaded pallet against the 2.39 m internal height of a standard 20ft.",
      },
      {
        q: "Does this calculator account for weight distribution?",
        a: "No. It compares total cargo weight against total payload. Distribution is a separate and genuinely safety-critical question: cargo concentrated at one end of the container can be within total payload and still exceed axle limits on the road leg, or create an unsafe lift. A loading plan from the warehouse or a specialist stow tool is the right instrument for that.",
      },
      {
        q: "What about refrigerated, open-top and flat-rack equipment?",
        a: "The standard figures here describe dry containers. A reefer of the same nominal size holds materially less because the refrigeration unit occupies internal length and the T-floor and air-return path must stay clear. Open tops, flat racks and tanks have their own geometry and loading rules entirely. Enter custom internal dimensions if you are working with specialised equipment, and confirm the payload from the container's own CSC plate.",
      },
      {
        q: "When should I switch from LCL to a full container?",
        a: "The usual crossover in most trades is somewhere between 13 and 15 CBM, because LCL is charged per revenue ton and the per-unit rate stops being competitive once the volume approaches half a 20ft. The crossover moves with the trade lane, the season and the destination charges, which are often the deciding factor — run the LCL W/M calculation and compare the all-in landed cost rather than the ocean freight line alone.",
      },
      {
        q: "Does GainingDocx check container utilisation against my documents?",
        a: "The workspace reconciles what your documents claim. When a packing list, Bill of Lading and commercial invoice are grouped as one shipment, package counts, gross weights and CBM totals are compared across them, and a container whose declared load exceeds plausible capacity or payload is surfaced as a discrepancy for review.",
      },
    ],
    related: [
      { href: "/tools/cbm-calculator", label: "CBM calculator", blurb: "Total the volume of every carton group before you choose equipment." },
      { href: "/tools/lcl-freight-calculator", label: "LCL freight W/M calculator", blurb: "Compare the cost of shipping loose against booking a full container." },
      { href: "/guides/how-to-calculate-cbm-for-shipping", label: "How to calculate CBM for shipping", blurb: "Formulas, unit conversions and the mistakes that distort a volume total." },
      { href: "/templates/container-packing-list-template", label: "Container packing list template", blurb: "Allocate packages and cargo lines to container and seal numbers with running totals." },
    ],
  },

  "lcl-freight-calculator": {
    updated: "2026-08-04",
    keywords: [
      "LCL freight calculator",
      "weight or measure W/M",
      "revenue ton calculator",
      "LCL shipping cost",
      "CBM vs metric ton freight",
      "LCL vs FCL breakeven",
      "ocean freight calculator",
    ],
    quickAnswer: {
      heading: "How LCL freight is calculated",
      body:
        "LCL ocean freight is charged per revenue ton on a weight-or-measure basis. Compare the shipment's volume in cubic metres with its gross weight in metric tons and take whichever number is higher — that is the revenue ton count. Multiply it by the quoted W/M rate to get the base ocean freight, then add origin and destination charges, which on a small LCL shipment routinely exceed the freight itself.",
      bullets: [
        "1 revenue ton = 1 CBM or 1,000 kg, whichever is greater",
        "Most tariffs apply a minimum of 1 RT",
        "Local charges are usually quoted per RT as well",
        "The all-in landed cost is the only number worth comparing",
      ],
    },
    sections: [
      {
        heading: "What weight or measure (W/M) actually means",
        paragraphs: [
          "Weight or measure is a pricing basis, not a unit. It exists because a ship is constrained by two things at once: how much space cargo takes and how much it weighs. A carrier that charged only by weight would lose money on pillows; one that charged only by volume would lose money on steel. W/M resolves this by charging on whichever measure is more expensive for the carrier to carry.",
          "The conversion is deliberately simple: one cubic metre is treated as equivalent to one metric ton. Compare your shipment's CBM against its weight expressed in metric tons, take the greater figure, and that is the number of revenue tons — often abbreviated RT, W/M or occasionally 'freight ton' — that the rate is applied to.",
        ],
        table: {
          caption: "Worked comparisons on a USD 45.00 per W/M rate",
          columns: ["Shipment", "Volume", "Gross weight", "Revenue tons", "Controlled by", "Base freight"],
          rows: [
            ["Cushions", "8.400 CBM", "1,150 kg (1.150 t)", "8.400 RT", "Measurement", "USD 378.00"],
            ["Ceramic tiles", "2.100 CBM", "3,900 kg (3.900 t)", "3.900 RT", "Weight", "USD 175.50"],
            ["Mixed hardware", "4.000 CBM", "4,000 kg (4.000 t)", "4.000 RT", "Either — they tie", "USD 180.00"],
            ["Sample carton", "0.180 CBM", "42 kg (0.042 t)", "1.000 RT (minimum)", "Tariff minimum", "USD 45.00"],
          ],
          note: "Rates shown are illustrative. Always apply your own quoted rate and confirm the tariff minimum, which is commonly 1 RT but can be higher on some lanes.",
        },
      },
      {
        heading: "The formula, step by step",
        paragraphs: [
          "The arithmetic is short, but the inputs are where shipments go wrong. Use the CBM and gross weight from the source document — the packing list or the Bill of Lading — not the figures from a quotation prepared before the goods were packed. LCL is measured and weighed at the consolidation warehouse, and the CFS measurement is what you will be invoiced on.",
        ],
        numbered: [
          "Total the shipment volume in cubic metres from the packing list, adding each carton group separately.",
          "Total the gross weight in kilograms and divide by 1,000 to express it in metric tons.",
          "Take the higher of the two figures — that is your revenue ton count.",
          "Apply the tariff minimum if the result is below it, which for most LCL tariffs means rounding up to 1 RT.",
          "Multiply the revenue tons by the quoted W/M rate to get base ocean freight.",
          "Add every origin charge, destination charge and per-document fee separately, noting which of them are also charged per RT.",
          "Compare the all-in total against an FCL quotation before committing.",
        ],
        callout: {
          tone: "warn",
          title: "The CFS re-measure is the figure that counts",
          body:
            "Consolidators measure and weigh cargo on receipt, and they measure the outside of the cargo as presented — including pallets, overhang, shrink wrap and any protruding edge. A pallet base of 1.2 × 1.0 m with cartons stacked to 1.5 m is measured as 1.8 CBM even if the cartons themselves total 1.55 CBM. Build that into your estimate rather than discovering it on the invoice.",
        },
      },
      {
        heading: "The charges that are not ocean freight",
        paragraphs: [
          "On a typical small LCL shipment, the W/M ocean freight is a minority of the final bill. Local charges at both ends are where the cost sits, and they are the main reason a headline rate of 'USD 12 per CBM' can turn into a four-figure invoice for three cubic metres. Ask for these in writing before booking, and ask which are per RT, which are per shipment and which are per Bill of Lading.",
        ],
        subsections: [
          {
            heading: "Origin charges",
            paragraphs: [
              "Incurred before the container leaves the load port, usually billed by the consolidator or the origin agent.",
            ],
            bullets: [
              "CFS receiving or warehouse handling, normally per CBM or per RT",
              "Origin terminal handling (THC), per RT or apportioned per shipment",
              "Bill of Lading or documentation fee, per document",
              "Export customs declaration and any inspection fee",
              "Advance manifest filing where the destination requires it, such as AMS for the United States or ENS for the European Union",
              "VGM submission fee, and fumigation or ISPM 15 treatment if wooden packaging is used",
            ],
          },
          {
            heading: "Destination charges",
            paragraphs: [
              "Frequently the larger half of the bill, and frequently the half that was not quoted. On a collect or ex-works LCL shipment these land on the consignee, which is a common source of disputes.",
            ],
            bullets: [
              "Destination THC and CFS deconsolidation or unstuffing, per RT",
              "Delivery order and documentation release fee",
              "Customs clearance, entry filing and any duty or tax disbursement fee",
              "Storage after free time at the CFS, which is usually much shorter than FCL demurrage free time",
              "Customs examination, X-ray or tailgate inspection charges if selected",
              "Final mile delivery, chassis, waiting time and any residential or limited-access surcharge",
            ],
          },
        ],
      },
      {
        heading: "LCL against FCL: where the crossover sits",
        paragraphs: [
          "LCL wins on small volumes because you pay only for the space you use. FCL wins once you are buying enough revenue tons that a whole container becomes cheaper per unit — and it wins on more than price, because an FCL box is not opened, re-measured, unstuffed or exposed to other people's cargo.",
          "The crossover in most trades falls somewhere between 13 and 15 CBM, but the ocean freight comparison alone is misleading. LCL destination charges scale with volume; FCL destination charges are largely fixed per container. That means the true crossover is often lower than the freight-only comparison suggests, sometimes as low as 10 CBM on lanes with expensive CFS handling.",
        ],
        table: {
          caption: "Practical comparison beyond price",
          columns: ["Factor", "LCL", "FCL"],
          rows: [
            ["Cost basis", "Per revenue ton, plus per-RT local charges", "Per container, largely fixed"],
            ["Transit time", "Longer — consolidation and deconsolidation add days at both ends", "Shorter — direct terminal to terminal"],
            ["Handling", "Cargo is handled loose at least twice more", "Sealed at origin, opened at destination"],
            ["Damage exposure", "Higher: co-loaded with unknown cargo, restacked at CFS", "Lower: your cargo only"],
            ["Free time at destination", "Short CFS storage allowance, often 3–7 days", "Longer demurrage and detention free time"],
            ["Measurement risk", "Re-measured at CFS; the invoice can exceed the quote", "None — you bought the box"],
            ["Best for", "Under about 13 CBM, or when cash flow rules out full loads", "Above about 13–15 CBM, fragile or high-value cargo, tight schedules"],
          ],
        },
      },
      {
        heading: "Auditing an LCL invoice",
        paragraphs: [
          "LCL invoices are worth checking line by line, because the number of separately quoted components makes silent additions easy. The most productive audit is not recalculating the freight — it is confirming that the volume and weight the carrier billed on match the volume and weight your packing list declares.",
        ],
        bullets: [
          "Confirm the billed CBM against your packing list, and ask for the CFS measurement record if they differ by more than a rounding margin",
          "Confirm the billed gross weight against the weighbridge or CFS weight ticket",
          "Check which measure controlled: being billed on weight when your cargo is clearly volume-controlled is an arithmetic error worth challenging",
          "Verify the rate applied matches the written quotation, including the validity date — LCL rates expire quickly",
          "Check each local charge against the quotation and query anything that was not disclosed",
          "Confirm that per-RT charges used the same revenue ton figure as the freight line",
          "Check whether the tariff minimum was applied correctly on small shipments",
          "Confirm currency and any exchange rate applied to locally billed charges",
        ],
        callout: {
          tone: "check",
          title: "Keep the calculation, not just the answer",
          body:
            "Export the calculation audit and file it with the packing list and the invoice. A dispute raised three weeks later is won by whoever can show their working — a reconstructed argument from memory almost never recovers the difference.",
        },
      },
    ],
    faqs: [
      {
        q: "What is a revenue ton in LCL shipping?",
        a: "A revenue ton — also written RT, W/M or freight ton — is the greater of one cubic metre of volume or one metric ton of weight. It is the unit LCL freight and most LCL local charges are billed on. A shipment of 6.2 CBM weighing 2.1 tonnes is 6.2 RT; the same 6.2 CBM weighing 9 tonnes is 9 RT.",
      },
      {
        q: "How do I calculate LCL freight cost?",
        a: "Take the greater of the shipment's CBM and its gross weight in metric tons, apply the tariff minimum if the result is below it, and multiply by the quoted W/M rate. That gives base ocean freight. Then add every origin and destination charge separately — on shipments under about five revenue tons, those charges usually exceed the freight line, so a freight-only estimate will materially understate the cost.",
      },
      {
        q: "Why did the consolidator bill more CBM than my packing list shows?",
        a: "Because LCL cargo is measured as presented at the CFS, not as calculated from carton dimensions. Pallets add height, shrink wrap and overhang add width, and irregular stacks are measured to the outermost point. A palletised shipment is routinely 10–20% larger by measurement than the sum of its cartons. Ask for the CFS measurement record if the difference looks larger than that, and build the allowance into future quotations.",
      },
      {
        q: "Is 1 CBM always equal to 1,000 kg for freight?",
        a: "For ocean LCL under a W/M basis, yes — that is the standard conversion. It is not the conversion used in air freight, where the divisor is typically 6,000 cm³/kg for general cargo and 5,000 cm³/kg for express, giving 167 kg and 200 kg per cubic metre respectively. Do not carry an air divisor into an ocean calculation or vice versa.",
      },
      {
        q: "What is the minimum charge for an LCL shipment?",
        a: "Most LCL tariffs apply a minimum of one revenue ton, so a shipment of 0.3 CBM weighing 60 kg is still billed as 1 RT. Some lanes and some consolidators set a higher minimum, and separate minimums often apply to individual local charges. Confirm the minimum in writing — it is the single biggest determinant of cost on very small shipments.",
      },
      {
        q: "At what volume should I switch from LCL to FCL?",
        a: "Commonly between 13 and 15 CBM, but compare landed cost rather than ocean freight. LCL local charges scale with revenue tons while FCL local charges are largely fixed per container, so on lanes with expensive CFS handling the crossover can fall to around 10 CBM. Also weigh the non-price factors: FCL is faster, handled less and not exposed to co-loaded cargo.",
      },
      {
        q: "Are destination charges included in an LCL quote?",
        a: "Often not. A quotation that names only a per-CBM ocean rate is quoting one line of a bill with eight or ten lines. Always ask for the destination charge schedule in writing before booking, especially on collect or ex-works terms where the consignee receives them. Undisclosed destination charges are the most common LCL complaint and the hardest to negotiate after arrival.",
      },
      {
        q: "How is chargeable volume rounded?",
        a: "Practice varies. Many tariffs bill to three decimal places of a cubic metre; others round up to the next 0.1 or the next whole RT. Rounding rules materially change small invoices, so confirm them at the quotation stage rather than assuming, and check the applied rounding when you audit the invoice.",
      },
      {
        q: "Does LCL have demurrage and detention?",
        a: "Not in the same form. Because you never take possession of a container, there is no detention. What you do face is CFS storage at destination once free time expires, and that allowance is typically much shorter than FCL free time — often three to seven days. It accrues per revenue ton per day, so a slow customs clearance on a bulky LCL shipment gets expensive quickly.",
      },
      {
        q: "Which document should I take the CBM and weight from?",
        a: "The packing list for planning and the Bill of Lading for verification, because the B/L reflects what the carrier accepted. If the two disagree, resolve the difference before the invoice arrives — a mismatch between the packing list and the B/L is also one of the fastest ways to attract a customs query at destination.",
      },
      {
        q: "Can I use this calculator for break bulk or air freight?",
        a: "No. Break bulk uses its own tariff structures with different conversion factors, and air freight uses volumetric divisors rather than the 1 CBM to 1 tonne equivalence. Use the chargeable weight calculator for air and express shipments, and obtain a specific quotation for break bulk or project cargo.",
      },
      {
        q: "Can GainingDocx audit freight invoices automatically?",
        a: "Yes. Extracting a freight invoice returns every charge as a separate reviewable line rather than a grand total, and grouping it with the Bill of Lading and packing list from the same shipment lets the workspace compare billed volume, weight and references against the transport documents that support them.",
      },
    ],
    related: [
      { href: "/tools/cbm-calculator", label: "CBM calculator", blurb: "Produce the cubic-metre total that drives the whole W/M comparison." },
      { href: "/freight-invoice-parser", label: "Freight invoice parser", blurb: "Extract every charge line from an LCL invoice for audit against the quotation." },
      { href: "/tools/container-load-calculator", label: "Container load calculator", blurb: "Check whether the same cargo justifies a full container instead." },
      { href: "/tools/demurrage-detention-calculator", label: "Demurrage and detention calculator", blurb: "Audit the time-based charges that follow an ocean shipment to destination." },
    ],
  },

  "port-code-lookup": {
    updated: "2026-08-04",
    keywords: [
      "UN/LOCODE lookup",
      "port code search",
      "UNLOCODE port codes",
      "seaport code finder",
      "port of loading code",
      "five character location code",
      "UN LOCODE list",
    ],
    quickAnswer: {
      heading: "What a UN/LOCODE is",
      body:
        "A UN/LOCODE is a five-character code that identifies a trade and transport location: two letters for the country under ISO 3166-1, then three characters for the place. Shanghai is CNSHA, Rotterdam is NLRTM, Los Angeles is USLAX. The code is maintained by the United Nations Economic Commission for Europe and is the standard reference for ports of loading and discharge on shipping documents.",
      bullets: [
        "Characters 1–2: ISO country code",
        "Characters 3–5: location, using A–Z and 2–9",
        "Digits 0 and 1 are never used",
        "One location can carry several transport functions",
      ],
    },
    sections: [
      {
        heading: "How a UN/LOCODE is built",
        paragraphs: [
          "The structure is deliberately restrictive so that codes stay unambiguous when they are handwritten, faxed, scanned or read aloud over a phone. The first two characters are the ISO 3166-1 alpha-2 country code — CN for China, NL for the Netherlands, US for the United States. The remaining three identify the location within that country.",
          "Those three characters may be letters A to Z or the digits 2 to 9. Zero and one are excluded because they are too easily confused with the letters O and I in printed and scanned documents. That single design decision prevents an entire category of transcription error, and it is why you will never see a UN/LOCODE containing a 0 or a 1.",
        ],
        table: {
          caption: "Reading familiar port codes",
          columns: ["Code", "Country", "Location", "Notes"],
          rows: [
            ["CNSHA", "CN — China", "Shanghai", "The world's busiest container port; frequently confused with CNSGH, which is not the correct code"],
            ["SGSIN", "SG — Singapore", "Singapore", "Country and city coincide, so the code looks redundant but follows the same rule"],
            ["NLRTM", "NL — Netherlands", "Rotterdam", "Europe's largest container port"],
            ["USLAX", "US — United States", "Los Angeles", "The three-character part matches the IATA airport code here by coincidence, not by rule"],
            ["AEJEA", "AE — United Arab Emirates", "Jebel Ali", "The port, distinct from AEDXB for Dubai"],
            ["DEHAM", "DE — Germany", "Hamburg", "Covers the port; individual terminals have no separate UN/LOCODE"],
            ["INNSA", "IN — India", "Jawaharlal Nehru (Nhava Sheva)", "Distinct from INBOM for Mumbai, though the two are frequently interchanged in error"],
          ],
        },
      },
      {
        heading: "The function classifier: why not every code is a seaport",
        paragraphs: [
          "UN/LOCODE covers trade and transport locations generally, not seaports specifically. Each entry carries an eight-position function classifier that says what the location actually does. This matters in practice: a code that identifies an inland rail terminal is a perfectly valid UN/LOCODE and a completely wrong port of loading.",
          "Positions are read independently, and a location can have several. A major coastal city will typically show a port function, an airport function and a road terminal function at once.",
        ],
        table: {
          caption: "UN/LOCODE function classifier positions",
          columns: ["Position", "Meaning"],
          rows: [
            ["0", "Function not known — to be specified"],
            ["1", "Maritime port, any size"],
            ["2", "Rail terminal"],
            ["3", "Road terminal"],
            ["4", "Airport"],
            ["5", "Postal exchange office"],
            ["6", "Multimodal function, inland clearance depot"],
            ["7", "Fixed transport function, such as an oil platform"],
            ["B", "Border crossing"],
          ],
        },
        callout: {
          tone: "info",
          title: "A UN/LOCODE is not a terminal code",
          body:
            "DEHAM identifies Hamburg, not Burchardkai, Altenwerder or Tollerort. Terminal identification is handled by carrier and port-community systems, and the terminal is normally named separately on the booking confirmation and arrival notice. If a routing dispute turns on which terminal cargo went to, the UN/LOCODE will not settle it.",
        },
      },
      {
        heading: "Where port codes appear on shipping documents",
        paragraphs: [
          "Once you know where to look, UN/LOCODEs turn up throughout the document set, and cross-checking them is one of the fastest structural checks available on a shipment file. A route that changes between the booking confirmation and the Bill of Lading, without anybody having agreed a change, is worth a phone call.",
        ],
        bullets: [
          "Bill of Lading: place of receipt, port of loading, port of discharge and place of delivery",
          "Booking confirmation: the same four routing points, plus the transhipment port where applicable",
          "Arrival notice: port of discharge and the final place of delivery",
          "Commercial invoice and packing list: often shown alongside the named ports as supporting reference",
          "Customs declarations: many national systems require the UN/LOCODE rather than a place name",
          "Certificates of origin and letters of credit: the named port must agree with the transport document",
        ],
      },
      {
        heading: "Codes that are routinely confused",
        paragraphs: [
          "Most port-code errors are not exotic. They come from a small set of genuinely confusable pairs, from cities with more than one port, and from countries where several places share a name. Checking the code rather than the name catches all three.",
        ],
        subsections: [
          {
            heading: "Cities with more than one port",
            paragraphs: [
              "The city name on a purchase order rarely identifies the port precisely enough for a booking. Getting this wrong means the cargo arrives at the wrong terminal, in the wrong port authority's jurisdiction, and sometimes several hundred kilometres from the consignee.",
            ],
            bullets: [
              "Mumbai: INBOM for the city port and INNSA for Jawaharlal Nehru Port at Nhava Sheva, which handles the container volume",
              "Dubai: AEDXB for Dubai and AEJEA for Jebel Ali, where nearly all container traffic moves",
              "Shanghai: CNSHA covers the port complex; Ningbo, a genuinely separate port often quoted as an alternative, is CNNGB",
              "New York and New Jersey: USNYC covers the port district that spans both states",
              "Ho Chi Minh City: VNSGN, still coded from the former name Saigon",
            ],
          },
          {
            heading: "Legacy and superseded codes",
            paragraphs: [
              "UN/LOCODE is revised twice a year. Codes are added, and occasionally a location is renamed or a code is retired. Older codes persist for years in carrier systems, customer master data and printed forms, which is why a document can carry a code that no current list contains.",
              "A superseded code is not necessarily an error in the document — it may simply be old master data. Treat an unrecognised code as something to verify, not something to reject: the practical response is to warn and ask, not to fail the shipment.",
            ],
          },
        ],
      },
      {
        heading: "UN/LOCODE against the other codes on your documents",
        paragraphs: [
          "Shipping paperwork is dense with short alphanumeric codes, and they are not interchangeable. Confusing them produces filings that are syntactically valid and factually wrong — the hardest kind of error to find.",
        ],
        table: {
          caption: "Which code identifies what",
          columns: ["Code type", "Format", "Identifies", "Issued by"],
          rows: [
            ["UN/LOCODE", "5 characters, e.g. NLRTM", "A trade and transport location", "UNECE"],
            ["IATA airport code", "3 letters, e.g. AMS", "An airport", "IATA"],
            ["ICAO airport code", "4 letters, e.g. EHAM", "An airport or aerodrome", "ICAO"],
            ["SCAC", "2–4 letters, e.g. MAEU", "An ocean or land carrier", "NMFTA"],
            ["IMO number", "7 digits", "A specific vessel, for its whole life", "IMO via IHS Markit"],
            ["ISO 6346 owner code", "3 letters + U/J/Z", "A container owner or operator", "BIC"],
            ["HS code", "6+ digits", "A commodity for tariff purposes", "WCO and national authorities"],
          ],
        },
      },
      {
        heading: "Using the lookup in a document review",
        numbered: [
          "Search by port name when you have a place and need the code, or by code when you have a document and need to confirm what it means.",
          "Check the country prefix first — a code whose first two letters do not match the country you expect is the most common error and the easiest to spot.",
          "Confirm the location is the one you mean when a city has more than one port; search the port name rather than the city name where they differ.",
          "Cross-check the same routing point across the booking confirmation, Bill of Lading and arrival notice; all three should agree.",
          "Record the code, not only the port name, in your own systems so that downstream filings and EDI messages have an unambiguous reference.",
        ],
        callout: {
          tone: "warn",
          title: "Dataset misses are warnings, not failures",
          body:
            "A bundled dataset is a snapshot. When a code is not found, the correct operational response is a warning that asks a human to verify — never an automatic rejection. Legitimate legacy codes, recently added locations and locations coded under a former name all fail a naive lookup while being entirely correct on the document.",
        },
      },
    ],
    faqs: [
      {
        q: "What does UN/LOCODE stand for?",
        a: "United Nations Code for Trade and Transport Locations. It is maintained by the United Nations Economic Commission for Europe (UNECE) and is published as a public dataset covering well over 100,000 locations worldwide, revised twice a year.",
      },
      {
        q: "What is the UN/LOCODE format?",
        a: "Five characters with no separator in electronic data, though it is often printed with a space: two letters for the country from ISO 3166-1 alpha-2, then three characters identifying the location. The location part uses letters A–Z and digits 2–9 only — 0 and 1 are excluded because they are too easily confused with O and I.",
      },
      {
        q: "Why is Shanghai CNSHA and not CNSGH?",
        a: "Because CNSHA is the assigned code. The three-character portion is allocated by UNECE and is not an abbreviation you can derive yourself — it often but not always follows the first letters of the place name. CNSGH appears frequently in real documents and legacy master data, which is why a good validator warns on an unrecognised code rather than silently correcting it.",
      },
      {
        q: "Is a UN/LOCODE the same as a port code used by a carrier?",
        a: "Not always. Carriers, port-community systems and customs authorities sometimes maintain their own location identifiers, and a few national systems use codes that resemble UN/LOCODEs without matching them. The UN/LOCODE is the interoperable standard and the one you should carry between systems, but confirm which reference a specific filing actually requires.",
      },
      {
        q: "Does a UN/LOCODE identify a specific terminal or berth?",
        a: "No. It identifies a location — a port, city or transport node. Individual terminals, berths and depots within that location have no separate UN/LOCODE. Terminal identification comes from the carrier's booking confirmation, the arrival notice or the local port-community system.",
      },
      {
        q: "Can one place have more than one UN/LOCODE?",
        a: "A location has one code, but a metropolitan area can contain several separately coded locations — Dubai and Jebel Ali, or Mumbai and Nhava Sheva, are the classic examples. Conversely a single code can carry several transport functions at once, which is what the eight-position function classifier records.",
      },
      {
        q: "How often is the UN/LOCODE list updated?",
        a: "UNECE publishes revisions twice a year. Additions are common; retirements and renames are rarer but do happen. Because carrier systems, customer master data and printed forms lag behind, expect to encounter valid-looking codes that a current dataset does not contain.",
      },
      {
        q: "What should I do if a code on a document is not in the dataset?",
        a: "Treat it as a question, not an error. Search for the port by name to see whether a different code is now current, check whether the location was renamed, and confirm with the carrier or the document issuer. Do not overwrite a code on an issued transport document — if it is genuinely wrong, it needs an authorised amendment from the party that issued the document.",
      },
      {
        q: "Are airport codes and port codes the same thing?",
        a: "No. Airports use three-letter IATA codes and four-letter ICAO codes; ports use five-character UN/LOCODEs. The coincidence that USLAX contains LAX is exactly that — a coincidence. Many UN/LOCODEs do not match the local airport code at all, and using an IATA code where a UN/LOCODE is required will fail validation in most customs systems.",
      },
      {
        q: "Do I need the port code or is the port name enough?",
        a: "The name is enough for a conversation and insufficient for a system. Place names are duplicated across and within countries, transliterated inconsistently, and printed with and without diacritics. Recording the code alongside the name removes that ambiguity permanently and is what makes automated matching between documents possible.",
      },
      {
        q: "Does GainingDocx validate port codes inside my documents?",
        a: "Yes. When a Bill of Lading, sea waybill, booking confirmation or arrival notice is extracted, the routing points are matched against the bundled UN/LOCODE dataset. A recognised code is confirmed, an unrecognised one raises a warning for review, and a code whose country prefix disagrees with the named port is highlighted as a likely error.",
      },
      {
        q: "Where does the underlying data come from?",
        a: "The bundled dataset is derived from the UNECE UN/LOCODE publication, which is the authoritative public source. It is a point-in-time snapshot rather than a live query, so for a filing that turns on a very recently assigned code, confirm against the current UNECE publication.",
      },
    ],
    related: [
      { href: "/bill-of-lading-parser", label: "Bill of Lading parser", blurb: "Extract routing points from a B/L and match them against the UN/LOCODE dataset automatically." },
      { href: "/guides/how-to-read-a-bill-of-lading", label: "How to read a Bill of Lading", blurb: "What each routing field means and how the four place fields differ." },
      { href: "/tools/container-number-check", label: "Container number check", blurb: "Validate the equipment references that travel with the routing on your B/L." },
      { href: "/standards", label: "Standards and datasets used", blurb: "Which reference data GainingDocx bundles, and how current each snapshot is." },
    ],
  },

  "demurrage-detention-calculator": {
    updated: "2026-08-04",
    keywords: [
      "demurrage calculator",
      "detention calculator",
      "container free time calculator",
      "demurrage vs detention",
      "D&D invoice audit",
      "last free day",
      "container storage charges",
    ],
    quickAnswer: {
      heading: "How demurrage and detention are calculated",
      body:
        "Count the days between the contractual start event and the end event, deduct the free days allowed by the tariff or service contract, and apply each rate tier only to the days that fall inside it. Demurrage covers the carrier's container sitting inside the terminal beyond free time; detention covers the container held outside the terminal. Getting the answer right depends less on the arithmetic than on identifying the correct start event, day-count convention and tier boundaries.",
      bullets: [
        "Chargeable days = counted days − free days, floored at zero",
        "Tiers are progressive, not retroactive",
        "Calendar and working-day counting give different answers",
        "Terminal storage is often a separate charge from carrier demurrage",
      ],
    },
    sections: [
      {
        heading: "Which charge are you actually looking at",
        paragraphs: [
          "Before any calculation, establish what is being billed. Three distinct charges are routinely conflated, and disputing the wrong one wastes the limited window you have to challenge an invoice.",
          "Demurrage is the carrier's charge for its container remaining inside the terminal or depot beyond free time. Detention is the carrier's charge for its container being held outside the terminal beyond free time. Storage is the terminal's or depot's charge for occupying its ground, and it is frequently billed by a different party under a different tariff with different free time. A single delayed import can generate all three simultaneously.",
        ],
        table: {
          caption: "Distinguishing the three time-based charges",
          columns: ["Charge", "Whose asset", "Where", "Typical import period"],
          rows: [
            ["Demurrage", "Carrier's container", "Inside the terminal", "From discharge or availability until the full container gates out"],
            ["Detention", "Carrier's container", "Outside the terminal", "From full gate-out until the empty container is returned"],
            ["Storage", "Terminal's ground", "Inside the terminal", "From discharge until gate-out, under the terminal's own tariff"],
          ],
          note: "Some tariffs combine demurrage and detention into a single continuous allowance, often labelled 'combined D&D' or 'merged free time'. Read the governing contract rather than assuming the market convention.",
        },
      },
      {
        heading: "The calculation, and where it goes wrong",
        paragraphs: [
          "The formula is trivial. Chargeable days equal counted days minus free days, floored at zero; the charge is the sum of each tier's day count multiplied by that tier's rate, plus any fixed fees. Almost every dispute is about the inputs, not the multiplication.",
          "Four inputs decide the answer, and all four vary by contract: the start event, whether the start day itself counts, whether the count runs on calendar days or working days, and where the tier boundaries sit. Change any one of them and a five-figure invoice can move by thousands.",
        ],
        subsections: [
          {
            heading: "The start event",
            paragraphs: [
              "'Discharged', 'available', 'free time commences' and 'last free day' are four different things, and carriers use them inconsistently. Discharge is when the box came off the vessel; availability is when customs and terminal processes allow it to be collected. On a shipment held for inspection, those dates can be a week apart, and which one starts the clock is worth more than any rate negotiation.",
            ],
          },
          {
            heading: "Inclusive or exclusive start",
            paragraphs: [
              "If free time is five days from a Monday discharge, does Monday count as day one or does the clock start Tuesday? Both conventions exist in live tariffs. The difference is exactly one chargeable day on every affected container, which on a fifty-container programme is not a rounding error.",
            ],
          },
          {
            heading: "Calendar days or working days",
            paragraphs: [
              "Calendar-day counting includes weekends and public holidays; working-day counting excludes them. A container discharged on a Thursday before a long weekend can attract three extra chargeable days under one convention and none under the other. Local holiday calendars matter here, and they are the destination country's holidays, not yours.",
            ],
          },
          {
            heading: "Progressive tiers",
            paragraphs: [
              "Tiered tariffs escalate: the first few chargeable days cost one rate, the next block more, everything after that more again. Tiers are applied progressively, so each day is charged at the rate for the band it falls in — not at the highest rate reached. Retroactive application of the top tier to all days is a genuine and recurring billing error.",
            ],
          },
        ],
      },
      {
        heading: "Worked example: a tiered import demurrage calculation",
        paragraphs: [
          "A 40ft container is discharged on 1 March and gates out full on 13 March. The service contract allows 5 calendar free days counted from the day after discharge, with tiers of USD 90 per day for days 1–3, USD 160 per day for days 4–7 and USD 230 per day thereafter, plus a USD 45 administration fee.",
          "Counting from 2 March to 13 March inclusive gives 12 counted days. Deducting 5 free days leaves 7 chargeable days. Those 7 days fall into the first tier (3 days) and the second tier (4 days). The time charge is (3 × 90) + (4 × 160) = 270 + 640 = USD 910, and the total with the administration fee is USD 955.",
        ],
        table: {
          caption: "Tier allocation for 7 chargeable days",
          columns: ["Tier", "Day range", "Days in tier", "Rate per day", "Amount"],
          rows: [
            ["Tier 1", "Chargeable days 1–3", "3", "USD 90.00", "USD 270.00"],
            ["Tier 2", "Chargeable days 4–7", "4", "USD 160.00", "USD 640.00"],
            ["Tier 3", "Chargeable days 8+", "0", "USD 230.00", "USD 0.00"],
            ["Fixed", "Administration fee", "—", "—", "USD 45.00"],
            ["Total", "—", "7", "—", "USD 955.00"],
          ],
          note: "Had the tariff counted the discharge day itself, the count would be 13 days, chargeable days 8, and the total USD 1,185 — a USD 230 difference from one convention.",
        },
        callout: {
          tone: "check",
          title: "Always reconcile day counts before rates",
          body:
            "Negotiating the rate is the instinctive response to a large invoice and usually the least productive. Confirm the day count first: wrong start events, wrong free-time allowances and retroactive tier application are far more common than wrong rates, and they are much easier to evidence.",
        },
      },
      {
        heading: "Auditing a demurrage or detention invoice",
        paragraphs: [
          "Work from evidence rather than recollection. Assemble the documents before you open the spreadsheet, and record the source of every date you use — an audit that cannot cite where a date came from will not survive a carrier's response.",
        ],
        numbered: [
          "Collect the service contract or tariff, booking confirmation, arrival notice, terminal availability record, gate-in and gate-out records, equipment interchange receipts, empty-return receipt and the invoice itself.",
          "Identify the charge type from the invoice wording — demurrage, detention, combined D&D or terminal storage — and confirm which party's tariff governs it.",
          "Match the container number, size and type, and the import or export movement, against your own records.",
          "Establish the contractual start and end events and pin each to a dated, evidenced record rather than an email.",
          "Confirm the day-count convention, the inclusive or exclusive start, and any holiday treatment for the destination country.",
          "Deduct the free-time allowance that the contract actually grants, including any lane-specific or customer-specific extension you negotiated.",
          "Allocate chargeable days progressively across the tiers and check the invoice has not applied the top tier retroactively.",
          "Verify fixed fees, taxes and currency separately, and confirm each was disclosed in the tariff.",
          "Compare your total against the invoice, and where they differ, raise the dispute in writing within the applicable window with the evidence attached.",
        ],
      },
      {
        heading: "What to do when the delay was not yours",
        paragraphs: [
          "Free time exists to allow normal commercial collection. When the container could not be collected — because the terminal was congested, the vessel discharged late, the carrier had not released the Bill of Lading, or customs held the cargo for inspection — the fairness of charging for that period is exactly what a dispute turns on.",
          "In the United States, the Federal Maritime Commission's demurrage and detention billing rule sets specific requirements for what a compliant invoice must contain and gives the billed party a defined window to request fee mitigation, refund or waiver. Other jurisdictions have their own regimes, and many service contracts contain their own dispute clauses. The practical point is universal: these windows are short, and an invoice not disputed inside the window is usually payable regardless of its merits.",
        ],
        bullets: [
          "Diarise the dispute deadline the day the invoice arrives, before you investigate the merits",
          "Dispute in writing, addressed to the party named on the invoice, with the container number and invoice reference in the subject line",
          "Attach the evidence rather than describing it: gate records, the availability notice, the customs hold notice, the release timestamp",
          "State the specific line you dispute and the amount, rather than rejecting the invoice as a whole",
          "Where the carrier's own delay caused the period, say so explicitly and cite the record that shows it",
          "Keep paying the undisputed portion if the contract requires it, so a genuine dispute does not become a payment default",
        ],
        callout: {
          tone: "warn",
          title: "Prevention beats audit every time",
          body:
            "The cheapest demurrage invoice is the one that never arrives. Track the last free day on every import from the moment the arrival notice lands, escalate at 48 hours remaining rather than on the day, and treat a missing carrier release or an unfiled customs entry as an operational alarm rather than a task on a list.",
        },
      },
    ],
    faqs: [
      {
        q: "What is the difference between demurrage and detention?",
        a: "Demurrage is charged when the carrier's container stays inside the terminal or depot beyond free time; detention is charged when the container is held outside the terminal beyond free time. On a typical import, demurrage runs from discharge or availability until the full container gates out, and detention runs from gate-out until the empty is returned. Some tariffs merge the two into a single continuous allowance, so the invoice wording and the governing contract decide, not the market convention.",
      },
      {
        q: "How do I calculate demurrage charges?",
        a: "Count the days between the contractual start and end events under the tariff's day-count convention, subtract the free days, and apply each rate tier only to the days falling within it. Add any fixed or administrative fees separately. The arithmetic is simple; the accuracy comes from confirming the start event, whether the first day counts, whether weekends and holidays count, and where the tier boundaries sit.",
      },
      {
        q: "What is the last free day?",
        a: "The final day on which the container can be collected or returned without incurring a time-based charge. It is derived from the start event plus the free-time allowance under the applicable counting convention, so it moves if any of those three change. Always take it from the carrier's own statement where one is given, and reconcile that against your own calculation rather than trusting either alone.",
      },
      {
        q: "Do weekends and public holidays count toward free time?",
        a: "It depends entirely on the tariff. Calendar-day counting includes them; working-day counting excludes them. Many tariffs count calendar days for demurrage and working days for detention, or vice versa, within the same contract. Where holidays are excluded, they are the destination country's public holidays — a point that catches out shippers applying their own national calendar.",
      },
      {
        q: "Are demurrage tiers applied progressively or retroactively?",
        a: "Progressively, under every standard tariff: each chargeable day is billed at the rate for the band it falls into, so seven chargeable days across two tiers are billed partly at each rate. Retroactive application of the highest reached tier to every day is a billing error, and it is common enough to be worth checking on every tiered invoice.",
      },
      {
        q: "Can I dispute a demurrage invoice?",
        a: "Yes, and the window is usually short. In the United States, the Federal Maritime Commission's billing rule sets requirements for what a compliant invoice must contain and gives the billed party a defined period to request mitigation, refund or waiver. Elsewhere, the service contract or carrier terms govern. Diarise the deadline as soon as the invoice arrives, dispute the specific line rather than the whole invoice, and attach dated evidence rather than describing it.",
      },
      {
        q: "Who is liable for demurrage — the shipper or the consignee?",
        a: "It depends on the freight terms, the Bill of Lading, the service contract and, in some jurisdictions, statute. A merchant clause in the carrier's terms can make several parties jointly liable, including a party that never took possession of the cargo. Do not assume that because you did not collect the container you cannot be billed for it; check the contract you actually signed.",
      },
      {
        q: "Does terminal storage count as demurrage?",
        a: "No, though the two run over the same period and are frequently confused. Storage compensates the terminal for occupying its ground and is billed under the terminal's tariff, often by a different party, with its own free time and its own rates. An import can accrue carrier demurrage and terminal storage simultaneously, and disputing one does not affect the other.",
      },
      {
        q: "What causes most demurrage charges?",
        a: "In practice: customs entries filed late or held for examination, carrier release not obtained because the original Bill of Lading or telex release was outstanding, no haulage capacity booked for the collection window, terminal congestion and appointment scarcity, missing or incorrect documentation at destination, and consignees who simply were not told the container had arrived. Most of these are visible days in advance if the arrival notice is processed on receipt.",
      },
      {
        q: "How much free time should I expect?",
        a: "It varies widely by trade lane, carrier, contract and equipment type — commonly in the range of three to seven days for import demurrage on standard dry equipment, with reefers and special equipment often allowed materially less. Free time is negotiable on contracted volume, and extended free time is frequently a cheaper concession for a carrier to grant than a rate reduction, which makes it worth asking for.",
      },
      {
        q: "Does this calculator work for export shipments?",
        a: "Yes, but the milestones are different. Export periods usually run from empty pickup to full gate-in, and sometimes to vessel loading, rather than from discharge to empty return. Enter the export start and end events your contract specifies; the day-count, free-time and tier logic is identical.",
      },
      {
        q: "Can GainingDocx warn me before free time expires?",
        a: "Yes. When an arrival notice is extracted, the vessel, ETA, port, container references and any printed free-time or last-free-day dates are captured as structured fields on the shipment record, so the deadline becomes a tracked date rather than a line buried in a PDF attachment.",
      },
    ],
    related: [
      { href: "/guides/demurrage-detention-calculation-guide", label: "Demurrage and detention: the complete guide", blurb: "Free time, milestones, worked examples and invoice audit in long form." },
      { href: "/arrival-notice-parser", label: "Arrival notice parser", blurb: "Capture ETA, port, containers and printed free-time dates from carrier notices." },
      { href: "/freight-invoice-parser", label: "Freight invoice parser", blurb: "Extract every D&D charge line for audit against your own calculation." },
      { href: "/tools/container-number-check", label: "Container number check", blurb: "Confirm the equipment references before reconciling a D&D invoice against your records." },
    ],
  },
};
