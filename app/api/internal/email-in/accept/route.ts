import { addressToken, senderAddress } from "@/lib/email-ingestion/address";
import { attachmentMatchesMime, intakeWindowStart, MAX_EMAILS_PER_TEN_MINUTES } from "@/lib/email-ingestion/security";
import { createAdminClient } from "@/lib/supabase/admin";

type IncomingAttachment = {
  filename?: unknown;
  contentType?: unknown;
  content?: unknown;
};

type IncomingEmail = {
  messageId?: unknown;
  from?: unknown;
  to?: unknown;
  subject?: unknown;
  attachments?: unknown;
};

const MAX_ATTACHMENTS = 20;
const MAX_ATTACHMENT_BYTES = 25 * 1024 * 1024;
const SUPPORTED = new Set(["application/pdf", "image/jpeg", "image/png", "image/webp"]);

function authorized(request: Request) {
  const secret = process.env.CRON_SECRET;
  return Boolean(secret && request.headers.get("authorization") === `Bearer ${secret}`);
}

function cleanFilename(value: string) {
  return value.replace(/[^a-z0-9._-]+/gi, "-").replace(/^-+|-+$/g, "").slice(0, 120) || "shipment-document";
}

export async function POST(request: Request) {
  if (!authorized(request)) return Response.json({ error: "unauthorized" }, { status: 401 });
  let body: IncomingEmail;
  try { body = await request.json() as IncomingEmail; }
  catch { return Response.json({ error: "invalid payload" }, { status: 400 }); }

  const recipient = typeof body.to === "string" ? body.to : "";
  const sender = senderAddress(typeof body.from === "string" ? body.from : "");
  const token = addressToken([recipient]);
  const providerEmailId = typeof body.messageId === "string" && body.messageId.trim()
    ? body.messageId.trim().slice(0, 500)
    : crypto.randomUUID();
  if (!token || !sender) return Response.json({ error: "email is not routable" }, { status: 422 });

  const admin = createAdminClient();
  const { data: profile } = await admin.from("profiles").select("id, email_ingest_enabled").eq("email_ingest_token", token).maybeSingle();
  if (!profile?.email_ingest_enabled) return Response.json({ error: "address is disabled" }, { status: 404 });

  const { data: existing } = await admin.from("email_ingestions").select("id, status").eq("provider_email_id", providerEmailId).maybeSingle();
  if (existing) return Response.json({ ingestionId: existing.id, duplicate: true, status: existing.status });

  const { count: recentCount } = await admin.from("email_ingestions")
    .select("id", { count: "exact", head: true })
    .eq("owner", profile.id)
    .gte("created_at", intakeWindowStart());
  if ((recentCount ?? 0) >= MAX_EMAILS_PER_TEN_MINUTES) {
    return Response.json({ error: "intake rate limit reached; retry later or use manual upload" }, { status: 429 });
  }

  const inputAttachments = Array.isArray(body.attachments) ? body.attachments.slice(0, MAX_ATTACHMENTS) as IncomingAttachment[] : [];
  const { data: ingestion, error: ingestionError } = await admin.from("email_ingestions").insert({
    owner: profile.id,
    provider: "cloudflare",
    provider_email_id: providerEmailId,
    sender,
    recipient,
    subject: typeof body.subject === "string" ? body.subject.slice(0, 500) : null,
    attachment_count: inputAttachments.length,
  }).select("id").single();
  if (ingestionError || !ingestion) return Response.json({ error: "could not accept email" }, { status: 500 });

  const documentIds: string[] = [];
  const skipped: string[] = [];
  for (const item of inputAttachments) {
    const filename = cleanFilename(typeof item.filename === "string" ? item.filename : "shipment-document");
    const contentType = typeof item.contentType === "string" ? item.contentType.toLowerCase().split(";")[0] : "";
    if (!SUPPORTED.has(contentType) || typeof item.content !== "string") { skipped.push(filename); continue; }
    let bytes: Uint8Array;
    try { bytes = Uint8Array.from(Buffer.from(item.content, "base64")); }
    catch { skipped.push(filename); continue; }
    if (!bytes.byteLength || bytes.byteLength > MAX_ATTACHMENT_BYTES || !attachmentMatchesMime(bytes, contentType)) { skipped.push(filename); continue; }

    const { data: document, error: documentError } = await admin.from("documents").insert({
      owner: profile.id,
      ingestion_id: ingestion.id,
      source_channel: "email",
      source_filename: filename,
      source_mime_type: contentType,
      batch_id: ingestion.id,
      status: "uploaded",
      page_count: 1,
    }).select("id").single();
    if (documentError || !document) { skipped.push(filename); continue; }
    const path = `${profile.id}/${document.id}/original/${filename}`;
    const { error: uploadError } = await admin.storage.from("docs").upload(path, bytes, { contentType, upsert: true });
    if (uploadError) {
      await admin.from("documents").update({ status: "failed" }).eq("id", document.id);
      skipped.push(filename);
      continue;
    }
    await admin.from("documents").update({ source_file_path: path }).eq("id", document.id);
    documentIds.push(document.id);
  }

  if (!documentIds.length) {
    await admin.from("email_ingestions").update({ status: "rejected", error: "No supported PDF, JPG, PNG or WebP attachments were found.", completed_at: new Date().toISOString() }).eq("id", ingestion.id);
    return Response.json({ error: "no supported attachments", ingestionId: ingestion.id }, { status: 422 });
  }
  await admin.from("email_ingestions").update({
    document_ids: documentIds,
    error: skipped.length ? `Skipped: ${skipped.join(", ")}`.slice(0, 1000) : null,
  }).eq("id", ingestion.id);
  return Response.json({ ingestionId: ingestion.id, accepted: documentIds.length, skipped });
}
