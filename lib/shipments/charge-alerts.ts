import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import type { NormalizedExtraction } from "@/lib/ai/schemas/shared";
import { parsePrintedDate } from "@/lib/validators/dates";

export async function syncExtractedChargeAlert(
  supabase: SupabaseClient,
  owner: string,
  documentId: string,
  extraction: NormalizedExtraction,
) {
  if (extraction.detected_type !== "arrival_notice" || !extraction.fields.last_free_day) return;
  const parsed = parsePrintedDate(extraction.fields.last_free_day);
  if (!parsed) return;
  const { data: document } = await supabase.from("documents").select("shipment_id").eq("id", documentId).maybeSingle();
  if (!document?.shipment_id) return;
  const { data: profile } = await supabase.from("profiles").select("email").eq("id", owner).maybeSingle();
  await supabase.from("charge_alerts").upsert({
    shipment_id: document.shipment_id,
    document_id: documentId,
    owner,
    alert_type: "demurrage",
    basis: "document",
    free_until: parsed.toISOString().slice(0, 10),
    notify_email: profile?.email ?? null,
    source_value: extraction.fields.last_free_day,
    status: "active",
    sent_offsets: [],
  }, { onConflict: "document_id,alert_type" });
}

