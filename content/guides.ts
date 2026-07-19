export interface GuideDefinition {
  slug: string;
  title: string;
  description: string;
  readMinutes: number;
  sections: { heading: string; paragraphs: string[]; bullets?: string[] }[];
}

export const GUIDES: GuideDefinition[] = [
  {
    slug: "how-to-read-a-bill-of-lading",
    title: "How to Read a Bill of Lading",
    description: "A practical field-by-field guide to parties, routing, cargo, originals and freight terms.", readMinutes: 8,
    sections: [
      { heading: "Start with identity and parties", paragraphs: ["Confirm the B/L number and carrier first, then compare the shipper, consignee and notify party against the commercial invoice. A consignee shown as ‘to order’ changes how title is transferred and should never be silently normalized."], bullets: ["B/L number and carrier SCAC", "Shipper and consignee legal names", "Notify party and contact details"] },
      { heading: "Check the voyage and ports", paragraphs: ["Vessel, voyage, port of loading and port of discharge define the contracted movement. Match ports using UN/LOCODE where possible, because similarly named terminals and cities cause expensive routing errors."] },
      { heading: "Reconcile containers and cargo", paragraphs: ["Recompute every ISO 6346 container check digit and compare package and weight totals with the packing list. Treat a missing or extra container as a high-severity discrepancy."] },
      { heading: "Review dates and release type", paragraphs: ["Check shipped-on-board and issue dates, the number of originals, and whether the document is original, sea waybill or telex released. These details control payment and cargo release."] },
    ],
  },
  {
    slug: "commercial-invoice-vs-packing-list",
    title: "Commercial Invoice vs Packing List",
    description: "What each document contains, where they overlap and how to cross-check them.", readMinutes: 6,
    sections: [
      { heading: "Different jobs, shared facts", paragraphs: ["The commercial invoice records the sale and customs value. The packing list records the physical packing. Both should agree on parties, product identity and shipment references, but only the invoice needs prices and currency."] },
      { heading: "Fields to cross-check", paragraphs: ["Compare names after removing harmless punctuation, then reconcile product lines, cartons, net weight and gross weight."], bullets: ["Seller and buyer", "Invoice and PO references", "Product descriptions and HS codes", "Cartons, net weight and gross weight"] },
      { heading: "Common discrepancies", paragraphs: ["Late packing changes, unit conversion errors and copied old references are common. Resolve the source document rather than editing both copies independently."] },
    ],
  },
  {
    slug: "iso-6346-container-number-check-digit",
    title: "ISO 6346 Container Number Check Digits",
    description: "Understand owner codes, serial numbers and the check-digit calculation.", readMinutes: 7,
    sections: [
      { heading: "Container number structure", paragraphs: ["A standard freight container number has three owner-code letters, one equipment-category letter, six serial digits and one check digit. Spaces may be printed for readability but are not part of the number."] },
      { heading: "How the checksum works", paragraphs: ["Letters receive ISO values that skip multiples of 11. Each character is multiplied by a power of two, the sum is reduced modulo 11, and a remainder of 10 becomes check digit 0."] },
      { heading: "What a failure means", paragraphs: ["A failed check digit usually means one character was mistyped or misread. It does not prove the container itself is invalid, so compare the number with the door marking and source document."] },
    ],
  },
  {
    slug: "how-to-calculate-cbm-for-shipping",
    title: "How to Calculate CBM for Ocean Shipping",
    description: "Calculate shipment volume from carton dimensions and avoid unit-conversion mistakes.", readMinutes: 5,
    sections: [
      { heading: "The CBM formula", paragraphs: ["For dimensions in metres, multiply length × width × height × quantity. For centimetres, divide the result by 1,000,000; for inches, multiply cubic inches by 0.000016387064."] },
      { heading: "Multiple carton sizes", paragraphs: ["Calculate each size group separately and add the group volumes. Do not average dimensions: it changes the volume whenever cartons differ in size."] },
      { heading: "CBM is not loadability", paragraphs: ["A container’s nominal cubic capacity is higher than its practical usable capacity. Door dimensions, pallet footprints, weight limits and safe stowage all reduce what will fit."] },
    ],
  },
];
