import assert from "node:assert/strict";
import { createHash, randomBytes, randomUUID } from "node:crypto";

import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { chromium } from "playwright";

const baseUrl = process.env.E2E_BASE_URL ?? "https://gainingdocx.gainingdocx.workers.dev";
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!supabaseUrl || !anonKey || !serviceKey) {
  throw new Error("Production E2E requires Supabase URL, anon key and service-role key.");
}

const admin = createClient(supabaseUrl, serviceKey, { auth: { persistSession: false, autoRefreshToken: false } });
const runId = `${Date.now()}-${randomBytes(3).toString("hex")}`;
const password = `E2e-${randomBytes(16).toString("base64url")}!9a`;
const createdUsers: string[] = [];
const storagePaths: string[] = [];

type Role = "owner" | "editor" | "reviewer" | "approver";
type Actor = { id: string; email: string; role: Role };

async function createActor(role: Role): Promise<Actor> {
  const email = `gdx-e2e-${role}-${runId}@example.invalid`;
  const { data, error } = await admin.auth.admin.createUser({ email, password, email_confirm: true });
  if (error || !data.user) throw error ?? new Error(`could not create ${role}`);
  createdUsers.push(data.user.id);
  return { id: data.user.id, email, role };
}

async function signedClient(actor: Actor): Promise<SupabaseClient> {
  const client = createClient(supabaseUrl!, anonKey!, { auth: { persistSession: false, autoRefreshToken: false } });
  const { error } = await client.auth.signInWithPassword({ email: actor.email, password });
  if (error) throw error;
  return client;
}

async function api(path: string, key: string, init: RequestInit = {}) {
  return fetch(`${baseUrl}${path}`, {
    ...init,
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json", ...(init.headers ?? {}) },
  });
}

function meta(type: string) {
  return { detected_type: type, confidence_flags: [], page_refs: {}, source_evidence: {}, prompt_version: "e2e-fixture-v1", source_languages: ["en"] };
}

