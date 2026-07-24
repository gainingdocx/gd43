"use server";

import { revalidatePath } from "next/cache";
import { emitWebhook } from "@/lib/integrations/webhooks";
import { createClient } from "@/lib/supabase/server";

export async function decideHsSuggestion(formData: FormData) {
  const reviewId = String(formData.get("reviewId") ?? "");
  const decision = String(formData.get("decision") ?? "");
  const note = String(formData.get("note") ?? "").trim().slice(0, 500);
  if (!reviewId || !["approved", "rejected"].includes(decision)) return;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;
  const { data: review } = await supabase.from("hs_reviews")
    .select("id, document_id, line_index, suggested_code, status")
    .eq("id", reviewId).eq("owner", user.id).maybeSingle();
  if (!review || review.status !== "pending") return;

  if (decision === "approved") {
    const { data: document } = await supabase.from("documents").select("fields").eq("id", review.document_id).maybeSingle();
    const fields = structuredClone((document?.fields ?? {}) as Record<string, unknown>);
    const lines = Array.isArray(fields.line_items) ? fields.line_items as Array<Record<string, unknown>> : [];
    if (lines[review.line_index]) {
      lines[review.line_index].hs_code = review.suggested_code;
      lines[review.line_index].hs_code_source = "approved_suggestion";
      fields.line_items = lines;
      await supabase.from("documents").update({ fields }).eq("id", review.document_id);
    }
  }
  await supabase.from("hs_reviews").update({
    status: decision,
    decision_note: note || null,
    decided_by: user.id,
    decided_at: new Date().toISOString(),
  }).eq("id", reviewId);
  await supabase.from("events").insert({
    owner: user.id,
    type: "hs_suggestion_reviewed",
    payload: {
      hs_review_id: reviewId,
      document_id: review.document_id,
      line_index: review.line_index,
      suggested_code: review.suggested_code,
      decision,
      note: note || null,
    },
  });
  await emitWebhook(user.id, "hs.reviewed", {
    review_id: reviewId,
    document_id: review.document_id,
    line_index: review.line_index,
    hs_code: review.suggested_code,
    decision,
  });
  revalidatePath(`/app/review/${review.document_id}`);
}

