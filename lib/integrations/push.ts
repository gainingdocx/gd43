import "server-only";
import { connectorHeaders, validateConnectorUrl, type ConnectorAuth } from "./connector-payload";
import { decryptConnectorCredentials } from "./connector-secrets";

export interface StoredConnection {
  endpoint_url: string;
  auth_type: ConnectorAuth;
  auth_header: string | null;
  encrypted_credentials: string | null;
}

export async function deliverConnector(connection: StoredConnection, payload: unknown) {
  const endpoint = validateConnectorUrl(connection.endpoint_url);
  if (!endpoint) return { delivered: false, status: null, error: "Connector endpoint is not an allowed public HTTPS URL." };
  try {
    const credentials = await decryptConnectorCredentials(connection.encrypted_credentials);
    const response = await fetch(endpoint, { method: "POST", headers: connectorHeaders(connection.auth_type, credentials, connection.auth_header), body: JSON.stringify(payload), redirect: "error", signal: AbortSignal.timeout(20_000) });
    return { delivered: response.ok, status: response.status, error: response.ok ? null : `Endpoint returned HTTP ${response.status}` };
  } catch (error) {
    return { delivered: false, status: null, error: error instanceof Error ? error.message.slice(0, 300) : "Connector delivery failed" };
  }
}
