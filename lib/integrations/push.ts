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
    // `redirect: "manual"`, not `"error"`: Workers rejects `"error"` outright,
    // which failed every push before a request was made. Redirects are still
    // never followed — pushing a customer's credentialed payload to a host they
    // did not configure is the thing being prevented — they are just refused
    // here rather than by the runtime. See lib/integrations/delivery.ts.
    const response = await fetch(endpoint, { method: "POST", headers: connectorHeaders(connection.auth_type, credentials, connection.auth_header), body: JSON.stringify(payload), redirect: "manual", signal: AbortSignal.timeout(20_000) });
    const redirected = response.status >= 300 && response.status < 400;
    const delivered = response.ok && !redirected;
    return {
      delivered,
      status: response.status,
      error: delivered
        ? null
        : redirected
          ? `Endpoint redirected (HTTP ${response.status}). Point the connection at its final URL — redirects are never followed.`
          : `Endpoint returned HTTP ${response.status}`,
    };
  } catch (error) {
    return { delivered: false, status: null, error: error instanceof Error ? error.message.slice(0, 300) : "Connector delivery failed" };
  }
}
