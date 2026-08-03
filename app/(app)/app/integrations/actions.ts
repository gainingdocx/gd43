"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { sha256 } from "@/lib/integrations/webhooks";
import { createAdminClient } from "@/lib/supabase/admin";
import { encryptConnectorCredentials } from "@/lib/integrations/connector-secrets";
import { buildShipmentPush, validateConnectorUrl, type ConnectorAuth, type ConnectorProfile } from "@/lib/integrations/connector-payload";
import { deliverConnector } from "@/lib/integrations/push";

export type CredentialState = { secret?: string; error?: string; success?: string };

const CONNECTOR_PROFILES = new Set<ConnectorProfile>(["canonical_json", "cargowise", "sap_tm", "magaya", "flexport", "custom"]);
const CONNECTOR_AUTHS = new Set<ConnectorAuth>(["bearer", "api_key", "basic", "none"]);

async function hasAutomationPlan(userId: string) {
  const { data } = await createAdminClient().from("profiles").select("plan").eq("id", userId).maybeSingle();
  return data?.plan === "pro" || data?.plan === "team";
}

function randomSecret(prefix: string): string {
  const bytes = crypto.getRandomValues(new Uint8Array(30));
  return `${prefix}${Buffer.from(bytes).toString("base64url")}`;
}

export async function createApiKey(_: CredentialState, formData: FormData): Promise<CredentialState> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Sign in again." };
  if (!await hasAutomationPlan(user.id)) return { error: "Upgrade to Pro or Team to create API keys." };
  const name = String(formData.get("name") ?? "").trim().slice(0, 80);
  if (!name) return { error: "Give this key a name." };
  const secret = randomSecret("gdx_live_");
  const { error } = await supabase.from("api_keys").insert({
    owner: user.id, name, key_prefix: secret.slice(0, 16), key_hash: await sha256(secret),
  });
  if (error) return { error: "The key could not be created." };
  revalidatePath("/app/integrations");
  return { secret };
}

export async function createWebhook(_: CredentialState, formData: FormData): Promise<CredentialState> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Sign in again." };
  if (!await hasAutomationPlan(user.id)) return { error: "Upgrade to Pro or Team to create webhooks." };
  const raw = String(formData.get("url") ?? "").trim();
  let url: URL;
  try { url = new URL(raw); } catch { return { error: "Enter a valid HTTPS URL." }; }
  if (url.protocol !== "https:" || ["localhost", "127.0.0.1", "::1"].includes(url.hostname)) {
    return { error: "Webhook URLs must use public HTTPS." };
  }
  const secret = randomSecret("whsec_");
  const { error } = await supabase.from("webhook_endpoints").insert({
    owner: user.id,
    url: url.toString(),
    description: String(formData.get("description") ?? "").trim().slice(0, 120) || null,
    signing_secret: secret,
  });
  if (error) return { error: "The webhook could not be created." };
  revalidatePath("/app/integrations");
  return { secret };
}

export async function revokeApiKey(formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;
  await supabase.from("api_keys").update({ revoked_at: new Date().toISOString() })
    .eq("id", String(formData.get("id") ?? "")).eq("owner", user.id);
  revalidatePath("/app/integrations");
}

export async function removeWebhook(formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;
  await supabase.from("webhook_endpoints").delete()
    .eq("id", String(formData.get("id") ?? "")).eq("owner", user.id);
  revalidatePath("/app/integrations");
}

