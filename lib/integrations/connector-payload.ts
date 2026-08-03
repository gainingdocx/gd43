import { integrationExport, type IntegrationProfile } from "@/lib/export/integrations";

export type ConnectorProfile = "canonical_json" | "cargowise" | "sap_tm" | "magaya" | "flexport" | "custom";
export type ConnectorAuth = "bearer" | "api_key" | "basic" | "none";

export function connectorHeaders(authType: ConnectorAuth, credentials: Record<string, string>, authHeader?: string | null) {
  const headers: Record<string, string> = { "Content-Type": "application/json", Accept: "application/json", "User-Agent": "GainingDocx-Connector/1.0" };
  if (authType === "bearer" && credentials.secret) headers.Authorization = `Bearer ${credentials.secret}`;
  if (authType === "api_key" && credentials.secret) headers[authHeader?.trim() || "X-API-Key"] = credentials.secret;
  if (authType === "basic" && credentials.username) headers.Authorization = `Basic ${Buffer.from(`${credentials.username}:${credentials.secret ?? ""}`).toString("base64")}`;
  return headers;
}

function mappingProfile(profile: ConnectorProfile): IntegrationProfile | null {
  if (profile === "cargowise") return "cargowise_xml";
  if (profile === "sap_tm" || profile === "magaya" || profile === "flexport") return profile;
  return null;
}

export function buildShipmentPush(profile: ConnectorProfile, shipment: Record<string, unknown>, documents: Array<{ id: string; doc_type: string; fields: Record<string, unknown> }>) {
  const mapping = mappingProfile(profile);
  return {
    schema: "gainingdocx.shipment.push.v1", profile, generated_at: new Date().toISOString(), shipment,
    documents: documents.map((document) => {
      const exported = mapping ? integrationExport(mapping, document.doc_type, document.fields) : null;
      return { id: document.id, document_type: document.doc_type, fields: document.fields, mapping: exported ? { format: exported.extension, content_type: exported.mime, body: exported.body } : null };
    }),
  };
}

export function validateConnectorUrl(raw: string) {
  let url: URL;
  try { url = new URL(raw); } catch { return null; }
  const host = url.hostname.toLowerCase();
  if (url.protocol !== "https:" || host === "localhost" || host.endsWith(".local") || /^127\.|^10\.|^192\.168\.|^169\.254\.|^0\.|^\[?::1\]?$/.test(host) || /^172\.(1[6-9]|2\d|3[01])\./.test(host)) return null;
  return url.toString();
}