async function main() {
  const [owner, editor, reviewer, approver] = await Promise.all([
    createActor("owner"), createActor("editor"), createActor("reviewer"), createActor("approver"),
  ]);
  const profileSetup = await admin.from("profiles").update({
    plan: "team", full_name: "E2E Owner", company: "GainingDocx E2E",
    onboarding_completed_at: new Date().toISOString(),
  }).eq("id", owner.id);
  if (profileSetup.error) throw profileSetup.error;
  const subscriptionSetup = await admin.from("subscriptions").upsert({
    owner: owner.id, plan: "team", status: "active",
    paddle_customer_id: `ctm_e2e_${runId}`, paddle_sub_id: `sub_e2e_${runId}`,
    current_period_end: new Date(Date.now() + 86400000).toISOString(),
  });
  if (subscriptionSetup.error) throw subscriptionSetup.error;
  const { data: workspace, error: workspaceError } = await admin.from("team_workspaces").select("id").eq("owner", owner.id).single();
  if (workspaceError) throw workspaceError;
  const members = [editor, reviewer, approver].map((actor) => ({
    workspace_id: workspace.id, member_id: actor.id, email: actor.email, display_name: `E2E ${actor.role}`,
    role: actor.role, status: "active", invited_by: owner.id,
  }));
  const { error: memberError } = await admin.from("team_members").insert(members);
  if (memberError) throw memberError;

  const { data: shipment, error: shipmentError } = await admin.from("shipments").insert({
    owner: owner.id, ref: `E2E-${runId}`, bl_number: `TSTBL${runId.replace(/\D/g, "").slice(-8)}`,
    export_approval_required: true,
  }).select("id").single();
  if (shipmentError) throw shipmentError;

  const [{ data: bl, error: blError }, { data: packing, error: packingError }] = await Promise.all([
    admin.from("documents").insert({
      owner: owner.id, shipment_id: shipment.id, doc_type: "bill_of_lading", status: "parsed",
      source_filename: "e2e-bill-of-lading.pdf", page_count: 1, validation: [],
      fields: { bl_number: "TSTBL260001", shipper: { name: "NORTHSTAR EXPORTS LTD" }, consignee: { name: "HARBOR RETAIL GMBH" }, total_packages: 120, total_gross_kg: 6120, containers: [], cargo: [], _meta: meta("bill_of_lading") },
    }).select("id").single(),
    admin.from("documents").insert({
      owner: owner.id, shipment_id: shipment.id, doc_type: "packing_list", status: "parsed",
      source_filename: "e2e-packing-list.pdf", page_count: 1, validation: [],
      fields: { pl_no: "TSTPL-260007", seller: { name: "NORTHSTAR EXPORTS LTD" }, buyer: { name: "HARBOR RETAIL GMBH" }, total_cartons: 120, total_gross_kg: 6100, line_items: [], container_refs: [], _meta: meta("packing_list") },
    }).select("id").single(),
  ]);
  if (blError || packingError || !bl || !packing) throw blError ?? packingError ?? new Error("documents missing");

  // Real signed-in RLS: all active members can read; only editors can mutate
  // requirements and only approvers can decide export approval.
  const [editorClient, reviewerClient, approverClient] = await Promise.all([
    signedClient(editor), signedClient(reviewer), signedClient(approver),
  ]);
  for (const client of [editorClient, reviewerClient, approverClient]) {
    const accessResult: { data: { id: string } | null; error: Error | null } =
      await client.from("shipments").select("id").eq("id", shipment.id).single();
    assert.ifError(accessResult.error); assert.equal(accessResult.data?.id, shipment.id);
  }
  const requirement = { shipment_id: shipment.id, owner: owner.id, requirement_key: "e2e_packing", label: "E2E packing list", accepted_types: ["packing_list"] };
  assert.ifError((await editorClient.from("shipment_requirements").insert(requirement)).error);
  assert.ok((await reviewerClient.from("shipment_requirements").insert({ ...requirement, requirement_key: "forbidden" })).error);
  const { data: approval, error: approvalError } = await admin.from("export_approvals").insert({ shipment_id: shipment.id, owner: owner.id, requested_by: reviewer.id }).select("id").single();
  if (approvalError) throw approvalError;
  const reviewerDecision = await reviewerClient.from("export_approvals")
    .update({ status: "approved" }).eq("id", approval.id).select("id");
  assert.ifError(reviewerDecision.error);
  assert.equal(reviewerDecision.data?.length, 0, "reviewer must not decide export approval");
  const approverDecision = await approverClient.from("export_approvals")
    .update({ status: "approved", decided_by: approver.id, decided_at: new Date().toISOString() })
    .eq("id", approval.id).select("id");
  assert.ifError(approverDecision.error);
  assert.equal(approverDecision.data?.length, 1, "approver must be able to decide export approval");

  const apiKey = `gdx_live_${randomBytes(30).toString("base64url")}`;
  const { error: keyError } = await admin.from("api_keys").insert({
    owner: owner.id, name: "Production E2E", key_prefix: apiKey.slice(0, 16),
    key_hash: createHash("sha256").update(apiKey).digest("hex"),
  });
  if (keyError) throw keyError;
  const meResponse = await api("/api/v1/me", apiKey);
  assert.equal(meResponse.status, 200); assert.equal((await meResponse.json()).plan, "team");

  await admin.from("discrepancies").insert({ shipment_id: shipment.id, owner: owner.id, severity: "red", field: "total_gross_kg", doc_a: bl.id, doc_b: packing.id, value_a: "6120", value_b: "6100", message: "E2E conflicting printed totals", resolved: false });
  const blocked = await api(`/api/v1/documents/${bl.id}/approve`, apiKey, { method: "POST", body: "{}" });
  assert.equal(blocked.status, 409);
  const corrected = await api(`/api/v1/documents/${packing.id}/correct`, apiKey, { method: "POST", body: JSON.stringify({ fields: { total_gross_kg: 6120 }, corrected_by: "E2E reviewer" }) });
  assert.equal(corrected.status, 200); assert.deepEqual((await corrected.json()).corrected, ["total_gross_kg"]);
  const matched = await api(`/api/v1/shipments/${shipment.id}/match`, apiKey, { method: "POST", body: "{}" });
  assert.equal(matched.status, 200);
  const approved = await api(`/api/v1/documents/${bl.id}/approve`, apiKey, { method: "POST", body: JSON.stringify({ approved_by: "E2E approver" }) });
  assert.equal(approved.status, 200); assert.ok((await approved.json()).approved_at);
  const exported = await api(`/api/v1/shipments/${shipment.id}/export?profile=canonical_json`, apiKey, { headers: {} });
  assert.equal(exported.status, 200); assert.match(exported.headers.get("content-disposition") ?? "", /canonical_json/);

  const webhook = await api("/api/v1/webhooks", apiKey, { method: "POST", body: JSON.stringify({ url: "https://postman-echo.com/post", description: "Production E2E receiver", events: ["document.approved"] }) });
  assert.equal(webhook.status, 201);
  const webhookBody = await webhook.json() as { id: string; signing_secret: string };
  assert.match(webhookBody.signing_secret, /^whsec_/);
  const webhookTest = await api(`/api/v1/webhooks/${webhookBody.id}/test`, apiKey, { method: "POST", body: "{}" });
  assert.equal(webhookTest.status, 200); assert.equal((await webhookTest.json()).delivered, true);

  // Exercise the authenticated internal email acceptance and real docs bucket.
  const { data: profile } = await admin.from("profiles").select("email_ingest_token").eq("id", owner.id).single();
  assert.ok(profile?.email_ingest_token);
  const previousCronSecret = process.env.CRON_SECRET;
  process.env.CRON_SECRET = `e2e-${randomUUID()}`;
  const { POST: acceptEmail } = await import("../app/api/internal/email-in/accept/route");
  const pdf = Buffer.from("JVBERi0xLjQKMSAwIG9iajw8L1R5cGUvQ2F0YWxvZz4+ZW5kb2JqCnRyYWlsZXI8PC9Sb290IDEgMCBSPj4KJSVFT0Y=", "base64");
  const emailResponse = await acceptEmail(new Request("http://e2e.local/api/internal/email-in/accept", {
    method: "POST", headers: { Authorization: `Bearer ${process.env.CRON_SECRET}`, "Content-Type": "application/json" },
    body: JSON.stringify({ messageId: `e2e-${runId}`, from: owner.email, to: `${profile.email_ingest_token}@docs.gainingdocx.com`, subject: "E2E document", attachments: [{ filename: "e2e.pdf", contentType: "application/pdf", content: pdf.toString("base64") }] }),
  }));
  if (previousCronSecret === undefined) delete process.env.CRON_SECRET;
  else process.env.CRON_SECRET = previousCronSecret;
  assert.equal(emailResponse.status, 200);
  const emailBody = await emailResponse.json() as { accepted: number };
  assert.equal(emailBody.accepted, 1);
  const { data: stored } = await admin.from("documents").select("source_file_path").eq("owner", owner.id).eq("source_channel", "email").single();
  assert.ok(stored?.source_file_path);
  storagePaths.push(stored.source_file_path);
  assert.ok((await admin.storage.from("docs").download(stored.source_file_path)).data);

  const browser = await chromium.launch({ headless: true });
  try {
    const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
    await page.goto(`${baseUrl}/auth/login?next=/app`);
    await page.getByLabel("Email address").fill(owner.email);
    await page.locator("#login-password").fill(password);
    await Promise.all([
      page.waitForURL((url) => url.pathname === "/app"),
      page.getByRole("button", { name: /Sign in/ }).click(),
    ]);
    await assert.doesNotReject(() => page.getByRole("heading", { level: 1 }).first().waitFor({ state: "visible" }));
    const billing = await page.evaluate(async () => (await fetch("/api/billing/status")).json());
    assert.deepEqual({ plan: billing.plan, isTeam: billing.isTeam, isPaid: billing.isPaid }, { plan: "team", isTeam: true, isPaid: true });
    await page.goto(`${baseUrl}/app/integrations`);
    await page.getByRole("heading", { name: "API & webhooks" }).waitFor();
  } finally {
    await browser.close();
  }

  console.log(JSON.stringify({
    ok: true, baseUrl, runId,
    verified: ["signed-in mobile workspace", "storage", "correction", "matching", "team permissions", "approval gate", "billing entitlement", "email ingestion", "API key", "signed webhook", "canonical export"],
  }, null, 2));
}

main().catch((error) => { console.error(error); process.exitCode = 1; }).finally(async () => {
  if (storagePaths.length) await admin.storage.from("docs").remove(storagePaths);
  for (const id of [...createdUsers].reverse()) await admin.auth.admin.deleteUser(id);
});
