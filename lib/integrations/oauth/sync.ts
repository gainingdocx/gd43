// The watched-folder worker.
//
// Polls each active Drive connection's inbox folder and pulls new files into
// the same intake the email channel uses: a `documents` row, the bytes in the
// `docs` bucket, status `uploaded`. Parsing is deliberately left to the
// existing pipeline — a second parse path would drift from the first.
//
// Three things this must never do, each of which is a way to lose a customer:
//   1. Import the same file twice. It costs them a document from their monthly
//      allowance and produces a duplicate shipment.
//   2. Import past their plan's allowance without checking.
//   3. Keep hammering a connection whose grant was revoked.

import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";
import { getUsageContext } from "@/lib/billing/usage";
import { logError, logInfo } from "@/lib/observability/logger";
import { emitWebhook } from "../webhooks";
import { downloadFile, listFolder } from "./drive";
import { accessTokenFor, ReauthRequiredError } from "./tokens";

/** Matches the email channel's per-file cap, so one intake is not quietly more permissive. */
const MAX_FILE_BYTES = 25 * 1024 * 1024;

/** Per connection, per run. Bounds one sweep's runtime and one customer's spend. */
const MAX_FILES_PER_RUN = 10;

interface ConnectionRow {
  id: string;
  owner: string;
  provider: string;
  config: { inbox_folder_id?: string } | null;
}

function cleanFilename(value: string): string {
  return value.replace(/[^a-z0-9._-]+/gi, "-").replace(/^-+|-+$/g, "").slice(0, 120) || "drive-document";
}

/**
 * Pull new files from one connection's watched folder.
 *
 * Returns counts rather than throwing, because one broken connection must not
 * stop the sweep for every other customer.
 */
export async function syncDriveConnection(connection: ConnectionRow): Promise<{ imported: number; skipped: number; error: string | null }> {
  const folderId = connection.config?.inbox_folder_id;
  if (!folderId) return { imported: 0, skipped: 0, error: null };

  const admin = createAdminClient();
  let accessToken: string;
  try {
    accessToken = await accessTokenFor(connection.id);
  } catch (error) {
    // ReauthRequiredError has already flagged the row for the customer; there
    // is nothing to retry until they act.
    if (error instanceof ReauthRequiredError) return { imported: 0, skipped: 0, error: "reauth_required" };
    throw error;
  }

  const files = await listFolder(accessToken, folderId);
  if (files.length === 0) {
    await admin.from("oauth_connections").update({ last_synced_at: new Date().toISOString() }).eq("id", connection.id);
    return { imported: 0, skipped: 0, error: null };
  }

  // One query rather than one per file: a folder of 100 already-imported files
  // would otherwise be 100 round trips every poll.
  const { data: seen } = await admin
    .from("oauth_synced_items")
    .select("external_id, external_revision")
    .eq("connection_id", connection.id)
    .in("external_id", files.map((file) => file.id));
  const alreadyImported = new Set((seen ?? []).map((row) => `${row.external_id}@${row.external_revision}`));

  const pending = files.filter((file) => !alreadyImported.has(`${file.id}@${file.version}`));
  if (pending.length === 0) {
    await admin.from("oauth_connections").update({ last_synced_at: new Date().toISOString() }).eq("id", connection.id);
    return { imported: 0, skipped: files.length, error: null };
  }

  // Checked once per run, before any work: importing first and billing later
  // would let a watched folder blow straight through a Free plan's limit.
  const usage = await getUsageContext(connection.owner);
  const remaining = Math.max(0, usage.limit - usage.used);
  if (remaining === 0) {
    await admin
      .from("oauth_connections")
      .update({
        last_error: "Monthly document allowance reached. Files will import when the allowance resets or the plan is upgraded.",
        last_synced_at: new Date().toISOString(),
      })
      .eq("id", connection.id);
    return { imported: 0, skipped: pending.length, error: "quota_exhausted" };
  }

  let imported = 0;
  let skipped = 0;

  for (const file of pending.slice(0, Math.min(MAX_FILES_PER_RUN, remaining))) {
    try {
      const bytes = await downloadFile(accessToken, file.id, MAX_FILE_BYTES);
      const filename = cleanFilename(file.name);

      const { data: document, error: documentError } = await admin
        .from("documents")
        .insert({
          owner: connection.owner,
          source_channel: "cloud_storage",
          source_filename: filename,
          source_mime_type: file.mimeType,
          status: "uploaded",
          page_count: 1,
        })
        .select("id")
        .single();
      if (documentError || !document) {
        skipped += 1;
        continue;
      }

      const path = `${connection.owner}/${document.id}/original/${filename}`;
      const { error: uploadError } = await admin.storage
        .from("docs")
        .upload(path, bytes, { contentType: file.mimeType, upsert: true });
      if (uploadError) {
        await admin.from("documents").update({ status: "failed" }).eq("id", document.id);
        skipped += 1;
        continue;
      }
      await admin.from("documents").update({ source_file_path: path }).eq("id", document.id);

      // Written only after the bytes are safely stored. Recording the import
      // first would mean a failed upload is never retried, and the file is
      // silently lost.
      await admin.from("oauth_synced_items").insert({
        owner: connection.owner,
        connection_id: connection.id,
        external_id: file.id,
        external_revision: file.version,
        document_id: document.id,
      });

      await emitWebhook(connection.owner, "document.received", {
        document_id: document.id,
        source: "cloud_storage",
        source_filename: filename,
        shipment_id: null,
      });
      imported += 1;
    } catch (error) {
      logError("drive sync file failed", error, { connectionId: connection.id, fileId: file.id });
      skipped += 1;
    }
  }

  await admin
    .from("oauth_connections")
    .update({ last_synced_at: new Date().toISOString(), last_error: null })
    .eq("id", connection.id);

  return { imported, skipped, error: null };
}

/**
 * Sweep every active connection whose watch is due. Called by the cron.
 *
 * Polls at most every five minutes per connection: Drive's quota is per project
 * and shared by every customer, so a tighter loop would spend one customer's
 * folder activity out of everyone's budget.
 */
export async function runDueCloudSyncs(limit = 20): Promise<{ connections: number; imported: number; skipped: number }> {
  const admin = createAdminClient();
  const dueBefore = new Date(Date.now() - 5 * 60 * 1000).toISOString();

  const { data: connections } = await admin
    .from("oauth_connections")
    .select("id, owner, provider, config, last_synced_at")
    .eq("status", "active")
    .eq("provider", "google_drive")
    .or(`last_synced_at.is.null,last_synced_at.lt.${dueBefore}`)
    .order("last_synced_at", { ascending: true, nullsFirst: true })
    .limit(limit);

  let imported = 0;
  let skipped = 0;
  const rows = (connections ?? []) as ConnectionRow[];

  for (const connection of rows) {
    try {
      const result = await syncDriveConnection(connection);
      imported += result.imported;
      skipped += result.skipped;
    } catch (error) {
      logError("drive sync failed", error, { connectionId: connection.id });
      await admin
        .from("oauth_connections")
        .update({
          last_error: (error instanceof Error ? error.message : "Sync failed").slice(0, 300),
          last_synced_at: new Date().toISOString(),
        })
        .eq("id", connection.id);
    }
  }

  if (rows.length > 0) logInfo("cloud sync sweep", { connections: rows.length, imported, skipped });
  return { connections: rows.length, imported, skipped };
}
