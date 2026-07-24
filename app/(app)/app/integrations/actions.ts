"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { sha256 } from "@/lib/integrations/webhooks";

export type CredentialState = { secret?: string; error?: string };

function randomSecret(prefix: string): string {
  const bytes = crypto.getRandomValues(new Uint8Array(30));
  return `${prefix}${Buffer.from(bytes).toString("base64url")}`;
}

export async function createApiKey(_: CredentialState, formData: FormData): Promise<CredentialState> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Sign in again." };
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

