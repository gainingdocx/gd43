import type { DeepContentMap } from "@/content/deep/types";

export const AIR_TOOL_DEEP: DeepContentMap = {
  "chargeable-weight-calculator": {
    updated: "2026-08-04",
    keywords: [
      "chargeable weight calculator",
      "volumetric weight calculator",
      "dimensional weight",
      "air freight chargeable weight formula",
      "6000 divisor air cargo",
      "5000 divisor courier",
      "how to calculate volume weight",
    ],
    quickAnswer: {
      heading: "How chargeable weight is calculated",
      body:
        "Calculate volumetric weight by multiplying length × width × height in centimetres and dividing by the applicable divisor — 6,000 for general air cargo and 5,000 for most express couriers. Compare that figure with the actual gross weight and charge on whichever is higher. In imperial units the equivalents are 166 in³/lb for general air cargo and 139 in³/lb for express.",
      bullets: [
        "General air cargo: L × W × H (cm) ÷ 6,000",
        "Express courier: L × W × H (cm) ÷ 5,000",
        "Chargeable weight = greater of actual and volumetric",
        "IATA practice rounds up to the next 0.5 kg",
      ],
    },
    sections: [
      {
        heading: "Why airlines charge on volume as well as weight",
        paragraphs: [
          "An aircraft runs out of space long before it runs out of lift on most general cargo. A pallet of feather pillows and a pallet of machine parts occupy the same position in the hold, but if the airline charged only by weight it would earn a fraction as much from the pillows. Volumetric weight is the mechanism that prices the space a shipment consumes rather than the mass it contains.",
          "The divisor encodes an assumed cargo density. A 6,000 divisor treats one cubic metre as equivalent to 167 kilograms; a 5,000 divisor treats it as 200 kilograms. Express operators use the tighter 5,000 divisor because their networks are built around small, light, high-value parcels where space is the binding constraint almost every time.",
        ],
        table: {
          caption: "Common volumetric divisors and what they imply",
          columns: ["Mode", "Metric divisor", "Imperial", "Implied density", "Typical use"],
          rows: [
            ["General air cargo (IATA)", "6,000 cm³/kg", "166 in³/lb", "167 kg per CBM", "Airline and forwarder air freight"],
            ["International express", "5,000 cm³/kg", "139 in³/lb", "200 kg per CBM", "DHL, FedEx, UPS and similar networks"],
            ["European road groupage", "3,000 cm³/kg", "—", "333 kg per CBM", "LTL and groupage trucking"],
            ["Ocean LCL (weight or measure)", "1,000 cm³/kg equivalent", "—", "1,000 kg per CBM", "Sea freight consolidations"],
          ],
          note: "Divisors are contractual. Some airlines, forwarders and courier accounts apply a negotiated divisor that differs from the published one — always confirm which divisor your rate is quoted against.",
        },
      },
      {
        heading: "The formula and a worked example",
        paragraphs: [
          "Volumetric weight in kilograms equals length × width × height in centimetres, divided by the divisor. Multiply by the number of identical pieces. Then compare the result with the actual gross weight for the same pieces and take the higher figure.",
          "Take four cartons, each measuring 60 × 45 × 40 cm and weighing 14 kg. Each carton is 108,000 cm³. At the general air cargo divisor of 6,000 that is 18.00 kg volumetric per carton, so 72.00 kg for the four. Actual weight is 56.00 kg. Volumetric is higher, so chargeable weight is 72.00 kg. Under an express account at the 5,000 divisor the same cartons yield 21.60 kg each, or 86.40 kg — a 20% increase from the divisor alone.",
        ],
        table: {
          caption: "Same shipment, three tariff bases",
          columns: ["Basis", "Volumetric per carton", "Volumetric total", "Actual total", "Chargeable"],
          rows: [
            ["Air cargo, 6,000", "18.00 kg", "72.00 kg", "56.00 kg", "72.00 kg"],
            ["Express, 5,000", "21.60 kg", "86.40 kg", "56.00 kg", "86.40 kg"],
            ["Road groupage, 3,000", "36.00 kg", "144.00 kg", "56.00 kg", "144.00 kg"],
          ],
          note: "Four cartons of 60 × 45 × 40 cm at 14 kg each. The cargo has not changed; only the assumed density has.",
        },
        callout: {
          tone: "info",
          title: "Density is the number that decides",
          body:
            "A shipment is volumetric if its density is below the divisor's implied threshold. Below 167 kg per cubic metre it will always be charged on volume under a 6,000 divisor; above it, on actual weight. Working out the density once tells you which lever — reducing box size or reducing mass — will actually change the bill.",
        },
      },
      {
        heading: "Rounding, and why it is not a rounding error",
        paragraphs: [
          "Air freight rounds up. Standard IATA practice takes the chargeable weight to the next half kilogram, so 72.1 kg becomes 72.5 kg and 72.6 kg becomes 73.0 kg. Some carriers and some express services round to the next whole kilogram instead. On a single shipment the difference is trivial; across a year of daily consignments it is not.",
          "Where the rounding is applied matters as much as the increment. Rounding each piece line and then summing produces a higher figure than summing first and rounding once, because every line absorbs its own round-up. Reproduce your carrier's actual sequence rather than assuming — this calculator lets you choose, so you can match the tariff instead of arguing with it.",
        ],
        subsections: [
          {
            heading: "Rate breaks make heavier cheaper",
            paragraphs: [
              "Air cargo rates fall in bands, conventionally quoted as minimum charge, then −45 kg, +45 kg, +100 kg, +300 kg, +500 kg and +1,000 kg. Because the rate per kilogram drops at each break, a shipment just below a break can cost more in total than one just above it.",
              "This is the origin of the 'weight break' or 'as agreed' calculation: if 96 kg at the +45 rate costs more than 100 kg at the +100 rate, the shipment is rated at 100 kg. Reputable forwarders apply the lower of the two automatically. Checking it yourself is a two-minute audit that occasionally finds real money.",
            ],
          },
          {
            heading: "Minimum charges",
            paragraphs: [
              "Every air tariff has a minimum charge, and on small shipments it is what you actually pay regardless of the chargeable weight. A 3 kg parcel and a 12 kg parcel on the same lane can cost exactly the same. Below the minimum-charge threshold, optimising dimensions changes nothing.",
            ],
          },
        ],
      },
      {
        heading: "Per-piece, per-line or per-shipment: where the comparison happens",
        paragraphs: [
          "The single most contested point in chargeable weight is the level at which actual and volumetric are compared. Compare per shipment and a dense carton can offset a light one. Compare per piece and it cannot — each piece is charged on its own higher figure, and the total is always equal to or greater than the shipment-level result.",
          "General air cargo conventionally compares at shipment level: total volume of the consignment against total gross weight. Many express tariffs compare per piece. Mixed consignments of dense and light cartons are where the two methods diverge most, and where invoices most often surprise the payer.",
        ],
        table: {
          caption: "A mixed consignment compared two ways",
          columns: ["Piece", "Dimensions", "Actual", "Volumetric at 6,000", "Higher of the two"],
          rows: [
            ["Carton A", "80 × 60 × 50 cm", "12 kg", "40.00 kg", "40.00 kg"],
            ["Carton B", "40 × 30 × 25 cm", "48 kg", "5.00 kg", "48.00 kg"],
            ["Per-piece total", "—", "60 kg", "45.00 kg", "88.00 kg"],
            ["Shipment-level total", "—", "60 kg", "45.00 kg", "60.00 kg"],
          ],
          note: "The same two cartons produce 88 kg per-piece and 60 kg at shipment level — a 47% difference from the comparison level alone, with no change to the cargo.",
        },
        callout: {
          tone: "warn",
          title: "Ask which level your rate assumes",
          body:
            "A rate quoted per kilogram is meaningless without knowing how the kilograms are counted. Confirm the divisor, the comparison level and the rounding rule at the quotation stage, in writing. All three are contractual, all three are negotiable, and disputes about them after the fact are rarely won.",
        },
      },
      {
        heading: "Reducing chargeable weight legitimately",
        paragraphs: [
          "If your shipment is volumetric, every cubic centimetre you remove is money. If it is weight-controlled, shrinking the box achieves nothing. Establish which you are before redesigning anything.",
        ],
        bullets: [
          "Right-size the carton: 5 cm of unnecessary headroom on a 60 × 45 cm footprint is 1,350 cm³, or 0.23 kg chargeable at the 6,000 divisor, on every single carton",
          "Consolidate small parcels into fewer, denser cartons where the tariff compares per piece",
          "Check whether a slightly larger carton crosses a rate break and lowers the total cost",
          "Avoid over-protective void fill that adds volume without adding protection — foam-in-place and right-sized inserts beat loose fill on both counts",
          "Measure the outermost point including pallet overhang, banding and protruding handles, because that is what the carrier measures",
          "Where cargo is genuinely dense, ask whether the tariff offers a low-density or high-density rating basis",
          "Compare a sea-air or road-air routing for low-density cargo, where the divisor penalty is largest",
        ],
      },
      {
        heading: "Checking an air freight invoice",
        numbered: [
          "Take dimensions and gross weight from the air waybill and the packing list, not from the booking request — the carrier rates on what it measured at acceptance.",
          "Recalculate volumetric weight at the divisor your contract specifies, and confirm the invoice used the same one.",
          "Confirm the comparison level: per piece or per shipment, matching the tariff.",
          "Apply the rounding rule in the same sequence the carrier applies it, then compare against the chargeable weight printed on the AWB.",
          "Check the rate band used against the published breaks, and test whether the next break up would have produced a lower total.",
          "Confirm the minimum charge was not applied above a properly rated weight.",
          "Reconcile surcharges — fuel, security, screening, dangerous goods, terminal handling — as separate lines rather than accepting a bundled total.",
          "Export the calculation audit and file it with the AWB so any dispute is evidenced.",
        ],
      },
    ],
    faqs: [
      {
        q: "What is the chargeable weight formula for air freight?",
        a: "Volumetric weight in kilograms = (length × width × height in centimetres) ÷ 6,000 for general air cargo, or ÷ 5,000 for most express services. Multiply by the number of pieces, compare the result with the actual gross weight, and the chargeable weight is whichever is greater — then rounded up, conventionally to the next half kilogram.",
      },
      {
        q: "What is the difference between the 5,000 and 6,000 divisor?",
        a: "They encode different assumed cargo densities. The 6,000 divisor used for general air cargo treats one cubic metre as 167 kg; the 5,000 divisor used by most international express carriers treats it as 200 kg. The same shipment costs 20% more in chargeable weight under 5,000. Which applies is a matter of contract, not cargo type, so confirm it on your rate sheet.",
      },
      {
        q: "How do I calculate volumetric weight in inches and pounds?",
        a: "Divide cubic inches by 166 for general air cargo or by 139 for express, giving the volumetric weight in pounds. These are the imperial equivalents of the 6,000 and 5,000 metric divisors, so they produce the same answer once converted. Keep all three dimensions in the same unit before dividing.",
      },
      {
        q: "Is chargeable weight the same as gross weight?",
        a: "Only when the cargo is dense enough that actual weight exceeds volumetric weight. Gross weight is what the shipment physically weighs including packaging. Chargeable weight is the billing figure — the greater of gross and volumetric. Both appear on the air waybill, in separate boxes, and a document where they are identical for low-density cargo is worth a second look.",
      },
      {
        q: "Should I compare actual and volumetric per piece or for the whole shipment?",
        a: "It depends on the tariff. General air cargo conventionally compares at shipment level, taking total volume against total gross weight. Many express tariffs compare per piece, which produces a higher total whenever a consignment mixes dense and light cartons. The difference on a mixed shipment can exceed 40%, so confirm the level before you accept a quotation.",
      },
      {
        q: "How is chargeable weight rounded?",
        a: "Standard IATA practice rounds up to the next 0.5 kg; some carriers and express services round to the next whole kilogram. The sequence matters too: rounding each line before summing gives a higher figure than summing then rounding once. Reproduce your carrier's actual method rather than assuming the industry default.",
      },
      {
        q: "What are air freight rate breaks?",
        a: "Rate bands where the per-kilogram rate steps down as weight increases, conventionally at minimum, −45, +45, +100, +300, +500 and +1,000 kg. Because the rate falls at each break, a shipment just below one can cost more in total than a heavier shipment just above it. Where that happens the shipment should be rated at the higher break — check it, because it is not always applied.",
      },
      {
        q: "Does volumetric weight apply to ocean freight?",
        a: "Not in this form. Ocean LCL uses a weight-or-measure basis where one cubic metre is treated as one metric ton — effectively a 1,000 kg per CBM density against air freight's 167 or 200. Applying an air divisor to an ocean shipment, or the reverse, produces answers that are wrong by a factor of five or more.",
      },
      {
        q: "How can I reduce chargeable weight?",
        a: "Only if your cargo is volume-controlled. Right-size cartons to eliminate headroom, consolidate where the tariff compares per piece, replace bulky void fill with right-sized protection, and check whether crossing a rate break lowers the total. If the cargo is weight-controlled — density above roughly 167 kg per CBM at a 6,000 divisor — none of that changes the bill, and the lever is the rate itself.",
      },
      {
        q: "Do carriers measure my cartons themselves?",
        a: "Yes, routinely, at the point of acceptance. Dimensional scanners at handling facilities measure to the outermost point of the piece as presented, including pallet overhang, banding, protruding handles and any bulge in the carton. Cargo is rated on the measured figure, not the declared one, which is why declared dimensions should be taken from the packed article rather than the flat carton specification.",
      },
      {
        q: "What is a minimum charge and when does it apply?",
        a: "The floor price for a shipment on a given lane, applied when the rated weight produces a total below it. Below the threshold, chargeable weight has no effect on price — a 3 kg and a 12 kg parcel may cost the same. It is worth knowing your minimum-charge weight per lane, because consolidating shipments that each fall below it is often free capacity.",
      },
      {
        q: "Can GainingDocx check the chargeable weight on my air waybills?",
        a: "Yes. Extracting an air waybill captures pieces, gross weight, chargeable weight, rate class and charge lines as separate structured fields, so the printed chargeable weight can be reconciled against the packing list dimensions and against the freight invoice rather than taken on trust.",
      },
    ],
    related: [
      { href: "/guides/chargeable-weight-calculation-air-freight", label: "Chargeable weight: the complete calculation guide", blurb: "Divisors, rate breaks, rounding and worked examples in long form." },
      { href: "/air-waybill-parser", label: "Air waybill parser", blurb: "Extract pieces, gross weight, chargeable weight and charge lines from a MAWB or HAWB." },
      { href: "/tools/cbm-calculator", label: "CBM calculator", blurb: "Get the cubic-metre total that feeds every volumetric calculation." },
      { href: "/features/airfreight-invoice-audit", label: "Air freight invoice audit", blurb: "Reconcile rated weights and surcharges across the AWB, invoice and booking." },
    ],
  },

  "air-waybill-number-check": {
    updated: "2026-08-04",
    keywords: [
      "air waybill number check",
      "AWB check digit calculator",
      "MAWB format",
      "modulus 7 air waybill",
      "airline prefix codes",
      "validate AWB number",
      "house air waybill vs master",
    ],
    quickAnswer: {
      heading: "How an air waybill number is validated",
      body:
        "A Master Air Waybill number is eleven digits: a three-digit airline prefix, a seven-digit serial and a one-digit check digit. To validate it, divide the seven-digit serial by 7 and take the remainder — that remainder is the expected check digit. House air waybill references follow forwarder-specific formats and are not covered by this calculation.",
      bullets: [
        "Digits 1–3: IATA airline prefix",
        "Digits 4–10: serial number",
        "Digit 11: serial mod 7",
        "Written as 020-1234 5675",
      ],
    },
    sections: [
      {
        heading: "The structure of a Master Air Waybill number",
        paragraphs: [
          "Every MAWB number carries the same eleven digits in the same order, which is what makes automated checking possible. The three-digit prefix identifies the issuing airline and is allocated by IATA; the seven-digit serial is drawn from stock allocated to that airline; the final digit is arithmetic.",
          "Conventionally the number is printed with a hyphen after the prefix and a space in the middle of the eight-digit document number — 020-1234 5675 — but the separators are presentation only. Strip them before doing anything with the number, and never treat a number with separators as different from the same number without.",
        ],
        table: {
          caption: "Parsing 020-1234 5675",
          columns: ["Part", "Digits", "Value", "Meaning"],
          rows: [
            ["Airline prefix", "3", "020", "The IATA-allocated code for the issuing carrier"],
            ["Serial number", "7", "1234567", "The document number from the airline's allocated stock"],
            ["Check digit", "1", "5", "1234567 ÷ 7 = 176,366 remainder 5"],
          ],
          note: "The check digit is the remainder, not a rounded quotient. Unlike ISO 6346, there is no special case: a modulus-7 remainder is always 0 to 6 and always fits in one digit.",
        },
      },
      {
        heading: "The modulus-7 check, worked",
        paragraphs: [
          "The calculation is the simplest of any transport document check digit. Take the seven-digit serial as a whole number and divide it by seven. The remainder is the check digit. There are no positional weights, no letter values and no special cases.",
          "For serial 1234567: 1234567 ÷ 7 = 176,366 with 176,366 × 7 = 1,234,562, leaving a remainder of 5. The check digit is 5, and the complete number is 020-12345675. If the printed final digit were anything other than 5, the number has been mistyped, misread or fabricated.",
        ],
        numbered: [
          "Remove spaces, hyphens and any leading text such as 'AWB' or 'MAWB'.",
          "Confirm you have exactly eleven digits — anything else is not an airline MAWB reference.",
          "Split off the first three digits as the airline prefix.",
          "Take the next seven digits as the serial and divide by 7.",
          "Compare the remainder with the eleventh digit; they must match.",
        ],
        callout: {
          tone: "info",
          title: "Modulus 7 catches less than modulus 11",
          body:
            "A single-digit modulus-7 check has only seven possible values, so roughly one in seven random errors will pass by chance. It reliably catches single-digit typos but is weaker against transpositions than the weighted modulo-11 scheme used for container numbers. Treat an AWB check-digit pass as a useful filter, not a guarantee.",
        },
      },
      {
        heading: "Airline prefixes",
        paragraphs: [
          "The three-digit prefix is allocated by IATA and is specific to the carrier issuing the document, not the carrier flying it. On an interline movement the prefix stays with the issuing airline for the whole journey. A forwarder's own neutral air waybill stock also carries an airline prefix, because the stock is drawn against a carrier.",
          "The prefixes below are widely recognised examples for orientation. The authoritative list is maintained by IATA and changes as carriers enter and leave the market, so treat any offline list as illustrative rather than a validation source.",
        ],
        table: {
          caption: "Examples of IATA airline prefixes",
          columns: ["Prefix", "Carrier"],
          rows: [
            ["001", "American Airlines"],
            ["006", "Delta Air Lines"],
            ["016", "United Airlines"],
            ["020", "Lufthansa Cargo"],
            ["057", "Air France"],
            ["074", "KLM"],
            ["125", "British Airways"],
            ["131", "Japan Airlines"],
            ["160", "Cathay Pacific"],
            ["176", "Emirates"],
            ["180", "Korean Air"],
            ["235", "Turkish Airlines"],
            ["618", "Singapore Airlines"],
          ],
          note: "Illustrative only. This checker validates the arithmetic structure of the number and does not verify the prefix against a carrier registry.",
        },
      },
      {
        heading: "Master and house air waybills",
        paragraphs: [
          "A Master Air Waybill is the contract between the carrier and whoever tendered the consignment — usually a freight forwarder. A House Air Waybill is the contract between that forwarder and the actual shipper. On a consolidated shipment one MAWB covers many HAWBs, and the two reference types serve entirely different purposes.",
          "This is the distinction that breaks naive validation. MAWB numbers follow the eleven-digit IATA structure and can be check-digit validated. HAWB numbers are assigned by the forwarder from its own sequence and may be any length, may contain letters, and frequently encode the forwarder's branch or year. Running the modulus-7 check against a HAWB reference produces meaningless failures.",
        ],
        table: {
          caption: "MAWB against HAWB",
          columns: ["Aspect", "Master Air Waybill", "House Air Waybill"],
          rows: [
            ["Issued by", "The airline, or an agent on its stock", "The freight forwarder or consolidator"],
            ["Contract between", "Carrier and the tendering party", "Forwarder and the actual shipper"],
            ["Number format", "11 digits: prefix + serial + check digit", "Forwarder-defined; often alphanumeric"],
            ["Check digit", "Modulus 7 on the serial", "None, or a proprietary scheme"],
            ["Consignee shown", "Usually the destination agent", "The actual consignee"],
            ["Used for customs", "Manifest level", "Entry level in most jurisdictions"],
          ],
        },
        callout: {
          tone: "warn",
          title: "Never guess the level from the format",
          body:
            "An eleven-digit reference is probably a MAWB, but a forwarder is perfectly free to number its house documents in an eleven-digit sequence. Determine master or house status from how the document labels itself, not from the shape of the number. GainingDocx records the level as unknown rather than guessing when the document does not state it.",
        },
      },
      {
        heading: "Where AWB numbers matter downstream",
        paragraphs: [
          "The air waybill number is the key that links every message about a consignment. It is quoted on the flight manifest, in customs filings, in status messages, on the freight invoice and on any claim. A single wrong digit disconnects the shipment from its own record trail.",
        ],
        bullets: [
          "Customs entries filed against a manifest that does not contain the quoted AWB will not clear",
          "Track-and-trace lookups return nothing, so a stalled shipment stays invisible until someone asks",
          "Cargo cannot be released at destination without a matching document reference",
          "Freight invoices cannot be reconciled to a shipment file, delaying approval and payment",
          "Claims for loss or damage need the AWB as the contract of carriage reference",
          "Advance security filings quote the AWB, and a mismatch can generate a hold",
        ],
      },
      {
        heading: "What this checker cannot tell you",
        paragraphs: [
          "The modulus-7 calculation validates arithmetic and nothing else. Because the check digit is derived from the serial itself, a structurally valid number can be produced in seconds by anyone with a calculator.",
        ],
        bullets: [
          "It does not confirm the airline issued the number or that the stock is allocated",
          "It does not confirm a booking exists, or that cargo was ever tendered",
          "It does not confirm the flight, routing, pieces, weight or charges shown on the document",
          "It does not detect a reused or cancelled document number",
          "It does not validate house air waybill references, which follow no common standard",
          "It does not confirm the prefix belongs to a currently operating carrier",
        ],
      },
    ],
    faqs: [
      {
        q: "What is the air waybill check digit formula?",
        a: "Take the seven-digit serial number — digits four to ten of the eleven-digit AWB — divide it by 7, and the remainder is the check digit. There are no positional weights and no special cases; the remainder is always between 0 and 6 and always fits in a single digit.",
      },
      {
        q: "How many digits is an air waybill number?",
        a: "Eleven for a Master Air Waybill: a three-digit airline prefix, a seven-digit serial and one check digit. It is usually printed as 020-1234 5675, but the hyphen and space are formatting only. House air waybill numbers are set by the forwarder and have no standard length.",
      },
      {
        q: "What does the three-digit prefix on an AWB mean?",
        a: "It identifies the airline whose document stock the air waybill was issued against, allocated by IATA. It is not necessarily the carrier that operates the flight — on interline movements the issuing airline's prefix stays with the document for the whole journey, and forwarders issuing on neutral stock also carry an airline prefix.",
      },
      {
        q: "Why does my house air waybill fail the check?",
        a: "Because HAWB numbers are not subject to the IATA modulus-7 scheme. Forwarders assign house references from their own sequences, which may contain letters, vary in length, and encode branch or year information. Running the airline check digit calculation against a house reference produces a failure that means nothing. Validate house references against the forwarder's own convention instead.",
      },
      {
        q: "What is the difference between a MAWB and a HAWB?",
        a: "The MAWB is the contract of carriage between the airline and the party that tendered the cargo — usually a forwarder — and covers the whole consolidated consignment. The HAWB is the contract between that forwarder and the individual shipper, covering one shipment inside the consolidation. One MAWB commonly covers dozens of HAWBs, and customs entry is generally filed at house level.",
      },
      {
        q: "Can two shipments share an AWB number?",
        a: "They should not. Document stock is allocated to a carrier and each number is used once. Duplicates do appear when a document is cancelled and the number is reissued, or when a forwarder reuses house references across years. If a lookup returns two live shipments for one reference, treat it as a data-integrity problem and confirm with the issuing party before acting.",
      },
      {
        q: "Does a valid check digit mean the shipment exists?",
        a: "No. The check digit is calculated from the number itself, so a structurally valid AWB number can be invented instantly. It confirms that eleven digits are internally consistent — nothing about booking, tender, flight or cargo. Confirm existence through the carrier's own systems.",
      },
      {
        q: "How reliable is a modulus-7 check?",
        a: "It catches single-digit typing errors reliably, which is the most common failure mode when numbers are keyed by hand. It is weaker than the weighted modulo-11 scheme used for container numbers: with only seven possible check values, roughly one in seven random corruptions will pass by chance, and some digit transpositions survive it. Use it as a filter, not a proof.",
      },
      {
        q: "Can I check several AWB numbers at once?",
        a: "Yes. Paste a list one per line or comma-separated. Each entry is reported separately with its prefix, serial, printed check digit and expected check digit, and structural errors — wrong length, non-numeric characters — are distinguished from arithmetic failures so you can tell a bad reference from a bad transcription. The result set exports as CSV.",
      },
      {
        q: "Where is the AWB number printed on the document?",
        a: "Top right and bottom right of a standard IATA air waybill form, and repeated on every copy in the set. The prefix is usually printed separately from the eight-digit document number. If your document shows only an eight-digit number, the prefix is likely pre-printed elsewhere on the form or implied by the stock — find it before validating, because the check digit calculation needs only the serial but the complete reference needs all eleven digits.",
      },
      {
        q: "Do express couriers use IATA air waybill numbers?",
        a: "Generally not for their own network shipments. Integrators use proprietary tracking numbers with their own formats and check schemes, and those will not validate under modulus 7. An IATA-format AWB appears when the consignment moves as general air cargo on an airline's document stock.",
      },
      {
        q: "Does GainingDocx validate AWB numbers during extraction?",
        a: "Yes. When an air waybill is extracted, the printed number is separated into prefix, serial and check digit, and the modulus-7 calculation runs automatically. Master and house references are recorded separately where the document labels them, and the level is marked unknown rather than guessed when it does not.",
      },
    ],
    related: [
      { href: "/air-waybill-parser", label: "Air waybill parser", blurb: "Extract parties, routing, pieces, weights and charges from MAWB and HAWB documents." },
      { href: "/features/mawb-hawb-reconciliation", label: "MAWB and HAWB reconciliation", blurb: "Reconcile house documents against the master consignment they consolidate into." },
      { href: "/tools/chargeable-weight-calculator", label: "Chargeable weight calculator", blurb: "Verify the rated weight printed on the air waybill." },
      { href: "/templates/air-waybill-template", label: "Air waybill data worksheet", blurb: "Prepare complete AWB particulars before tendering cargo to an airline or agent." },
    ],
  },

  "air-cargo-document-checklist": {
    updated: "2026-08-04",
    keywords: [
      "air cargo document checklist",
      "air freight export documents",
      "documents required for air shipment",
      "dangerous goods declaration air",
      "shipper's letter of instruction",
      "perishable air cargo documents",
      "air export paperwork",
    ],
    quickAnswer: {
      heading: "What paperwork an air shipment needs",
      body:
        "Every air export needs a commercial invoice, a packing list, a shipper's letter of instruction and an air waybill, plus the export declaration required by the origin country. Beyond that core, the document set depends on the cargo: dangerous goods add a shipper's declaration and packing certification, perishables add health or phytosanitary certificates, and consolidations add house air waybills and a cargo manifest.",
      bullets: [
        "Core commercial: invoice and packing list",
        "Core transport: SLI and air waybill",
        "Core regulatory: export declaration, security status",
        "Conditional: by commodity, destination and consolidation",
      ],
    },
    sections: [
      {
        heading: "The core document set",
        paragraphs: [
          "Four documents accompany essentially every air export, and they carry different information for different audiences. The invoice tells customs what the goods are worth; the packing list tells the handler what is physically in the shipment; the shipper's letter of instruction tells the forwarder what to do; the air waybill is the contract of carriage and the operational record.",
          "The most productive discipline is not collecting these documents but reconciling them. Pieces, weights and descriptions have to agree across all four, because the moment they disagree the shipment becomes a query rather than a movement.",
        ],
        table: {
          caption: "Who issues each core document and what it establishes",
          columns: ["Document", "Issued by", "Establishes", "Read by"],
          rows: [
            ["Commercial invoice", "Seller or exporter", "Value, currency, terms of sale, commodity and origin", "Customs at both ends, the bank on documentary payment"],
            ["Packing list", "Shipper or packer", "Pieces, marks, dimensions, net and gross weight", "Handler, customs examination, consignee receiving"],
            ["Shipper's letter of instruction", "Shipper", "Written instruction to the forwarder or agent, including declared values and special handling", "Forwarder or cargo agent"],
            ["Air waybill", "Airline or its agent", "Contract of carriage, routing, pieces, weights, charges", "Carrier, ground handler, customs manifest, consignee"],
            ["Export declaration", "Exporter or its agent", "The regulatory export filing required by the origin country", "Origin customs"],
          ],
        },
      },
      {
        heading: "Conditional documents by scenario",
        paragraphs: [
          "Beyond the core, the requirement is driven by what you are shipping, where it is going and how it is being tendered. The checklist tool builds this set from your role and scenario, but the logic below is what it applies.",
        ],
        subsections: [
          {
            heading: "Dangerous goods",
            paragraphs: [
              "Air transport of dangerous goods is governed by the ICAO Technical Instructions, implemented commercially through the IATA Dangerous Goods Regulations. The paperwork is only the visible part of a compliance chain that also covers classification, packing, marking, labelling and trained personnel.",
              "Acceptance is strict and refusal is common. Airlines and ground handlers apply an acceptance checklist item by item, and a declaration with an inconsistent packing instruction, a missing emergency contact or an unsigned box will be rejected at the counter regardless of how urgent the shipment is.",
            ],
            bullets: [
              "Shipper's Declaration for Dangerous Goods, completed and signed by a trained shipper",
              "Correct UN specification packaging with the required marks and hazard labels",
              "Packing instruction and quantity limits confirmed for passenger or cargo aircraft as applicable",
              "Air waybill annotated to reference the dangerous goods declaration and, where required, 'Cargo Aircraft Only'",
              "Emergency response telephone number that is monitored for the duration of transport",
              "Evidence of current dangerous goods training for the person signing",
              "State and operator variations checked for origin, transit and destination",
            ],
          },
          {
            heading: "Perishables and temperature-controlled cargo",
            paragraphs: [
              "Perishable shipments fail on timing and temperature far more often than on paperwork, but the paperwork is what allows them to move at all. Health, veterinary and phytosanitary requirements are set by the destination and frequently require the certificate to be issued within a defined window before departure.",
            ],
            bullets: [
              "Phytosanitary certificate for plants and plant products, or a veterinary health certificate for animal products",
              "Import permit where the destination requires one before shipment, not on arrival",
              "Temperature instruction stated on the air waybill and on the packages",
              "Pre-cooling and packaging evidence where the buyer or destination requires it",
              "Data logger where the cold chain must be evidenced on arrival",
              "Booking confirmed against a temperature-controlled facility at transit points, not only at origin and destination",
            ],
          },
          {
            heading: "Consolidations and house shipments",
            paragraphs: [
              "When a forwarder consolidates several shippers' cargo under one master air waybill, an extra documentary layer appears. Customs at destination generally clears at house level, so the house documents must be complete and internally consistent with the master.",
            ],
            bullets: [
              "House air waybill for each underlying shipment",
              "Master air waybill covering the consolidated consignment",
              "Consolidation or house manifest listing every house shipment under the master",
              "Advance filings at house level where the destination requires them",
              "Each house shipment's own commercial invoice and packing list",
            ],
          },
          {
            heading: "Cargo security",
            paragraphs: [
              "Air cargo entering the secure supply chain must have a known security status before it can be loaded. Depending on the jurisdiction, that status comes from the shipper's own accreditation, from screening performed by a regulated agent, or from a combination of both.",
            ],
            bullets: [
              "Security status declared on the air waybill or an accompanying consignment security declaration",
              "Evidence of known consignor or account consignor status where the shipper holds it",
              "Screening method recorded where cargo is screened rather than secured at origin",
              "Tamper-evident sealing and a documented chain of custody from the point security was applied",
              "Additional requirements for shipments transiting or terminating in jurisdictions with their own regimes",
            ],
          },
        ],
      },
      {
        heading: "Sequence: what has to happen before what",
        paragraphs: [
          "Air freight fails on sequencing more than on availability. A certificate that exists but was issued after the cut-off is worth nothing, and a security status applied after the cargo left the shipper's control cannot be reinstated retrospectively.",
        ],
        numbered: [
          "Confirm the commodity is acceptable for air transport and identify any dangerous goods, perishable or restricted classification before booking.",
          "Establish destination import requirements, including permits that must be obtained before shipment rather than on arrival.",
          "Prepare the commercial invoice and packing list, and reconcile pieces, weights and descriptions between them.",
          "Issue the shipper's letter of instruction with declared values, special handling and the intended routing.",
          "Complete the export declaration and obtain any licence required at origin.",
          "Apply security screening or secure the cargo under the shipper's accreditation, and record the status before the cargo leaves the secured area.",
          "Obtain commodity-specific certificates inside their validity window, then tender to the forwarder or airline with the air waybill.",
          "Confirm the air waybill particulars against the invoice and packing list before departure, not after.",
        ],
        callout: {
          tone: "warn",
          title: "Requirements are lane-specific, not universal",
          body:
            "Airline, origin, destination, commodity, security regime and customs requirements all vary and all change. This checklist organises preparation; it does not certify compliance. Confirm the live requirement with your forwarder, the operating carrier and the destination authority for the specific shipment in front of you.",
        },
      },
      {
        heading: "Why air shipments get held at the counter",
        paragraphs: [
          "Handling agents refuse cargo for a narrow set of recurring reasons. Almost all of them are document reconciliation failures that would take two minutes to catch before the truck leaves.",
        ],
        bullets: [
          "Piece count or gross weight on the air waybill disagrees with the packing list",
          "Goods description on the invoice is too generic for customs — 'spare parts', 'samples', 'gifts'",
          "Value or currency on the invoice conflicts with the declared value on the air waybill",
          "Dangerous goods declaration inconsistent with the packing instruction, quantity or labels applied",
          "Missing signature, missing emergency contact or an expired training reference on a DG declaration",
          "Certificate issued outside its validity window, or naming a consignee that does not match the invoice",
          "Security status absent, or applied by a party not authorised in that jurisdiction",
          "Consignee address incomplete, with no contact number for the destination agent to arrange clearance",
          "Wooden packaging without an ISPM 15 mark where the destination requires treatment",
        ],
      },
    ],
    faqs: [
      {
        q: "What documents are required for an air freight shipment?",
        a: "At minimum a commercial invoice, a packing list, a shipper's letter of instruction and an air waybill, plus the export declaration required at origin. Beyond that core, requirements depend on the commodity and destination: certificates of origin, import permits, phytosanitary or health certificates, dangerous goods declarations and security documentation are all conditional rather than universal.",
      },
      {
        q: "What is a shipper's letter of instruction?",
        a: "A written instruction from the shipper to the forwarder or cargo agent, authorising them to prepare the air waybill and handle the export on the shipper's behalf. It records the parties, routing, pieces, weights, declared values for carriage and customs, special handling requirements and any documents attached. It is the shipper's evidence of what it instructed, which matters when something is later disputed.",
      },
      {
        q: "Who issues the air waybill?",
        a: "The airline, or a cargo agent acting on the airline's document stock. A shipper does not issue an air waybill — it provides the information, usually through a shipper's letter of instruction, and the carrier or its agent completes and issues the document. Where a forwarder consolidates, the forwarder issues house air waybills to its own customers and receives one master air waybill from the airline.",
      },
      {
        q: "What paperwork do dangerous goods require for air transport?",
        a: "A Shipper's Declaration for Dangerous Goods signed by a trained shipper, UN specification packaging with the correct marks and labels, an air waybill annotated to reference the declaration, a monitored emergency contact number, and confirmation that the packing instruction and quantity limits are correct for passenger or cargo aircraft. Classification, packing, marking and training all have to be right before the declaration means anything.",
      },
      {
        q: "Do I need a certificate of origin for air shipments?",
        a: "Only where the destination requires it, or where the buyer needs it to claim preferential duty under a trade agreement, or where a letter of credit calls for it. It is not a general air freight requirement. Where one is needed, check who is authorised to issue it in your country — commonly a chamber of commerce or a designated competent authority — and how long issuance takes.",
      },
      {
        q: "What is a consignment security declaration?",
        a: "A record of the security status of air cargo and how that status was achieved — whether the cargo was secured by an accredited known consignor, screened by a regulated agent, or handled under another approved method. The exact form and name vary by jurisdiction. Cargo without a valid security status cannot be loaded, and the status cannot be applied retrospectively once the chain of custody is broken.",
      },
      {
        q: "How far in advance should air export documents be ready?",
        a: "Ahead of the carrier's document cut-off, which is earlier than the cargo cut-off and can be a day or more before departure on some lanes. Certificates with validity windows should be timed to be current at departure, not at preparation. The practical rule is to have the invoice and packing list finalised before the cargo is collected, because those two drive everything else.",
      },
      {
        q: "What is the difference between a master and a house air waybill?",
        a: "The master air waybill is the contract between the airline and the party tendering the consolidated consignment, usually a forwarder. The house air waybill is the contract between that forwarder and an individual shipper whose cargo forms part of the consolidation. Customs entry at destination is generally filed at house level, so house documentation must be complete in its own right.",
      },
      {
        q: "Does a commercial invoice need to be signed for air freight?",
        a: "Requirements vary by destination and by the terms of the transaction. Some customs administrations require a signed and sometimes stamped invoice; others accept electronic documents without signature. Where a letter of credit governs payment, the credit's own requirements are stricter than customs and must be met exactly. Confirm both before printing.",
      },
      {
        q: "What causes air shipments to be rejected at acceptance?",
        a: "Overwhelmingly, inconsistencies between documents: piece counts or weights that disagree between the packing list and the air waybill, goods descriptions too vague for customs, values that conflict between the invoice and the declared value, and dangerous goods declarations that do not match the packing or labelling applied. Missing signatures and certificates outside their validity window account for most of the rest.",
      },
      {
        q: "Do wooden crates need special treatment for air freight?",
        a: "Where the destination applies ISPM 15, solid wood packaging must be treated and marked regardless of transport mode. Air shipments are not exempt. The mark must be visible, legible and permanent on at least two opposite sides of the packaging, and untreated wood arriving at a destination that enforces the standard is liable to be refused entry, treated at cost or destroyed.",
      },
      {
        q: "Can GainingDocx check that my air documents agree with each other?",
        a: "Yes. Grouping the invoice, packing list and air waybill for one shipment lets the workspace compare parties, references, piece counts, gross and chargeable weights, values and descriptions across the set, and surface the disagreements as prioritised discrepancies before the cargo is tendered rather than after it is refused.",
      },
    ],
    related: [
      { href: "/features/air-freight-document-automation", label: "Air freight document automation", blurb: "Extract and reconcile the whole air document set in one workspace." },
      { href: "/dangerous-goods-declaration-parser", label: "Dangerous goods declaration parser", blurb: "Capture UN numbers, classes, packing instructions and quantities as structured data." },
      { href: "/templates/air-waybill-template", label: "Air waybill data worksheet", blurb: "Prepare complete AWB particulars for an airline or cargo agent." },
      { href: "/features/air-dangerous-goods-readiness", label: "Air dangerous goods readiness", blurb: "Check DG declarations against the air waybill and packing evidence before tender." },
    ],
  },
};
