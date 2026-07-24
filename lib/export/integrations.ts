import { docRef } from "./rows";

export const INTEGRATION_PROFILES = ["canonical_xml", "cargowise_xml", "sap_tm", "magaya", "flexport"] as const;
export type IntegrationProfile = typeof INTEGRATION_PROFILES[number];

function xmlEscape(value: unknown): string {
  return String(value ?? "").replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&apos;" }[char]!));
}

function xmlNode(name: string, value: unknown): string {
  if (Array.isArray(value)) return value.map((item) => xmlNode(name, item)).join("");
  if (value && typeof value === "object") {
    return `<${name}>${Object.entries(value as Record<string, unknown>).filter(([key]) => key !== "_meta").map(([key, item]) => xmlNode(key.replace(/[^A-Za-z0-9_.-]/g, "_"), item)).join("")}</${name}>`;
  }
  return `<${name}>${xmlEscape(value)}</${name}>`;
}

function canonical(docType: string, fields: Record<string, unknown>) {
  return { schema: "gainingdocx.integration.v1", documentType: docType, documentReference: docRef(fields), fields };
}

export function integrationExport(profile: IntegrationProfile, docType: string, fields: Record<string, unknown>): { body: string; extension: "xml" | "json"; mime: string } {
  const data = canonical(docType, fields);
  if (profile === "canonical_xml" || profile === "cargowise_xml") {
    const root = profile === "cargowise_xml" ? "CargoWiseMappingEnvelope" : "GainingDocxDocument";
    const notice = profile === "cargowise_xml" ? "Mapping template: confirm field names against your CargoWise tenant/import specification." : "Canonical portable export.";
    return { body: `<?xml version="1.0" encoding="UTF-8"?>\n<${root} profileNotice="${xmlEscape(notice)}">${Object.entries(data).map(([key, value]) => xmlNode(key, value)).join("")}</${root}>`, extension: "xml", mime: "application/xml; charset=utf-8" };
  }
  const envelope = {
    profile,
    profileNotice: `Integration mapping template for ${profile === "sap_tm" ? "SAP Transportation Management" : profile}. Confirm required fields and authentication against the receiving system before production import.`,
    payload: data,
  };
  return { body: JSON.stringify(envelope, null, 2), extension: "json", mime: "application/json; charset=utf-8" };
}
