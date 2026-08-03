export const CANONICAL_SCHEMA_VERSION = "2.1.0";
export const STANDARDS_CROSSWALK_VERSION = "2026.08";

export const STANDARD_SOURCES = {
  dcsa: {
    standard: "DCSA Bill of Lading",
    version: "3.0.3",
    informationModel: "2024.Q4",
    url: "https://developer.dcsa.org/implementing-bill-of-lading-si-td",
  },
  uncefact: {
    standard: "UN/CEFACT Multi Modal Transport Reference Data Model",
    version: "D19A",
    url: "https://service.unece.org/trade/uncefact/publication/Transport-Logistics/MMT-RDM/HTML/011.htm",
  },
  fiata: {
    standard: "FIATA electronic Bill of Lading public data model",
    version: "public main reference accessed 2026-08-02",
    url: "https://github.com/FIATA/eFBL",
  },
} as const;

export type StandardsMapping = {
  canonicalField: string;
  meaning: string;
  dcsa?: string;
  uncefact: string;
  fiata?: string;
  documentTypes?: string[];
};

// These are semantic crosswalk concepts, not claims that the canonical export
// is a valid payload for any external API. Exact partner payloads must still be
// generated and tested against the applicable published schema/version.
export const TRANSPORT_DOCUMENT_CROSSWALK: StandardsMapping[] = [
  { canonicalField: "bl_number", meaning: "Transport-document reference", dcsa: "transportDocumentReference", uncefact: "Transport Contract / Reference ID", fiata: "FBL number" },
  { canonicalField: "booking_no", meaning: "Carrier booking reference", dcsa: "carrierBookingReference", uncefact: "Consignment / Carrier Assigned ID", fiata: "Booking reference" },
  { canonicalField: "shipper", meaning: "Shipper/document party", dcsa: "documentParties: shipper", uncefact: "Consignor Trade Party", fiata: "Consignor" },
  { canonicalField: "consignee", meaning: "Consignee/document party", dcsa: "documentParties: consignee", uncefact: "Consignee Trade Party", fiata: "Consignee" },
  { canonicalField: "notify", meaning: "Notify party", dcsa: "documentParties: notify party", uncefact: "Notify Trade Party", fiata: "Notify address" },
  { canonicalField: "carrier_name", meaning: "Contractual carrier", dcsa: "issuingParty / carrier", uncefact: "Carrier Trade Party", fiata: "Carrier/forwarder" },
  { canonicalField: "vessel_name", meaning: "Vessel name", dcsa: "transports: vessel", uncefact: "Main Carriage Transport Means", fiata: "Vessel" },
  { canonicalField: "voyage_no", meaning: "Carrier voyage", dcsa: "transports: carrierVoyageNumber", uncefact: "Main Carriage Transport Movement", fiata: "Voyage" },
  { canonicalField: "port_of_load", meaning: "Port of loading", dcsa: "shipmentLocations: PRE/ POL", uncefact: "Loading Baseport Location", fiata: "Port of loading" },
  { canonicalField: "port_of_discharge", meaning: "Port of discharge", dcsa: "shipmentLocations: POD", uncefact: "Unloading Baseport Location", fiata: "Port of discharge" },
  { canonicalField: "place_of_receipt", meaning: "Place of receipt", dcsa: "displayedNameForPlaceOfReceipt / shipmentLocations", uncefact: "Receipt Location", fiata: "Place of receipt" },
  { canonicalField: "place_of_delivery", meaning: "Place of delivery", dcsa: "displayedNameForPlaceOfDelivery / shipmentLocations", uncefact: "Delivery Location", fiata: "Place of delivery" },
  { canonicalField: "containers", meaning: "Utilized transport equipment", dcsa: "utilizedTransportEquipments", uncefact: "Utilized Transport Equipment", fiata: "Transport equipment" },
  { canonicalField: "cargo", meaning: "Consignment/goods items", dcsa: "consignmentItems / cargoItems", uncefact: "Included Supply Chain Consignment Item", fiata: "Goods items" },
  { canonicalField: "total_packages", meaning: "Package total", dcsa: "cargoItems: outerPackaging", uncefact: "Consignment Item / Package Quantity", fiata: "Number and kind of packages" },
  { canonicalField: "total_gross_kg", meaning: "Gross cargo weight", dcsa: "cargoItems: cargoGrossWeight", uncefact: "Consignment Item / Gross Weight", fiata: "Gross weight" },
  { canonicalField: "total_volume_cbm", meaning: "Cargo volume", dcsa: "cargoItems: cargoGrossVolume", uncefact: "Consignment Item / Gross Volume", fiata: "Measurement" },
  { canonicalField: "freight_terms", meaning: "Freight-payment term", dcsa: "isShippedOnBoardType / charges payment terms", uncefact: "Transport Service Payment Arrangement", fiata: "Freight amount / prepaid-collect" },
  { canonicalField: "originals_count", meaning: "Number of originals", dcsa: "numberOfOriginalsWithCharges / numberOfOriginalsWithoutCharges", uncefact: "Transport Contract Document / Original Quantity", fiata: "Original FBL count" },
  { canonicalField: "document_stage", meaning: "Draft/final lifecycle state", dcsa: "transportDocumentStatus", uncefact: "Document Status Code", fiata: "Document issuance state" },
  { canonicalField: "si_number", meaning: "Shipping-instructions reference", dcsa: "shippingInstructionsReference", uncefact: "Transport Instructions / Reference ID", documentTypes: ["shipping_instructions"] },
];

function hasValue(value: unknown) {
  if (value === null || value === undefined || value === "") return false;
  if (Array.isArray(value)) return value.length > 0;
  return true;
}

export function standardsProfile(docType: string, fields: Record<string, unknown>) {
  const mappings = TRANSPORT_DOCUMENT_CROSSWALK.filter((mapping) => !mapping.documentTypes || mapping.documentTypes.includes(docType));
  const populatedMappings = mappings.filter((mapping) => hasValue(fields[mapping.canonicalField]));
  return {
    profile: "gainingdocx.semantic-crosswalk",
    version: STANDARDS_CROSSWALK_VERSION,
    canonicalSchemaVersion: CANONICAL_SCHEMA_VERSION,
    sources: STANDARD_SOURCES,
    status: "Internal semantic mapping only; not DCSA, UN/CEFACT or FIATA certification, API conformance, or legal eBL issuance.",
    mappedFields: populatedMappings,
    coverage: { populatedMappedFields: populatedMappings.length, availableMappings: mappings.length },
  };
}

export function validateCanonicalDocument(docType: string, fields: Record<string, unknown>) {
  const errors: string[] = [];
  const warnings: string[] = [];
  if (!docType.trim()) errors.push("documentType is required");
  if (!fields || typeof fields !== "object" || Array.isArray(fields)) errors.push("fields must be an object");
  if (["bill_of_lading", "sea_waybill"].includes(docType) && !hasValue(fields.bl_number)) errors.push("transport documents require bl_number in the internal canonical profile");
  if (docType === "shipping_instructions" && !hasValue(fields.si_number) && !hasValue(fields.booking_no)) errors.push("shipping instructions require si_number or booking_no in the internal canonical profile");
  const profile = standardsProfile(docType, fields);
  if (!profile.coverage.populatedMappedFields) warnings.push("no populated field has a published semantic crosswalk entry");
  if (!hasValue(fields._meta)) warnings.push("source metadata is absent; external consumers cannot trace values to reviewed evidence");
  return { profile: "gainingdocx.canonical.internal", version: CANONICAL_SCHEMA_VERSION, conforms: errors.length === 0, errors, warnings };
}
