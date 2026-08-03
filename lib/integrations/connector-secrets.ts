import "server-only";

function keyMaterial() {
  const value = process.env.INTEGRATION_CREDENTIAL_KEY ?? process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!value) throw new Error("Connector credential encryption is not configured");
  return value;
}
async function aesKey() {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(keyMaterial()));
  return crypto.subtle.importKey("raw", digest, "AES-GCM", false, ["encrypt", "decrypt"]);
}
export async function encryptConnectorCredentials(value: Record<string, string>) {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const encrypted = await crypto.subtle.encrypt({ name: "AES-GCM", iv }, await aesKey(), new TextEncoder().encode(JSON.stringify(value)));
  return `${Buffer.from(iv).toString("base64url")}.${Buffer.from(encrypted).toString("base64url")}`;
}
export async function decryptConnectorCredentials(value: string | null) {
  if (!value) return {};
  const [ivText, encryptedText] = value.split(".");
  if (!ivText || !encryptedText) throw new Error("Invalid connector credential envelope");
  const decrypted = await crypto.subtle.decrypt({ name: "AES-GCM", iv: Buffer.from(ivText, "base64url") }, await aesKey(), Buffer.from(encryptedText, "base64url"));
  return JSON.parse(new TextDecoder().decode(decrypted)) as Record<string, string>;
}
