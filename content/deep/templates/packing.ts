import type { DeepContentMap } from "@/content/deep/types";

export const PACKING_TEMPLATE_DEEP: DeepContentMap = {
  "packing-list-template": {
    updated: "2026-08-04",
    keywords: [
      "packing list template",
      "export packing list format",
      "packing list excel free",
      "net weight gross weight packing list",
      "case level packing list",
      "packing list vs commercial invoice",
      "shipping packing list sample",
    ],
    quickAnswer: {
      heading: "What an export packing list must show",
      body:
        "A packing list describes the physical shipment: how many packages, what is in each, their marks and case numbers, dimensions, net and gross weight, and the total volume. It does not show prices. Its job is to let a handler, customs officer or receiving warehouse identify and verify the cargo without opening it, and to reconcile against the commercial invoice line for line.",
      bullets: [
        "Case numbers and marks per package",
        "Net weight, gross weight and dimensions",
        "Contents allocated to packages, not just totalled",
        "No prices — that is the invoice's job",
      ],
    },
    sections: [
      {
        heading: "What the packing list is actually used for",
        paragraphs: [
          "The packing list is the document people physically work from. A customs officer selecting a package for examination uses it to know what should be inside. A warehouse receiving a delivery reconciles against it. A claims adjuster establishing what was in a damaged case reads it. A forwarder planning a stow uses its weights and dimensions.",
          "That practical audience is why a packing list that only shows shipment totals is close to useless. If it says 'Total: 40 cartons, 820 kg, 12.4 CBM' and nothing else, none of those people can do their job — and the shipment becomes a question rather than a movement.",
        ],
      },
      {
        heading: "Net, gross and tare weight",
        paragraphs: [
          "Three weights appear on packing lists and they are routinely confused, including by people who have worked in freight for years. Getting them right matters because customs, carriers and consignees each use a different one.",
        ],
        table: {
          caption: "Which weight means what",
          columns: ["Weight", "Definition", "Used by"],
          rows: [
            ["Net weight", "The goods alone, excluding all packaging", "Customs for weight-based duty; buyers verifying quantity"],
            ["Tare weight", "Packaging, pallet and dunnage alone", "Rarely stated separately, but it is the difference between the other two"],
            ["Gross weight", "Goods plus all packaging as presented for carriage", "Carriers for rating and VGM; handlers for lifting"],
          ],
          note: "Gross weight minus net weight equals tare. If your document's three figures do not satisfy that relationship, at least one is wrong.",
        },
        callout: {
          tone: "warn",
          title: "Net weight cannot exceed gross weight",
          body:
            "It sounds too obvious to state, and it is one of the most frequently triggered validation failures in real shipping documents. It happens when net and gross are entered in the wrong columns, when different units are mixed across rows, or when net is taken from a product specification while gross is measured. Any document where net exceeds gross has an error somewhere upstream.",
        },
      },
      {
        heading: "Case-level detail: why it is worth the effort",
        paragraphs: [
          "A case-level packing list allocates contents to individual packages, so case 7 of 40 has a stated contents, weight and dimension. A shipment-level list gives only totals. The difference shows up whenever anything goes wrong.",
          "With case-level detail, a short shipment is provable, a damaged case's contents are known, a customs examination is targeted at one carton, and a partial delivery reconciles. Without it, every one of those becomes a negotiation. The extra work at preparation is repaid the first time a single case is queried.",
        ],
        bullets: [
          "Marks and case numbers in the form C/NO. 7/40, matching the marks printed on the cargo",
          "Package type — carton, crate, drum, pallet, bale — because handling depends on it",
          "Contents of each package, including SKU or part number and quantity",
          "HS code where the shipment covers more than one classification",
          "Net and gross weight per package",
          "Dimensions per package, in a single consistent unit",
          "CBM per package or per group, and a shipment total",
          "Container and seal number where cargo is allocated across containers",
        ],
      },
      {
        heading: "What must reconcile with the commercial invoice",
        paragraphs: [
          "The packing list and the commercial invoice describe the same shipment from two angles — physical and financial. Customs compares them, and so does the buyer. Differences that are not explained become queries.",
        ],
        table: {
          caption: "Fields that must agree across the two documents",
          columns: ["Field", "Must match", "Common cause of divergence"],
          rows: [
            ["Seller, buyer and consignee", "Exactly", "One document updated from new master data, the other copied forward"],
            ["Invoice and PO references", "Exactly", "Late change of PO not carried through"],
            ["Goods description", "Consistent wording", "Invoice written for customs, packing list for the warehouse"],
            ["SKU or part numbers", "Exactly", "Different internal systems producing each document"],
            ["Quantity per line", "Exactly", "Partial shipment invoiced in full, or short pack not reflected"],
            ["HS code", "Exactly", "Classification revised on one document only"],
            ["Country of origin", "Exactly", "Multi-origin shipment summarised on one document"],
            ["Net and gross weight", "Exactly, where the invoice states them", "Estimated on one, weighed on the other"],
          ],
        },
      },
      {
        heading: "Building the list",
        numbered: [
          "Enter the packing list number and date, and reference the commercial invoice and purchase order so all three documents link.",
          "Enter the seller, buyer and ship-to consignee exactly as they appear on the invoice.",
          "Record the transport details — mode, vessel or flight, ports — so the list can be matched to the transport document.",
          "Add one row per package group, starting with the marks and case number range.",
          "Enter contents, SKU, HS code and item quantity for each group, matching the invoice line.",
          "Enter net and gross weight per package, and dimensions in a single unit across the whole document.",
          "Let CBM calculate from dimensions and package count, or override it where the dimensions describe a whole lot rather than each package.",
          "Allocate packages to container and seal numbers where the shipment moves in more than one container.",
          "Check the totals: packages, net weight, gross weight and CBM should each equal the sum of the rows.",
          "Reconcile against the commercial invoice before issuing, and against the transport document once the draft arrives.",
        ],
        callout: {
          tone: "check",
          title: "Recompute totals rather than typing them",
          body:
            "A printed total that does not equal the sum of its lines is one of the most common defects in real shipping documents, and it is a reliable signal that a line was added, removed or edited after the total was written. The builder totals for you; when you receive someone else's packing list, add the lines up yourself.",
        },
      },
      {
        heading: "Presentation details that prevent queries",
        bullets: [
          "Use one unit system throughout — mixing centimetres and inches, or kilograms and pounds, across rows is a frequent and expensive error",
          "State the unit explicitly in every column header rather than relying on convention",
          "Keep case numbering unbroken and sequential, and match it exactly to the marks on the cargo",
          "Do not show prices; a packing list carrying values invites the wrong kind of scrutiny and defeats its purpose when it is sent to parties who should not see commercial terms",
          "Where a shipment is partial, say so explicitly and reference the total order quantity",
          "Where dimensions describe a pallet rather than a carton, say which — a 1.2 × 1.0 × 1.5 m row means very different things otherwise",
          "Sign and identify who prepared it, because a query goes back to that person",
          "Keep the document to a readable structure even when it runs to many pages, repeating column headers on each page",
        ],
      },
    ],
    faqs: [
      {
        q: "What is an export packing list?",
        a: "A document describing the physical composition of a shipment: the number and type of packages, marks and case numbers, what is in each package, dimensions, net and gross weights and total volume. It carries no prices. Its purpose is to let handlers, customs and the consignee identify and verify cargo without opening it, and to reconcile against the commercial invoice.",
      },
      {
        q: "What is the difference between a packing list and a commercial invoice?",
        a: "The invoice records the sale — value, currency, terms and the basis for customs valuation. The packing list records the physical shipment — packages, weights, dimensions and how the goods are distributed among them. They describe the same shipment from different angles, and the facts they share must agree exactly.",
      },
      {
        q: "What is the difference between net weight and gross weight?",
        a: "Net weight is the goods alone, excluding all packaging. Gross weight is the goods plus packaging, pallets and dunnage, as presented for carriage. The difference is tare weight. Customs generally uses net weight where duty is weight-based; carriers rate on gross weight and use it for the Verified Gross Mass declaration.",
      },
      {
        q: "Does a packing list need to show prices?",
        a: "No, and it should not. Values belong on the commercial invoice. A packing list frequently travels to parties who have no business seeing commercial terms — warehouses, hauliers, the consignee's receiving staff — and adding prices both defeats that separation and creates a second, potentially inconsistent, statement of value for customs to compare.",
      },
      {
        q: "Should I show contents per case or just totals?",
        a: "Per case wherever practical. Case-level detail is what makes a short shipment provable, a damaged carton's contents known, a customs examination targeted and a partial delivery reconcilable. A totals-only packing list forces every one of those situations into a negotiation. The extra effort is repaid the first time a single case is queried.",
      },
      {
        q: "How is CBM calculated on a packing list?",
        a: "For dimensions in centimetres, length × width × height × number of packages, divided by 1,000,000. Calculate each package group separately and add the results rather than averaging dimensions. Where a row's dimensions describe a whole lot or a loaded pallet rather than each package, override the calculated figure and note what the dimensions refer to.",
      },
      {
        q: "What are marks and numbers?",
        a: "The identifying information printed on the outside of each package — consignee reference, destination, order number and case number — plus the descriptive side mark carrying weights and dimensions. They must match the packing list exactly, because the packing list is what they are checked against at examination and at receipt.",
      },
      {
        q: "Who prepares the packing list?",
        a: "The shipper or the party that physically packed the goods, because it describes what was actually packed rather than what was ordered. Where a third-party warehouse or contract packer does the work, they should produce or at minimum verify the list — a packing list prepared from a purchase order rather than from the packed cargo is a description of intent, not of fact.",
      },
      {
        q: "Do the weights on the packing list have to match the Bill of Lading?",
        a: "The gross weight should reconcile. The B/L states what the carrier received based on the shipper's declaration, and a difference between the two documents is a discrepancy customs will notice. Where the container was weighed for VGM and the figure differs materially from the packing list total, investigate before the documents are issued — something in the load is not what the list says.",
      },
      {
        q: "What if the packing list total does not equal the sum of the lines?",
        a: "Something changed after the total was written — a line added, removed or edited. Recompute from the lines and correct the total at source rather than adjusting a line to fit. It is one of the most common defects in real shipping documents and one of the most reliable indicators that the document was edited without being rechecked.",
      },
      {
        q: "Can one packing list cover multiple containers?",
        a: "Yes, and it should allocate packages to specific container and seal numbers rather than presenting a single undifferentiated list. Without that allocation, a customs examination of one container cannot be reconciled, and a short shipment cannot be attributed. The container packing list format exists specifically for this.",
      },
      {
        q: "Can GainingDocx check a supplier's packing list automatically?",
        a: "Yes. Extracting a packing list returns package rows with marks, counts, contents, dimensions and net and gross weights as structured data, recomputes the printed totals against the line detail, and flags relationships that cannot hold — such as net weight exceeding gross. Grouping it with the invoice and Bill of Lading compares quantities, weights and references across the set.",
      },
    ],
    related: [
      { href: "/guides/commercial-invoice-vs-packing-list", label: "Commercial invoice vs packing list", blurb: "What each document establishes and exactly which fields must agree." },
      { href: "/packing-list-parser", label: "Packing list parser", blurb: "Extract package rows, weights and dimensions from a supplier's packing list." },
      { href: "/tools/cbm-calculator", label: "CBM calculator", blurb: "Calculate and verify the volume totals on your packing list." },
      { href: "/tools/shipping-mark-generator", label: "Shipping mark generator", blurb: "Produce the carton marks that must match your case numbering." },
    ],
  },

  "simple-packing-list-template": {
    updated: "2026-08-04",
    keywords: [
      "simple packing list template",
      "basic packing list format",
      "small shipment packing list",
      "packing list for samples",
      "courier packing list",
      "free packing list word",
      "packing slip template export",
    ],
    quickAnswer: {
      heading: "When a simple packing list is enough",
      body:
        "A simple packing list summarises a shipment by package group rather than case by case. It suits small consignments, uniform cargo, samples and courier shipments where every carton is identical and case-level detail would add nothing. If the shipment has mixed contents, multiple containers, high value or a documentary credit attached, use the full case-level format instead.",
      bullets: [
        "Package groups rather than individual cases",
        "Suitable for uniform or small shipments",
        "Still needs net and gross weight",
        "Not suitable where a credit prescribes the format",
      ],
    },
    sections: [
      {
        heading: "Choosing between the simple and the full format",
        paragraphs: [
          "The question is not how much detail you can be bothered to provide — it is how much detail somebody will need when something goes wrong. A shipment of forty identical cartons of one SKU can be described accurately in one line. A shipment of forty cartons containing eleven different products cannot, and summarising it produces a document nobody can reconcile.",
        ],
        table: {
          caption: "Which format fits which shipment",
          columns: ["Situation", "Simple format", "Full case-level format"],
          rows: [
            ["All packages identical, one SKU", "Suitable", "Unnecessary detail"],
            ["Mixed contents across packages", "Not suitable", "Required"],
            ["Samples or small courier shipments", "Suitable", "Usually excessive"],
            ["Multiple containers", "Not suitable", "Required, with container allocation"],
            ["Documentary credit governs payment", "Only if the credit permits", "Safer default"],
            ["High-value or fragile cargo", "Not advisable", "Required for claims"],
            ["Destination known for examination", "Not advisable", "Strongly advisable"],
          ],
        },
        callout: {
          tone: "warn",
          title: "Check the credit before choosing the short form",
          body:
            "Where payment runs through a documentary credit, the credit may prescribe what the packing list must show — case numbers, dimensions per package, a specific signature. A simplified list that omits a required element is a discrepancy, and the discrepancy holds payment regardless of how accurate the document is.",
        },
      },
      {
        heading: "What the simple format still has to include",
        paragraphs: [
          "Simplifying means fewer rows, not fewer fields. Every element that lets a third party verify the shipment must still be present.",
        ],
        bullets: [
          "Packing list number and date, and the commercial invoice reference",
          "Seller, buyer and ship-to consignee in full",
          "Number and type of packages per group",
          "Contents description and item quantity per group",
          "HS code where the shipment covers more than one classification",
          "Net weight and gross weight per group, and shipment totals",
          "Dimensions and CBM, at group level where packages are uniform",
          "Marks and numbers, including the case number range covered by each group",
          "Transport details sufficient to match the list to the transport document",
          "Preparer identification and signature",
        ],
      },
      {
        heading: "Common shortcuts that cause problems",
        paragraphs: [
          "Simplification is legitimate; omission is not. These are the abbreviations that reliably generate queries.",
        ],
        bullets: [
          "Giving only a shipment total with no package breakdown at all — nobody can verify anything against it",
          "Omitting net weight and stating gross only, which prevents weight-based duty being assessed correctly",
          "Dropping case numbers entirely, so a short shipment cannot be attributed to a specific package",
          "Describing contents as 'as per invoice', which forces every checker to hold two documents side by side and defeats the point of a separate packing list",
          "Omitting dimensions, which prevents volume verification and stow planning",
          "Failing to state which packages carry which SKU when the group is not genuinely uniform",
          "Reusing a previous shipment's list with the quantities edited, carrying forward stale references",
        ],
      },
      {
        heading: "Using the simple list well",
        numbered: [
          "Confirm the shipment is genuinely uniform enough for group-level description before choosing this format.",
          "Enter the references first — packing list number, date, invoice number and purchase order — so the document links to the rest of the file.",
          "Describe each package group with its contents, quantity, package type and count.",
          "Enter net and gross weight for the group, keeping the relationship between them plausible.",
          "State the case number range each group covers, matching the marks on the cargo.",
          "Check that group totals sum to the shipment totals, and that those totals match the commercial invoice quantities.",
          "Upgrade to the full case-level format the moment the shipment stops being uniform.",
        ],
      },
    ],
    faqs: [
      {
        q: "When should I use a simple packing list?",
        a: "When the shipment is uniform enough that group-level description is complete rather than abbreviated: identical cartons of a single SKU, small consignments, samples and courier shipments. If contents vary between packages, the shipment spans multiple containers, the value is high or a documentary credit governs payment, use the full case-level format.",
      },
      {
        q: "What is the difference between a packing list and a packing slip?",
        a: "Terminology varies by market. A packing slip is generally an internal or domestic document accompanying a delivery, confirming what was sent against an order. A packing list in international trade is a formal shipping document used by customs, carriers and consignees, and it carries weights, dimensions and marks that a domestic packing slip usually omits.",
      },
      {
        q: "Can I omit dimensions from a simple packing list?",
        a: "It is inadvisable. Dimensions support volume verification, freight rating and stow planning, and their absence will generate a request from the forwarder if not from customs. On genuinely uniform cargo you only need one set of dimensions for the whole group, which is very little work for a field several parties will need.",
      },
      {
        q: "Do I still need net and gross weight?",
        a: "Yes. Net weight is what many customs administrations use where duty is weight-based, and gross weight is what carriers rate on and what feeds the Verified Gross Mass declaration on containerised cargo. Providing only one of the two forces someone downstream to estimate the other.",
      },
      {
        q: "Can I write 'contents as per invoice'?",
        a: "You can, but it defeats the purpose. The packing list exists so that someone holding the cargo can verify it without holding the commercial documents. A reference back to the invoice forces every checker to obtain a second document, and where the invoice is not travelling with the cargo — which is common — it leaves them with nothing.",
      },
      {
        q: "Is a simple packing list acceptable for customs?",
        a: "Generally yes, provided it contains the information customs needs: parties, references, package counts, contents description, net and gross weight and marks. What customs will not accept is a list too vague to verify the shipment against. Requirements vary by destination, so confirm with your broker for lanes where examination rates are high.",
      },
      {
        q: "Does a packing list need to be signed?",
        a: "Not universally, but sign it where the buyer, a documentary credit or the destination requires it, and always identify who prepared it. A named preparer means a query goes to a person rather than into a shared mailbox, which materially shortens resolution time.",
      },
      {
        q: "Can I use one packing list for a partial shipment?",
        a: "Yes, and you must make the partial nature explicit — state what is shipping now and reference the total order quantity. A list that shows only the shipped quantity without indicating it is partial will not reconcile against an invoice or purchase order covering the full order, and generates exactly the query you were trying to avoid.",
      },
      {
        q: "What if my shipment turns out to be less uniform than I thought?",
        a: "Move to the full case-level format. A simple list describing groups that are not genuinely uniform is worse than either alternative, because it presents itself as complete while being unverifiable. The point at which a group needs a footnote to explain its contents is the point at which it needed its own rows.",
      },
      {
        q: "Should the case numbers on a simple packing list match the cartons?",
        a: "Yes, always. State the case number range each group covers — cases 1 to 20, 21 to 34 — and make sure the marks printed on the cartons follow that sequence exactly. Case numbering is what makes a short shipment provable, and it costs nothing to maintain even on a simplified document.",
      },
      {
        q: "Is a simple packing list enough for a letter of credit?",
        a: "Only if the credit permits it. Credits frequently prescribe what the packing list must show, and a simplified document that omits a required element is a discrepancy that holds payment. Read the credit before choosing the format — this is one of the few situations where the extra detail is not optional.",
      },
      {
        q: "Can GainingDocx extract a simple packing list?",
        a: "Yes. Group-level packing lists extract into the same structured package rows as case-level documents, with counts, contents, weights and any stated dimensions captured and the printed totals recomputed against the lines. Where the document is too summarised to reconcile against the invoice, that is reported rather than silently accepted.",
      },
    ],
    related: [
      { href: "/templates/packing-list-template", label: "Full export packing list", blurb: "Case-level detail for mixed contents, multiple containers and credit-governed shipments." },
      { href: "/templates/container-packing-list-template", label: "Container packing list", blurb: "Allocate packages to container and seal numbers with running totals." },
      { href: "/packing-list-parser", label: "Packing list parser", blurb: "Extract and verify a packing list you have received." },
      { href: "/guides/commercial-invoice-vs-packing-list", label: "Invoice vs packing list", blurb: "Which fields must agree between the two documents." },
    ],
  },

  "container-packing-list-template": {
    updated: "2026-08-04",
    keywords: [
      "container packing list template",
      "container load list",
      "stuffing report format",
      "packing list by container seal",
      "FCL packing list",
      "container allocation packing list",
      "VGM packing list",
    ],
    quickAnswer: {
      heading: "What a container packing list adds",
      body:
        "A container packing list allocates every package and cargo line to a specific container and seal number, with gross weight and CBM totalled per container as well as per shipment. It is what makes a multi-container shipment auditable: without the allocation, a customs examination of one container cannot be reconciled and a shortage cannot be attributed.",
      bullets: [
        "Every package tied to a container and seal",
        "Gross weight and CBM per container",
        "Supports VGM and payload verification",
        "Essential for multi-container consignments",
      ],
    },
    sections: [
      {
        heading: "Why allocation matters more than totals",
        paragraphs: [
          "On a single-container shipment, a standard packing list is sufficient — everything is in the one box. The moment cargo spans two or more containers, shipment totals stop being useful, because every operational question is about a specific container.",
          "Customs examines one container, not a shipment. A terminal weighs one container. A shortage is discovered when one container is unstuffed. A damage claim relates to the cargo in one container. A packing list that cannot say what was in which unit turns each of those into an investigation.",
        ],
        bullets: [
          "A customs examination on container two needs to know what container two holds",
          "A VGM declaration is made per container and must reconcile with that container's cargo weight",
          "A payload check needs the weight loaded into each specific unit",
          "A short-landed or damaged container needs its own contents record for a claim",
          "Partial deliveries frequently move container by container",
          "Devanning at destination is planned from the per-container manifest",
        ],
      },
      {
        heading: "Building the allocation",
        paragraphs: [
          "The structure is a standard packing list with a container and seal column added, and totals struck at two levels. The discipline is that every row must belong to exactly one container, and that the per-container subtotals must sum to the shipment totals.",
        ],
        numbered: [
          "Record the container number, size and type, and seal number for each unit before allocating any cargo.",
          "Validate every container number's ISO 6346 check digit — a transposed digit here disconnects the container from its own contents record.",
          "Allocate each package group to exactly one container, splitting a group across rows if it spans units rather than assigning it to both.",
          "Enter contents, quantity, net and gross weight and dimensions per row as on a standard packing list.",
          "Strike a subtotal per container for packages, gross weight and CBM.",
          "Check each container's gross weight against its payload capacity, and against the tare stencilled on the door.",
          "Confirm the container subtotals sum to the shipment totals, and that those match the commercial invoice quantities.",
          "Reconcile the per-container gross weights against the VGM figures once weighing is complete.",
        ],
        callout: {
          tone: "warn",
          title: "Seal numbers are evidence, not decoration",
          body:
            "The seal number recorded at stuffing is what proves the container was not opened in transit. It must match the physical seal, appear on the Bill of Lading, and be checked at delivery. A seal number recorded incorrectly, or recorded from the seal bag rather than the fitted seal, destroys the evidential chain exactly when you need it — after a loss.",
        },
      },
      {
        heading: "Checking weight against capacity",
        paragraphs: [
          "A container packing list is the first place a weight problem becomes visible, and catching it here is enormously cheaper than catching it at the terminal weighbridge or, worse, at a road weight check.",
          "Two limits apply and both are hard. Payload is the container's maximum gross weight minus its actual tare, and it is stencilled on the door. Road weight limits apply on the land legs at both ends and are frequently lower than the container's own rating, particularly in jurisdictions with strict axle-weight enforcement.",
        ],
        table: {
          caption: "Indicative payload limits for standard dry containers",
          columns: ["Equipment", "Typical tare", "Typical payload", "Weight-limited above"],
          rows: [
            ["20ft general purpose", "≈ 2,200 kg", "≈ 28,200 kg", "≈ 850 kg per CBM"],
            ["40ft general purpose", "≈ 3,800 kg", "≈ 26,600 kg", "≈ 395 kg per CBM"],
            ["40ft high cube", "≈ 3,900 kg", "≈ 26,400 kg", "≈ 345 kg per CBM"],
            ["45ft high cube", "≈ 4,800 kg", "≈ 27,700 kg", "≈ 320 kg per CBM"],
          ],
          note: "Take the tare and maximum gross weight from the specific container's door markings rather than from any table. Road weight limits at origin and destination may be materially lower.",
        },
      },
      {
        heading: "The container packing list and Verified Gross Mass",
        paragraphs: [
          "VGM is a separate legal declaration made per container, and it must be obtained by weighing rather than calculating from a specification. But the container packing list is the cross-check: your declared cargo weight plus the stencilled tare should approximate the weighed VGM closely.",
          "When they diverge materially, something is wrong and it is worth finding out what before the container ships. Common causes are dunnage and packaging omitted from the packing list, a generic tare figure used instead of the actual one, cargo loaded that was not on the list, or — occasionally — cargo missing that was.",
        ],
      },
      {
        heading: "Reconciling with the Bill of Lading",
        paragraphs: [
          "The Bill of Lading repeats the container and seal numbers, the packages and the gross weight per container. Those figures come from your shipping instructions, which come from this list. A mismatch between the B/L and the packing list is a discrepancy customs will find and a documentary credit will reject.",
        ],
        bullets: [
          "Every container on the B/L appears on the packing list, and no more",
          "Seal numbers match exactly, character for character",
          "Package counts per container agree",
          "Gross weight per container agrees within any tolerance the carrier applies",
          "The shipment totals on both documents agree",
          "Container size and type codes are consistent",
          "Marks and numbers correspond to what is on the cargo",
        ],
      },
    ],
    faqs: [
      {
        q: "What is a container packing list?",
        a: "A packing list that allocates every package and cargo line to a specific container and seal number, with gross weight and CBM totalled per container as well as for the shipment. It is the format needed whenever cargo spans more than one container, because every operational and customs question relates to a specific unit rather than to the shipment as a whole.",
      },
      {
        q: "When do I need a container packing list rather than a standard one?",
        a: "Whenever the shipment moves in more than one container. A standard packing list is fine for a single unit. From two upward, a document that cannot say what is in which container cannot support a customs examination, a shortage claim, a VGM reconciliation or a partial delivery.",
      },
      {
        q: "Why does the seal number matter so much?",
        a: "It is the evidence that the container was not opened between stuffing and delivery. It must match the physical seal, appear on the Bill of Lading, and be verified at delivery. If the seal at destination does not match the number recorded at stuffing, that is a cargo security event and it is the first thing a claims adjuster will look at.",
      },
      {
        q: "Is a container packing list the same as a stuffing report?",
        a: "They overlap heavily. A stuffing report is the warehouse's record of what was physically loaded, often with photographs and the seal fitted. A container packing list is the shipping document derived from it. Where the two exist separately, the packing list should be produced from the stuffing report rather than from the order, so it describes what was loaded rather than what was meant to be.",
      },
      {
        q: "How do I check whether a container is overweight?",
        a: "Compare the cargo gross weight allocated to that container against its payload — the maximum gross weight stencilled on the door minus that container's actual tare, also stencilled. Then check road weight limits at both origin and destination, which are frequently lower than the container's own rating and are enforced with fines and offloading rather than warnings.",
      },
      {
        q: "Does the container packing list replace the VGM declaration?",
        a: "No. VGM is a separate legal declaration under SOLAS, made per container and obtained by weighing rather than calculation. The packing list is the cross-check: cargo weight plus stencilled tare should approximate the weighed VGM closely. A material divergence means something was loaded, omitted or mis-weighed, and it is worth resolving before the container ships.",
      },
      {
        q: "Can one package group span two containers?",
        a: "Yes, but split it across rows rather than assigning the group to both. A row that says '80 cartons in containers A and B' cannot support an examination of either. Split it into '48 cartons in container A' and '32 cartons in container B', with the weights and volumes divided accordingly.",
      },
      {
        q: "What should the container numbers be checked against?",
        a: "Their own ISO 6346 check digits first, which catches transcription errors immediately, then against the equipment interchange receipt and the carrier's booking. A container number wrong on the packing list disconnects that unit's cargo record from every downstream system, and the error typically surfaces at destination when it is most expensive.",
      },
      {
        q: "Do container packing lists need dimensions per package?",
        a: "Where practical, yes — they support volume verification and devanning planning. On uniform cargo, group-level dimensions are sufficient. What matters more is that the CBM allocated to each container is stated, so the load can be sanity-checked against that container's capacity.",
      },
      {
        q: "What if the Bill of Lading shows a different weight per container?",
        a: "Resolve it before the document is finalised. The B/L figures come from your shipping instructions, which should come from this list, so a difference means one of the three was edited independently. Customs compares the documents, and a documentary credit will reject a set that disagrees with itself.",
      },
      {
        q: "Should I record the container tare on the packing list?",
        a: "It is good practice. Recording the stencilled tare alongside the cargo weight makes the payload check visible on the document, gives you the figure needed for a VGM cross-check, and creates a record of which specific container was used — tares vary between boxes of the same nominal size by several hundred kilograms.",
      },
      {
        q: "Can GainingDocx reconcile a container packing list against the B/L?",
        a: "Yes. Extracting both documents for the same shipment lets the workspace compare container numbers with their check digits recomputed, seal numbers, package counts and gross weights per container, and report any unit that appears on one document but not the other, or whose figures disagree.",
      },
    ],
    related: [
      { href: "/templates/packing-list-template", label: "Export packing list template", blurb: "The case-level format this document extends with container allocation." },
      { href: "/tools/container-number-check", label: "Container number check", blurb: "Validate every container number before it reaches a shipping document." },
      { href: "/tools/container-load-calculator", label: "Container load calculator", blurb: "Check the load against volume and payload before allocating cargo." },
      { href: "/bill-of-lading-parser", label: "Bill of Lading parser", blurb: "Extract the container, seal and weight detail the B/L repeats." },
    ],
  },
};