export async function createIntegrationConnection(_: CredentialState, formData: FormData): Promise<CredentialState> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Sign in again." };
  if (!await hasAutomationPlan(user.id)) return { error: "Upgrade to Pro or Team to connect an ERP or TMS." };
  const endpoint = validateConnectorUrl(String(formData.get("endpoint") ?? "").trim());
  const profile = String(formData.get("profile") ?? "") as ConnectorProfile;
  const authType = String(formData.get("authType") ?? "") as ConnectorAuth;
  const name = String(formData.get("name") ?? "").trim().slice(0, 100);
  if (!name || !endpoint || !CONNECTOR_PROFILES.has(profile) || !CONNECTOR_AUTHS.has(authType)) return { error: "Enter a name, supported profile, authentication method and public HTTPS endpoint." };
  const credentials = { username: String(formData.get("username") ?? "").trim().slice(0, 300), secret: String(formData.get("secret") ?? "").trim().slice(0, 2000) };
  if (authType !== "none" && !credentials.secret) return { error: "Enter the credential required by this connection." };
  if (authType === "basic" && !credentials.username) return { error: "Basic authentication requires a username." };
  const admin = createAdminClient();
  const { error } = await admin.from("integration_connections").insert({ owner: user.id, name, profile, endpoint_url: endpoint, auth_type: authType, auth_header: authType === "api_key" ? String(formData.get("authHeader") ?? "X-API-Key").trim().slice(0, 100) : null, encrypted_credentials: await encryptConnectorCredentials(credentials) });
  if (error) return { error: "The connection could not be saved." };
  revalidatePath("/app/integrations");
  return { success: "Connection saved. Run a test before pushing shipment data." };
}

export async function testIntegrationConnection(formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;
  const id = String(formData.get("id") ?? "");
  const admin = createAdminClient();
  const { data: connection } = await admin.from("integration_connections").select("id, owner, endpoint_url, auth_type, auth_header, encrypted_credentials").eq("id", id).eq("owner", user.id).maybeSingle();
  if (!connection) return;
  const result = await deliverConnector(connection as Parameters<typeof deliverConnector>[0], { schema: "gainingdocx.connection.test.v1", connection_id: id, sent_at: new Date().toISOString() });
  await admin.from("integration_connections").update({ last_test_status: result.status ?? 0, last_tested_at: new Date().toISOString() }).eq("id", id).eq("owner", user.id);
  revalidatePath("/app/integrations");
}

export async function removeIntegrationConnection(formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;
  await createAdminClient().from("integration_connections").delete().eq("id", String(formData.get("id") ?? "")).eq("owner", user.id);
  revalidatePath("/app/integrations");
}

export async function pushShipmentToConnection(formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;
  if (!await hasAutomationPlan(user.id)) return;
  const shipmentId = String(formData.get("shipmentId") ?? "");
  const connectionId = String(formData.get("connectionId") ?? "");
  const admin = createAdminClient();
  const [{ data: shipment }, { data: connection }, { data: documents }, { count: blockers }] = await Promise.all([
    admin.from("shipments").select("id, owner, ref, bl_number, bill_level, house_bl_number, created_at").eq("id", shipmentId).eq("owner", user.id).maybeSingle(),
    admin.from("integration_connections").select("id, owner, profile, endpoint_url, auth_type, auth_header, encrypted_credentials, last_test_status, last_tested_at").eq("id", connectionId).eq("owner", user.id).eq("enabled", true).maybeSingle(),
    admin.from("documents").select("id, doc_type, fields").eq("shipment_id", shipmentId).eq("status", "parsed"),
    admin.from("discrepancies").select("id", { count: "exact", head: true }).eq("shipment_id", shipmentId).eq("resolved", false).eq("severity", "red"),
  ]);
  if (!shipment || !connection || !documents?.length || (blockers ?? 0) > 0 || !connection.last_tested_at || connection.last_test_status < 200 || connection.last_test_status >= 300) return;
  const payload = buildShipmentPush(connection.profile as ConnectorProfile, shipment as Record<string, unknown>, documents.map((document) => ({ id: document.id, doc_type: document.doc_type, fields: document.fields as Record<string, unknown> })));
  const result = await deliverConnector(connection as Parameters<typeof deliverConnector>[0], payload);
  await admin.from("integration_pushes").insert({ owner: user.id, connection_id: connectionId, shipment_id: shipmentId, status: result.delivered ? "delivered" : "failed", response_status: result.status, error: result.error });
  await admin.from("events").insert({ owner: user.id, type: "shipment_connector_push", payload: { shipment_id: shipmentId, connection_id: connectionId, delivered: result.delivered, response_status: result.status } });
  revalidatePath(`/app/shipments/${shipmentId}`);
  revalidatePath("/app/integrations");
}
