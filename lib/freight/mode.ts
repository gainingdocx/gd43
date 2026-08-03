export type FreightMode = "air" | "ocean" | "multimodal";

const AIR_PARSERS = new Set(["air-waybill-parser", "shipper-letter-of-instruction-parser", "dangerous-goods-declaration-parser", "air-cargo-manifest-parser", "cargo-security-declaration-parser"]);
const OCEAN_PARSERS = new Set(["bill-of-lading-parser", "sea-waybill-parser", "arrival-notice-parser", "booking-confirmation-parser"]);

const AIR_TOOLS = new Set(["chargeable-weight-calculator", "air-waybill-number-check", "air-cargo-document-checklist"]);
const OCEAN_TOOLS = new Set(["container-load-calculator", "container-number-check", "port-code-lookup", "lcl-freight-calculator", "demurrage-detention-calculator"]);

const AIR_TEMPLATES = new Set(["air-waybill-template"]);
const OCEAN_TEMPLATES = new Set(["bill-of-lading-template", "arrival-notice-template", "delivery-order-template", "shipping-instructions-template", "container-packing-list-template"]);

const AIR_FEATURES = new Set(["air-freight-document-automation", "mawb-hawb-reconciliation", "airfreight-invoice-audit", "air-dangerous-goods-readiness"]);
const OCEAN_FEATURES = new Set(["maritime-document-validation"]);

function classify(slug: string, air: Set<string>, ocean: Set<string>): FreightMode {
  if (air.has(slug)) return "air";
  if (ocean.has(slug)) return "ocean";
  return "multimodal";
}

export const parserMode = (slug: string) => classify(slug, AIR_PARSERS, OCEAN_PARSERS);
export const toolMode = (slug: string) => classify(slug, AIR_TOOLS, OCEAN_TOOLS);
export const templateMode = (slug: string) => classify(slug, AIR_TEMPLATES, OCEAN_TEMPLATES);
export const featureMode = (slug: string) => classify(slug, AIR_FEATURES, OCEAN_FEATURES);

export function freightModeLabel(mode: FreightMode) {
  if (mode === "air") return "AIR";
  if (mode === "ocean") return "OCEAN";
  return "SHARED";
}
